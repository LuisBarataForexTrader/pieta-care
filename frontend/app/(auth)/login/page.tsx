'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, setToken, setElderlyId } from '@/lib/api'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.login(email, password)
      setToken(res.access_token)
      const list = await api.listElderly()
      if (list.length > 0) setElderlyId(list[0].id)
      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Email ou password incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand)', letterSpacing: '-0.5px' }}>pieta.care</h1>
          <p style={{ color: 'var(--text-3)', marginTop: 6, fontSize: 15 }}>Cuidar de quem amamos, juntos.</p>
        </div>

        <div className="auth-card">
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>Entrar na conta</h2>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="field-label">Email</label>
              <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="o_seu@email.com" required autoComplete="email" />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input className="field-input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password" />
            </div>

            {error && <div className="alert-error">{error}</div>}

            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'A entrar…' : 'Entrar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-3)', fontSize: 14 }}>
            Não tem conta?{' '}
            <Link href="/register" style={{ color: 'var(--brand)', fontWeight: 700 }}>Criar conta gratuita</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-3)' }}>
          🔒 Dados protegidos e encriptados · RGPD compliant
        </p>
      </div>
    </div>
  )
}
