'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Clock, X } from 'lucide-react'
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

  // Don't show banner if trial has lots of days left (>10 days)
  if (daysLeft > 10) return null

  const expired = daysLeft === 0
  const tone = expired ? 'danger' : daysLeft <= 3 ? 'warn' : 'info'

  function dismiss(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 3600 * 1000))  // dismiss for 1 day
    setDismissed(true)
  }

  return (
    <Link href="/conta" className={`trial-banner trial-banner-${tone}`}>
      <Clock size={14} strokeWidth={2.25} />
      <span>
        {expired
          ? <>Trial terminou — escolhe um plano para continuar</>
          : <>Trial termina em <strong>{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong>. Escolhe um plano →</>
        }
      </span>
      <button onClick={dismiss} className="trial-banner-close" aria-label="Dispensar">
        <X size={13} strokeWidth={2.5} />
      </button>
    </Link>
  )
}
