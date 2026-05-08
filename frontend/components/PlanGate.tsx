'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, Sparkles, MessageCircle, Stethoscope, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { PLAN_LABEL, type PlanKey, planAtLeast } from '@/lib/access'
import type { BillingStatus } from '@/lib/types'

interface Props {
  /** The plan tier required to view the wrapped content. */
  requires: PlanKey
  /** Page name for the paywall headline (e.g. "Relatório Médico"). */
  pageName: string
  /** Optional 1-line value-prop shown under the title. */
  pitch?: string
  children: React.ReactNode
}

/** Block-render wrapper. While we wait for billing status, renders the
 *  children optimistically (no flash of paywall for legitimate users).
 *  When status arrives, swaps to a paywall card if access is denied. */
export default function PlanGate({ requires, pageName, pitch, children }: Props) {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.billingStatus()
      .then(s => setStatus(s))
      .catch(() => setStatus(null))
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded) return <>{children}</>
  const ok = planAtLeast(status?.effective_plan, requires)
  if (ok) return <>{children}</>

  return <Paywall requires={requires} pageName={pageName} pitch={pitch} current={status?.effective_plan ?? null} />
}

function planIcon(p: PlanKey) {
  if (p === 'cuidador_pro') return <Sparkles size={28} strokeWidth={1.75} />
  if (p === 'familia_plus') return <Stethoscope size={28} strokeWidth={1.75} />
  return <Lock size={28} strokeWidth={1.75} />
}

function planAccent(p: PlanKey): { from: string; to: string; soft: string } {
  if (p === 'cuidador_pro') return { from: '#7C3AED', to: '#A78BFA', soft: 'rgba(124,58,237,0.10)' }
  if (p === 'familia_plus') return { from: '#166534', to: '#22C55E', soft: 'rgba(22,101,52,0.10)' }
  return { from: '#166534', to: '#22C55E', soft: 'rgba(22,101,52,0.10)' }
}

function Paywall({
  requires, pageName, pitch, current,
}: {
  requires: PlanKey
  pageName: string
  pitch?: string
  current: PlanKey | null
}) {
  const accent = planAccent(requires)
  const isUpgrade = !!current

  return (
    <div>
      <div className="page-top">
        <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <Lock size={18} strokeWidth={2} style={{ color: 'var(--text-3)' }} /> {pageName}
        </div>
        <div className="page-subtitle">Disponível no plano {PLAN_LABEL[requires]}</div>
      </div>
      <div className="page-body">
        <div style={{ maxWidth: 640, margin: '24px auto 0', padding: 'clamp(28px, 4vw, 48px)', borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <div style={{
            width: 72, height: 72, margin: '0 auto 18px', borderRadius: 18,
            background: accent.soft, color: accent.from,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {planIcon(requires)}
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#fff', background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`, padding: '5px 12px', borderRadius: 99, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
            {requires === 'cuidador_pro' ? <Sparkles size={11} strokeWidth={2.5} /> : null}
            Exclusivo {PLAN_LABEL[requires]}
          </div>

          <h2 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.2, marginBottom: 12 }}>
            {pageName} é uma funcionalidade {PLAN_LABEL[requires]}.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 28 }}>
            {pitch ?? `Faça upgrade para o plano ${PLAN_LABEL[requires]} para desbloquear esta secção.`}
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              href="/conta"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 15, fontWeight: 800, color: '#fff',
                background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                padding: '13px 26px', borderRadius: 12, textDecoration: 'none',
              }}
            >
              {isUpgrade ? 'Fazer upgrade' : 'Ver planos'}
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            {requires === 'cuidador_pro' && (
              <Link href="/conta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: accent.from, textDecoration: 'none', padding: '13px 16px' }}>
                <MessageCircle size={14} strokeWidth={2.5} /> Inclui chat interno + IA
              </Link>
            )}
          </div>

          {current && (
            <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-3)' }}>
              Estás actualmente no plano <strong style={{ color: 'var(--text-2)' }}>{PLAN_LABEL[current]}</strong>.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
