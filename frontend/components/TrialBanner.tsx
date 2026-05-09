'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { api } from '@/lib/api'
import type { BillingStatus } from '@/lib/types'

const DISMISS_KEY = 'pieta_trial_banner_dismissed_until'

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
      <Sparkles size={14} strokeWidth={2.25} />
      <span>
        {expired ? (
          <>O seu trial terminou - escolha um plano em <strong>A minha conta</strong> para continuar →</>
        ) : daysLeft === 1 ? (
          <>Amanhã termina o seu trial <strong>Família Plus</strong>. Subscreva em <strong>A minha conta</strong> para manter os dados →</>
        ) : (
          <>A experimentar <strong>Família Plus</strong> · faltam <strong>{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong> · gerir em <strong>A minha conta</strong> →</>
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
