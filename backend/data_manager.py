import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
SETTINGS_FILE = os.path.join(DATA_DIR, 'settings.json')
PRESETS_FILE = os.path.join(DATA_DIR, 'presets.json')
ORDERS_FILE = os.path.join(DATA_DIR, 'playlist_orders.json')
METADATA_FILE = os.path.join(DATA_DIR, 'track_metadata.json') # NUEVO

os.makedirs(DATA_DIR, exist_ok=True)

def load_json(filepath, default):
    if not os.path.exists(filepath): return default
    try:
        with open(filepath, 'r', encoding='utf-8') as f: return json.load(f)
    except: return default

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f: json.dump(data, f, indent=4)

# --- Settings ---
def get_settings(): return load_json(SETTINGS_FILE, {"masterVolume": 50, "lastFrame": "Fantasy"})
def save_settings(s): 
    curr = get_settings()
    curr.update(s)
    save_json(SETTINGS_FILE, curr)

# --- Presets ---
def get_presets(): return load_json(PRESETS_FILE, [])
def save_preset(p):
    presets = get_presets()
    found = False
    for idx, existing in enumerate(presets):
        if existing['id'] == p['id']:
            presets[idx] = p
            found = True
            break
    if not found: presets.append(p)
    save_json(PRESETS_FILE, presets)
def delete_preset(pid):
    presets = [p for p in get_presets() if p['id'] != pid]
    save_json(PRESETS_FILE, presets)

# --- Playlist Orders ---
def get_orders(): return load_json(ORDERS_FILE, {})
def save_order(key, track_ids):
    orders = get_orders()
    orders[key] = track_ids
    save_json(ORDERS_FILE, orders)

# --- Track Metadata (Iconos, etc) --- NUEVO
def get_all_metadata():
    return load_json(METADATA_FILE, {})

def save_track_metadata(track_id, metadata):
    data = get_all_metadata()
    # track_id es la ruta relativa (ej: Fantasy/music/...)
    if track_id not in data:
        data[track_id] = {}
    data[track_id].update(metadata)
    save_json(METADATA_FILE, data)

def update_metadata_id(old_id, new_id):
    """Mueve la metadata de un ID antiguo al nuevo (usado en rename/move)"""
    data = get_all_metadata()
    if old_id in data:
        data[new_id] = data.pop(old_id)
        save_json(METADATA_FILE, data)