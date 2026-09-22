# ============================================================
# VOTESECURE - AUTHENTICATION ROUTES
# ============================================================

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)

from database import db, User


# ------------------------------------------------------------
# BLUEPRINT
# ------------------------------------------------------------

auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


# ============================================================
# REGISTER
# ============================================================

@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    department = data.get("department", "").strip()


    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not name:
        return jsonify({
            "success": False,
            "message": "Name is required"
        }), 400

    if not email:
        return jsonify({
            "success": False,
            "message": "Email is required"
        }), 400

    if not password:
        return jsonify({
            "success": False,
            "message": "Password is required"
        }), 400

    if len(password) < 6:
        return jsonify({
            "success": False,
            "message": "Password must contain at least 6 characters"
        }), 400


    # --------------------------------------------------------
    # CHECK EXISTING USER
    # --------------------------------------------------------

    existing_user = User.query.filter_by(
        email=email
    ).first()

    if existing_user:

        return jsonify({
            "success": False,
            "message": "An account with this email already exists"
        }), 409


    # --------------------------------------------------------
    # CREATE USER
    # --------------------------------------------------------

    user = User(
        name=name,
        email=email,
        department=department,
        is_verified=True,
        is_admin=False
    )

    user.set_password(password)

    db.session.add(user)
    db.session.commit()


    # --------------------------------------------------------
    # CREATE TOKEN
    # --------------------------------------------------------

    access_token = create_access_token(
        identity=str(user.id)
    )


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return jsonify({
        "success": True,
        "message": "Account created successfully",
        "token": access_token,
        "user": user.to_dict()
    }), 201


# ============================================================
# LOGIN
# ============================================================

@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400


    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )


    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not email or not password:

        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400


    # --------------------------------------------------------
    # FIND USER
    # --------------------------------------------------------

    user = User.query.filter_by(
        email=email
    ).first()


    if not user:

        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401


    # --------------------------------------------------------
    # CHECK PASSWORD
    # --------------------------------------------------------

    if not user.check_password(password):

        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401


    # --------------------------------------------------------
    # CREATE JWT
    # --------------------------------------------------------

    access_token = create_access_token(
        identity=str(user.id)
    )


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return jsonify({
        "success": True,
        "message": "Login successful",
        "token": access_token,
        "user": user.to_dict()
    }), 200


# ============================================================
# CURRENT USER
# ============================================================

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def current_user():

    user_id = get_jwt_identity()

    user = User.query.get(
        int(user_id)
    )


    if not user:

        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404


    return jsonify({
        "success": True,
        "user": user.to_dict()
    }), 200