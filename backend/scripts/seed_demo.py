"""
Seed a demo account with X days of realistic Portuguese elderly-care data.

Persona: Maria José Ferreira, 79 anos, viúva, Setúbal.
Cuidadora principal (owner): Sofia Ferreira (filha).
Outros familiares: João Ferreira (filho), Inês Costa (neta).

Run on the server:

    cd /opt/pieta-care/backend
    docker compose exec -e DEMO_DAYS=60 api python scripts/seed_demo.py

It is **idempotent** by demo email — re-running wipes the demo's data and
re-creates it. Safe to run repeatedly to refresh the demo account.

Set ``DEMO_DAYS`` (env or CLI arg) to control how many days of history.
Default 60.

Credentials printed at the end. Default:
    email:     demo@pietas.care
    password:  pietas2026
"""
from __future__ import annotations

import os
import random
import sys
from datetime import datetime, date, time, timedelta
from decimal import Decimal

# Allow running from /opt/pieta-care/backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select, delete  # noqa: E402

from app.core.auth import hash_password  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.elderly import ElderlyProfile  # noqa: E402
from app.models.family import FamilyMember  # noqa: E402
from app.models.medication import Medication, MedicationLog  # noqa: E402
from app.models.calendar import CalendarEvent, Task  # noqa: E402
from app.models.health import (  # noqa: E402
    VitalSign, WellbeingLog, Incident, DailyNote,
    ClinicalDiagnosis, Vaccination, CarePlanItem,
)
from app.models.chat import ChatMessage  # noqa: E402
from app.models.document import Document  # noqa: E402

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

DEMO_OWNER_EMAIL = os.environ.get("DEMO_OWNER_EMAIL", "demo@pietas.care")
DEMO_OWNER_PASSWORD = os.environ.get("DEMO_OWNER_PASSWORD", "pietas2026")
DEMO_OWNER_NAME = os.environ.get("DEMO_OWNER_NAME", "Sofia Ferreira")
DEMO_OWNER_PHONE = os.environ.get("DEMO_OWNER_PHONE", "+351 932 145 678")
# Plan tier the owner is on. One of: familia | familia_plus | cuidador_pro
DEMO_PLAN = os.environ.get("DEMO_PLAN", "cuidador_pro")
# If "true", invite the joão + inês family members and seed chat history.
# Skip on lower tiers (chat is gated to cuidador_pro anyway, and the
# Família plan caps family members at 2).
DEMO_INCLUDE_FAMILY = os.environ.get("DEMO_INCLUDE_FAMILY", "true").lower() == "true"
DEMO_DAYS = int(os.environ.get("DEMO_DAYS", sys.argv[1] if len(sys.argv) > 1 else "60"))

random.seed(20260508)  # deterministic-ish demo

NOW = datetime.utcnow()
TODAY = NOW.date()


def days_ago(n: int, *, hour: int = 9, minute: int = 0) -> datetime:
    return datetime.combine(TODAY - timedelta(days=n), time(hour=hour, minute=minute))


# ─────────────────────────────────────────────────────────────────────────────
# Seed
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    db = SessionLocal()
    try:
        print(f"▶ Seeding demo for {DEMO_OWNER_EMAIL} ({DEMO_PLAN}) with {DEMO_DAYS} days of data…")

        # 1) Owner user (cuidadora principal)
        owner = db.scalar(select(User).where(User.email == DEMO_OWNER_EMAIL))
        if owner is None:
            owner = User(
                email=DEMO_OWNER_EMAIL,
                hashed_password=hash_password(DEMO_OWNER_PASSWORD),
                full_name=DEMO_OWNER_NAME,
                phone=DEMO_OWNER_PHONE,
                is_active=True,
                is_verified=True,
                subscription_status="active",
                subscription_plan=DEMO_PLAN,
                trial_ends_at=NOW + timedelta(days=365),
            )
            db.add(owner)
            db.flush()
        else:
            # Refresh — set password + ensure active plan for screenshots
            owner.hashed_password = hash_password(DEMO_OWNER_PASSWORD)
            owner.full_name = DEMO_OWNER_NAME
            owner.phone = DEMO_OWNER_PHONE
            owner.is_active = True
            owner.is_verified = True
            owner.subscription_status = "active"
            owner.subscription_plan = DEMO_PLAN
            owner.trial_ends_at = NOW + timedelta(days=365)

        # 2) Wipe any prior demo data owned by this user
        # — find all elderly profiles created by owner and cascade-clean
        prior_elderly_ids = [
            e.id for e in db.scalars(
                select(ElderlyProfile).where(ElderlyProfile.created_by == owner.id)
            ).all()
        ]
        if prior_elderly_ids:
            for tbl_model in [
                MedicationLog,
            ]:
                # Cascade via FK from MedicationLog → Medication, so:
                pass

            # Delete medication logs first via medication ids
            med_ids = [
                m.id for m in db.scalars(
                    select(Medication).where(Medication.elderly_id.in_(prior_elderly_ids))
                ).all()
            ]
            if med_ids:
                db.execute(delete(MedicationLog).where(MedicationLog.medication_id.in_(med_ids)))

            db.execute(delete(Medication).where(Medication.elderly_id.in_(prior_elderly_ids)))
            db.execute(delete(VitalSign).where(VitalSign.elderly_id.in_(prior_elderly_ids)))
            db.execute(delete(WellbeingLog).where(WellbeingLog.elderly_id.in_(prior_elderly_ids)))
            db.execute(delete(Incident).where(Incident.elderly_id.in_(prior_elderly_ids)))
            db.execute(delete(DailyNote).where(DailyNote.elderly_id.in_(prior_elderly_ids)))
            db.execute(delete(ClinicalDiagnosis).where(ClinicalDiagnosis.elderly_id.in_(prior_elderly_ids)))
            db.execute(delete(Vaccination).where(Vaccination.elderly_id.in_(prior_elderly_ids)))
            db.execute(delete(CarePlanItem).where(CarePlanItem.elderly_id.in_(prior_elderly_ids)))
            db.execute(delete(CalendarEvent).where(CalendarEvent.elderly_id.in_(prior_elderly_ids)))
            db.execute(delete(Task).where(Task.elderly_id.in_(prior_elderly_ids)))
            db.execute(delete(Document).where(Document.elderly_id.in_(prior_elderly_ids)))
            db.execute(delete(ChatMessage).where(ChatMessage.elderly_id.in_(prior_elderly_ids)))
            db.execute(delete(FamilyMember).where(FamilyMember.elderly_id.in_(prior_elderly_ids)))
            db.execute(delete(ElderlyProfile).where(ElderlyProfile.id.in_(prior_elderly_ids)))
            db.flush()
            print(f"  · cleaned {len(prior_elderly_ids)} prior demo elderly profile(s)")

        # 3) Other family users (idempotent by email)
        def upsert_user(email: str, name: str, phone: str | None = None) -> User:
            u = db.scalar(select(User).where(User.email == email))
            if u is None:
                u = User(
                    email=email,
                    hashed_password=hash_password("pietas2026"),
                    full_name=name,
                    phone=phone,
                    is_active=True,
                    is_verified=True,
                    subscription_status="member",
                )
                db.add(u)
                db.flush()
            else:
                u.full_name = name
                u.phone = phone
                u.is_active = True
            return u

        joao = upsert_user("demo+joao@pietas.care", "João Ferreira", "+351 916 552 134")
        ines = upsert_user("demo+ines@pietas.care", "Inês Costa", "+351 925 880 471")

        # 4) Elderly profile — Maria José
        maria = ElderlyProfile(
            full_name="Maria José Ferreira",
            date_of_birth=date(1947, 3, 15),
            id_number="08234567",
            health_number="123456789",
            address="Rua das Flores 14, 2.º Esq, 2900-241 Setúbal",
            blood_type="A+",
            medical_conditions=(
                "Hipertensão arterial essencial (controlada)\n"
                "Diabetes mellitus tipo 2 (sob tratamento oral)\n"
                "Artrose dos joelhos bilateral (Grau II)\n"
                "Hipercolesterolemia\n"
                "Insuficiência venosa crónica dos membros inferiores"
            ),
            allergies="Penicilina (rash cutâneo, 1986)\nIbuprofeno e outros AINEs (epigastralgia)",
            emergency_contact_name="Sofia Ferreira (filha)",
            emergency_contact_phone="+351 932 145 678",
            created_by=owner.id,
        )
        db.add(maria)
        db.flush()

        # 5) Family members
        members = [
            FamilyMember(
                elderly_id=maria.id, user_id=owner.id, invited_email=owner.email,
                role="owner", relation="filha", is_accepted=True,
                can_manage_medications=True, can_manage_documents=True, can_invite_others=True,
                joined_at=NOW - timedelta(days=DEMO_DAYS),
            ),
            FamilyMember(
                elderly_id=maria.id, user_id=joao.id, invited_email=joao.email,
                role="admin", relation="filho", is_accepted=True,
                can_manage_medications=True, can_manage_documents=True,
                joined_at=NOW - timedelta(days=DEMO_DAYS - 2),
            ),
            FamilyMember(
                elderly_id=maria.id, user_id=ines.id, invited_email=ines.email,
                role="member", relation="neta", is_accepted=True,
                can_manage_medications=False, can_manage_documents=False,
                joined_at=NOW - timedelta(days=DEMO_DAYS - 5),
            ),
        ]
        db.add_all(members)
        db.flush()

        # ─── Diagnoses (chronic, set as known on day 0 of history) ────────
        diagnoses = [
            ("Hipertensão arterial essencial", "I10", date(2014, 6, 12), True, "sns"),
            ("Diabetes mellitus tipo 2", "E11", date(2017, 11, 4), True, "sns"),
            ("Artrose dos joelhos (gonartrose) bilateral", "M17", date(2019, 4, 22), True, "sns"),
            ("Hipercolesterolemia", "E78.0", date(2018, 9, 30), True, "sns"),
            ("Insuficiência venosa crónica MI", "I87.2", date(2021, 2, 15), True, "manual"),
            ("Catarata bilateral incipiente", "H25.1", date(2024, 8, 8), True, "manual"),
        ]
        for desc, icd, dx_date, chronic, src in diagnoses:
            db.add(ClinicalDiagnosis(
                elderly_id=maria.id, created_by_id=owner.id,
                description=desc, icd_code=icd, diagnosed_date=dx_date,
                is_chronic=chronic, is_active=True, source=src,
            ))

        # ─── Vaccinations ────────────────────────────────────────────────
        vaccs = [
            ("Influenza (vacina da gripe) 2025-2026", date(2025, 10, 14), date(2026, 10, 1), "VFL2025-A4471", "sns"),
            ("COVID-19 reforço (Comirnaty Omicron)", date(2026, 1, 22), date(2026, 10, 1), "PF77820", "sns"),
            ("Pneumocócica polissacárida (Pneumovax 23)", date(2024, 5, 30), None, "MK45221", "sns"),
            ("Tétano + Difteria (Td)", date(2022, 9, 6), date(2032, 9, 6), "GSK39102", "sns"),
            ("Herpes Zoster (Shingrix) — 1.ª dose", date(2025, 6, 18), date(2025, 12, 18), "GSK77641", "manual"),
            ("Herpes Zoster (Shingrix) — 2.ª dose", date(2025, 12, 28), None, "GSK78920", "manual"),
        ]
        for name, adm, due, lot, src in vaccs:
            db.add(Vaccination(
                elderly_id=maria.id, created_by_id=owner.id,
                vaccine_name=name, administered_date=adm, next_due_date=due,
                lot_number=lot, source=src,
            ))

        # ─── Care plan items ─────────────────────────────────────────────
        plan_items = [
            ("higiene", "Higiene matinal e arranjo pessoal", "Apoio na higiene oral, cabelo, vestir.", "diario"),
            ("nutricao", "Pequeno-almoço com fruta e cereais", "Manter padrão glicémico estável; ½ chávena de leite, fruta da época.", "diario"),
            ("medico", "Aferição da glicemia capilar", "Em jejum e 2h após almoço; registar no caderno.", "diario"),
            ("mobilidade", "Caminhada de 20-30 min", "No jardim ou em redor de casa; cadeira de descanso a meio se necessário.", "diario"),
            ("mobilidade", "Exercícios de fortalecimento dos joelhos", "Série de 3×10 (extensão da perna sentada); pausa entre séries.", "semanal"),
            ("social", "Telefonema/visita de família", "Garantir contacto diário com pelo menos um familiar.", "diario"),
            ("medico", "Verificar tensão arterial em casa", "De manhã, em repouso, antes da medicação.", "semanal"),
            ("higiene", "Hidratação dos membros inferiores", "Aplicar creme após banho; pernas elevadas 15 min ao final do dia.", "diario"),
            ("nutricao", "Hidratação — 1.5 L de água", "Distribuir ao longo do dia; chá ou infusão sem açúcar contam.", "diario"),
            ("medico", "Consulta com médico de família", "Renovação de receitas + check-up.", "mensal"),
        ]
        for category, title, desc, freq in plan_items:
            db.add(CarePlanItem(
                elderly_id=maria.id, created_by_id=owner.id,
                category=category, title=title, description=desc, frequency=freq,
            ))

        # ─── Medications ─────────────────────────────────────────────────
        medications_data = [
            {
                "name": "Lisinopril",
                "dosage": "10 mg",
                "schedule_times": '["08:00"]',
                "instructions": "Tomar em jejum, com um copo de água. Hipertensão.",
                "description": "Inibidor da enzima de conversão da angiotensina (IECA) usado no tratamento da hipertensão arterial e insuficiência cardíaca.",
                "is_prn": False,
            },
            {
                "name": "Metformina",
                "dosage": "850 mg",
                "schedule_times": '["08:00", "20:00"]',
                "instructions": "Tomar durante ou imediatamente após as refeições para reduzir desconforto gástrico.",
                "description": "Antidiabético oral (biguanida) que reduz a produção hepática de glicose e aumenta a sensibilidade à insulina. Primeira linha na diabetes tipo 2.",
                "is_prn": False,
            },
            {
                "name": "Ácido Acetilsalicílico",
                "dosage": "100 mg",
                "schedule_times": '["08:00"]',
                "instructions": "Tomar após o pequeno-almoço. Profilaxia cardiovascular.",
                "description": "Antiagregante plaquetário em baixa dose, usado na prevenção secundária de eventos cardiovasculares.",
                "is_prn": False,
            },
            {
                "name": "Sinvastatina",
                "dosage": "20 mg",
                "schedule_times": '["22:00"]',
                "instructions": "Tomar à noite, antes de deitar. Não consumir sumo de toranja.",
                "description": "Estatina que inibe a HMG-CoA redutase, reduzindo o colesterol LDL. Indicada na hipercolesterolemia.",
                "is_prn": False,
            },
            {
                "name": "Pantoprazol",
                "dosage": "20 mg",
                "schedule_times": '["07:30"]',
                "instructions": "Tomar 30 minutos antes do pequeno-almoço.",
                "description": "Inibidor da bomba de protões; reduz a produção de ácido gástrico. Usado na proteção gástrica e refluxo.",
                "is_prn": False,
            },
            {
                "name": "Paracetamol",
                "dosage": "1000 mg",
                "schedule_times": '[]',
                "instructions": "SOS — em caso de dor ligeira a moderada. Máx. 3 g/dia.",
                "description": "Analgésico e antipirético de primeira linha. Bem tolerado em idosos.",
                "is_prn": True,
            },
        ]
        meds: list[Medication] = []
        desc_fetched = NOW - timedelta(days=DEMO_DAYS - 1)
        for md in medications_data:
            m = Medication(
                elderly_id=maria.id,
                name=md["name"], dosage=md["dosage"],
                instructions=md["instructions"],
                schedule_times=md["schedule_times"],
                is_active=True, is_prn=md["is_prn"],
                description=md["description"],
                description_fetched_at=desc_fetched,
                created_at=NOW - timedelta(days=DEMO_DAYS),
            )
            db.add(m)
            meds.append(m)
        db.flush()

        # ─── Medication logs (over DEMO_DAYS) ────────────────────────────
        # Realistic adherence: ~88% taken, ~7% missed, ~5% skipped
        confirmer_pool = [owner.id, joao.id, ines.id]
        log_count = 0
        for m in meds:
            if m.is_prn:
                # PRN: 0-2 takes per week, only "taken"
                for d in range(DEMO_DAYS):
                    if random.random() < 0.18:
                        sched = days_ago(DEMO_DAYS - 1 - d, hour=random.choice([10, 14, 16, 21]),
                                         minute=random.choice([5, 12, 25, 38, 47]))
                        if sched > NOW: continue
                        db.add(MedicationLog(
                            medication_id=m.id,
                            confirmed_by=random.choice(confirmer_pool),
                            scheduled_time=sched,
                            confirmed_at=sched + timedelta(minutes=random.randint(2, 25)),
                            status="taken",
                            notes="Dor no joelho direito" if random.random() < 0.4 else None,
                        ))
                        log_count += 1
                continue

            # Regular: each schedule slot per day
            slots = eval(m.schedule_times) if m.schedule_times else []
            for d in range(DEMO_DAYS):
                date_d = TODAY - timedelta(days=DEMO_DAYS - 1 - d)
                for slot in slots:
                    h, mi = (int(x) for x in slot.split(":"))
                    sched = datetime.combine(date_d, time(hour=h, minute=mi))
                    if sched > NOW:
                        continue
                    r = random.random()
                    if r < 0.88:
                        status = "taken"
                        confirmed = sched + timedelta(minutes=random.randint(0, 25))
                    elif r < 0.93:
                        status = "skipped"
                        confirmed = sched + timedelta(minutes=random.randint(5, 60))
                    else:
                        status = "missed"
                        confirmed = sched + timedelta(hours=random.randint(2, 5))
                    db.add(MedicationLog(
                        medication_id=m.id,
                        confirmed_by=random.choice(confirmer_pool),
                        scheduled_time=sched,
                        confirmed_at=confirmed,
                        status=status,
                    ))
                    log_count += 1
        print(f"  · medication logs: {log_count}")

        # ─── Vital signs (4-5x per week) ─────────────────────────────────
        vital_count = 0
        for d in range(DEMO_DAYS):
            # 60% chance of measuring on any given day
            if random.random() > 0.62:
                continue
            measured_at = days_ago(DEMO_DAYS - 1 - d,
                                   hour=random.choice([8, 9, 10, 19, 20]),
                                   minute=random.choice([0, 8, 17, 32, 45]))
            if measured_at > NOW:
                continue
            # Realistic ranges with mild variation; weight drifts slowly
            bp_sys = random.choice([122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 145])
            bp_dia = random.randint(70, 88)
            hr = random.randint(64, 86)
            temp = round(random.uniform(36.2, 36.9), 1)
            # weight slow drift centered on 68.5 kg
            weight = round(68.5 + (d - DEMO_DAYS / 2) * 0.02 + random.uniform(-0.4, 0.4), 2)
            spo2 = random.randint(94, 98)
            # glucose: morning fasting ~95-115, post-meal ~140-180
            glucose = (random.randint(92, 118)
                       if measured_at.hour < 11 else random.randint(130, 180))
            db.add(VitalSign(
                elderly_id=maria.id,
                recorded_by_id=random.choice(confirmer_pool),
                measured_at=measured_at,
                blood_pressure_sys=bp_sys, blood_pressure_dia=bp_dia,
                heart_rate=hr,
                temperature=Decimal(str(temp)),
                weight=Decimal(str(weight)),
                oxygen_saturation=spo2,
                blood_glucose=Decimal(str(glucose)),
                notes=random.choice([None, None, None, "Antes do almoço", "Em jejum", "Após caminhada"]),
            ))
            vital_count += 1
        print(f"  · vital signs: {vital_count}")

        # ─── Wellbeing logs ──────────────────────────────────────────────
        wb_count = 0
        for d in range(DEMO_DAYS):
            if random.random() > 0.78:
                continue
            log_date = TODAY - timedelta(days=DEMO_DAYS - 1 - d)
            mood = random.choices([2, 3, 3, 4, 4, 4, 5], k=1)[0]
            energy = random.choices([2, 3, 3, 4, 4, 5], k=1)[0]
            pain = random.choices([0, 1, 2, 3, 3, 4, 4, 5, 6, 7], k=1)[0]
            appetite = random.choices([2, 3, 3, 4, 4, 4, 5], k=1)[0]
            note = None
            if pain >= 5:
                note = random.choice([
                    "Dor no joelho direito após caminhada matinal.",
                    "Joelhos cansados; descansou após almoço.",
                    "Lombalgia ligeira; aplicou calor seco.",
                ])
            elif mood >= 4 and random.random() < 0.3:
                note = random.choice([
                    "Conversou com a Sofia ao telefone — disposição muito melhor.",
                    "Dia animado; viu fotos antigas com a neta Inês.",
                    "Recebeu visita do João; tarde tranquila.",
                ])
            db.add(WellbeingLog(
                elderly_id=maria.id, recorded_by_id=random.choice(confirmer_pool),
                logged_date=log_date, mood=mood, energy=energy,
                pain_level=pain, appetite=appetite, notes=note,
            ))
            wb_count += 1
        print(f"  · wellbeing logs: {wb_count}")

        # ─── Daily notes (turnos) ────────────────────────────────────────
        shift_notes = {
            "manha": [
                "Acordou descansada às 7h30. Tomou pequeno-almoço completo (papa de aveia, fruta e chá). Medicação tomada.",
                "Tensão arterial controlada. Caminhou no jardim 20 minutos com auxílio.",
                "Higiene matinal feita com mínima ajuda. Disposição animada.",
                "Glicemia em jejum: 102 mg/dL. Tomou Metformina com pequeno-almoço.",
                "Queixou-se de dor moderada nos joelhos ao levantar — aliviou com paracetamol.",
            ],
            "tarde": [
                "Almoço bem aceite — sopa, peixe grelhado, arroz e fruta.",
                "Sesta de 45 min. Acordou bem-disposta.",
                "Recebeu visita do filho João — tarde social e animada.",
                "Atividade de leitura e crucigramas durante 1 hora.",
                "Hidratação dos membros inferiores feita após banho.",
            ],
            "noite": [
                "Jantou pouco mas equilibrado. Tomou medicação noturna (Sinvastatina).",
                "Noite tranquila; adormeceu por volta das 22h30.",
                "Glicemia pós-jantar: 148 mg/dL — dentro do esperado.",
                "Ligeira agitação ao deitar; acalmou com infusão de cidreira.",
                "Acordou uma vez para a casa de banho; voltou a dormir sem queixas.",
            ],
        }
        note_count = 0
        for d in range(DEMO_DAYS):
            log_date = TODAY - timedelta(days=DEMO_DAYS - 1 - d)
            # 1-3 notes per day
            n = random.choices([0, 1, 2, 3], weights=[1, 4, 4, 2], k=1)[0]
            chosen_shifts = random.sample(["manha", "tarde", "noite"], k=min(n, 3))
            for shift in chosen_shifts:
                db.add(DailyNote(
                    elderly_id=maria.id, recorded_by_id=random.choice(confirmer_pool),
                    note_date=log_date, shift=shift,
                    content=random.choice(shift_notes[shift]),
                    mood_observed=random.choice([None, "calma", "alegre", "cansada", "conversadora"]),
                ))
                note_count += 1
        print(f"  · daily notes: {note_count}")

        # ─── Incidents ───────────────────────────────────────────────────
        incidents_data = [
            (38, 8, 30, "queda", "leve", "joelho_direito",
             "Tropeçou no tapete da sala ao levantar-se. Sem ferimento aparente; ligeira escoriação no joelho direito.",
             "Aplicado gelo. Avaliação por enfermeira no dia seguinte. Tapete removido.", True, True),
            (24, 7, 15, "tonturas", "leve", None,
             "Tonturas matinais ligeiras ao levantar-se. Episódio breve, ~2 min. Sem perda de consciência.",
             "Recomendado levantar-se devagar. Hidratação reforçada. Sem alteração da medicação.", False, True),
            (12, 18, 45, "outro", "moderada", "torax",
             "Episódio de dor torácica retro-esternal de curta duração (~5 min) durante o jantar. Sem irradiação.",
             "Avaliação no SAP — ECG normal, troponinas negativas. Provável origem digestiva.", True, True),
            (3, 22, 10, "ferimento_pele", "leve", "antebraco_esquerdo",
             "Pequeno arranhão no antebraço esquerdo ao mexer no roseiral.",
             "Limpeza com soro e penso simples. Vacinação antitetânica em dia.", False, True),
        ]
        for ago, h, mi, typ, sev, zone, desc, actions, follow, resolved in incidents_data:
            db.add(Incident(
                elderly_id=maria.id, reported_by_id=owner.id,
                occurred_at=days_ago(ago, hour=h, minute=mi),
                type=typ, severity=sev, body_zone=zone,
                description=desc, actions_taken=actions,
                follow_up_required=follow, resolved=resolved,
            ))

        # ─── Calendar events ─────────────────────────────────────────────
        events_data = [
            # past
            (-DEMO_DAYS + 5, "consulta", "Consulta de Cardiologia",
             "Hospital de S. Bernardo — Setúbal", "Dr.ª Cristina Ramalho",
             "ECG controlo + revisão da medicação anti-hipertensora.",
             "Receituário em vigor; lista de TA das últimas 4 semanas.", True),
            (-22, "exame", "Análises Clínicas — Hemograma + HbA1c",
             "Lab. Joaquim Chaves — Setúbal", None,
             "Análises de rotina trimestrais. Jejum 8h.",
             "Pedido médico; cartão de utente.", True),
            (-15, "consulta", "Consulta de Diabetologia",
             "Centro de Saúde do Bonfim", "Dr. André Bento",
             "Avaliação trimestral DM2. Discutir HbA1c.",
             "Caderno de glicemias; lista de medicação.", True),
            (-7, "outro", "Sessão de Fisioterapia (joelhos)",
             "Clínica Reabilitar Setúbal", "Fis. Marta Andrade",
             "Fortalecimento quadricípete + mobilização patelar.",
             "Vestuário desportivo confortável.", True),
            # upcoming
            (3, "outro", "Sessão de Fisioterapia (joelhos)",
             "Clínica Reabilitar Setúbal", "Fis. Marta Andrade",
             "Continuação programa quadricípete.", "Vestuário desportivo.", False),
            (8, "consulta", "Consulta de Oftalmologia",
             "Hospital de S. Bernardo — Setúbal", "Dr. Pedro Saraiva",
             "Avaliação de catarata bilateral.",
             "Óculos atuais; lista de gotas oftálmicas se aplicável.", False),
            (15, "exame", "Análises de controlo + HbA1c",
             "Lab. Joaquim Chaves — Setúbal", None,
             "Trimestral. Jejum 8h.", "Pedido médico.", False),
            (22, "consulta", "Consulta Médico de Família",
             "Centro de Saúde do Bonfim", "Dr.ª Helena Marques",
             "Renovação de receitas + revisão geral.",
             "Caderno de TA e glicemias; embalagens vazias.", False),
            (35, "outro", "Vacina contra a gripe (campanha 2026-2027)",
             "Centro de Saúde do Bonfim", None,
             "Campanha sazonal. Em jejum não obrigatório.",
             "Cartão de utente; cartão de vacinas.", False),
        ]
        for offset, typ, title, loc, doc, prep, items, completed in events_data:
            starts_at = days_ago(-offset, hour=random.choice([9, 10, 11, 14, 15, 16]),
                                 minute=random.choice([0, 15, 30, 45]))
            db.add(CalendarEvent(
                elderly_id=maria.id, created_by=owner.id,
                title=title, event_type=typ,
                starts_at=starts_at, ends_at=starts_at + timedelta(minutes=45),
                location=loc, doctor_name=doc,
                preparation_notes=prep, items_to_bring=items,
                is_completed=completed, reminder_minutes=60,
            ))

        # ─── Documents (metadata only — files not uploaded) ──────────────
        # Skipping actual file URLs since they require object storage. The list
        # page will simply show no documents for the demo, which is fine.

        # ─── Family chat history ─────────────────────────────────────────
        chat_seed = [
            (DEMO_DAYS - 1, 9, 14, owner.id,
             "Bom dia 🌞 a mãe acordou bem-disposta hoje. TA: 128/78."),
            (DEMO_DAYS - 1, 10, 22, joao.id,
             "Boa! Eu passo lá ao fim da tarde. Levo morangos."),
            (DEMO_DAYS - 1, 18, 5, ines.id,
             "Avó! Ligo-te depois do jantar. ❤"),
            (DEMO_DAYS - 3, 8, 30, owner.id,
             "Glicemia em jejum: 102. A toma da manhã está feita."),
            (DEMO_DAYS - 3, 13, 41, joao.id,
             "Sof, ela disse-me que o joelho direito andou pior ontem. Vale a pena fisio extra?"),
            (DEMO_DAYS - 3, 14, 12, owner.id,
             "Vou perguntar à fisio Marta amanhã. Acho que sim."),
            (DEMO_DAYS - 7, 19, 50, ines.id,
             "Estive com ela hoje, vimos fotos antigas. Ficou super animada 🥹"),
            (DEMO_DAYS - 12, 20, 15, joao.id,
             "Confirmei a consulta da diabetologia para sexta às 11h."),
            (DEMO_DAYS - 12, 20, 17, owner.id,
             "Top, eu levo-a. Marquei trazer o caderno das glicemias."),
            (DEMO_DAYS - 18, 7, 55, owner.id,
             "Ligeiras tonturas matinais — ela já está bem. Vamos hidratar mais hoje."),
            (DEMO_DAYS - 22, 11, 0, owner.id,
             "Análises feitas. Resultados online em 2 dias."),
            (DEMO_DAYS - 32, 9, 30, joao.id,
             "Ouvi dizer que a mãe caiu. Está tudo bem?"),
            (DEMO_DAYS - 32, 9, 32, owner.id,
             "Sim sim! Tropeçou no tapete da sala. Sem ferimento sério, só um arranhão. Já tirei o tapete."),
            (DEMO_DAYS - 32, 9, 35, ines.id,
             "Que susto. Beijinhos avó 💕"),
            (DEMO_DAYS - 45, 18, 10, owner.id,
             "Receituário renovado pelo Dr. Helena. Fui à farmácia, está tudo em casa."),
            (2, 8, 0, owner.id,
             "Bom dia ☕ vou acompanhá-la à fisio às 14h."),
            (2, 8, 12, ines.id,
             "Boa Sof. Eu passo lá ao jantar 🌙"),
            (1, 9, 25, joao.id,
             "Mãe está com bom aspeto hoje. Tomou tudo da manhã."),
            (0, 7, 45, owner.id,
             "Bom dia! Glicemia: 98. Pequeno-almoço já tomado."),
        ]
        for ago, h, mi, sender_id, content in chat_seed:
            ts = days_ago(ago, hour=h, minute=mi)
            db.add(ChatMessage(
                elderly_id=maria.id, sender_id=sender_id,
                content=content, created_at=ts,
            ))

        # ─── Tasks (a couple of open ones for the dashboard) ─────────────
        tasks_data = [
            (2, "Levar caderno de glicemias à consulta", "Trimestral.", joao.id, False),
            (-3, "Comprar embalagens de Metformina", "2 caixas (renovação receituário).", joao.id, True),
            (5, "Renovar receita oftalmológica", "Solicitar receita digital.", owner.id, False),
            (1, "Acompanhar à fisioterapia", "Sessão das 14h00.", owner.id, False),
        ]
        for offset, title, desc, assignee, completed in tasks_data:
            db.add(Task(
                elderly_id=maria.id,
                created_by=owner.id, assigned_to=assignee,
                title=title, description=desc,
                due_date=days_ago(-offset, hour=14, minute=0),
                is_completed=completed,
                completed_at=NOW - timedelta(days=abs(offset) - 1) if completed else None,
            ))

        db.commit()
        print("✅ Demo seed complete.")
        print(f"   email:    {DEMO_OWNER_EMAIL}")
        print(f"   password: {DEMO_OWNER_PASSWORD}")
        print(f"   familiares: {joao.email} / {ines.email} (mesma password)")
        print(f"   idoso: Maria José Ferreira (id={maria.id})")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
