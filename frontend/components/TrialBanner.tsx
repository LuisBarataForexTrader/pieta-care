'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Clock, ArrowRight, X } from 'lucide-react'
import { api } from '@/lib/api'
import type { BillingStatus } from '@/lib/types'

const DISMISS_KEY = 'pieta_trial_banner_dismissed_until'

/** Pretty-print remaining trial time. Avoids absurd values like
 *  "faltam 364 dias" by promoting weeks/months when appropriate. */
function formatRemaining(days: number): string {
  if (days <= 0) return 'expirado'
  if (days === 1) return 'termina amanhã'
  if (days <= 14) return `${days} dias restantes`
  if (days <= 60) {
    const weeks = Math.round(days / 7)
    return `${weeks} semanas restantes`
  }
  const months = Math.round(days / 30)
  return `${months} ${months === 1 ? 'mês' : 'meses'} restantes`
}

export default function TrialBanner() {
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    api.billingStatus().then(setBilling).catch(() => setBilling(null))
    const stored = localStorage.getItem(DISMISS_KEY)
    if (stored && parseInt(stored) > Date.now()) {
      setDismissed(true)
    }
  }, [])

  if (!billing || dismissed) return null
  if (billing.has_subscription) return null

  const trialEnd = billing.trial_ends_at ? new Date(billing.trial_ends_at) : null
  if (!trialEnd) return null

  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
  const expired = daysLeft === 0

  // Tone scales with urgency
  const tone = expired ? 'danger' : daysLeft <= 1 ? 'danger' : daysLeft <= 5 ? 'warn' : 'info'

  function dismiss(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    // Allow dismiss only when there's no urgency (info tone) - for 24h
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 3600 * 1000))
    setDismissed(true)
  }

  return (
    <Link href="/conta" className={`trial-banner trial-banner-${tone}`}>
      <span className="trial-banner-icon" aria-hidden="true">
        <Clock size={13} strokeWidth={2.25} />
      </span>
      <span className="trial-banner-text">
        {expired ? (
          <>Período de avaliação terminado · <strong>Subscrever</strong></>
        ) : (
          <>
            <span className="trial-banner-pill">Avaliação</span>
            <span className="trial-banner-divider" />
            <span>{formatRemaining(daysLeft)}</span>
            <span className="trial-banner-divider" />
            <span className="trial-banner-cta">
              Subscrever
              <ArrowRight size={12} strokeWidth={2.5} />
            </span>
          </>
        )}
      </span>
      {tone === 'info' && (
        <button onClick={dismiss} className="trial-banner-close" aria-label="Dispensar">
          <X size={13} strokeWidth={2.5} />
        </button>
      )}
    </Link>
  )
}
