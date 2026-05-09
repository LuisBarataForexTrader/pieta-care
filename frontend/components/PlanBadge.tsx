'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sparkles, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import type { BillingStatus } from '@/lib/types'

const LABEL: Record<string, string> = {
  familia: 'Família',
  familia_plus: 'Família+',
  cuidador_pro: 'Família Plus',
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

export default function PlanBadge() {
  const pathname = usePathname()
  const [billing, setBilling] = useState<BillingStatus | null>(null)

  useEffect(() => {
    let alive = true
    const fetchBilling = () =>
      api.billingStatus()
        .then(s => { if (alive) setBilling(s) })
        .catch(() => { if (alive) setBilling(null) })
    fetchBilling()
    const onVisible = () => { if (document.visibilityState === 'visible') fetchBilling() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [pathname])

  if (!billing) return null

  // Trial → show countdown chip pointing to /conta
  if (billing.status === 'trial' || billing.status === 'trialing') {
    const days = daysUntil(billing.trial_ends_at)
    return (
      <Link href="/conta" className="user-plan-chip user-plan-chip-trial" title="Período de experimentação">
        <Clock size={12} strokeWidth={2.5} />
        <span className="user-plan-chip-label">
          Trial{days !== null ? ` · ${days}d` : ''}
        </span>
      </Link>
    )
  }

  const plan = billing.effective_plan ?? billing.plan
  if (!plan || !LABEL[plan]) return null

  const isPlus = plan === 'cuidador_pro'
  return (
    <Link
      href="/conta"
      className={`user-plan-chip user-plan-chip-${plan}`}
      title={`Plano ${LABEL[plan]} · gerir em A minha conta`}
    >
      {isPlus && <Sparkles size={12} strokeWidth={2.5} />}
      <span className="user-plan-chip-label">{LABEL[plan]}</span>
    </Link>
  )
}
