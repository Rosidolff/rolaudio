from app import app, db
from models import Frame, Track, Preset

def init_db():
    with app.app_context():
        db.create_all()
        
        # Initialize Frames if empty
        if not Frame.query.first():
            frames = ["Fantasía", "Futurista", "Grim Dark"]
            for name in frames:
                db.session.add(Frame(name=name))
            db.session.commit()
            print("Frames initialized.")
        
        print("Database initialized.")

if __name__ == "__main__":
    init_db()
