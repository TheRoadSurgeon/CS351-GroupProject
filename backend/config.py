import os
from pathlib import Path

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent


env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path)


database_url = os.getenv("DATABASE_URL") or os.getenv("SQLALCHEMY_DATABASE_URI")
if not database_url:
    database_url = f"sqlite:///{BASE_DIR / 'foodbankdb.db'}"

if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg2://", 1)

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JSON_SORT_KEYS"] = False

# Add connection pool settings to prevent connection drops
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,  # Test connections before using them
    "pool_recycle": 300,     # Recycle connections after 5 minutes
    "pool_size": 10,         # Number of connections to maintain
    "max_overflow": 5,       # Additional connections if pool is full
}

# CORS Configuration
# For production, update origins to include your deployed frontend URL
allowed_origins = [
    "http://localhost:5173",  # Local development
    "http://127.0.0.1:5173",  # Alternative localhost
    os.getenv("FRONTEND_URL", ""),  # Production frontend URL from .env
]

# Remove empty strings
allowed_origins = [origin for origin in allowed_origins if origin]

# Allow all origins in development, specific origins in production
if os.getenv("FLASK_ENV") == "production":
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})
else:
    CORS(app, resources={r"/api/*": {"origins": "*"}})

db = SQLAlchemy(app)
