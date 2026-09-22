from flask import Blueprint, jsonify
from database import Election, Candidate

elections_bp = Blueprint(
    "elections",
    __name__,
    url_prefix="/api/elections"
)


# ==========================================
# GET ALL ELECTIONS
# ==========================================
@elections_bp.route("/", methods=["GET"])
def get_elections():

    elections = Election.query.order_by(
        Election.created_at.desc()
    ).all()

    return jsonify({
        "success": True,
        "count": len(elections),
        "elections": [
            election.to_dict(include_candidates=True)
            for election in elections
        ]
    }), 200


# ==========================================
# GET SINGLE ELECTION
# ==========================================
@elections_bp.route("/<int:election_id>", methods=["GET"])
def get_election(election_id):

    election = Election.query.get(election_id)

    if not election:
        return jsonify({
            "success": False,
            "message": "Election not found"
        }), 404

    return jsonify({
        "success": True,
        "election": election.to_dict(include_candidates=True)
    }), 200


# ==========================================
# GET CANDIDATES OF AN ELECTION
# ==========================================
@elections_bp.route(
    "/<int:election_id>/candidates",
    methods=["GET"]
)
def get_candidates(election_id):

    election = Election.query.get(election_id)

    if not election:
        return jsonify({
            "success": False,
            "message": "Election not found"
        }), 404

    candidates = Candidate.query.filter_by(
        election_id=election_id
    ).all()

    return jsonify({
        "success": True,
        "election_id": election_id,
        "count": len(candidates),
        "candidates": [
            candidate.to_dict(include_votes=False)
            for candidate in candidates
        ]
    }), 200