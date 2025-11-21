import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
SETTINGS_FILE = os.path.join(DATA_DIR, 'settings.json')
PRESETS_FILE = os.path.join(DATA_DIR, 'presets.json')

# Asegurar que el directorio data existe
os.makedirs(DATA_DIR, exist_ok=True)

def load_json(filepath, default):
    if not os.path.exists(filepath):
        return default
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return default

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

# --- API Settings ---
def get_settings():
    return load_json(SETTINGS_FILE, {"masterVolume": 50, "lastFrame": "Fantasy"})

def save_settings(settings):
    current = get_settings()
    current.update(settings)
    save_json(SETTINGS_FILE, current)

# --- API Presets ---
def get_presets():
    return load_json(PRESETS_FILE, [])

def save_preset(preset):
    presets = get_presets()
    # Si ya existe (por nombre), actualizar, sino añadir
    for idx, p in enumerate(presets):
        if p['id'] == preset['id']:
            presets[idx] = preset
            save_json(PRESETS_FILE, presets)
            return
    presets.append(preset)
    save_json(PRESETS_FILE, presets)

def delete_preset(preset_id):
    presets = get_presets()
    presets = [p for p in presets if p['id'] != preset_id]
    save_json(PRESETS_FILE, presets)