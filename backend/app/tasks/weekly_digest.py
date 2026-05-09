"""Weekly recap email - sent every Sunday at 09:00 Europe/Lisbon
to every household owner with at least one elderly profile.

Summary contains, for each elderly the user owns:
  - medication adherence % (last 7 days)
  - bem-estar score (mood average + trend)
  - alerts count (vacinas em atraso, incidentes recentes)
  - dose count taken vs missed/skipped

Idempotent on the day: we record `last_weekly_digest_at` on User and
skip if it was sent in the last 6 days, so an accidental cron re-run
doesn't double-send.
"""
from __future__ import annotations
import json
import logging
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.email import send_email
from app.models.user import User
from app.models.elderly import ElderlyProfile
from app.models.family import FamilyMember
from app.models.medication import Medication, MedicationLog
from app.models.health import WellbeingLog, Incident, Vaccination

log = logging.getLogger(__name__)


def _household_summary(db: Session, elderly_id: int) -> dict:
    """Compute the 7-day numbers for one elderly profile."""
    week_ago = datetime.utcnow() - timedelta(days=7)
    today = datetime.utcnow().date()

    # Medication
    med_ids = [
        m.id for m in db.query(Medication).filter(Medication.elderly_id == elderly_id, Medication.is_active == True).all()  # noqa: E712
    ]
    logs = []
    if med_ids:
        logs = db.query(MedicationLog).filter(
            MedicationLog.medication_id.in_(med_ids),
            MedicationLog.scheduled_time >= week_ago,
        ).all()
    taken = sum(1 for l in logs if l.status == "taken")
    total = len(logs)
    adherence = round((taken / total) * 100) if total else None

    # Wellbeing
    wb_logs = db.query(WellbeingLog).filter(
        WellbeingLog.elderly_id == elderly_id,
        WellbeingLog.logged_date >= today - timedelta(days=7),
    ).all()
    moods = [w.mood for w in wb_logs if w.mood is not None]
    mood_avg = round(sum(moods) / len(moods), 1) if moods else None

    # Incidents
    incidents = db.query(Incident).filter(
        Incident.elderly_id == elderly_id,
        Incident.occurred_at >= week_ago,
    ).count()

    # Overdue vaccines
    overdue_vaccines = db.query(Vaccination).filter(
        Vaccination.elderly_id == elderly_id,
        Vaccination.next_due_date.isnot(None),
        Vaccination.next_due_date < today,
    ).count()

    return {
        "adherence": adherence,
        "doses_taken": taken,
        "doses_total": total,
        "mood_avg": mood_avg,
        "mood_count": len(moods),
        "incidents": incidents,
        "overdue_vaccines": overdue_vaccines,
    }


def _digest_html(user_full_name: str, items: list[dict]) -> str:
    rows = ""
    for it in items:
        s = it["summary"]
        adherence_label = (
            f"<strong>{s['adherence']}%</strong>"
            f" <span style='color:#94a89a;font-size:13px'>({s['doses_taken']}/{s['doses_total']} tomas)</span>"
            if s["adherence"] is not None
            else "<span style='color:#94a89a'>sem registos</span>"
        )
        mood_label = (
            f"<strong>{s['mood_avg']}/5</strong> <span style='color:#94a89a;font-size:13px'>({s['mood_count']} dias)</span>"
            if s["mood_avg"] is not None
            else "<span style='color:#94a89a'>sem registos</span>"
        )
        warnings: list[str] = []
        if s["overdue_vaccines"]:
            warnings.append(f"{s['overdue_vaccines']} vacina(s) em atraso")
        if s["incidents"]:
            warnings.append(f"{s['incidents']} incidente(s)")
        warn_html = (
            f"<div style='margin-top:10px;padding:8px 12px;background:#fff5f5;border-left:3px solid #C53030;border-radius:6px;font-size:13px;color:#C53030;'>"
            f"⚠ {' · '.join(warnings)}</div>"
            if warnings else ""
        )
        rows += f"""
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf7;border:1px solid #e6eeea;border-radius:12px;padding:18px 20px;margin-bottom:14px;">
          <tr><td>
            <div style="font-size:17px;font-weight:800;color:#1a2b22;margin-bottom:10px;">{it['name']}</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#3D5249;">
              <tr><td style="padding:3px 0;width:50%;">Adesão à medicação</td><td>{adherence_label}</td></tr>
              <tr><td style="padding:3px 0;">Bem-estar (humor)</td><td>{mood_label}</td></tr>
            </table>
            {warn_html}
          </td></tr>
        </table>"""

    return f"""<!DOCTYPE html>
<html lang="pt"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f7f5;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2b22;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.09);">
      <tr><td style="background:#2A6049;padding:30px 40px;text-align:center;">
        <div style="font-size:30px;margin-bottom:6px;">🌿</div>
        <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.4px;">pietas.care</div>
        <div style="color:#a8c9bc;font-size:13px;margin-top:4px;">Resumo da semana</div>
      </td></tr>
      <tr><td style="padding:32px 32px 28px;">
        <p style="font-size:16px;margin:0 0 18px;line-height:1.7;">Olá <strong>{user_full_name}</strong>,</p>
        <p style="font-size:15px;margin:0 0 22px;line-height:1.7;color:#4a7060;">Aqui fica o resumo dos últimos 7 dias.</p>
        {rows}
        <div style="margin-top:24px;text-align:center;">
          <a href="https://pietas.care/dashboard" style="display:inline-block;background:#2A6049;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:13px 30px;border-radius:10px;">Abrir o painel</a>
        </div>
        <hr style="border:none;border-top:1px solid #e6eeea;margin:26px 0 14px;">
        <p style="font-size:12px;color:#b0c4b8;margin:0;text-align:center;line-height:1.6;">
          © pietas.care &nbsp;·&nbsp; <a href="https://pietas.care" style="color:#2A6049;text-decoration:none;">pietas.care</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""


def run_weekly_digest(db: Session | None = None) -> dict:
    """Iterate every owner-user with elderly profiles, send digest email.
    Returns a small summary dict for logs."""
    own = db is None
    if own:
        db = SessionLocal()
    try:
        seven_days_ago = datetime.utcnow() - timedelta(days=6)
        sent = 0
        skipped = 0

        # Find users who own at least one elderly profile
        owner_user_ids = {
            row.user_id for row in db.query(FamilyMember.user_id).filter(
                FamilyMember.role == "owner",
                FamilyMember.is_accepted == True,  # noqa: E712
                FamilyMember.user_id.isnot(None),
            ).distinct()
        }

        users = db.query(User).filter(
            User.id.in_(owner_user_ids),
            User.is_verified == True,  # noqa: E712
            User.deleted_at.is_(None),
            User.subscription_status.in_(["trial", "active", "trialing"]),
        ).all()

        for user in users:
            # Idempotency: skip if we sent in the last 6 days
            if user.trial_emails_sent:
                try:
                    history = json.loads(user.trial_emails_sent or "[]")
                except Exception:
                    history = []
            else:
                history = []
            last_digest_keys = [k for k in history if isinstance(k, str) and k.startswith("digest_")]
            if last_digest_keys:
                # Latest digest key is digest_YYYY-MM-DD; parse the date
                try:
                    last_date = max(datetime.strptime(k[7:], "%Y-%m-%d") for k in last_digest_keys)
                    if last_date >= seven_days_ago:
                        skipped += 1
                        continue
                except Exception:
                    pass

            # Gather summaries for each elderly the user owns
            elderly_rows = db.query(ElderlyProfile).join(
                FamilyMember, FamilyMember.elderly_id == ElderlyProfile.id,
            ).filter(
                FamilyMember.user_id == user.id,
                FamilyMember.role == "owner",
                FamilyMember.is_accepted == True,  # noqa: E712
            ).all()
            if not elderly_rows:
                continue

            items = [
                {"name": e.full_name, "summary": _household_summary(db, e.id)}
                for e in elderly_rows
            ]

            html = _digest_html(user.full_name, items)
            ok = send_email(user.email, "Resumo da semana - pietas.care", html)
            if ok:
                key = f"digest_{datetime.utcnow().date().isoformat()}"
                history.append(key)
                user.trial_emails_sent = json.dumps(history)
                db.commit()
                sent += 1

        return {"sent": sent, "skipped": skipped, "owners_checked": len(users)}
    finally:
        if own:
            db.close()
