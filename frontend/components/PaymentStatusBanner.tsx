'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import type { BillingStatus } from '@/lib/types'

/** Sticky banner shown when the subscription is in a problem state -
 *  past_due, unpaid, incomplete, or canceled. Sits above page content
 *  on every app route. Trial / active states render nothing. */
export default function PaymentStatusBanner() {
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    let alive = true
    const refresh = () =>
      api.billingStatus().then(s => { if (alive) setBilling(s) }).catch(() => {})
    refresh()
    const onVis = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVis)
    return () => { alive = false; document.removeEventListener('visibilitychange', onVis) }
  }, [])

  if (!billing) return null

  const status = billing.status

  async function openPortal() {
    if (opening) return
    setOpening(true)
    try {
      const res = await api.billingPortal()
      window.location.href = res.url
    } catch {
      window.location.href = '/conta'
    } finally {
      setOpening(false)
    }
  }

  // Past-due / unpaid / incomplete - urgent, red banner
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') {
    return (
      <div className="payment-banner payment-banner-danger">
        <AlertTriangle size={16} strokeWidth={2.25} />
        <div className="payment-banner-text">
          <strong>Pagamento em atraso.</strong> Atualize o método de pagamento para manter o acesso à app.
        </div>
        <button onClick={openPortal} disabled={opening} className="payment-banner-cta">
          {opening ? 'A abrir…' : <>Atualizar <ArrowRight size={13} strokeWidth={2.5} /></>}
        </button>
      </div>
    )
  }

  // Canceled but still in paid period - amber, informative
  if (status === 'canceled' && billing.current_period_end) {
    const endsAt = new Date(billing.current_period_end)
    const days = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86_400_000))
    return (
      <div className="payment-banner payment-banner-warning">
        <AlertTriangle size={16} strokeWidth={2.25} />
        <div className="payment-banner-text">
          Subscrição cancelada. Mantém acesso até {endsAt.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}
          {days <= 7 && <> · faltam <strong>{days} dia{days !== 1 ? 's' : ''}</strong></>}.
        </div>
        <Link href="/conta" className="payment-banner-cta payment-banner-cta-ghost">
          Reativar <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </div>
    )
  }

  // Active or trial - render nothing
  return null
}
