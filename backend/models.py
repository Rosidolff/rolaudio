from database import db

class Frame(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name
        }

class Track(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    filename = db.Column(db.String(255), nullable=False) # Path relative to audio root
    type = db.Column(db.String(20), nullable=False) # music, ambience, sfx
    
    # Frame association
    frame_id = db.Column(db.Integer, db.ForeignKey('frame.id'), nullable=True)
    is_global = db.Column(db.Boolean, default=False)
    
    # Categorization
    category = db.Column(db.String(50)) # Action, Cotidiano, etc.
    subcategory = db.Column(db.String(50)) # Combate, Hoguera, etc. (For Music)
    
    frame = db.relationship('Frame', backref=db.backref('tracks', lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "filename": self.filename,
            "type": self.type,
            "frame_id": self.frame_id,
            "is_global": self.is_global,
            "category": self.category,
            "subcategory": self.subcategory
        }

class Preset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    frame_id = db.Column(db.Integer, db.ForeignKey('frame.id'), nullable=False)
    config = db.Column(db.JSON, nullable=False) # { "track_id": volume, ... }

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "frame_id": self.frame_id,
            "config": self.config
        }
