# config.py
import os
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

def _db_url():
    return (
        os.getenv("SQLALCHEMY_DATABASE_URI")
        or os.getenv("DATABASE_URL")
        or f"sqlite:///{BASE_DIR / 'app.db'}"
    )

app = Flask(__name__)
app.config.update(
    SQLALCHEMY_DATABASE_URI=_db_url(),
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    SQLALCHEMY_ENGINE_OPTIONS={
        "pool_pre_ping": True,
        **({"connect_args": {"check_same_thread": False}} if _db_url().startswith("sqlite") else {})
    },
)

db = SQLAlchemy(app)

if app.config["SQLALCHEMY_DATABASE_URI"].startswith("sqlite"):
    from sqlalchemy import event
    @event.listens_for(db.engine, "connect")
    def _fk_on(dbapi_conn, _):
        dbapi_conn.execute("PRAGMA foreign_keys = ON")
