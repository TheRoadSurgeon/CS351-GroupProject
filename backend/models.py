from config import db
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB


class Profile(db.Model):
    __tablename__ = "profiles"

    id = db.Column(UUID(as_uuid=True), primary_key=True)
    email = db.Column(db.String, nullable=False)
    role = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False)

    def to_json(self):
        return {
            "id": str(self.id),
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Donor(db.Model):
    __tablename__ = "donors"

    id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("profiles.id"),
        primary_key=True,
    )
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=True)
    phone = db.Column(db.String, nullable=True)
    address = db.Column(db.String, nullable=True)
    city = db.Column(db.String, nullable=True)
    state = db.Column(db.String, nullable=True)
    postal_code = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False)

    profile = db.relationship("Profile", backref="donor", uselist=False)

    def to_json(self):
        return {
            "id": str(self.id),
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone": self.phone,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "postal_code": self.postal_code,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class FoodBank(db.Model):
    __tablename__ = "food_banks"

    id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("profiles.id"),
        primary_key=True,
    )

    name = db.Column(db.String, nullable=False)
    phone = db.Column(db.String, nullable=True)
    # maps to the "address" column in the database
    address = db.Column("address", db.String, nullable=False)
    city = db.Column(db.String, nullable=False)
    state = db.Column(db.String, nullable=False)
    postal_code = db.Column(db.String, nullable=False)

    created_at = db.Column(db.DateTime(timezone=True), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False)

    profile = db.relationship("Profile", backref="food_bank", uselist=False)

    def to_json(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "phone": self.phone,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "postal_code": self.postal_code,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# class DonationPosting(db.Model):
#     __tablename__ = "donation_postings"

#     id = db.Column(UUID(as_uuid=True), primary_key=True)
#     food_bank_id = db.Column(
#         UUID(as_uuid=True),
#         db.ForeignKey("food_banks.id"),
#         nullable=False,
#     )

#     title = db.Column(db.String, nullable=False)
#     description = db.Column(db.Text, nullable=True)
#     food_type = db.Column(db.String, nullable=False)

#     quantity_needed = db.Column(db.Numeric, nullable=False)
#     urgency = db.Column(db.String, nullable=False)

#     available_times = db.Column(JSONB, nullable=False)
#     pickup_address = db.Column(db.Text, nullable=False)

#     status = db.Column(db.String, nullable=False)

#     tags = db.Column(ARRAY(db.String), nullable=True)
#     banned_items = db.Column(ARRAY(db.String), nullable=True)

#     created_at = db.Column(db.DateTime(timezone=True), nullable=False)
#     updated_at = db.Column(db.DateTime(timezone=True), nullable=False)
#     expires_at = db.Column(db.DateTime(timezone=True), nullable=True)

#     food_bank = db.relationship("FoodBank", backref="postings")

#     def to_json(self):
#         return {
#             "id": str(self.id),
#             "food_bank_id": str(self.food_bank_id),
#             "title": self.title,
#             "description": self.description,
#             "food_type": self.food_type,
#             "quantity_needed": float(self.quantity_needed)
#             if self.quantity_needed is not None else None,
#             "urgency": self.urgency,
#             "available_times": self.available_times,
#             "pickup_address": self.pickup_address,
#             "status": self.status,
#             "tags": self.tags,
#             "banned_items": self.banned_items,
#             "created_at": self.created_at.isoformat() if self.created_at else None,
#             "updated_at": self.updated_at.isoformat() if self.updated_at else None,
#             "expires_at": self.expires_at.isoformat() if self.expires_at else None,
#         }


class DonationPosting(db.Model):
    __tablename__ = "donation_postings"

    id = db.Column(UUID(as_uuid=True), primary_key=True)
    food_bank_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("food_banks.id"),
        nullable=False,
    )

    food_name = db.Column(db.String, nullable=False)
    urgency = db.Column(db.String, nullable=False)
    qty_needed = db.Column(db.Numeric, nullable=False)
    
    from_date = db.Column(db.Date, nullable=False)
    to_date = db.Column(db.Date, nullable=False)
    from_time = db.Column(db.Time, nullable=False)
    to_time = db.Column(db.Time, nullable=False)

    created_at = db.Column(db.DateTime(timezone=False), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=False), nullable=False)

    food_bank = db.relationship("FoodBank", backref="postings")

    def to_json(self):
        return {
            "id": str(self.id),
            "food_bank_id": str(self.food_bank_id),
            "food_name": self.food_name,
            "urgency": self.urgency,
            "qty_needed": float(self.qty_needed) if self.qty_needed is not None else None,
            "from_date": self.from_date.isoformat() if self.from_date else None,
            "to_date": self.to_date.isoformat() if self.to_date else None,
            "from_time": self.from_time.isoformat() if self.from_time else None,
            "to_time": self.to_time.isoformat() if self.to_time else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class Meetup(db.Model):
    __tablename__ = "meetups"

    id = db.Column(UUID(as_uuid=True), primary_key=True)

    posting_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("donation_postings.id"),
        nullable=False,
    )
    donor_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("donors.id"),
        nullable=False,
    )
    food_bank_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("food_banks.id"),
        nullable=False,
    )

    status = db.Column(db.String, nullable=False)
    scheduled_time = db.Column(db.DateTime(timezone=True), nullable=False)

    donation_items = db.Column(db.Text, nullable=False)
    quantity = db.Column(db.Numeric, nullable=True)

    notes = db.Column(db.Text, nullable=True)
    completion_notes = db.Column(db.Text, nullable=True)

    completed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False)

    posting = db.relationship("DonationPosting", backref="meetups")
    donor = db.relationship("Donor", backref="meetups")
    food_bank = db.relationship("FoodBank", backref="meetups")

    def to_json(self):
        return {
            "id": str(self.id),
            "posting_id": str(self.posting_id),
            "donor_id": str(self.donor_id),
            "food_bank_id": str(self.food_bank_id),
            "status": self.status,
            "scheduled_time": self.scheduled_time.isoformat()
            if self.scheduled_time else None,
            "donation_items": self.donation_items,
            "quantity": float(self.quantity) if self.quantity is not None else None,
            "notes": self.notes,
            "completion_notes": self.completion_notes,
            "completed_at": self.completed_at.isoformat()
            if self.completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Leaderboard(db.Model):
    __tablename__ = "leaderboard"

    donor_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("donors.id"),
        primary_key=True,
    )
    rank = db.Column(db.Integer, nullable=True)
    total_points = db.Column(db.Integer, nullable=False)
    total_meetups = db.Column(db.Integer, nullable=False)
    total_weight_donated = db.Column(db.Numeric, nullable=True)
    last_updated = db.Column(db.DateTime(timezone=True), nullable=False)

    donor = db.relationship("Donor", backref="leaderboard_entry")

    def to_json(self):
        return {
            "donor_id": str(self.donor_id),
            "rank": self.rank,
            "total_points": self.total_points,
            "total_meetups": self.total_meetups,
            "total_weight_donated": float(self.total_weight_donated)
            if self.total_weight_donated is not None else None,
            "last_updated": self.last_updated.isoformat()
            if self.last_updated else None,
        }
