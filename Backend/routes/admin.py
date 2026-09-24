# ============================================================
# VOTESECURE - ADMIN ROUTES
# ============================================================

from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import db, User, Election, Candidate, Vote


# ============================================================
# BLUEPRINT
# ============================================================

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


# ============================================================
# ADMIN AUTH CHECK
# ============================================================

def get_admin_user():
    """Return the currently logged-in admin user."""

    user_id = get_jwt_identity()

    if not user_id:
        return None

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return None

    user = User.query.get(user_id)

    if not user:
        return None

    if not user.is_admin:
        return None

    return user


# ============================================================
# DATE PARSER
# ============================================================

def parse_datetime(value):
    """
    Convert frontend date/datetime strings into Python datetime.

    Supported examples:
    2026-09-25
    2026-09-25T10:30
    2026-09-25T10:30:00
    """

    if not value:
        return None

    if isinstance(value, datetime):
        return value

    value = str(value).strip()

    formats = [
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d"
    ]

    for fmt in formats:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue

    return None


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def admin_dashboard():

    admin = get_admin_user()

    if not admin:
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    total_elections = Election.query.count()

    total_candidates = Candidate.query.count()

    total_voters = User.query.filter_by(
        is_admin=False
    ).count()

    total_votes = Vote.query.count()

    active_elections = Election.query.filter_by(
        status="active"
    ).count()

    return jsonify({
        "success": True,
        "stats": {
            "total_elections": total_elections,
            "active_elections": active_elections,
            "total_candidates": total_candidates,
            "total_voters": total_voters,
            "total_votes": total_votes
        }
    }), 200


# ============================================================
# GET ALL ELECTIONS
# ============================================================

@admin_bp.route("/elections", methods=["GET"])
@jwt_required()
def get_all_elections():

    admin = get_admin_user()

    if not admin:
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    elections = Election.query.order_by(
        Election.id.desc()
    ).all()

    return jsonify({
        "success": True,
        "count": len(elections),
        "elections": [
            election.to_dict()
            for election in elections
        ]
    }), 200


# ============================================================
# CREATE ELECTION
# ============================================================

@admin_bp.route("/elections", methods=["POST"])
@jwt_required()
def create_election():

    admin = get_admin_user()

    if not admin:
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    title = str(data.get("title", "")).strip()

    description = str(
        data.get("description", "")
    ).strip()

    start_date_raw = data.get("start_date")

    end_date_raw = data.get("end_date")

    status = str(
        data.get("status", "upcoming")
    ).strip().lower()

    # --------------------------------------------------------
    # VALIDATE TITLE
    # --------------------------------------------------------

    if not title:
        return jsonify({
            "success": False,
            "message": "Election title is required"
        }), 400

    # --------------------------------------------------------
    # VALIDATE DATES
    # --------------------------------------------------------

    if not start_date_raw:
        return jsonify({
            "success": False,
            "message": "Start date is required"
        }), 400

    if not end_date_raw:
        return jsonify({
            "success": False,
            "message": "End date is required"
        }), 400

    start_date = parse_datetime(
        start_date_raw
    )

    end_date = parse_datetime(
        end_date_raw
    )

    if not start_date:
        return jsonify({
            "success": False,
            "message": "Invalid start date format"
        }), 400

    if not end_date:
        return jsonify({
            "success": False,
            "message": "Invalid end date format"
        }), 400

    # --------------------------------------------------------
    # VALIDATE DATE ORDER
    # --------------------------------------------------------

    if end_date <= start_date:
        return jsonify({
            "success": False,
            "message": "End date must be after start date"
        }), 400

    # --------------------------------------------------------
    # VALIDATE STATUS
    # --------------------------------------------------------

    allowed_statuses = [
        "upcoming",
        "active",
        "completed"
    ]

    if status not in allowed_statuses:
        return jsonify({
            "success": False,
            "message": "Invalid election status"
        }), 400

    # --------------------------------------------------------
    # CREATE ELECTION
    # --------------------------------------------------------

    try:

        election = Election(
            title=title,
            description=description,
            start_date=start_date,
            end_date=end_date,
            status=status
        )

        db.session.add(election)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Election created successfully",
            "election": election.to_dict()
        }), 201

    except Exception as error:

        db.session.rollback()

        print(
            "CREATE ELECTION ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Failed to create election",
            "error": str(error)
        }), 500


# ============================================================
# GET SINGLE ELECTION
# ============================================================

@admin_bp.route(
    "/elections/<int:election_id>",
    methods=["GET"]
)
@jwt_required()
def get_election(election_id):

    admin = get_admin_user()

    if not admin:
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    election = Election.query.get(election_id)

    if not election:
        return jsonify({
            "success": False,
            "message": "Election not found"
        }), 404

    return jsonify({
        "success": True,
        "election": election.to_dict(
            include_candidates=True
        )
    }), 200


# ============================================================
# UPDATE ELECTION
# ============================================================

@admin_bp.route(
    "/elections/<int:election_id>",
    methods=["PUT"]
)
@jwt_required()
def update_election(election_id):

    admin = get_admin_user()

    if not admin:
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    election = Election.query.get(election_id)

    if not election:
        return jsonify({
            "success": False,
            "message": "Election not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    try:

        if "title" in data:

            title = str(
                data["title"]
            ).strip()

            if not title:
                return jsonify({
                    "success": False,
                    "message": "Election title cannot be empty"
                }), 400

            election.title = title

        if "description" in data:

            election.description = str(
                data["description"]
            ).strip()

        if "start_date" in data:

            start_date = parse_datetime(
                data["start_date"]
            )

            if not start_date:
                return jsonify({
                    "success": False,
                    "message": "Invalid start date format"
                }), 400

            election.start_date = start_date

        if "end_date" in data:

            end_date = parse_datetime(
                data["end_date"]
            )

            if not end_date:
                return jsonify({
                    "success": False,
                    "message": "Invalid end date format"
                }), 400

            election.end_date = end_date

        if election.end_date <= election.start_date:
            return jsonify({
                "success": False,
                "message": "End date must be after start date"
            }), 400

        if "status" in data:

            status = str(
                data["status"]
            ).strip().lower()

            allowed_statuses = [
                "upcoming",
                "active",
                "completed"
            ]

            if status not in allowed_statuses:
                return jsonify({
                    "success": False,
                    "message": "Invalid election status"
                }), 400

            election.status = status

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Election updated successfully",
            "election": election.to_dict()
        }), 200

    except Exception as error:

        db.session.rollback()

        print(
            "UPDATE ELECTION ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Failed to update election",
            "error": str(error)
        }), 500


# ============================================================
# DELETE ELECTION
# ============================================================

@admin_bp.route(
    "/elections/<int:election_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_election(election_id):

    admin = get_admin_user()

    if not admin:
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    election = Election.query.get(election_id)

    if not election:
        return jsonify({
            "success": False,
            "message": "Election not found"
        }), 404

    try:

        Vote.query.filter_by(
            election_id=election_id
        ).delete(
            synchronize_session=False
        )

        Candidate.query.filter_by(
            election_id=election_id
        ).delete(
            synchronize_session=False
        )

        db.session.delete(election)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Election deleted successfully"
        }), 200

    except Exception as error:

        db.session.rollback()

        print(
            "DELETE ELECTION ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Failed to delete election",
            "error": str(error)
        }), 500


# ============================================================
# ADD CANDIDATE
# ============================================================

@admin_bp.route(
    "/elections/<int:election_id>/candidates",
    methods=["POST"]
)
@jwt_required()
def add_candidate(election_id):

    admin = get_admin_user()

    if not admin:
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    election = Election.query.get(election_id)

    if not election:
        return jsonify({
            "success": False,
            "message": "Election not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    name = str(
        data.get("name", "")
    ).strip()

    department = str(
        data.get("department", "")
    ).strip()

    description = str(
        data.get("description", "")
    ).strip()

    avatar = str(
        data.get("avatar", "")
    ).strip()

    if not name:
        return jsonify({
            "success": False,
            "message": "Candidate name is required"
        }), 400

    try:

        candidate = Candidate(
            name=name,
            department=department,
            description=description,
            avatar=avatar,
            election_id=election_id
        )

        db.session.add(candidate)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Candidate added successfully",
            "candidate": candidate.to_dict()
        }), 201

    except Exception as error:

        db.session.rollback()

        print(
            "ADD CANDIDATE ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Failed to add candidate",
            "error": str(error)
        }), 500


# ============================================================
# UPDATE CANDIDATE
# ============================================================

@admin_bp.route(
    "/candidates/<int:candidate_id>",
    methods=["PUT"]
)
@jwt_required()
def update_candidate(candidate_id):

    admin = get_admin_user()

    if not admin:
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    candidate = Candidate.query.get(candidate_id)

    if not candidate:
        return jsonify({
            "success": False,
            "message": "Candidate not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    try:

        if "name" in data:

            name = str(
                data["name"]
            ).strip()

            if not name:
                return jsonify({
                    "success": False,
                    "message": "Candidate name cannot be empty"
                }), 400

            candidate.name = name

        if "department" in data:
            candidate.department = str(
                data["department"]
            ).strip()

        if "description" in data:
            candidate.description = str(
                data["description"]
            ).strip()

        if "avatar" in data:
            candidate.avatar = str(
                data["avatar"]
            ).strip()

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Candidate updated successfully",
            "candidate": candidate.to_dict()
        }), 200

    except Exception as error:

        db.session.rollback()

        print(
            "UPDATE CANDIDATE ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Failed to update candidate",
            "error": str(error)
        }), 500


# ============================================================
# DELETE CANDIDATE
# ============================================================

@admin_bp.route(
    "/candidates/<int:candidate_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_candidate(candidate_id):

    admin = get_admin_user()

    if not admin:
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    candidate = Candidate.query.get(candidate_id)

    if not candidate:
        return jsonify({
            "success": False,
            "message": "Candidate not found"
        }), 404

    try:

        Vote.query.filter_by(
            candidate_id=candidate_id
        ).delete(
            synchronize_session=False
        )

        db.session.delete(candidate)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Candidate deleted successfully"
        }), 200

    except Exception as error:

        db.session.rollback()

        print(
            "DELETE CANDIDATE ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Failed to delete candidate",
            "error": str(error)
        }), 500