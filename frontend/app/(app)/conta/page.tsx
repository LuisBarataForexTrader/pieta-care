'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Settings, User as UserIcon, CreditCard, Download, Trash2, AlertTriangle,
  Check, Sparkles, ExternalLink, Clock,
} from 'lucide-react'
import { api, clearToken } from '@/lib/api'
import type { User, Plan, BillingStatus } from '@/lib/types'

const STATUS_LABEL: Record<string, string> = {
  trial: 'Período de experimentação',
  trialing: 'Trial Stripe',
  active: 'Activa',
  past_due: 'Pagamento em atraso',
  canceled: 'Cancelada',
  incomplete: 'Incompleta',
  incomplete_expired: 'Expirada',
  unpaid: 'Por pagar',
  member: 'Membro',
  none: 'Sem subscrição',
}

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
}
function daysUntil(iso: string | null) {
  if (!iso) return null
  const d = (new Date(iso).getTime() - Date.now()) / 86400000
  return Math.max(0, Math.ceil(d))
}

export default function ContaPage() {
  const router = useRouter()
  const search = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const checkoutResult = search.get('checkout')

  useEffect(() => {
    Promise.all([
      api.me(),
      api.billingStatus().catch(() => null),
      api.listPlans().catch(() => []),
    ]).then(([u, b, p]) => {
      setUser(u)
      setBilling(b)
      setPlans(p)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (checkoutResult === 'success') {
      setMsg({ type: 'success', text: 'Subscrição activada. Obrigado por escolher pieta.care!' })
    } else if (checkoutResult === 'cancel') {
      setMsg({ type: 'error', text: 'Checkout cancelado. Podes voltar a tentar quando quiseres.' })
    }
  }, [checkoutResult])

  async function startCheckout(planKey: string) {
    setCheckingOut(planKey)
    setMsg(null)
    try {
      const { url } = await api.createCheckoutSession(planKey)
      window.location.href = url
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Erro ao iniciar checkout' })
      setCheckingOut(null)
    }
  }

  async function openPortal() {
    setOpeningPortal(true)
    try {
      const { url } = await api.billingPortal()
      window.location.href = url
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Erro ao abrir portal' })
      setOpeningPortal(false)
    }
  }

  async function handleExport() {
    setExportLoading(true)
    setMsg(null)
    try {
      const data = await api.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pieta-care-dados-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMsg({ type: 'success', text: 'Dados exportados com sucesso.' })
    } catch {
      setMsg({ type: 'error', text: 'Erro ao exportar dados. Tente novamente.' })
    } finally {
      setExportLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return }
    setDeletePending(true)
    setMsg(null)
    try {
      await api.deleteAccount()
      setMsg({ type: 'success', text: 'Conta marcada para eliminação. Receberá um email de confirmação.' })
      setTimeout(() => { clearToken(); router.replace('/login') }, 4000)
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao eliminar conta.' })
      setDeletePending(false)
      setDeleteConfirm(false)
    }
  }

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>A carregar…</div>

  const status = billing?.status ?? user?.subscription_status ?? 'trial'
  const isActive = status === 'active' || status === 'trialing'
  const isTrial = status === 'trial' && !billing?.has_subscription
  const trialDays = daysUntil(billing?.trial_ends_at ?? null)
  const currentPlan = billing?.plan
  const periodEnd = fmtDate(billing?.current_period_end ?? null)

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><Settings size={20} strokeWidth={2} /> A minha conta</div>
          <div className="page-subtitle">Gerir dados, subscrição e preferências</div>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 920 }}>
        {msg && (
          <div className={msg.type === 'success' ? 'alert-success' : 'alert-error'} style={{ marginBottom: 20 }}>
            {msg.text}
          </div>
        )}

        {/* Current subscription */}
        <div className="card card-lg" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>
            <CreditCard size={16} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Subscrição
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {billing?.plan_name ?? (isTrial ? 'Trial gratuito' : 'Sem plano')}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
                <span className={
                  isActive ? 'pill pill-taken' :
                  status === 'past_due' ? 'pill pill-missed' :
                  status === 'canceled' ? 'pill pill-skipped' :
                  'pill pill-pending'
                } style={{ marginRight: 8 }}>{STATUS_LABEL[status] ?? status}</span>
                {isTrial && trialDays !== null && (
                  <>Trial termina em <strong>{trialDays} dia{trialDays !== 1 ? 's' : ''}</strong></>
                )}
                {isActive && periodEnd && (
                  <>{billing?.cancel_at_period_end ? 'Termina' : 'Renova'} em <strong>{periodEnd}</strong></>
                )}
              </div>
            </div>

            {billing?.has_subscription && (
              <button
                className="btn-secondary"
                onClick={openPortal}
                disabled={openingPortal}
                style={{ width: 'auto', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {openingPortal ? 'A abrir…' : <><ExternalLink size={14} strokeWidth={2} /> Gerir faturação</>}
              </button>
            )}
          </div>

          {isTrial && trialDays !== null && trialDays <= 7 && (
            <div className="alert-warning-banner" style={{ marginBottom: 16 }}>
              <Clock size={16} strokeWidth={2} />
              <span>Trial termina em <strong>{trialDays} dia{trialDays !== 1 ? 's' : ''}</strong>. Escolhe um plano abaixo para continuar.</span>
            </div>
          )}

          {/* Plans grid — show only when no active sub */}
          {(!billing?.has_subscription || status === 'canceled' || status === 'incomplete' || status === 'incomplete_expired') && plans.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 18, marginBottom: 12 }}>
                Escolhe um plano
              </div>
              <div className="plans-grid">
                {plans.map(p => (
                  <div key={p.key} className={`plan-card ${currentPlan === p.key ? 'plan-card-current' : ''} ${p.has_ai ? 'plan-card-ai' : ''}`}>
                    {p.has_ai && (
                      <div className="plan-badge">
                        <Sparkles size={11} strokeWidth={2.25} /> Com IA
                      </div>
                    )}
                    <div className="plan-name">{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6, marginBottom: 14 }}>
                      <span className="plan-price">€{p.price.toFixed(0)}</span>
                      <span className="plan-period">+ IVA / mês</span>
                    </div>
                    <ul className="plan-features">
                      {p.features.map((f, i) => (
                        <li key={i}><Check size={13} strokeWidth={2.5} /> {f}</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => startCheckout(p.key)}
                      disabled={checkingOut !== null}
                      className={p.has_ai ? 'btn-primary' : 'btn-secondary'}
                      style={{ width: '100%', marginTop: 14, padding: '11px', fontSize: 14 }}
                    >
                      {checkingOut === p.key ? 'A redirecionar…' : isTrial ? 'Subscrever' : 'Escolher'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Profile info */}
        {user && (
          <div className="card card-lg" style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}><UserIcon size={16} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Informação da conta</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-3)' }}>Nome</span>
                <span style={{ fontWeight: 600 }}>{user.full_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0' }}>
                <span style={{ color: 'var(--text-3)' }}>Email</span>
                <span style={{ fontWeight: 600 }}>{user.email}</span>
              </div>
            </div>
          </div>
        )}

        {/* Export data */}
        <div className="card card-lg" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 12 }}><Download size={16} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Exportar dados</div>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
            De acordo com o RGPD, tem o direito de obter uma cópia de todos os seus dados pessoais e dos perfis de cuidado que gere.
          </p>
          <button
            className="btn-secondary"
            onClick={handleExport}
            disabled={exportLoading}
            style={{ width: 'auto', padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            {exportLoading ? 'A exportar…' : <><Download size={15} strokeWidth={2} /> Exportar todos os dados (JSON)</>}
          </button>
        </div>

        {/* Delete account */}
        <div className="card card-lg" style={{ border: '1px solid #FEB2B2' }}>
          <div className="section-title" style={{ marginBottom: 12, color: '#C53030' }}><Trash2 size={16} strokeWidth={2} /> Eliminar conta</div>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 8 }}>
            Ao eliminar a sua conta, todos os dados ficam disponíveis para exportação durante <strong>30 dias</strong>, após os quais são eliminados definitivamente dos nossos sistemas.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.6 }}>
            Esta acção não pode ser revertida após o período de 30 dias. Receberá um email de confirmação com os detalhes.
          </p>

          {deleteConfirm && !deletePending && (
            <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 10, padding: '14px 16px', marginBottom: 16, fontSize: 14, color: '#744210', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertTriangle size={18} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Tem a certeza? Clique novamente em &ldquo;Confirmar eliminação&rdquo; para prosseguir.</span>
            </div>
          )}

          <button
            onClick={handleDelete}
            disabled={deletePending}
            style={{
              background: deleteConfirm ? '#C53030' : 'transparent',
              color: deleteConfirm ? '#fff' : '#C53030',
              border: '1px solid #C53030',
              borderRadius: 10,
              padding: '10px 24px',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              width: 'auto',
            }}
          >
            {deletePending ? 'A processar…' : deleteConfirm ? 'Confirmar eliminação' : 'Eliminar conta'}
          </button>
          {deleteConfirm && !deletePending && (
            <button
              onClick={() => setDeleteConfirm(false)}
              style={{ marginLeft: 12, background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: 14, cursor: 'pointer' }}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
