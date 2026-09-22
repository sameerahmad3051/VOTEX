# ============================================================
# VOTESECURE - DATABASE MODELS
# ============================================================

from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash


# ------------------------------------------------------------
# DATABASE INSTANCE
# ------------------------------------------------------------

db = SQLAlchemy()


# ============================================================
# USER MODEL
# ============================================================

class User(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(150),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    department = db.Column(
        db.String(100),
        nullable=True
    )

    is_verified = db.Column(
        db.Boolean,
        default=True
    )

    is_admin = db.Column(
        db.Boolean,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    # --------------------------------------------------------
    # SET PASSWORD
    # --------------------------------------------------------

    def set_password(self, password):

        self.password_hash = generate_password_hash(
            password
        )

    # --------------------------------------------------------
    # CHECK PASSWORD
    # --------------------------------------------------------

    def check_password(self, password):

        return check_password_hash(
            self.password_hash,
            password
        )

    # --------------------------------------------------------
    # USER RESPONSE
    # --------------------------------------------------------

    def to_dict(self):

        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "department": self.department,
            "is_verified": self.is_verified,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat()
            if self.created_at else None
        }


# ============================================================
# ELECTION MODEL
# ============================================================

class Election(db.Model):

    __tablename__ = "elections"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    start_date = db.Column(
        db.DateTime,
        nullable=False
    )

    end_date = db.Column(
        db.DateTime,
        nullable=False
    )

    status = db.Column(
        db.String(30),
        default="upcoming"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    # --------------------------------------------------------
    # RELATIONSHIP
    # --------------------------------------------------------

    candidates = db.relationship(
        "Candidate",
        backref="election",
        lazy=True,
        cascade="all, delete-orphan"
    )

    votes = db.relationship(
        "Vote",
        backref="election",
        lazy=True,
        cascade="all, delete-orphan"
    )

    # --------------------------------------------------------
    # ELECTION RESPONSE
    # --------------------------------------------------------

    def to_dict(self, include_candidates=False):

        data = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "status": self.status,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            )
        }

        if include_candidates:

            data["candidates"] = [
                candidate.to_dict()
                for candidate in self.candidates
            ]

        return data


# ============================================================
# CANDIDATE MODEL
# ============================================================

class Candidate(db.Model):

    __tablename__ = "candidates"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    department = db.Column(
        db.String(100),
        nullable=True
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    avatar = db.Column(
        db.String(500),
        nullable=True
    )

    election_id = db.Column(
        db.Integer,
        db.ForeignKey("elections.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    # --------------------------------------------------------
    # RELATIONSHIP
    # --------------------------------------------------------

    votes = db.relationship(
        "Vote",
        backref="candidate",
        lazy=True
    )

    # --------------------------------------------------------
    # VOTE COUNT
    # --------------------------------------------------------

    @property
    def vote_count(self):

        return len(self.votes)

    # --------------------------------------------------------
    # CANDIDATE RESPONSE
    # --------------------------------------------------------

    def to_dict(self, include_votes=True):

        data = {
            "id": self.id,
            "name": self.name,
            "department": self.department,
            "description": self.description,
            "avatar": self.avatar,
            "election_id": self.election_id
        }

        if include_votes:
            data["votes"] = self.vote_count

        return data


# ============================================================
# VOTE MODEL
# ============================================================

class Vote(db.Model):

    __tablename__ = "votes"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    election_id = db.Column(
        db.Integer,
        db.ForeignKey("elections.id"),
        nullable=False
    )

    candidate_id = db.Column(
        db.Integer,
        db.ForeignKey("candidates.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    # --------------------------------------------------------
    # ONE USER = ONE VOTE PER ELECTION
    # --------------------------------------------------------

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "election_id",
            name="unique_user_election_vote"
        ),
    )

    # --------------------------------------------------------
    # VOTE RESPONSE
    # --------------------------------------------------------

    def to_dict(self):

        return {
            "id": self.id,
            "user_id": self.user_id,
            "election_id": self.election_id,
            "candidate_id": self.candidate_id,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            )
        }