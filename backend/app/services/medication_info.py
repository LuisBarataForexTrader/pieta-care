from datetime import datetime
import httpx

from app.core.config import settings


class MedicationInfoError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        self.message = message
        self.status_code = status_code


SYSTEM_PROMPT = """És um farmacêutico clínico português. Vais explicar um medicamento ao familiar de um idoso, em português europeu, de forma clara e curta.

Responde EXACTAMENTE neste formato Markdown, sem nada antes nem depois:

**Para que serve**
[1-2 frases sobre a indicação terapêutica principal]

**Como tomar**
[1-2 frases sobre posologia típica e instruções de toma — em jejum, com comida, etc.]

**Cuidados**
[1-2 frases sobre os efeitos secundários mais comuns e contra-indicações relevantes para idosos]

**Aviso:** Esta informação é geral. Confirme sempre a posologia exacta com o médico ou farmacêutico.

Regras:
- Português de Portugal (não Brasil).
- Linguagem acessível, evita jargão técnico.
- Mantém-te factual — se não conheces o medicamento, responde apenas "Não foi possível identificar este medicamento."
- Não inventes posologias específicas para o paciente.
- Sem emojis."""


def fetch_medication_description(name: str, dosage: str | None = None) -> str:
    """Fetch a Portuguese-language description of a medication via Claude Haiku."""
    if not settings.ANTHROPIC_API_KEY:
        raise MedicationInfoError("Serviço de informação não configurado", 503)

    user_msg = f"Medicamento: {name}"
    if dosage:
        user_msg += f"\nDosagem: {dosage}"

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
                    "max_tokens": 500,
                    "system": SYSTEM_PROMPT,
                    "messages": [{"role": "user", "content": user_msg}],
                },
            )
    except httpx.HTTPError as e:
        raise MedicationInfoError(f"Erro de rede: {e}", 502)

    if r.status_code != 200:
        raise MedicationInfoError(
            f"API retornou {r.status_code}: {r.text[:200]}", 502
        )

    body = r.json()
    blocks = body.get("content", [])
    text = "".join(b.get("text", "") for b in blocks if b.get("type") == "text").strip()
    if not text:
        raise MedicationInfoError("Resposta vazia do serviço", 502)
    return text
