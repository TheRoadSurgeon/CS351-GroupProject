from datetime import datetime
from decimal import Decimal, InvalidOperation
from uuid import uuid4, UUID
from threading import Lock
from sqlalchemy import text
from flask import request, jsonify

from config import app, db
from models import (
    FoodBank,
    DonationPosting,
    Meetup,
    Leaderboard,
    Profile,
    Donor,
)
from trie import Trie


# --- Global Trie setup for searching donation postings ---

search_trie = Trie()
trie_lock = Lock()


def _index_posting_in_trie(posting):
    """
    Index one DonationPosting into the Trie.
    We use title, description, tags, and banned_items so that
    search can match on any of those words.
    """
    text_pieces = []

    if posting.title:
        text_pieces.append(posting.title)
    if posting.description:
        text_pieces.append(posting.description)
    if posting.tags:
        
        text_pieces.extend(posting.tags)
    if posting.banned_items:
        text_pieces.extend(posting.banned_items)

    combined = " ".join(text_pieces)
    if not combined:
        return

    words = combined.split()
    
    with trie_lock:
        for w in words:

            search_trie.insert(w, item_id=str(posting.id))


def _build_trie_from_db():
    """
    Rebuild the Trie from all existing DonationPosting rows.
    This will be called once at startup (in __main__).
    """
    postings = DonationPosting.query.all()
    with trie_lock:
        search_trie.clear()
        for posting in postings:
            _index_posting_in_trie(posting)



# --- Food banks API ---

@app.get("/api/food_banks")
def list_food_banks():
    banks = FoodBank.query.order_by(FoodBank.name).all()
    return jsonify({"food_banks": [b.to_json() for b in banks]})


# --- Donation postings API ---

@app.get("/api/donation_postings")
def list_donation_postings():
    """
    List donation postings.
    """
    food_bank_id = request.args.get("food_bank_id")
    query = DonationPosting.query
    if food_bank_id:
        query = query.filter_by(food_bank_id=food_bank_id)
    postings = query.order_by(DonationPosting.created_at.desc()).all()
    return jsonify({"postings": [p.to_json() for p in postings]})


@app.post("/api/donation_postings")
def create_donation_posting():
    """
    Create a new donation posting for a food bank into the Trie.
    Required fields: food_bank_id, title, food_type.
    """
    data = request.get_json(silent=True) or {}

    food_bank_id = data.get("food_bank_id")
    title = (data.get("title") or "").strip()
    food_type = (data.get("food_type") or "").strip()

    if not food_bank_id or not title or not food_type:
        return jsonify(
            {"error": "food_bank_id, title, and food_type are required"}
        ), 400

    posting = DonationPosting(
       
        id=uuid4(),
        food_bank_id=food_bank_id,
        title=title,
        description=data.get("description"),
        food_type=food_type,
        quantity_needed=data.get("quantity_needed"),
        quantity_unit=data.get("quantity_unit"),
        urgency=data.get("urgency") or "medium",
        available_times=data.get("available_times"),
        pickup_address=data.get("pickup_address"),
        status=data.get("status") or "active",
        tags=data.get("tags"),
        banned_items=data.get("banned_items"),
        expires_at=None,
    )

    db.session.add(posting)
    db.session.commit()

    _index_posting_in_trie(posting)

    return jsonify(posting.to_json()), 201


# --- Trie-based autocomplete endpoint ---

@app.get("/api/items/autocomplete")
def autocomplete_items():
    """
    Return word suggestions for a given prefix based on all
    words we've seen in donation postings (title, description, tags, banned_items).
    Example: /api/items/autocomplete?q=can
    """
    prefix = (request.args.get("q") or "").strip()
    if not prefix:
        return jsonify({"items": []})

    with trie_lock:
        words = search_trie.words_with_prefix(prefix, limit=10)

    return jsonify({"items": words})


# --- Trie-based search for postings ---

@app.get("/api/search/postings")
def search_postings():
    """
    Search donation postings by text prefix using the Trie.
    Looks at words from title, description, tags, and banned_items.
    Example: /api/search/postings?q=rice
    """
    prefix = (request.args.get("q") or "").strip()
    if not prefix:
        return jsonify({"postings": []})

    with trie_lock:
        id_list = search_trie.prefix_ids(prefix, limit=20)

    if not id_list:
        return jsonify({"postings": []})

    uuid_ids = []
    for s in id_list:
        try:
            uuid_ids.append(UUID(s))
        except ValueError:
            continue

    if not uuid_ids:
        return jsonify({"postings": []})

    postings = (
        DonationPosting
        .query
        .filter(DonationPosting.id.in_(uuid_ids))
        .all()
    )

    posting_by_id = {str(p.id): p for p in postings}
    ordered = [posting_by_id[_id] for _id in id_list if _id in posting_by_id]

    return jsonify({"postings": [p.to_json() for p in ordered]})


# --- Meetups API ---

@app.get("/api/meetups")
def list_meetups():
    """
    List meetups (pledged donations).
    """
    donor_id = request.args.get("donor_id")
    food_bank_id = request.args.get("food_bank_id")

    query = Meetup.query
    if donor_id:
        query = query.filter_by(donor_id=donor_id)
    if food_bank_id:
        query = query.filter_by(food_bank_id=food_bank_id)

    meetups = query.order_by(Meetup.created_at.desc()).all()
    return jsonify({"meetups": [m.to_json() for m in meetups]})


@app.post("/api/meetups")
def create_meetup():
    """
    Create a new meetup.
    Required fields: posting_id, donor_id, food_bank_id.
    """
    data = request.get_json(silent=True) or {}

    posting_id = data.get("posting_id")
    donor_id = data.get("donor_id")
    food_bank_id = data.get("food_bank_id")

    if not posting_id or not donor_id or not food_bank_id:
        return jsonify(
            {"error": "posting_id, donor_id, and food_bank_id are required"}
        ), 400

    scheduled_time = None
    if data.get("scheduled_time"):
        try:
            scheduled_time = datetime.fromisoformat(data["scheduled_time"])
        except ValueError:
            return jsonify(
                {"error": "scheduled_time must be ISO 8601 datetime string"}
            ), 400

    qty = None
    if data.get("quantity") is not None:
        try:
            qty = Decimal(str(data["quantity"])).quantize(Decimal("0.01"))
        except (InvalidOperation, ValueError, TypeError):
            return jsonify({"error": "quantity must be a number"}), 400

    meetup = Meetup(
        posting_id=posting_id,
        donor_id=donor_id,
        food_bank_id=food_bank_id,
        status=data.get("status") or "pending",
        scheduled_time=scheduled_time,
        donation_items=data.get("donation_items"),
        quantity=qty,
        quantity_unit=data.get("quantity_unit"),
        notes=data.get("notes"),
        completion_notes=data.get("completion_notes"),
    )

    db.session.add(meetup)
    db.session.commit()
    return jsonify(meetup.to_json()), 201


# --- Leaderboard (by total donated weight) ---

@app.get("/api/leaderboard")
def leaderboard():
    """
    Build a leaderboard of donors based on TOTAL WEIGHT donated
    (sum of Meetup.quantity) for completed meetups.
    """
    rows = (
        db.session.query(
            Meetup.donor_id,
            db.func.count(Meetup.id).label("total_meetups"),
            db.func.coalesce(db.func.sum(Meetup.quantity), 0).label("total_weight"),
        )
        .filter(Meetup.status == "completed")
        .group_by(Meetup.donor_id)
        .order_by(db.func.coalesce(db.func.sum(Meetup.quantity), 0).desc())
        .limit(10)
        .all()
    )

    donor_ids = [row.donor_id for row in rows]
    donors = Donor.query.filter(Donor.id.in_(donor_ids)).all()
    donor_by_id = {d.id: d for d in donors}

    out = []
    rank = 1
    for row in rows:
        donor = donor_by_id.get(row.donor_id)
        out.append({
            "rank": rank,
            "donor_id": str(row.donor_id),
            "first_name": donor.first_name if donor else None,
            "last_name": donor.last_name if donor else None,
            "email": donor.email if donor else None,
            "total_meetups": int(row.total_meetups or 0),
            "total_weight": float(row.total_weight or 0),
        })
        rank += 1

    return jsonify({"leaderboard": out})


# --- Debug ---

# TODO DELETE ME
@app.get("/api/db-test")
def db_test():
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify({"db_ok": True})
    except Exception as e:
        print("DB TEST ERROR:", repr(e))
        return jsonify({"db_ok": False, "error": str(e)}), 500

# TODO DELETE ME
@app.get("/api/db-info")
def db_info():
    url = str(db.engine.url)
    if "@" in url and "://" in url:
        head, tail = url.split("://", 1)
        creds, host = tail.split("@", 1)
        if ":" in creds:
            user, _ = creds.split(":", 1)
            url = f"{head}://{user}:***@{host}"
    return {"dialect": db.engine.dialect.name, "url": url}



if __name__ == "__main__":
    with app.app_context():
        try:
            _build_trie_from_db()
        except Exception as e:
            print("WARNING: Could not build Trie from DB at startup:", repr(e))
        

    app.run(debug=True, port=5000)

