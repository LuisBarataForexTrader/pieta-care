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
      // load first elderly profile
      const list = await api.listElderly()
      if (list.length > 0) setElderlyId(list[0].id)
      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px' }}>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🌿</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>pieta.care</h1>
        <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 15 }}>Cuidar de quem amamos, juntos.</p>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="o_teu@email.com"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 14, textAlign: 'center', margin: 0 }}>{error}</p>
        )}

        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'A entrar…' : 'Entrar'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--muted)', fontSize: 15 }}>
        Não tens conta?{' '}
        <Link href="/register" style={{ color: 'var(--sage)', fontWeight: 600 }}>
          Registar
        </Link>
      </p>
    </div>
  )
}
