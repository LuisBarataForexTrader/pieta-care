#!/usr/bin/env python3
"""
SEO Article Generator for pietas.care

Runs daily via GitHub Actions. Picks unused keywords from the seed list
(checking which .md files already exist), generates a 1500-2000 word
article in Portuguese with Claude, and saves it as a .md file in
frontend/content/guias/.

Usage:
    python generate.py [--dry-run]

Required env vars:
    ANTHROPIC_API_KEY
"""

import os
import sys
import re
import json
import argparse
import datetime
from pathlib import Path

import anthropic

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTENT_DIR = REPO_ROOT / "frontend" / "content" / "guias"

# ---------------------------------------------------------------------------
# Seed keyword list — split by intent
# A = informational guides, B = commercial comparisons
# Add new keywords here; the script skips ones already written.
# ---------------------------------------------------------------------------

KEYWORDS: list[dict] = [
    # --- Informational guides (category: guia) ---
    {"slug": "sinais-alerta-demencia-senil", "title": "Sinais de alerta da demência senil: o que observar e quando consultar um médico", "keywords": ["demência senil sintomas", "sinais alerta demência idosos", "alzheimer precoce sinais"], "category": "guia", "readingTime": 7},
    {"slug": "cuidados-domiciliarios-portugal-guia", "title": "Cuidados domiciliários em Portugal: guia completo para famílias", "keywords": ["cuidados domiciliários portugal", "home care idosos portugal", "apoio domiciliário idosos"], "category": "guia", "readingTime": 9},
    {"slug": "como-falar-com-medico-sobre-pais-idosos", "title": "Como falar com o médico sobre o estado de saúde dos seus pais idosos", "keywords": ["consulta médico idosos", "como comunicar médico idoso", "acompanhar consulta pais idosos"], "category": "guia", "readingTime": 6},
    {"slug": "prevencao-quedas-idosos-em-casa", "title": "Prevenção de quedas em idosos: como tornar a casa mais segura", "keywords": ["prevenção quedas idosos", "quedas idosos em casa", "segurança idosos em casa"], "category": "guia", "readingTime": 7},
    {"slug": "alzheimer-cuidados-em-casa", "title": "Alzheimer: como cuidar de um familiar em casa — guia para cuidadores", "keywords": ["alzheimer cuidados em casa", "cuidar familiar alzheimer", "alzheimer portugal"], "category": "guia", "readingTime": 10},
    {"slug": "sinais-vitais-normais-idosos", "title": "Sinais vitais normais em idosos: tensão, glicemia, peso e temperatura", "keywords": ["sinais vitais normais idosos", "tensão arterial normal idosos", "glicemia normal idoso"], "category": "guia", "readingTime": 6},
    {"slug": "depressao-idosos-sinais-e-apoio", "title": "Depressão em idosos: sinais que a família deve conhecer e como ajudar", "keywords": ["depressão idosos sintomas", "depressão sénior", "apoio emocional idosos"], "category": "guia", "readingTime": 7},
    {"slug": "cuidar-pais-distancia", "title": "Como cuidar de pais idosos quando mora longe: guia prático", "keywords": ["cuidar pais distância", "gerir cuidados à distância", "filho cuidador longe"], "category": "guia", "readingTime": 8},
    {"slug": "nutricao-idosos-em-casa", "title": "Nutrição para idosos em casa: o que comer, o que evitar e como ajudar", "keywords": ["nutrição idosos", "alimentação idosos em casa", "dieta saudável idosos"], "category": "guia", "readingTime": 7},
    {"slug": "burnout-cuidador-familiar", "title": "Burnout do cuidador familiar: reconhecer os sinais e pedir ajuda", "keywords": ["burnout cuidador", "esgotamento cuidador familiar", "cuidador familiar stress"], "category": "guia", "readingTime": 7},
    {"slug": "polimedicacao-idosos-riscos", "title": "Polimedicação em idosos: riscos, interações e como reduzir", "keywords": ["polimedicação idosos", "muitos medicamentos idoso", "interações medicamentosas idosos"], "category": "guia", "readingTime": 6},
    {"slug": "diabetes-idosos-controlo-glicemia", "title": "Diabetes em idosos: como controlar a glicemia e evitar complicações", "keywords": ["diabetes idosos", "controlo glicemia idosos", "diabetes tipo 2 idosos"], "category": "guia", "readingTime": 8},
    {"slug": "incontinencia-urinaria-idosos", "title": "Incontinência urinária em idosos: causas, tratamentos e cuidados diários", "keywords": ["incontinência urinária idosos", "perda urina idosos", "fraldas adulto idoso"], "category": "guia", "readingTime": 6},
    {"slug": "como-escolher-lar-idosos-portugal", "title": "Como escolher um lar de idosos em Portugal: o que verificar antes de decidir", "keywords": ["lar idosos portugal", "como escolher lar idosos", "residência sénior portugal"], "category": "guia", "readingTime": 9},
    {"slug": "hipertensao-arterial-idosos", "title": "Hipertensão arterial em idosos: controlo, medicação e estilo de vida", "keywords": ["hipertensão idosos", "tensão alta idosos", "pressão arterial idosos"], "category": "guia", "readingTime": 7},

    # --- Commercial comparisons (category: comparar) ---
    {"slug": "melhor-app-cuidar-pais-idosos-portugal", "title": "Melhor app para cuidar de pais idosos em Portugal: comparação 2026", "keywords": ["melhor app cuidar pais idosos", "app saúde idosos portugal", "app cuidadores portugal"], "category": "comparar", "readingTime": 6},
    {"slug": "pietas-care-vs-medisafe", "title": "pietas.care vs Medisafe: qual a melhor para gerir medicação de idosos?", "keywords": ["pietas care medisafe", "app medicação idosos comparação", "medisafe alternativa portugal"], "category": "comparar", "readingTime": 5},
    {"slug": "app-familiar-idosos-portugal", "title": "Apps de coordenação familiar para idosos: quais existem em Portugal?", "keywords": ["app familiar idosos", "app coordenar cuidados família", "app partilhada cuidados idosos"], "category": "comparar", "readingTime": 6},
    {"slug": "caderno-medicacao-vs-app-digital", "title": "Caderno de medicação vs app digital: o que funciona melhor?", "keywords": ["caderno medicação idosos", "registo medicação papel vs digital", "app vs papel medicação"], "category": "comparar", "readingTime": 5},
    {"slug": "apoio-domiciliario-vs-lar-idosos", "title": "Apoio domiciliário vs lar de idosos: como decidir o que é melhor", "keywords": ["apoio domiciliário vs lar", "lar ou cuidados em casa idoso", "alternativas lar idosos portugal"], "category": "comparar", "readingTime": 8},
]


def slug_exists(slug: str) -> bool:
    return (CONTENT_DIR / f"{slug}.md").exists()


def pick_keywords(max_articles: int = 2) -> list[dict]:
    unused = [k for k in KEYWORDS if not slug_exists(k["slug"])]
    if not unused:
        print("All keywords already written. Nothing to do.")
        return []
    # Alternate between guia and comparar to keep the mix balanced
    guias = [k for k in unused if k["category"] == "guia"]
    comparar = [k for k in unused if k["category"] == "comparar"]
    chosen = []
    i, j = 0, 0
    while len(chosen) < max_articles:
        if i < len(guias):
            chosen.append(guias[i]); i += 1
        if len(chosen) >= max_articles:
            break
        if j < len(comparar):
            chosen.append(comparar[j]); j += 1
    return chosen[:max_articles]


SYSTEM_PROMPT = """Você é um redator de conteúdo especializado em saúde sénior e cuidados a idosos em Portugal.
Escreve artigos informativos e práticos em português europeu formal, dirigidos a famílias que cuidam de pais idosos.
O tom é empático, claro e direto — sem jargão médico desnecessário, sem condescendência.
Não uses emojis. Usa o "você" formal.
A empresa pietas.care é uma app portuguesa de coordenação de cuidados a idosos — podes referenciá-la naturalmente no contexto, nunca de forma forçada."""

ARTICLE_PROMPT = """Escreve um artigo completo em Markdown para o tema: **{title}**

Requisitos:
- Extensão: entre 1400 e 2000 palavras de conteúdo (excluindo frontmatter)
- Começa com um parágrafo introdutório que explica por que o tema é importante para famílias cuidadoras
- Inclui 5 a 7 secções com H2 claros e práticos
- Cada secção tem 150 a 250 palavras com conteúdo acionável
- Inclui pelo menos uma lista com bullets ou uma tabela onde faça sentido
- Termina com uma secção de CTA discreta que mencione a pietas.care de forma natural (não forçada), com o link [pietas.care/register](https://pietas.care/register)
- NÃO incluas o frontmatter YAML — apenas o conteúdo Markdown a partir do H1
- O H1 deve ser exatamente: **{title}**
- Escreve em português europeu. Usa "você", não "tu". Não uses "você" em excesso — alterna com formas verbais impessoais.
- Não uses emojis
- Categoria do artigo: {category} {"(artigo informativo)" if "{category}" == "guia" else "(comparação de soluções)"}

Palavras-chave a incluir naturalmente no texto: {keywords}"""


def generate_article(client: anthropic.Anthropic, item: dict, dry_run: bool = False) -> str:
    prompt = ARTICLE_PROMPT.format(
        title=item["title"],
        category=item["category"],
        keywords=", ".join(item["keywords"]),
    )

    if dry_run:
        print(f"[DRY RUN] Would generate: {item['slug']}")
        return ""

    print(f"Generating: {item['slug']} …")
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def save_article(item: dict, body: str) -> Path:
    today = datetime.date.today().isoformat()
    frontmatter = (
        f"---\n"
        f"title: \"{item['title']}\"\n"
        f"description: \"\"\n"
        f"date: \"{today}\"\n"
        f"category: \"{item['category']}\"\n"
        f"keywords: {json.dumps(item['keywords'], ensure_ascii=False)}\n"
        f"readingTime: {item['readingTime']}\n"
        f"---\n\n"
    )

    # Extract description from first paragraph of generated content
    paragraphs = [l.strip() for l in body.split("\n") if l.strip() and not l.startswith("#")]
    description = paragraphs[0][:200].rstrip(".") + "." if paragraphs else item["title"]
    # Trim to 160 chars for meta
    if len(description) > 160:
        description = description[:157] + "..."
    frontmatter = frontmatter.replace('description: ""', f'description: "{description}"')

    output = frontmatter + body
    path = CONTENT_DIR / f"{item['slug']}.md"
    path.write_text(output, encoding="utf-8")
    print(f"Saved: {path.relative_to(REPO_ROOT)}")
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Print what would be generated without calling the API")
    parser.add_argument("--slug", help="Force generate a specific slug (even if it already exists)")
    parser.add_argument("--count", type=int, default=2, help="Number of articles to generate (default: 2)")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key and not args.dry_run:
        print("Error: ANTHROPIC_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    client = anthropic.Anthropic(api_key=api_key) if not args.dry_run else None

    if args.slug:
        items = [next((k for k in KEYWORDS if k["slug"] == args.slug), None)]
        if not items[0]:
            print(f"Slug '{args.slug}' not found in keyword list", file=sys.stderr)
            sys.exit(1)
    else:
        items = pick_keywords(args.count)

    if not items:
        sys.exit(0)

    for item in items:
        body = generate_article(client, item, dry_run=args.dry_run)
        if not args.dry_run:
            save_article(item, body)

    print(f"Done. Generated {len(items)} article(s).")


if __name__ == "__main__":
    main()
