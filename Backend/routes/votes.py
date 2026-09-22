from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, User, Election, Candidate, Vote


votes_bp = Blueprint(
    "votes",
    __name__,
    url_prefix="/api/votes"
)


# ==========================================
# SUBMIT VOTE
# ==========================================
@votes_bp.route("/", methods=["POST"])
@jwt_required()
def submit_vote():

    user_id = int(get_jwt_identity())

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    election_id = data.get("election_id")
    candidate_id = data.get("candidate_id")

    if not election_id or not candidate_id:
        return jsonify({
            "success": False,
            "message": "Election ID and Candidate ID are required"
        }), 400

    # Check user
    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    # Check election
    election = Election.query.get(election_id)

    if not election:
        return jsonify({
            "success": False,
            "message": "Election not found"
        }), 404

    # Check election status
    if election.status != "active":
        return jsonify({
            "success": False,
            "message": "This election is not active"
        }), 400

    # Check candidate
    candidate = Candidate.query.filter_by(
        id=candidate_id,
        election_id=election_id
    ).first()

    if not candidate:
        return jsonify({
            "success": False,
            "message": "Candidate not found for this election"
        }), 404

    # Check if user already voted
    existing_vote = Vote.query.filter_by(
        user_id=user_id,
        election_id=election_id
    ).first()

    if existing_vote:
        return jsonify({
            "success": False,
            "message": "You have already voted in this election"
        }), 409

    # Create vote
    vote = Vote(
        user_id=user_id,
        election_id=election_id,
        candidate_id=candidate_id
    )

    db.session.add(vote)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Vote submitted successfully",
        "vote": vote.to_dict()
    }), 201


# ==========================================
# CHECK MY VOTE
# ==========================================
@votes_bp.route("/my/<int:election_id>", methods=["GET"])
@jwt_required()
def get_my_vote(election_id):

    user_id = int(get_jwt_identity())

    vote = Vote.query.filter_by(
        user_id=user_id,
        election_id=election_id
    ).first()

    if not vote:
        return jsonify({
            "success": True,
            "has_voted": False,
            "vote": None
        }), 200

    return jsonify({
        "success": True,
        "has_voted": True,
        "vote": vote.to_dict()
    }), 200


# ==========================================
# GET ELECTION RESULTS
# ==========================================
@votes_bp.route("/results/<int:election_id>", methods=["GET"])
@jwt_required()
def get_results(election_id):

    election = Election.query.get(election_id)

    if not election:
        return jsonify({
            "success": False,
            "message": "Election not found"
        }), 404

    candidates = Candidate.query.filter_by(
        election_id=election_id
    ).all()

    total_votes = Vote.query.filter_by(
        election_id=election_id
    ).count()

    results = []

    for candidate in candidates:

        vote_count = Vote.query.filter_by(
            election_id=election_id,
            candidate_id=candidate.id
        ).count()

        percentage = 0

        if total_votes > 0:
            percentage = round(
                (vote_count / total_votes) * 100,
                1
            )

        results.append({
            "candidate_id": candidate.id,
            "candidate_name": candidate.name,
            "department": candidate.department,
            "avatar": candidate.avatar,
            "votes": vote_count,
            "percentage": percentage
        })

    return jsonify({
        "success": True,
        "election_id": election_id,
        "election_title": election.title,
        "total_votes": total_votes,
        "results": results
    }), 200