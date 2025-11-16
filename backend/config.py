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

CORS(app, resources={r"/api/*": {"origins": "*"}})

db = SQLAlchemy(app)
