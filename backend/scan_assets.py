import os
from app import app, db
from models import Track, Frame

# Mapping folders to categories/subcategories
# Structure: assets/mocks/{type}/{category}/{subcategory}/file.mp3
# Or flat: assets/mocks/{type}/file.mp3 (Global/Uncategorized)

def scan_assets():
    base_path = os.path.join(os.path.dirname(__file__), 'assets', 'mocks')
    
    if not os.path.exists(base_path):
        print(f"Assets path not found: {base_path}")
        return

    with app.app_context():
        # Clear existing tracks to avoid duplicates for this demo
        # db.session.query(Track).delete()
        
        types = ['music', 'ambience', 'sfx']
        
        for t_type in types:
            type_path = os.path.join(base_path, t_type)
            if not os.path.exists(type_path):
                continue
                
            for root, dirs, files in os.walk(type_path):
                for file in files:
                    if file.endswith(('.mp3', '.wav', '.ogg')):
                        # Determine relative path for frontend
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, os.path.dirname(__file__)).replace('\\', '/')
                        
                        # Infer metadata from path
                        # Expected: .../music/Acción/Combate/track.mp3
                        parts = rel_path.split('/')
                        
                        name = os.path.splitext(file)[0].replace('_', ' ').title()
                        category = None
                        subcategory = None
                        frame_id = None # Default to Global if not specified
                        
                        # Check depth to determine category/subcategory
                        # parts[0] = 'assets', parts[1] = 'mocks', parts[2] = type
                        
                        if len(parts) > 4:
                            category = parts[3] # e.g. Acción
                            subcategory = parts[4] # e.g. Combate
                        elif len(parts) > 3:
                            category = parts[3]
                            subcategory = "General"
                        else:
                            category = "General"
                            subcategory = "General"
                        
                        # Check if track exists
                        existing = Track.query.filter_by(filename=rel_path).first()
                        if not existing:
                            print(f"Adding {t_type}: {name} ({category}/{subcategory})")
                            new_track = Track(
                                name=name,
                                filename=rel_path,
                                type=t_type,
                                category=category,
                                subcategory=subcategory,
                                is_global=True # Default to global for now as folder structure doesn't imply Frame
                            )
                            db.session.add(new_track)
        
        db.session.commit()
        print("Scan complete.")

if __name__ == "__main__":
    scan_assets()
