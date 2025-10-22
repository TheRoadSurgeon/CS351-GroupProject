# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import json, os
from trie import Trie

app = Flask(__name__)
CORS(app)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "banks.json")

# Load seed data
with open(DATA_PATH, "r", encoding="utf-8") as f:
    BANKS = json.load(f)

BANK_BY_ID = {b["id"]: b for b in BANKS}

# Build Trie over bank names
TRIE = Trie()
for b in BANKS:
    TRIE.insert(b["name"], b["id"])
    # optional: also index city or tags
    # TRIE.insert(b["city"], b["id"])

@app.get("/api/health")
def health():
    return {"ok": True}, 200

@app.get("/api/banks")
def banks():
    q = (request.args.get("q") or "").strip()
    limit = int(request.args.get("limit") or 20)
    if not q:
        return jsonify({"results": BANKS[:limit], "meta": {"source": "seed", "count": min(limit, len(BANKS))}})
    ids = TRIE.prefix_ids(q, limit=limit)
    results = [BANK_BY_ID[i] for i in ids]
    if not results:
        lowered = q.lower()
        for b in BANKS:
            if lowered in b["name"].lower():
                results.append(b)
                if len(results) >= limit:
                    break
    return jsonify({"results": results, "meta": {"query": q, "count": len(results), "algo": "trie_prefix|substring"}})

@app.get("/api/dashboard")
def dashboard():
    recent = [
        {"date": "2025-10-10", "bankName": "UIC Pantry", "status": "Picked up"},
        {"date": "2025-10-04", "bankName": "Pilsen Food Pantry", "status": "Delivered"},
        {"date": "2025-09-28", "bankName": "Lakeview Food Pantry", "status": "Scheduled"},
    ]
    suggested = BANKS[:3]
    return jsonify({
        "kpis": {"totalDonations": 12, "totalWeightLbs": 85, "streakWeeks": 3},
        "recent": recent,
        "suggestedBanks": suggested
    })

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
