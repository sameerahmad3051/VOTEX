# ============================================================
# VOTESECURE - PYTHON FLASK BACKEND
# ============================================================

import os
from routes.auth import auth_bp
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from database.database import db


# ------------------------------------------------------------
# LOAD ENVIRONMENT VARIABLES
# ------------------------------------------------------------

load_dotenv()


# ------------------------------------------------------------
# CREATE FLASK APP
# ------------------------------------------------------------

app = Flask(__name__)


# ------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

DATABASE_PATH = os.path.join(
    BASE_DIR,
    "instance",
    "votesecure.db"
)

# Make sure instance directory exists
os.makedirs(
    os.path.join(BASE_DIR, "instance"),
    exist_ok=True
)


app.config["SQLALCHEMY_DATABASE_URI"] = (
    "sqlite:///" + DATABASE_PATH
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET",
    "development-secret-change-this"
)


# ------------------------------------------------------------
# EXTENSIONS
# ------------------------------------------------------------
from database.database import (
    db,
    User,
    Election,
    Candidate,
    Vote
)

db.init_app(app)

db.UniqueConstraint(
    "user_id",
    "election_id",
    name="unique_user_election_vote"
)

jwt = JWTManager(app)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*"
        }
    }
)


# ------------------------------------------------------------
# BASIC ROUTE
# ------------------------------------------------------------

@app.route("/")
def home():

    return jsonify({
        "success": True,
        "message": "VoteSecure API is running",
        "version": "1.0.0"
    })


# ------------------------------------------------------------
# API HEALTH CHECK
# ------------------------------------------------------------

@app.route("/api/health")
def health():

    return jsonify({
        "success": True,
        "status": "healthy",
        "message": "VoteSecure backend is working"
    })


# ------------------------------------------------------------
# ERROR HANDLERS
# ------------------------------------------------------------

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "success": False,
        "message": "API endpoint not found"
    }), 404


@app.errorhandler(500)
def internal_error(error):

    return jsonify({
        "success": False,
        "message": "Internal server error"
    }), 500


# ------------------------------------------------------------
# DATABASE INITIALIZATION
# ------------------------------------------------------------

with app.app_context():

    # Database tables will be created
    # after we add our models.
    db.create_all()


# ------------------------------------------------------------
# START SERVER
# ------------------------------------------------------------

if __name__ == "__main__":

    print()
    print("=" * 55)
    print("        VOTESECURE BACKEND SERVER")
    print("=" * 55)
    print()
    print("Server running at:")
    print("http://127.0.0.1:5000")
    print()
    print("API health check:")
    print("http://127.0.0.1:5000/api/health")
    print()
    print("=" * 55)
    print()
    app.register_blueprint(auth_bp)
    app.run(
        host="127.0.0.1",
        port=int(os.getenv("PORT", 5000)),
        debug=True
    )