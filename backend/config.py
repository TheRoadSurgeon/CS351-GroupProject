from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)


app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///foodbankdb.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JSON_SORT_KEYS"] = False


CORS(app, resources={r"/api/*": {"origins": "*"}})

db = SQLAlchemy(app)
