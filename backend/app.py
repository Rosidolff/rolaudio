import os
import uuid
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
# Eliminamos secure_filename de aquí para usar nuestra propia lógica permisiva
from werkzeug.utils import secure_filename 
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
    for root, dirs, files in os.walk(ASSETS_DIR):
        for file in files:
            if file.lower().endswith(('.mp3', '.wav', '.ogg')):
                full_path = os.path.join(root, file)
                # Obtenemos la ruta relativa con separadores '/' universales
                rel_path = os.path.relpath(full_path, ASSETS_DIR).replace('\\', '/')
                
                parts = rel_path.split('/')
                
                # Valores por defecto
                frame = "Global"
                t_type = "sfx"
                category = "General"
                subcategory = ""
                
                # Heurística: assets/{Frame}/{Type}/{Category}/{Subcategory}/file.mp3
                if len(parts) > 0:
                    frame = parts[0] if parts[0] != 'mocks' else 'Global'
                if len(parts) > 1: t_type = parts[1]
                if len(parts) > 2: category = parts[2]
                if len(parts) > 3 and parts[3] != file: subcategory = parts[3]

                if t_type not in ['music', 'ambience', 'sfx']: t_type = 'sfx'

                # Generamos el nombre "bonito" desde el nombre del archivo
                display_name = os.path.splitext(file)[0].replace('_', ' ').replace('-', ' ').title()

                tracks.append({
                    "id": rel_path,
                    "name": display_name,
                    "url": f"http://localhost:5000/assets/{rel_path}",
                    "filename": rel_path,
                    "type": t_type,
                    "frame": frame if frame != "Global" else None,
                    "category": category,
                    "subcategory": subcategory
                })
    return jsonify(tracks)

@app.route('/api/tracks', methods=['POST'])
def upload_track():
    if 'file' not in request.files: return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    
    # Función helper para permitir tildes pero evitar '../'
    def safe_name(txt):
        if not txt: return ""
        return os.path.basename(txt).strip()

    # Recibimos los datos tal cual (con tildes y espacios)
    custom_name = safe_name(request.form.get('name', 'track'))
    t_type = safe_name(request.form.get('type', 'sfx'))
    
    frame = request.form.get('frame', 'Global')
    if request.form.get('is_global') == 'true': 
        frame = 'Global'
    frame = safe_name(frame)
        
    category = safe_name(request.form.get('category', 'General'))
    subcategory = safe_name(request.form.get('subcategory', ''))

    # Creamos la ruta respetando la ortografía (ej: assets/Fantasy/music/Acción/Combate)
    save_path = os.path.join(ASSETS_DIR, frame, t_type, category, subcategory)
    os.makedirs(save_path, exist_ok=True)
    
    # Guardamos el archivo
    # Usamos el nombre personalizado para el fichero físico también, para que sea fácil de identificar
    # Mantenemos la extensión original
    ext = os.path.splitext(file.filename)[1]
    filename = f"{custom_name}{ext}"
    
    file.save(os.path.join(save_path, filename))
    
    return jsonify({"status": "success"}), 201

# --- Settings & Presets ---

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
        preset_id = data.get('id') or str(uuid.uuid4())
        
        preset = {
            "id": preset_id,
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

# --- Playlist Order ---

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

# --- Static Files ---

@app.route('/assets/<path:path>')
def serve_asset(path):
    return send_from_directory(ASSETS_DIR, path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)