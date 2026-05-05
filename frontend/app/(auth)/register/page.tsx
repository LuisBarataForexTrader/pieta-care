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

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submitAccount(e: React.FormEvent) {
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
      setError(err instanceof Error ? err.message : 'Erro ao registar')
      setStep('account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px' }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🌿</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Criar conta</h1>
        <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>
          {step === 'account' ? 'Os teus dados de acesso' : 'Quem vais cuidar?'}
        </p>
      </div>

      {step === 'account' ? (
        <form onSubmit={submitAccount} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Nome completo</label>
            <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="O teu nome" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="o_teu@email.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 8 caracteres" required />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 14, textAlign: 'center' }}>{error}</p>}
          <button className="btn-primary" type="submit" style={{ marginTop: 8 }}>Continuar →</button>
        </form>
      ) : (
        <form onSubmit={submitElderly} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ background: 'var(--sage-light)', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--sage-dark)' }}>
              🌿 Vais gerir os cuidados de saúde de um familiar. Diz-nos o nome dele/dela.
            </p>
          </div>
          <div>
            <label className="label">Nome do familiar</label>
            <input className="input" value={form.elderly_name} onChange={e => set('elderly_name', e.target.value)} placeholder="Ex: Maria Conceição" required />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 14, textAlign: 'center' }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'A criar conta…' : 'Começar →'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setStep('account')}>← Voltar</button>
        </form>
      )}

      <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--muted)', fontSize: 14 }}>
        Já tens conta?{' '}
        <Link href="/login" style={{ color: 'var(--sage)', fontWeight: 600 }}>Entrar</Link>
      </p>
    </div>
  )
}
