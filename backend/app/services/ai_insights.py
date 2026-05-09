"""On-demand AI clinical insights for an elderly profile.

Pulls recent vitals, wellbeing, medication adherence, and incidents,
and asks Claude Haiku for a Portuguese clinical summary suitable for
a family caregiver (not a medical professional).

Gated to Pack Plus + IA (cuidador_pro) tier or active trial.
"""
from __future__ import annotations
from datetime import datetime, timedelta
import httpx

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.elderly import ElderlyProfile
from app.models.family import FamilyMember
from app.models.health import VitalSign, WellbeingLog, Incident
from app.models.medication import Medication, MedicationLog
from app.models.user import User


class AIInsightsError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code


# Plan keys that grant AI insights access (mirror chat gate)
AI_PLAN_KEYS = {"cuidador_pro"}


def _user_has_ai_access(u: User) -> bool:
    if u.subscription_status == "trial":
        return True
    if u.subscription_status in ("active", "trialing"):
        return u.subscription_plan in AI_PLAN_KEYS
    return False


def _household_has_ai_access(db: Session, elderly_id: int, user: User) -> bool:
    if _user_has_ai_access(user):
        return True
    owner_membership = db.query(FamilyMember).filter(
        FamilyMember.elderly_id == elderly_id,
        FamilyMember.role == "owner",
        FamilyMember.is_accepted == True,
    ).first()
    if not owner_membership:
        return False
    owner = db.query(User).filter(User.id == owner_membership.user_id).first()
    return bool(owner and _user_has_ai_access(owner))


def _check_access(db: Session, elderly_id: int, user: User) -> ElderlyProfile:
    membership = db.query(FamilyMember).filter(
        FamilyMember.elderly_id == elderly_id,
        FamilyMember.user_id == user.id,
        FamilyMember.is_accepted == True,
    ).first()
    if not membership:
        raise AIInsightsError("Sem acesso a este perfil", 403)
    if not _household_has_ai_access(db, elderly_id, user):
        raise AIInsightsError(
            "Insights IA disponíveis no Pack Plus + IA. "
            "Faça upgrade na sua área de cliente.", 402
        )
    elderly = db.query(ElderlyProfile).filter(ElderlyProfile.id == elderly_id).first()
    if not elderly:
        raise AIInsightsError("Perfil não encontrado", 404)
    return elderly


def _gather_context(db: Session, elderly_id: int, days: int = 7) -> dict:
    since = datetime.utcnow() - timedelta(days=days)

    vitals = (
        db.query(VitalSign)
        .filter(VitalSign.elderly_id == elderly_id, VitalSign.measured_at >= since)
        .order_by(desc(VitalSign.measured_at)).all()
    )
    wellbeing = (
        db.query(WellbeingLog)
        .filter(WellbeingLog.elderly_id == elderly_id, WellbeingLog.logged_date >= since.date())
        .order_by(desc(WellbeingLog.logged_date)).all()
    )
    incidents = (
        db.query(Incident)
        .filter(Incident.elderly_id == elderly_id, Incident.occurred_at >= since)
        .order_by(desc(Incident.occurred_at)).all()
    )
    meds = (
        db.query(Medication)
        .filter(Medication.elderly_id == elderly_id, Medication.is_active == True)
        .all()
    )
    logs = (
        db.query(MedicationLog)
        .join(Medication, Medication.id == MedicationLog.medication_id)
        .filter(Medication.elderly_id == elderly_id, MedicationLog.scheduled_time >= since)
        .all()
    )

    taken = sum(1 for l in logs if l.status == "taken")
    skipped = sum(1 for l in logs if l.status == "skipped")
    missed = sum(1 for l in logs if l.status == "missed")
    total = taken + skipped + missed
    adherence = round(100 * taken / total) if total else None

    def vital_summary(field: str, unit: str) -> str | None:
        vals = [getattr(v, field) for v in vitals if getattr(v, field) is not None]
        if not vals:
            return None
        return f"min {min(vals)} · máx {max(vals)} · média {round(sum(vals)/len(vals), 1)} {unit} ({len(vals)} medições)"

    summary = {
        "vitals": {
            "tensao_sistolica": vital_summary("blood_pressure_sys", "mmHg"),
            "tensao_diastolica": vital_summary("blood_pressure_dia", "mmHg"),
            "frequencia_cardiaca": vital_summary("heart_rate", "bpm"),
            "spo2": vital_summary("oxygen_saturation", "%"),
            "temperatura": vital_summary("temperature", "°C"),
            "glicemia": vital_summary("blood_glucose", "mg/dL"),
            "peso": vital_summary("weight", "kg"),
        },
        "bem_estar": {
            "registos": len(wellbeing),
            "humor_medio": round(sum(w.mood for w in wellbeing) / len(wellbeing), 1) if wellbeing else None,
            "dor_max": max((w.pain_level for w in wellbeing if w.pain_level is not None), default=None),
        },
        "incidentes": [
            {"tipo": i.type, "severidade": i.severity, "descricao": i.description[:120]}
            for i in incidents[:5]
        ],
        "medicacao": {
            "ativos": len(meds),
            "tomas": total,
            "tomadas": taken,
            "saltadas": skipped,
            "perdidas": missed,
            "adesao_pct": adherence,
        },
    }
    return summary


SYSTEM_PROMPT = """És um assistente clínico para famílias portuguesas que cuidam de idosos. Vais analisar dados dos últimos 7 dias e dar um resumo claro e útil.

Responde EXACTAMENTE neste formato Markdown, em português europeu:

**Estado geral**
[1-2 frases sobre o panorama: estável / a melhorar / a piorar]

**Pontos positivos**
- [bullet curto, ex: "Adesão à medicação a 100%"]
- [bullet curto]

**Pontos a vigiar**
- [bullet curto, factual; menciona valores específicos relevantes]
- [se não houver, escreve "Sem alertas relevantes."]

**Recomendações práticas**
- [acção concreta para o cuidador: ex: "Verificar tensão pela manhã antes da medicação"]
- [outra acção concreta]

**Aviso:** Esta análise é informativa e não substitui avaliação médica. Em dúvida, consulte o médico assistente.

Regras:
- Português de Portugal (não Brasil).
- Linguagem acessível, sem jargão técnico desnecessário.
- Mantém-te factual - nunca diagnostiques.
- Bullets curtos (máx 15 palavras cada).
- Se faltarem dados em alguma secção, di-lo claramente."""


def generate_insights(db: Session, elderly_id: int, user: User) -> dict:
    elderly = _check_access(db, elderly_id, user)
    if not settings.ANTHROPIC_API_KEY:
        raise AIInsightsError("Serviço de IA não configurado", 503)

    ctx = _gather_context(db, elderly_id)

    name = elderly.full_name
    age = None
    if elderly.date_of_birth:
        age = (datetime.utcnow().date() - elderly.date_of_birth).days // 365

    user_msg = f"Idoso: {name}"
    if age:
        user_msg += f" ({age} anos)"
    if elderly.medical_conditions:
        user_msg += f"\nCondições conhecidas: {elderly.medical_conditions}"
    if elderly.allergies:
        user_msg += f"\nAlergias: {elderly.allergies}"
    user_msg += f"\n\nDados últimos 7 dias:\n{ctx}"

    try:
        with httpx.Client(timeout=30) as client:
            r = client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 700,
                    "system": SYSTEM_PROMPT,
                    "messages": [{"role": "user", "content": user_msg}],
                },
            )
    except httpx.HTTPError as e:
        raise AIInsightsError(f"Erro de rede: {e}", 502)

    if r.status_code != 200:
        raise AIInsightsError(f"API retornou {r.status_code}", 502)

    body = r.json()
    blocks = body.get("content", [])
    text = "".join(b.get("text", "") for b in blocks if b.get("type") == "text").strip()
    if not text:
        raise AIInsightsError("Resposta vazia do serviço", 502)

    return {
        "elderly_id": elderly_id,
        "elderly_name": name,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "period_days": 7,
        "markdown": text,
        "context_summary": ctx,
    }
