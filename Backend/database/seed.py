# ============================================================
# VOTESECURE - DATABASE SEED
# ============================================================

import os
import sys
from datetime import datetime, timedelta

# Allow importing from backend folder
BASE_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        ".."
    )
)

sys.path.insert(0, BASE_DIR)

from flask import Flask
from dotenv import load_dotenv

from database import (
    db,
    User,
    Election,
    Candidate
)


# ------------------------------------------------------------
# LOAD ENVIRONMENT VARIABLES
# ------------------------------------------------------------

load_dotenv(
    os.path.join(
        BASE_DIR,
        ".env"
    )
)


# ------------------------------------------------------------
# CREATE FLASK APP
# ------------------------------------------------------------

app = Flask(__name__)

DATABASE_PATH = os.path.join(
    BASE_DIR,
    "instance",
    "votesecure.db"
)

os.makedirs(
    os.path.join(BASE_DIR, "instance"),
    exist_ok=True
)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    "sqlite:///" + DATABASE_PATH
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)


# ============================================================
# SEED DATABASE
# ============================================================

def seed_database():

    with app.app_context():

        print()
        print("=" * 55)
        print("        VOTESECURE DATABASE SEED")
        print("=" * 55)
        print()

        # ----------------------------------------------------
        # CREATE TABLES
        # ----------------------------------------------------

        db.create_all()

        print("✓ Database tables checked")


        # ----------------------------------------------------
        # CHECK EXISTING ELECTION
        # ----------------------------------------------------

        existing_election = Election.query.filter_by(
            title="Student Council Election 2026"
        ).first()

        if existing_election:

            print("⚠ Election already exists")
            print("Nothing new was added.")
            print()

            return


        # ----------------------------------------------------
        # DATES
        # ----------------------------------------------------

        now = datetime.utcnow()

        start_date = now - timedelta(days=5)

        end_date = now + timedelta(days=4)


        # ====================================================
        # CREATE ELECTION
        # ====================================================

        election = Election(

            title="Student Council Election 2026",

            description=(
                "Vote for your preferred Student Council "
                "representative."
            ),

            start_date=start_date,

            end_date=end_date,

            status="active"
        )

        db.session.add(election)

        db.session.flush()


        # ====================================================
        # CREATE CANDIDATES
        # ====================================================

        candidates = [

            Candidate(

                name="Aarav Sharma",

                department="Computer Science",

                description=(
                    "Focused on improving student activities "
                    "and campus technology."
                ),

                avatar="https://i.pravatar.cc/150?img=11",

                election_id=election.id
            ),

            Candidate(

                name="Priya Verma",

                department="Electronics",

                description=(
                    "Focused on student welfare, events "
                    "and academic development."
                ),

                avatar="https://i.pravatar.cc/150?img=47",

                election_id=election.id
            ),

            Candidate(

                name="Rohan Mehta",

                department="Mechanical",

                description=(
                    "Focused on campus infrastructure "
                    "and student representation."
                ),

                avatar="https://i.pravatar.cc/150?img=13",

                election_id=election.id
            )
        ]


        db.session.add_all(candidates)


        # ====================================================
        # CREATE DEMO ADMIN
        # ====================================================

        existing_admin = User.query.filter_by(
            email="admin@votesecure.com"
        ).first()

        if not existing_admin:

            admin = User(

                name="VoteSecure Admin",

                email="admin@votesecure.com",

                department="Administration",

                is_verified=True,

                is_admin=True
            )

            admin.set_password(
                "Admin@12345"
            )

            db.session.add(admin)


        # ====================================================
        # CREATE DEMO USER
        # ====================================================

        existing_user = User.query.filter_by(
            email="voter@example.com"
        ).first()

        if not existing_user:

            user = User(

                name="Sameer Ahmad",

                email="voter@example.com",

                department="Computer Science",

                is_verified=True,

                is_admin=False
            )

            user.set_password(
                "Voter@12345"
            )

            db.session.add(user)


        # ====================================================
        # SAVE DATABASE
        # ====================================================

        db.session.commit()


        # ====================================================
        # SUCCESS MESSAGE
        # ====================================================

        print("✓ Election created")

        print("✓ 3 candidates created")

        print("✓ Demo admin created")

        print("✓ Demo voter created")

        print()

        print("-" * 55)

        print("DEMO ADMIN")
        print("Email    : admin@votesecure.com")
        print("Password : Admin@12345")

        print()

        print("DEMO VOTER")
        print("Email    : voter@example.com")
        print("Password : Voter@12345")

        print("-" * 55)

        print()
        print("Database seeding completed successfully.")
        print()


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    seed_database()