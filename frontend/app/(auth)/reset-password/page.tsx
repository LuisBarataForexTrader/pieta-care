'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Leaf, Lock, ArrowLeft, Check } from 'lucide-react'
import { api, setToken, setElderlyId } from '@/lib/api'

function ResetPasswordInner() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('A password tem de ter pelo menos 8 caracteres'); return }
    if (password !== confirm) { setError('As passwords não coincidem'); return }
    setLoading(true)
    try {
      const res = await api.resetPassword(token, password)
      setToken(res.access_token)
      // Try to load elderly list so the dashboard has context
      try {
        const list = await api.listElderly()
        if (list.length > 0) setElderlyId(list[0].id)
      } catch {}
      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível repor a password.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Link inválido</h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.7, marginBottom: 24 }}>
          O link que abriu não tem um token de reposição. Solicite um novo email.
        </p>
        <Link href="/esqueci-password" className="btn-primary" style={{ textDecoration: 'none' }}>
          Pedir novo link
        </Link>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Nova password</h2>
      <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24, lineHeight: 1.6 }}>
        Escolha uma password forte. Será automaticamente autenticado.
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="field-label">Nova password</label>
          <input className="field-input" type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres" required minLength={8} autoFocus autoComplete="new-password" />
        </div>
        <div>
          <label className="field-label">Confirmar password</label>
          <input className="field-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Repita a password" required autoComplete="new-password" />
        </div>
        {error && <div className="alert-error">{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? 'A guardar…' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={16} strokeWidth={2.5} /> Definir password e entrar</span>}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-3)', fontSize: 14 }}>
        <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 700 }}>Voltar ao login</Link>
      </p>
    </div>
  )
}

export default function ResetPassword() {
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
        </div>

        <Suspense fallback={<div className="auth-card"><p className="loading">A carregar…</p></div>}>
          <ResetPasswordInner />
        </Suspense>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}>
          <Lock size={12} strokeWidth={2.25} /> Dados protegidos e encriptados · RGPD compliant
        </p>
      </div>
    </div>
  )
}
