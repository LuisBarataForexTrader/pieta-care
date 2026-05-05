# pieta.care

**Plataforma de coordenação de cuidados a idosos**

> Inspirado na Pietà de Michelangelo — o símbolo universal de cuidar de quem amamos.

## O que é

Uma app que une família, cuidadores profissionais e médicos num único lugar, com AI que garante que nada é esquecido — medicação, consultas, documentos, tarefas.

## Stack

- **Backend:** FastAPI + PostgreSQL
- **Frontend:** Next.js (web mobile-first)
- **Notificações:** Firebase Cloud Messaging
- **Pagamentos:** Stripe
- **Storage:** Hetzner Object Storage
- **Infra:** Hetzner VPS + Docker + Nginx

## Estrutura

```
pieta-care/
├── backend/          # FastAPI API
│   └── app/
│       ├── api/      # Rotas/endpoints
│       ├── models/   # Modelos SQLAlchemy
│       ├── schemas/  # Schemas Pydantic
│       ├── services/ # Lógica de negócio
│       └── core/     # Config, auth, database
├── frontend/         # Next.js
└── docs/             # Documentação
```

## MVP — Módulos

1. **Perfil do idoso** — info, condições, médicos, documentos
2. **Medicação** — lista, confirmação diária, alertas
3. **Família** — convite, acesso partilhado, feed
4. **Calendário** — consultas, tarefas, lembretes
5. **Pagamento** — trial 30 dias + €35/mês (Stripe)

## Modelo de negócio

| Plano | Preço |
|---|---|
| Grátis (trial) | 30 dias |
| Família | €35/mês |
| Família+ | €59/mês |
| Cuidador Pro | €19/mês |
| Agência | €199-399/mês |

## Mercados

- Portugal (lançamento)
- Espanha (mês 6)
- França (mês 12)
