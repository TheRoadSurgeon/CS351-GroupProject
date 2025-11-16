from config import db
from sqlalchemy.dialects.postgresql import UUID, ARRAY


class Profile(db.Model):
    """
    id == auth.users.id
    role is 'Donor' or 'Food Bank'
    """

    __tablename__ = "profiles"

    id = db.Column(UUID(as_uuid=True), primary_key=True)
    email = db.Column(db.String, nullable=False)
    role = db.Column(db.String, nullable=False)  # 'Donor' or 'Food Bank'
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
    """
    Donor-specific info (regular users).
    id == profiles.id
    """

    __tablename__ = "donors"

    id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("profiles.id"),
        primary_key=True,
    )
    first_name = db.Column(db.String, nullable=True)
    last_name = db.Column(db.String, nullable=True)
    email = db.Column(db.String, nullable=True)  # optional, can mirror profiles.email
    phone = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False)

    profile = db.relationship("Profile", backref="donor", uselist=False)

    def to_json(self):
        return {
            "id": str(self.id),
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class FoodBank(db.Model):
    """
    Food bank account info.
    id == profiles.id
    """

    __tablename__ = "food_banks"

    id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("profiles.id"),
        primary_key=True,
    )

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    phone = db.Column(db.String)
    website = db.Column(db.String)
    address1 = db.Column(db.String, nullable=False)
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
            "description": self.description,
            "phone": self.phone,
            "website": self.website,
            "address1": self.address1,
            "city": self.city,
            "state": self.state,
            "postal_code": self.postal_code,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DonationPosting(db.Model):
    __tablename__ = "donation_postings"

    id = db.Column(UUID(as_uuid=True), primary_key=True)
    food_bank_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("food_banks.id"),
        nullable=False,
    )

    title = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    food_type = db.Column(db.String, nullable=False)

    quantity_needed = db.Column(db.Numeric, nullable=True)
    quantity_unit = db.Column(db.String, nullable=True)

    urgency = db.Column(db.String, nullable=False)  # 'low', 'medium', 'high'

    available_times = db.Column(db.JSON, nullable=True)   # JSONB in Postgres
    pickup_address = db.Column(db.Text, nullable=True)

    status = db.Column(db.String, nullable=False)  # 'active', 'fulfilled', 'cancelled'

    tags = db.Column(ARRAY(db.String), nullable=True)
    banned_items = db.Column(ARRAY(db.String), nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=True)

    food_bank = db.relationship("FoodBank", backref="postings")

    def to_json(self):
        return {
            "id": str(self.id),
            "food_bank_id": str(self.food_bank_id),
            "title": self.title,
            "description": self.description,
            "food_type": self.food_type,
            "quantity_needed": float(self.quantity_needed)
            if self.quantity_needed is not None else None,
            "quantity_unit": self.quantity_unit,
            "urgency": self.urgency,
            "available_times": self.available_times,
            "pickup_address": self.pickup_address,
            "status": self.status,
            "tags": self.tags,
            "banned_items": self.banned_items,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
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

    status = db.Column(db.String, nullable=False)  # 'pending', 'accepted', 'completed', 'cancelled'
    scheduled_time = db.Column(db.DateTime(timezone=True), nullable=True)

    donation_items = db.Column(db.Text, nullable=True)
    quantity = db.Column(db.Numeric, nullable=True)
    quantity_unit = db.Column(db.String, nullable=True)

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
            "quantity_unit": self.quantity_unit,
            "notes": self.notes,
            "completion_notes": self.completion_notes,
            "completed_at": self.completed_at.isoformat()
            if self.completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Leaderboard(db.Model):
    __tablename__ = "leaderboard"

    donor_id            = db.Column(
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
