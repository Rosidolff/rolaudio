import os
import uuid
import shutil
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import data_manager

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')

if not os.path.exists(ASSETS_DIR):
    os.makedirs(ASSETS_DIR)

@app.route('/health')
def health():
    return jsonify({"status": "ok", "db": "json-filesystem"})

@app.route('/api/tracks', methods=['GET'])
def get_tracks():
    tracks = []
    # Cargar metadatos (iconos)
    metadata = data_manager.get_all_metadata()
    
    for root, dirs, files in os.walk(ASSETS_DIR):
        for file in files:
            if file.lower().endswith(('.mp3', '.wav', '.ogg')):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, ASSETS_DIR).replace('\\', '/')
                parts = rel_path.split('/')
                
                frame = "Global"
                t_type = "sfx"
                category = "General"
                subcategory = ""
                
                if len(parts) > 0:
                    frame = parts[0] if parts[0] != 'mocks' else 'Global'
                if len(parts) > 1: t_type = parts[1]
                if len(parts) > 2: category = parts[2]
                if len(parts) > 3 and parts[3] != file: subcategory = parts[3]

                if t_type not in ['music', 'ambience', 'sfx']: t_type = 'sfx'

                # Recuperar icono guardado o usar default según tipo
                track_meta = metadata.get(rel_path, {})
                default_icon = 'CloudRain' if t_type == 'ambience' else 'Music'
                icon = track_meta.get('icon', default_icon)

                tracks.append({
                    "id": rel_path,
                    "name": os.path.splitext(file)[0].replace('_', ' ').replace('-', ' ').title(),
                    "url": f"http://localhost:5000/assets/{rel_path}",
                    "filename": rel_path,
                    "type": t_type,
                    "frame": frame if frame != "Global" else None,
                    "category": category,
                    "subcategory": subcategory,
                    "icon": icon # Campo nuevo
                })
    return jsonify(tracks)

@app.route('/api/tracks', methods=['POST'])
def upload_track():
    if 'file' not in request.files: return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    
    def safe_name(txt): return os.path.basename(txt).strip() if txt else ""

    custom_name = safe_name(request.form.get('name', 'track'))
    t_type = safe_name(request.form.get('type', 'sfx'))
    # Nuevo: Recibir icono
    icon = request.form.get('icon', 'CloudRain')
    
    frame = request.form.get('frame', 'Global')
    if request.form.get('is_global') == 'true': frame = 'Global'
    frame = safe_name(frame)
        
    category = safe_name(request.form.get('category', 'General'))
    subcategory = safe_name(request.form.get('subcategory', ''))

    save_path = os.path.join(ASSETS_DIR, frame, t_type, category, subcategory)
    os.makedirs(save_path, exist_ok=True)
    
    filename = f"{custom_name}{os.path.splitext(file.filename)[1]}"
    file.save(os.path.join(save_path, filename))
    
    # Guardar Metadata
    rel_path = os.path.relpath(os.path.join(save_path, filename), ASSETS_DIR).replace('\\', '/')
    data_manager.save_track_metadata(rel_path, {'icon': icon})
    
    return jsonify({"status": "success"}), 201

@app.route('/api/tracks/move', methods=['POST'])
def move_track():
    data = request.json
    track_id = data.get('trackId')
    new_frame = data.get('newFrame', 'Global')
    new_category = data.get('newCategory')
    new_subcategory = data.get('newSubcategory')
    t_type = data.get('type', 'music') 

    if not track_id or not new_category: return jsonify({'error': 'Missing data'}), 400

    src_path = os.path.join(ASSETS_DIR, track_id.replace('/', os.sep))
    filename = os.path.basename(src_path)
    dest_dir = os.path.join(ASSETS_DIR, new_frame, t_type, new_category, new_subcategory)
    dest_path = os.path.join(dest_dir, filename)

    if not os.path.exists(src_path): return jsonify({'error': 'File not found'}), 404

    try:
        os.makedirs(dest_dir, exist_ok=True)
        shutil.move(src_path, dest_path)
        
        # Actualizar referencia de metadata
        new_rel_path = os.path.relpath(dest_path, ASSETS_DIR).replace('\\', '/')
        data_manager.update_metadata_id(track_id, new_rel_path)
        
        return jsonify({'status': 'moved'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tracks/rename', methods=['POST'])
def rename_track():
    data = request.json
    track_id = data.get('trackId')
    new_name = data.get('newName')
    
    if not track_id or not new_name: return jsonify({'error': 'Missing data'}), 400

    src_path = os.path.join(ASSETS_DIR, track_id.replace('/', os.sep))
    if not os.path.exists(src_path): return jsonify({'error': 'File not found'}), 404
        
    folder = os.path.dirname(src_path)
    ext = os.path.splitext(src_path)[1]
    new_filename = f"{os.path.basename(new_name).strip()}{ext}"
    dest_path = os.path.join(folder, new_filename)
    
    try:
        os.rename(src_path, dest_path)
        
        # Actualizar referencia de metadata
        new_rel_path = os.path.relpath(dest_path, ASSETS_DIR).replace('\\', '/')
        data_manager.update_metadata_id(track_id, new_rel_path)
        
        return jsonify({'status': 'renamed'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Settings, Presets, Orders, Static ---
# (Igual que antes)
@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    if request.method == 'POST':
        data_manager.save_settings(request.json)
        return jsonify({"status": "saved"})
    return jsonify(data_manager.get_settings())

@app.route('/api/presets', methods=['GET', 'POST'])
def handle_presets():
    if request.method == 'POST':
        data = request.json
        preset = {
            "id": data.get('id') or str(uuid.uuid4()),
            "name": data.get('name', 'Nuevo Preset'),
            "frame": data.get('frame', 'Global'),
            "tracks": data.get('tracks', []) 
        }
        data_manager.save_preset(preset)
        return jsonify(preset)
    return jsonify(data_manager.get_presets())

@app.route('/api/presets/<preset_id>', methods=['DELETE'])
def delete_preset_endpoint(preset_id):
    data_manager.delete_preset(preset_id)
    return jsonify({"status": "deleted"})

@app.route('/api/playlist/order', methods=['POST'])
def save_playlist_order():
    data = request.json
    key = data.get('key')
    track_ids = data.get('trackIds', [])
    if key:
        data_manager.save_order(key, track_ids)
        return jsonify({"status": "saved"})
    return jsonify({"error": "missing key"}), 400

@app.route('/api/playlist/orders', methods=['GET'])
def get_playlist_orders():
    return jsonify(data_manager.get_orders())

@app.route('/assets/<path:path>')
def serve_asset(path):
    return send_from_directory(ASSETS_DIR, path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)