from datetime import date
from decimal import Decimal, InvalidOperation
from flask import request, jsonify
from config import app, db
from models import Donation

@app.get("/api/health")
def health():
    return jsonify({"ok": True})

@app.get("/api/donations")
def list_donations():
    donations = Donation.query.order_by(Donation.id.desc()).all()
    return jsonify({"donations": [d.to_json() for d in donations]})

@app.post("/api/donations")
def create_donation():
    data = request.get_json(silent=True) or {}

    first = (data.get("first_name") or "").strip()
    last  = (data.get("last_name")  or "").strip()
    if not first or not last:
        return jsonify({"error": "first_name and last_name are required"}), 400

    email    = data.get("email")
    location = data.get("location")
    items    = data.get("items")

    d_parsed = None
    if data.get("date"):
        try:
            d_parsed = date.fromisoformat(data["date"])  # expects "YYYY-MM-DD"
        except ValueError:
            return jsonify({"error": "date must be YYYY-MM-DD"}), 400

    amt = None
    if data.get("amount") is not None:
        try:
            amt = Decimal(str(data["amount"])).quantize(Decimal("0.01"))
        except (InvalidOperation, ValueError, TypeError):
            return jsonify({"error": "amount must be a number"}), 400

    donation = Donation(
        first_name=first,
        last_name=last,
        email=email,
        date=d_parsed,
        location=location,
        items=items,
        amount=amt,
    )
    db.session.add(donation)
    db.session.commit()
    return jsonify(donation.to_json()), 201

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # creates tables if they don't exist
    app.run(debug=True, port=5000)
