from datetime import datetime, timedelta
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
    for w in words:
        search_trie.insert(w, item_id=str(posting.id))


def _build_trie_from_db():
    """
    Rebuild the Trie from all existing DonationPosting rows.
    This will be called once at startup (in __main__).
    """
    postings = DonationPosting.query.all()
    search_trie.clear()
    
    for posting in postings:
        _index_posting_in_trie(posting)
    
    indexed_words = search_trie.words()
    print(f"Trie Index Built Successfully")
    print(f"Total postings indexed: {len(postings)}")
    print(f"Total unique words indexed: {len(indexed_words)}")
    print(f"\nIndexed words: {sorted(indexed_words)}")


# --- User Profile Creation API ---

@app.post("/api/profiles")
def create_profile():
    """
    Create a profile and associated donor or food_bank record after Supabase registration.
    """
    data = request.get_json(silent=True) or {}
    
    user_id = data.get("user_id")
    email = data.get("email")
    role = data.get("role")
    
    if not user_id or not email or not role:
        return jsonify({"error": "user_id, email, and role are required"}), 400
    
    try:
        # Convert user_id string to UUID
        from uuid import UUID
        user_uuid = UUID(user_id)
        
        now = datetime.utcnow()
        
        # Check if profile already exists
        existing_profile = Profile.query.filter_by(id=user_uuid).first()
        
        if not existing_profile:
            # Create Profile
            profile = Profile(
                id=user_uuid,
                email=email,
                role=role,
                created_at=now,
                updated_at=now
            )
            db.session.add(profile)
        else:
            profile = existing_profile
        
        # Create role-specific record
        if role == "Donor":
            # Check if donor already exists
            existing_donor = Donor.query.filter_by(id=user_uuid).first()
            if existing_donor:
                return jsonify({
                    "message": "Donor profile already exists",
                    "profile": profile.to_json()
                }), 200
            
            first_name = data.get("first_name")
            last_name = data.get("last_name")
            phone = data.get("phone")
            address = data.get("address")
            city = data.get("city")
            state = data.get("state")
            postal_code = data.get("postalCode")
            
            if not all([first_name, last_name, phone, address, city, state, postal_code]):
                return jsonify({"error": "first_name, last_name, phone, address, city, state, and postalCode are required for Donor"}), 400

            donor = Donor(
                id=user_uuid,
                first_name=first_name,
                last_name=last_name or "",
                phone=phone,
                address=address,
                city=city,
                state=state,
                postal_code=postal_code,
                created_at=now,
                updated_at=now
            )
            db.session.add(donor)
            
        elif role == "Food Bank":
            # Check if food bank already exists
            existing_food_bank = FoodBank.query.filter_by(id=user_uuid).first()
            if existing_food_bank:
                return jsonify({
                    "message": "Food Bank profile already exists",
                    "profile": profile.to_json()
                }), 200
            
            name = data.get("name")
            phone = data.get("phone")
            address = data.get("address")
            city = data.get("city")
            state = data.get("state")
            postal_code = data.get("postalCode")
            
            if not all([name, phone, address, city, state, postal_code]):
                return jsonify({"error": "name, phone, address, city, state, and postalCode are required for Food Bank"}), 400
            
            food_bank = FoodBank(
                id=user_uuid,
                name=name,
                phone=phone,
                address=address,
                city=city,
                state=state,
                postal_code=postal_code,
                created_at=now,
                updated_at=now
            )
            db.session.add(food_bank)
        else:
            return jsonify({"error": "Invalid role. Must be 'Donor' or 'Food Bank'"}), 400
        
        db.session.commit()
        
        return jsonify({
            "message": "Profile created successfully",
            "profile": profile.to_json()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Error creating profile: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Database error: {str(e)}"}), 500


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
    Create a new donation posting for a food bank.
    Required fields: food_bank_id, title, food_type, quantity_needed,
    available_times, pickup_address.
    """
    data = request.get_json(silent=True) or {}

    food_bank_id = data.get("food_bank_id")
    food_name = data.get("food_name")
    urgency = data.get("urgency")

    if not food_bank_id or not food_name or not urgency:
        return jsonify(
            {"error": "food_bank_id, food_name, and urgency are required"}
        ), 400

    qty_needed = data.get("quantity_needed")
    if qty_needed is None:
        return jsonify({"error": "quantity_needed is required"}), 400

    try:
        qty_needed = Decimal(str(qty_needed)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError, TypeError):
        return jsonify({"error": "quantity_needed must be a number"}), 400

    from_date = data.get("from_date")
    to_date = data.get("to_date")
    from_time = data.get("from_time")
    to_time = data.get("to_time")

    if not from_date or not to_date or not from_time or not to_time:
        return jsonify({"error": "either from_date, to_date, from_time, to_time is missing"}), 400

    posting = DonationPosting(
        id=uuid4(),
        food_bank_id=food_bank_id,
        food_name = food_name,
        urgency = urgency,
        qty_needed = qty_needed,
        from_date = from_date,
        to_date = to_date,
        from_time = from_time,
        to_time = to_time,
    )
    
    db.session.add(posting)
    db.session.commit()

    # _index_posting_in_trie(posting)

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
    List meetups (scheduled donations).
    Optional filters: donor_id, food_bank_id, posting_id, completed (true/false)
    """
    donor_id = request.args.get("donor_id")
    food_bank_id = request.args.get("food_bank_id")
    posting_id = request.args.get("posting_id")
    completed = request.args.get("completed")

    query = Meetup.query
    if donor_id:
        try:
            donor_uuid = UUID(donor_id)
            query = query.filter_by(donor_id=donor_uuid)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid donor_id format"}), 400
            
    if food_bank_id:
        try:
            fb_uuid = UUID(food_bank_id)
            query = query.filter_by(food_bank_id=fb_uuid)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid food_bank_id format"}), 400

    if posting_id:
        try:
            posting_uuid = UUID(posting_id)
            query = query.filter_by(posting_id=posting_uuid)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid posting_id format"}), 400
            
    if completed is not None:
        is_completed = completed.lower() in ('true', '1', 'yes')
        query = query.filter_by(completed=is_completed)

    meetups = query.order_by(Meetup.scheduled_date.desc(), Meetup.scheduled_time.desc()).all()
    return jsonify({"meetups": [m.to_json() for m in meetups]})


@app.get("/api/donors/<donor_id>")
def get_donor(donor_id):
    """
    Get a specific donor's details.
    """
    try:
        donor_uuid = UUID(donor_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid donor_id format"}), 400
    
    donor = Donor.query.filter_by(id=donor_uuid).first()
    if not donor:
        return jsonify({"error": "Donor not found"}), 404
    
    return jsonify(donor.to_json())

@app.post("/api/meetups")
def create_meetup():
    """
    Create a new meetup.
    Required fields: posting_id, donor_id, food_bank_id,
    scheduled_date, scheduled_time, donation_item, quantity
    """
    data = request.get_json(silent=True) or {}

    posting_id = data.get("posting_id")
    donor_id = data.get("donor_id")
    food_bank_id = data.get("food_bank_id")

    if not posting_id or not donor_id or not food_bank_id:
        return jsonify(
            {"error": "posting_id, donor_id, and food_bank_id are required"}
        ), 400

    # Validate UUIDs
    try:
        posting_uuid = UUID(posting_id)
        donor_uuid = UUID(donor_id)
        fb_uuid = UUID(food_bank_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid UUID format"}), 400

    # Validate scheduled_date and scheduled_time
    scheduled_date_str = data.get("scheduled_date")
    scheduled_time_str = data.get("scheduled_time")
    
    if not scheduled_date_str or not scheduled_time_str:
        return jsonify({"error": "scheduled_date and scheduled_time are required"}), 400

    try:
        from datetime import date, time
        scheduled_date = date.fromisoformat(scheduled_date_str)
        # Handle time format like "14:30" or "14:30:00"
        time_parts = scheduled_time_str.split(':')
        if len(time_parts) == 2:
            scheduled_time = time(int(time_parts[0]), int(time_parts[1]))
        elif len(time_parts) == 3:
            scheduled_time = time(int(time_parts[0]), int(time_parts[1]), int(time_parts[2]))
        else:
            raise ValueError("Invalid time format")
    except (ValueError, TypeError) as e:
        return jsonify(
            {"error": f"Invalid date/time format. Use YYYY-MM-DD for date and HH:MM for time. Error: {str(e)}"}
        ), 400

    # Validate donation_item
    donation_item = (data.get("donation_item") or data.get("donation_items") or "").strip()
    if not donation_item:
        return jsonify({"error": "donation_item is required"}), 400

    # Validate quantity
    quantity = data.get("quantity")
    if quantity is None:
        return jsonify({"error": "quantity is required"}), 400

    try:
        qty = Decimal(str(quantity)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError, TypeError):
        return jsonify({"error": "quantity must be a number"}), 400

    # Check if posting exists
    posting = DonationPosting.query.filter_by(id=posting_uuid).first()
    if not posting:
        return jsonify({"error": "Donation posting not found"}), 404

    # Check if donor exists
    donor = Donor.query.filter_by(id=donor_uuid).first()
    if not donor:
        return jsonify({"error": "Donor not found"}), 404

    # Check if food bank exists
    food_bank = FoodBank.query.filter_by(id=fb_uuid).first()
    if not food_bank:
        return jsonify({"error": "Food bank not found"}), 404

    now = datetime.utcnow()

    meetup = Meetup(
        id=uuid4(),
        posting_id=posting_uuid,
        donor_id=donor_uuid,
        food_bank_id=fb_uuid,
        donation_item=donation_item,
        quantity=qty,
        scheduled_date=scheduled_date,
        scheduled_time=scheduled_time,
        completed=False,
        completed_at=None,
        created_at=now,
        updated_at=now,
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

    Optional query param:
      - timeframe = "week" | "month" | "alltime" (default: alltime)
    """
    timeframe = (request.args.get("timeframe") or "alltime").lower()

    now = datetime.now()
    cutoff = None

    if timeframe == "week":
        cutoff = now - timedelta(days=7)
    elif timeframe == "month":
        cutoff = now - timedelta(days=30)
 
    query = db.session.query(
        Meetup.donor_id,
        db.func.count(Meetup.id).label("total_meetups"),
        db.func.coalesce(db.func.sum(Meetup.quantity), 0).label("total_weight"),
    ).filter(Meetup.completed.is_(True))

    if cutoff is not None:
        query = query.filter(Meetup.completed_at >= cutoff)

    rows = (
        query
        .group_by(Meetup.donor_id)
        .order_by(db.func.coalesce(db.func.sum(Meetup.quantity), 0).desc())
        .limit(50)
        .all()
    )

    donor_ids = [row.donor_id for row in rows]
    donors = Donor.query.filter(Donor.id.in_(donor_ids)).all()
    donor_by_id = {d.id: d for d in donors}

    profiles = Profile.query.filter(Profile.id.in_(donor_ids)).all()
    profile_by_id = {p.id: p for p in profiles}

    out = []
    rank = 1
    for row in rows:
        donor = donor_by_id.get(row.donor_id)
        profile = profile_by_id.get(row.donor_id)
        out.append({
            "rank": rank,
            "donor_id": str(row.donor_id),
            "first_name": donor.first_name if donor else None,
            "last_name": donor.last_name if donor else None,
            "email": profile.email if profile else None,
            "total_meetups": int(row.total_meetups or 0),
            "total_weight": float(row.total_weight or 0),
        })
        rank += 1

    return jsonify({
        "timeframe": timeframe,
        "leaderboard": out
    })



if __name__ == "__main__":
    # with app.app_context():
    #     try:
    #         _build_trie_from_db()
    #     except Exception as e:
    #         print("WARNING: Could not build Trie from DB at startup:", repr(e))
    #         import traceback
    #         traceback.print_exc()
    app.run(debug=True, port=5000)
