'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Leaf, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react'
import { api, setToken, setElderlyId } from '@/lib/api'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', elderly_name: '' })
  const [step, setStep] = useState<'account' | 'elderly' | 'verify'>('account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verifyEmail, setVerifyEmail] = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function submitAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('A password deve ter pelo menos 8 caracteres'); return }
    setStep('elderly')
  }

  async function submitElderly(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.register(form.email, form.password, form.full_name, form.elderly_name.trim() || undefined)
      setVerifyEmail(res.email)
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
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand)', letterSpacing: '-0.5px' }}>pieta.care</h1>
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
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
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
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em' }}>pieta.care</h1>
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
                <button className="btn-primary" type="submit" style={{ marginTop: 4 }}>Continuar <ArrowRight size={16} strokeWidth={2.5} /></button>
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
