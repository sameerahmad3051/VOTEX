from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import db, User, Election, Candidate, Vote


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


# =========================================================
# ADMIN AUTH CHECK
# =========================================================

def get_admin_user():
    """Return the currently logged-in admin user."""

    user_id = get_jwt_identity()

    if not user_id:
        return None

    user = User.query.get(int(user_id))

    if not user:
        return None

    if not user.is_admin:
        return None

    return user


# =========================================================
# ADMIN DASHBOARD
# =========================================================

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
    total_voters = User.query.filter_by(is_admin=False).count()
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


# =========================================================
# GET ALL ELECTIONS
# =========================================================

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


# =========================================================
# CREATE ELECTION
# =========================================================

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

    title = data.get("title")
    description = data.get("description", "")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    status = data.get("status", "upcoming")

    if not title:
        return jsonify({
            "success": False,
            "message": "Election title is required"
        }), 400

    if not start_date:
        return jsonify({
            "success": False,
            "message": "Start date is required"
        }), 400

    if not end_date:
        return jsonify({
            "success": False,
            "message": "End date is required"
        }), 400

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


# =========================================================
# GET SINGLE ELECTION
# =========================================================

@admin_bp.route("/elections/<int:election_id>", methods=["GET"])
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
        "election": election.to_dict()
    }), 200


# =========================================================
# UPDATE ELECTION
# =========================================================

@admin_bp.route("/elections/<int:election_id>", methods=["PUT"])
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

    if "title" in data:
        election.title = data["title"]

    if "description" in data:
        election.description = data["description"]

    if "start_date" in data:
        election.start_date = data["start_date"]

    if "end_date" in data:
        election.end_date = data["end_date"]

    if "status" in data:

        allowed_statuses = [
            "upcoming",
            "active",
            "completed"
        ]

        if data["status"] not in allowed_statuses:
            return jsonify({
                "success": False,
                "message": "Invalid election status"
            }), 400

        election.status = data["status"]

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Election updated successfully",
        "election": election.to_dict()
    }), 200


# =========================================================
# DELETE ELECTION
# =========================================================

@admin_bp.route("/elections/<int:election_id>", methods=["DELETE"])
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

    # Delete votes belonging to this election
    Vote.query.filter_by(
        election_id=election_id
    ).delete()

    # Delete candidates belonging to this election
    Candidate.query.filter_by(
        election_id=election_id
    ).delete()

    db.session.delete(election)

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Election deleted successfully"
    }), 200


# =========================================================
# ADD CANDIDATE
# =========================================================

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

    name = data.get("name")
    department = data.get("department", "")
    description = data.get("description", "")
    avatar = data.get("avatar", "")

    if not name:
        return jsonify({
            "success": False,
            "message": "Candidate name is required"
        }), 400

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


# =========================================================
# UPDATE CANDIDATE
# =========================================================

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

    if "name" in data:
        candidate.name = data["name"]

    if "department" in data:
        candidate.department = data["department"]

    if "description" in data:
        candidate.description = data["description"]

    if "avatar" in data:
        candidate.avatar = data["avatar"]

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Candidate updated successfully",
        "candidate": candidate.to_dict()
    }), 200


# =========================================================
# DELETE CANDIDATE
# =========================================================

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

    # Delete votes for this candidate
    Vote.query.filter_by(
        candidate_id=candidate_id
    ).delete()

    db.session.delete(candidate)

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Candidate deleted successfully"
    }), 200