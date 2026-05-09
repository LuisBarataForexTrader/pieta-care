// Plan-tier access control for pages and sidebar items.
//
// Single source of truth: PAGE_MIN_PLAN below maps each route to the
// minimum plan tier that can see it. The Sidebar uses this to decide
// which items to render with a lock; PlanGate uses it on the page itself
// to swap content for a paywall card if the user is below the tier.
//
// Tier ranking:
//   1 = familia        (€35)
//   2 = familia_plus   (€59)
//   3 = cuidador_pro   (€88, "Família Plus" - IA + chat interno)

export type PlanKey = 'familia' | 'familia_plus' | 'cuidador_pro'

export const PLAN_RANK: Record<PlanKey, number> = {
  familia: 1,
  familia_plus: 2,
  cuidador_pro: 3,
}

export const PLAN_LABEL: Record<PlanKey, string> = {
  familia: 'Família',
  familia_plus: 'Família+',
  cuidador_pro: 'Família Plus',
}

/** Minimum plan tier to access each page. Pages NOT listed are open
 *  (always accessible - e.g. /conta, /suporte, /novo-familiar). */
export const PAGE_MIN_PLAN: Record<string, PlanKey> = {
  '/dashboard':  'familia',
  '/medicacao':  'familia',
  '/calendario': 'familia',
  '/saude':      'familia',
  '/incidentes': 'familia',
  '/documentos': 'familia',
  '/notas':      'familia',
  '/familia':    'familia',
  '/perfil':     'familia',

  '/relatorio':  'familia_plus',
  '/clinico':    'familia_plus',
  '/plano':      'familia_plus',
  '/qualidade':  'familia_plus',

  '/chat':       'cuidador_pro',
}

/** Pages that are ALWAYS accessible regardless of subscription state. */
export const ALWAYS_OPEN: ReadonlySet<string> = new Set([
  '/conta', '/suporte', '/novo-familiar', '/admin/suporte',
])

/** True if the given plan tier is >= the required tier. */
export function planAtLeast(have: PlanKey | null | undefined, required: PlanKey): boolean {
  if (!have) return false
  return PLAN_RANK[have] >= PLAN_RANK[required]
}

/** Required tier to access a path, or null if always open / unknown. */
export function requiredPlanFor(path: string): PlanKey | null {
  if (ALWAYS_OPEN.has(path)) return null
  // Match by prefix so /chat, /chat/anything, etc. all map.
  for (const [route, tier] of Object.entries(PAGE_MIN_PLAN)) {
    if (path === route || path.startsWith(route + '/')) return tier
  }
  return null
}

/** Can this user (with effective_plan) access this path? */
export function canAccess(effectivePlan: PlanKey | null | undefined, path: string): boolean {
  const required = requiredPlanFor(path)
  if (required === null) return true // always-open routes + unknown
  return planAtLeast(effectivePlan, required)
}

/** Shown in the locked-feature modal when the user clicks a locked
 *  sidebar item. Each entry is a short marketing description of what
 *  the feature does, surfaced before the upgrade CTA. */
export const FEATURE_INFO: Record<string, { pitch: string; bullets: string[] }> = {
  '/relatorio': {
    pitch: 'Um relatório clínico completo, pronto a entregar ao médico ou enviar por email - em qualquer consulta.',
    bullets: [
      'Identificação, alergias, condições crónicas e medicação atual numa só folha',
      'Gráfico de adesão à medicação dos últimos 30 dias',
      'Consultas passadas e próximas, contactos de emergência',
      'Imprime em PDF ou envia por email com 1 clique',
    ],
  },
  '/clinico': {
    pitch: 'O histórico clínico estruturado que evita ter de explicar tudo de novo a cada novo médico.',
    bullets: [
      'Diagnósticos com código ICD-10 e data, separados em crónicos vs agudos',
      'Vacinas com lote, data de administração e próximo reforço calculado',
      'Alertas automáticos quando há reforços em atraso',
      'Importação futura via SNS / FHIR (em desenvolvimento)',
    ],
  },
  '/plano': {
    pitch: 'O plano de cuidados que coordena toda a família e cuidadores em torno das mesmas rotinas.',
    bullets: [
      'Rotinas por categoria: higiene, nutrição, mobilidade, estimulação',
      'Frequência configurável (diário, semanal, conforme necessário)',
      'Visível para todos os familiares e cuidadores em tempo real',
      'Indispensável quando se reveza turnos entre vários cuidadores',
    ],
  },
  '/qualidade': {
    pitch: 'Indicadores mensais para detectar tendências negativas antes de se tornarem problema.',
    bullets: [
      'Score global de qualidade do cuidado, semana a semana',
      'Taxa de adesão à medicação e evolução do bem-estar',
      'Frequência e tipologia de incidentes ao longo do tempo',
      'Sugestões automáticas para conversar com o médico',
    ],
  },
  '/chat': {
    pitch: 'Canal privado entre os familiares aceites - coordenação contínua sem WhatsApp paralelo.',
    bullets: [
      'Conversa partilhada apenas com os familiares autorizados pelo titular',
      'Histórico permanente, organizado por dia',
      'Notificações com som e vibração quando alguém escreve',
      'Presença online em tempo real no topo da app',
    ],
  },
}
