'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Leaf, Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { api, setToken, setElderlyId } from '@/lib/api'

export default function Register() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', full_name: '', elderly_name: '' })
  const [step, setStep] = useState<'account' | 'elderly' | 'verify'>('account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyStatus, setVerifyStatus] = useState<string>('trial')
  const [autoLoggingIn, setAutoLoggingIn] = useState(false)
  const passwordRef = useRef('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  // Poll for cross-device email verification. The desktop tab keeps
  // hitting verification-status; once Gmail/iPhone clicks the link in
  // the email and the backend flips is_verified=true, we auto-login
  // here and redirect to /dashboard.
  useEffect(() => {
    if (step !== 'verify' || !verifyEmail) return
    let alive = true
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      if (!alive) return
      try {
        const res = await api.checkVerification(verifyEmail)
        if (res.verified && alive && passwordRef.current) {
          setAutoLoggingIn(true)
          try {
            const auth = await api.login(verifyEmail, passwordRef.current)
            setToken(auth.access_token)
            try {
              const list = await api.listElderly()
              if (list.length > 0) setElderlyId(list[0].id)
            } catch {}
            // If the user came from /planos with intent=subscribe, route
            // them straight to /conta which auto-triggers Stripe Checkout
            // (pay now, no Stripe trial). Otherwise, /dashboard as usual.
            const params = new URLSearchParams(window.location.search)
            const wantsPay = params.get('pay') === '1' || params.get('intent') === 'subscribe'
            const plan = params.get('plan')
            if (wantsPay && plan) {
              router.replace(`/conta?checkout=auto&plan=${encodeURIComponent(plan)}`)
            } else {
              router.replace('/dashboard')
            }
            return  // don't reschedule
          } catch {
            // Login failed for some reason - fall through to /login so
            // the user can enter the password manually.
            router.replace('/login')
            return
          }
        }
      } catch {
        // Network blip - try again next tick.
      }
      if (alive) timer = setTimeout(tick, 3000)
    }

    tick()

    const onVisible = () => {
      if (document.visibilityState === 'visible' && alive) {
        if (timer) clearTimeout(timer)
        tick()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      alive = false
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [step, verifyEmail, router])

  async function submitAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('A password deve ter pelo menos 8 caracteres'); return }
    // Surface "Email já registado" here, on the step where the email was
    // actually entered, instead of after the user fills in elderly_name
    // and clicks Começar. Lighter UX, no wasted typing.
    setLoading(true)
    let blocked = false
    try {
      const r = await api.checkEmail(form.email)
      if (r.taken) {
        setError('Email já registado. Tente entrar em vez de criar conta.')
        blocked = true
      }
    } catch {
      // Network glitch — let it through; the register call on step 2
      // is the canonical check and will surface the error there.
    } finally {
      setLoading(false)
    }
    if (!blocked) setStep('elderly')
  }

  async function submitElderly(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.register(form.email, form.password, form.full_name, form.elderly_name.trim() || undefined)
      setVerifyEmail(res.email)
      setVerifyStatus(res.subscription_status)
      passwordRef.current = form.password   // remember for auto-login after verification
      setStep('verify')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <div className="auth-shell">
        <Link href="/" className="auth-back" aria-label="Voltar ao site">
          <ArrowLeft size={15} strokeWidth={2.25} /> Voltar ao site
        </Link>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand)', letterSpacing: '-0.5px' }}>pietas.care</h1>
          </div>
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{
              width: 60, height: 60, margin: '0 auto 16px',
              borderRadius: 16, background: 'var(--brand-light)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Mail size={28} strokeWidth={1.75} style={{ color: 'var(--brand)' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>Verifique o seu email</h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 8 }}>
              Enviámos um link de confirmação para:
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)', marginBottom: 24, wordBreak: 'break-all' }}>
              {verifyEmail}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Clique no link no email para activar a sua conta. O link expira em 24 horas.
            </p>

            {verifyStatus === 'expired' && (
              <div style={{
                marginTop: 16, padding: '12px 14px', borderRadius: 10,
                background: 'var(--warning-light)',
                border: '1px solid rgba(192,86,33,0.22)',
                fontSize: 13, color: 'var(--on-tinted-warning)', fontWeight: 600,
                textAlign: 'left', lineHeight: 1.55,
              }}>
                <strong>Sem período de experimentação:</strong> detectámos que já experimentou o pietas.care anteriormente.
                Para usar a app, terá de subscrever um plano logo após confirmar o email.
              </div>
            )}

            {/* Live polling indicator - turns into an "entrando" state once verification is detected */}
            <div style={{
              marginTop: 20, padding: '12px 14px', borderRadius: 12,
              background: autoLoggingIn ? 'var(--success-light)' : 'var(--brand-light)',
              border: `1px solid ${autoLoggingIn ? 'var(--success)' : 'rgba(42,96,73,0.18)'}`,
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
              color: autoLoggingIn ? 'var(--on-tinted-success)' : 'var(--brand)', fontWeight: 600,
              textAlign: 'left',
            }}>
              {autoLoggingIn ? (
                <>
                  <CheckCircle2 size={18} strokeWidth={2.25} />
                  <span>Email confirmado - a entrar…</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true" style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid currentColor', borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite', flexShrink: 0,
                  }} />
                  <span>À espera de confirmação… esta página atualiza-se automaticamente.</span>
                </>
              )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Tipo de email errado? Permite voltar a editar. */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>
                Não é este o email?
              </p>
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setVerifyEmail('')
                  setStep('account')
                }}
                className="btn-secondary"
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ArrowLeft size={14} strokeWidth={2.25} /> Corrigir e enviar de novo
              </button>
            </div>

            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
                Já tem conta?{' '}
                <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 700 }}>Entrar</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      <Link href="/" className="auth-back" aria-label="Voltar ao site">
        <ArrowLeft size={15} strokeWidth={2.25} /> Voltar ao site
      </Link>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, margin: '0 auto 16px',
            borderRadius: 16, background: 'linear-gradient(135deg, #2A6049 0%, #1E4A38 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px -8px rgba(42,96,73,0.4)',
          }}>
            <Leaf size={30} strokeWidth={2} color="#fff" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em' }}>pietas.care</h1>
          <p style={{ color: 'var(--text-3)', marginTop: 6, fontSize: 15 }}>14 dias grátis · Sem cartão de crédito</p>
        </div>

        <div className="auth-card">
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {(['account', 'elderly'] as const).map((s, i) => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 99, background: step === s || (i === 0 && step === 'elderly') ? 'var(--brand)' : 'var(--border)', transition: 'background 0.3s' }} />
            ))}
          </div>

          {step === 'account' ? (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Criar conta</h2>
              <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>Os seus dados de acesso</p>
              <form onSubmit={submitAccount} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="field-label">Nome completo</label>
                  <input className="field-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="O seu nome" required />
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <input className="field-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="o_seu@email.com" required />
                </div>
                <div>
                  <label className="field-label">Password</label>
                  <input className="field-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 8 caracteres" required />
                </div>
                {error && <div className="alert-error">{error}</div>}
                <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? 'A verificar…' : <>Continuar <ArrowRight size={16} strokeWidth={2.5} /></>}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Quem vai cuidar?</h2>
              <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>Indique o nome do seu familiar</p>

              <div style={{ background: 'var(--brand-light)', border: '1px solid rgba(42,96,73,0.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: 14, color: 'var(--brand)', lineHeight: 1.6 }}>
                🌿 Pode adicionar mais familiares e convidar outros membros da família depois.
              </div>

              <form onSubmit={submitElderly} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="field-label">Nome do familiar</label>
                  <input className="field-input" value={form.elderly_name} onChange={e => set('elderly_name', e.target.value)}
                    placeholder="Ex: Maria Conceição" required autoFocus />
                </div>
                {error && <div className="alert-error">{error}</div>}
                <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? 'A criar conta…' : 'Começar →'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setStep('account')}>← Voltar</button>
              </form>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-3)', fontSize: 14 }}>
            Já tem conta?{' '}
            <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 700 }}>Entrar</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-3)' }}>
          🔒 Dados protegidos e encriptados · RGPD compliant
        </p>
      </div>
    </div>
  )
}
