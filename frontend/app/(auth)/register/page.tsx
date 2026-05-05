'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, setToken, setElderlyId } from '@/lib/api'

export default function Register() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', full_name: '', elderly_name: '' })
  const [step, setStep] = useState<'account' | 'elderly'>('account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      const res = await api.register(form.email, form.password, form.full_name)
      setToken(res.access_token)
      if (form.elderly_name.trim()) {
        const elderly = await api.createElderly({ full_name: form.elderly_name.trim() })
        setElderlyId(elderly.id)
      }
      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
      setStep('account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand)', letterSpacing: '-0.5px' }}>pieta.care</h1>
          <p style={{ color: 'var(--text-3)', marginTop: 6, fontSize: 15 }}>30 dias grátis · Sem cartão de crédito</p>
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
              <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>Os teus dados de acesso</p>
              <form onSubmit={submitAccount} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="field-label">Nome completo</label>
                  <input className="field-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="O teu nome" required />
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <input className="field-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="o_teu@email.com" required />
                </div>
                <div>
                  <label className="field-label">Password</label>
                  <input className="field-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 8 caracteres" required />
                </div>
                {error && <div className="alert-error">{error}</div>}
                <button className="btn-primary" type="submit" style={{ marginTop: 4 }}>Continuar →</button>
              </form>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Quem vais cuidar?</h2>
              <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>Introduz o nome do teu familiar</p>

              <div style={{ background: 'var(--brand-light)', border: '1px solid rgba(42,96,73,0.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: 14, color: 'var(--brand)', lineHeight: 1.6 }}>
                🌿 Podes adicionar mais familiares e convidar outros membros da família depois.
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
            Já tens conta?{' '}
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
