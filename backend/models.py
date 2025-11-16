from datetime import datetime, timezone
from config import db

class Donation(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80),  nullable=False)
    last_name  = db.Column(db.String(80),  nullable=False)
    email      = db.Column(db.String(120), nullable=True)
    date       = db.Column(db.Date,        nullable=True)      # YYYY-MM-DD
    location   = db.Column(db.String(120), nullable=True)
    items      = db.Column(db.Text,        nullable=True)      # text area
    amount     = db.Column(db.Numeric(10,2), nullable=True)    # precise cents
    created_at = db.Column(
        db.DateTime(timezone=True),                  
        default=lambda: datetime.now(timezone.utc),  
        nullable=False
    )

    def to_json(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "date": self.date.isoformat() if self.date else None,
            "location": self.location,
            "items": self.items,
            "amount": float(self.amount) if self.amount is not None else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
