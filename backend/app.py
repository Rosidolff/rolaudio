import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from database import db

app = Flask(__name__, static_folder='assets')
CORS(app)

# Database Configuration
db_path = os.path.join(os.path.dirname(__file__), 'rpg_music.db')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', f'sqlite:///{db_path}')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

from models import Track, Frame, Preset

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy", "service": "RPGMusicManager Backend"})

@app.route('/api/tracks', methods=['GET', 'POST'])
def handle_tracks():
    if request.method == 'GET':
        tracks = Track.query.all()
        return jsonify([t.to_dict() for t in tracks])
    
    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if file:
            filename = secure_filename(file.filename)
            # Determine save path based on type/category
            t_type = request.form.get('type', 'music')
            category = request.form.get('category', 'Uncategorized')
            subcategory = request.form.get('subcategory', '')
            
            # Create directory structure
            # app.static_folder is 'assets'
            save_dir = os.path.join(app.static_folder, 'uploads', t_type, category, subcategory)
            os.makedirs(save_dir, exist_ok=True)
            
            file_path = os.path.join(save_dir, filename)
            file.save(file_path)
            
            # Create DB entry
            # Path relative to backend root (where app.py is)
            rel_path = os.path.relpath(file_path, os.path.dirname(__file__)).replace('\\', '/')
            
            new_track = Track(
                name=request.form.get('name', filename),
                filename=rel_path,
                type=t_type,
                category=category,
                subcategory=subcategory,
                is_global=request.form.get('is_global') == 'true',
                frame_id=request.form.get('frame_id') if request.form.get('frame_id') else None
            )
            db.session.add(new_track)
            db.session.commit()
            
            return jsonify(new_track.to_dict()), 201

@app.route('/api/frames')
def get_frames():
    frames = Frame.query.all()
    return jsonify([f.to_dict() for f in frames])

# Serve static files from assets directory
@app.route('/assets/<path:path>')
def send_asset(path):
    return send_from_directory('assets', path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
