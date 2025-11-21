import os
import uuid
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import shutil

app = Flask(__name__)
CORS(app)

# Configuración de rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')

# Asegurar que existen las carpetas base si no están
if not os.path.exists(ASSETS_DIR):
    os.makedirs(ASSETS_DIR)

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy", "mode": "Filesystem"})

def scan_directory():
    """
    Escanea la carpeta assets y construye la lista de pistas basada en la estructura de carpetas:
    assets/{Frame}/{Type}/{Category}/{Subcategory}/File.mp3
    """
    tracks = []
    
    # Recorremos todo el directorio de assets
    for root, dirs, files in os.walk(ASSETS_DIR):
        for file in files:
            if file.lower().endswith(('.mp3', '.wav', '.ogg')):
                full_path = os.path.join(root, file)
                
                # Obtenemos la ruta relativa desde 'assets'
                # Ejemplo: 'Fantasy/music/Accion/Combate/track.mp3'
                rel_path = os.path.relpath(full_path, ASSETS_DIR).replace('\\', '/')
                parts = rel_path.split('/')

                # Valores por defecto
                track_id = rel_path # Usamos el path como ID único
                name = os.path.splitext(file)[0].replace('_', ' ').title()
                frame = "Global"
                t_type = "sfx" # Default
                category = "General"
                subcategory = ""

                # Lógica heurística para determinar metadatos según la profundidad de la carpeta
                # Esperamos: [Frame, Type, Category, Subcategory, Filename]
                
                # Caso 1: Carpeta 'mocks' antigua (la trataremos como Global)
                if parts[0] == 'mocks':
                    frame = 'Global'
                    if len(parts) > 1: t_type = parts[1]
                    if len(parts) > 2: category = parts[2]
                    if len(parts) > 3 and parts[3] != file: subcategory = parts[3]
                
                # Caso 2: Nueva estructura uploads o manual
                else:
                    # Intentar mapear estructura: Frame / Type / Category / Subcategory
                    if len(parts) > 0: frame = parts[0]
                    if len(parts) > 1: t_type = parts[1]
                    if len(parts) > 2: category = parts[2]
                    if len(parts) > 3 and parts[3] != file: subcategory = parts[3]

                # Limpieza de datos
                if t_type not in ['music', 'ambience', 'sfx']:
                    t_type = 'sfx' # Fallback

                tracks.append({
                    "id": track_id,
                    "name": name,
                    "url": f"http://localhost:5000/assets/{rel_path}", # URL directa para el frontend
                    "filename": rel_path,
                    "type": t_type,
                    "frame": frame if frame != 'Global' else None, # Frontend espera null para Global
                    "category": category,
                    "subcategory": subcategory,
                    "is_global": frame == 'Global'
                })
    return tracks

@app.route('/api/tracks', methods=['GET'])
def get_tracks():
    tracks = scan_directory()
    return jsonify(tracks)

@app.route('/api/tracks', methods=['POST'])
def upload_track():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Datos del formulario
    custom_name = request.form.get('name')
    t_type = request.form.get('type', 'sfx')
    frame = request.form.get('frame', 'Global') # Ahora recibimos el nombre del Frame, ej: "Fantasy"
    category = request.form.get('category', 'General')
    subcategory = request.form.get('subcategory', '')
    is_global = request.form.get('is_global') == 'true'

    if is_global:
        frame = "Global"

    # Renombrar el archivo físico con el nombre que dio el usuario
    ext = os.path.splitext(file.filename)[1]
    safe_name = secure_filename(custom_name) + ext
    
    # Construir ruta de destino
    # assets/{Frame}/{Type}/{Category}/{Subcategory}/
    save_dir = os.path.join(ASSETS_DIR, frame, t_type, category, subcategory)
    os.makedirs(save_dir, exist_ok=True)
    
    file_path = os.path.join(save_dir, safe_name)
    
    # Guardar archivo
    file.save(file_path)

    return jsonify({"message": "Upload successful", "path": file_path}), 201

# Servir archivos estáticos
@app.route('/assets/<path:path>')
def send_asset(path):
    return send_from_directory(ASSETS_DIR, path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)