"""Ad-hoc: wipe a single user (and all data they own) so they can
re-register cleanly. Reads the email from EMAIL_TO_WIPE env var.

NOT for regular use — only when an account got into a bad state during
testing or migration. Idempotent: running on a non-existent email is a
no-op.

Usage on the server:
    docker compose exec -T -e EMAIL_TO_WIPE='foo@bar.com' \\
        -w /app api python scripts/wipe_user.py
"""
from __future__ import annotations

import os
import sys
from sqlalchemy import select, delete

# Allow running from /app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.elderly import ElderlyProfile  # noqa: E402
from app.models.family import FamilyMember  # noqa: E402
from app.models.medication import Medication, MedicationLog  # noqa: E402
from app.models.health import (  # noqa: E402
    VitalSign, WellbeingLog, Incident, DailyNote,
    ClinicalDiagnosis, Vaccination, CarePlanItem,
)
from app.models.calendar import CalendarEvent, Task  # noqa: E402
from app.models.chat import ChatMessage, ChatRead  # noqa: E402
from app.models.document import Document  # noqa: E402
from app.models.support import SupportThread, SupportMessage  # noqa: E402


def main() -> None:
    email = os.environ.get("EMAIL_TO_WIPE")
    if not email:
        print("ERROR: set EMAIL_TO_WIPE env var.", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        u = db.scalar(select(User).where(User.email == email))
        if not u:
            print(f"No user with email {email}; nothing to do.")
            return
        print(f"Found user id={u.id} email={u.email} verified={u.is_verified}")

        # Elderly profiles created by this user (cascade their data)
        eids = [
            e.id for e in db.scalars(
                select(ElderlyProfile).where(ElderlyProfile.created_by == u.id)
            ).all()
        ]
        print(f"  cascading {len(eids)} elderly profile(s)…")

        if eids:
            med_ids = [
                m.id for m in db.scalars(
                    select(Medication).where(Medication.elderly_id.in_(eids))
                ).all()
            ]
            if med_ids:
                db.execute(
                    delete(MedicationLog).where(MedicationLog.medication_id.in_(med_ids))
                )
            db.execute(delete(Medication).where(Medication.elderly_id.in_(eids)))

            for tbl in (
                VitalSign, WellbeingLog, Incident, DailyNote,
                ClinicalDiagnosis, Vaccination, CarePlanItem,
                CalendarEvent, Task, Document, ChatMessage, ChatRead,
            ):
                db.execute(delete(tbl).where(tbl.elderly_id.in_(eids)))

            db.execute(delete(FamilyMember).where(FamilyMember.elderly_id.in_(eids)))
            db.execute(delete(ElderlyProfile).where(ElderlyProfile.id.in_(eids)))

        # Memberships in other people's households
        db.execute(delete(FamilyMember).where(FamilyMember.user_id == u.id))

        # Support history
        db.execute(delete(SupportMessage).where(SupportMessage.sender_id == u.id))
        thread_ids = [
            t.id for t in db.scalars(
                select(SupportThread).where(SupportThread.user_id == u.id)
            ).all()
        ]
        if thread_ids:
            db.execute(delete(SupportMessage).where(SupportMessage.thread_id.in_(thread_ids)))
        db.execute(delete(SupportThread).where(SupportThread.user_id == u.id))

        # Chat sender rows + read pointers
        db.execute(delete(ChatMessage).where(ChatMessage.sender_id == u.id))
        db.execute(delete(ChatRead).where(ChatRead.user_id == u.id))

        # Finally, the user themselves
        db.delete(u)
        db.commit()
        print(f"✅ wiped user {email} and all related rows")
    except Exception as e:
        db.rollback()
        print(f"❌ {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
