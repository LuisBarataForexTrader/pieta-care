'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Leaf, Mail, ArrowLeft, ArrowRight, Lock } from 'lucide-react'
import { api } from '@/lib/api'

export default function EsqueciPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.forgotPassword(email)
      setSent(true)
    } catch (err: unknown) {
      // We still claim success even on error to avoid leaking which
      // emails are registered, but if there was a network/server error
      // we surface it.
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o email. Tente novamente.')
    } finally {
      setLoading(false)
    }
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
        </div>

        <div className="auth-card">
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 60, height: 60, margin: '0 auto 16px',
                borderRadius: 16, background: 'var(--brand-light)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Mail size={28} strokeWidth={1.75} style={{ color: 'var(--brand)' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>Verifique o seu email</h2>
              <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 8 }}>
                Se o email <strong style={{ color: 'var(--brand)' }}>{email}</strong> está registado, enviámos um link para repor a password.
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 24 }}>
                O link expira em 1 hora. Se não vir o email, verifique também a pasta de spam.
              </p>
              <Link
                href="/login"
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', textDecoration: 'none' }}
              >
                <ArrowLeft size={14} strokeWidth={2.25} /> Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Repor password</h2>
              <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24, lineHeight: 1.6 }}>
                Indique o email da sua conta — enviamos um link para criar uma nova password.
              </p>
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="field-label">Email</label>
                  <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="o_seu@email.com" required autoComplete="email" autoFocus />
                </div>
                {error && <div className="alert-error">{error}</div>}
                <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? 'A enviar…' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>Enviar link <ArrowRight size={16} strokeWidth={2.5} /></span>}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-3)', fontSize: 14 }}>
                Lembrou-se?{' '}
                <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 700 }}>Voltar ao login</Link>
              </p>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}>
          <Lock size={12} strokeWidth={2.25} /> Dados protegidos e encriptados · RGPD compliant
        </p>
      </div>
    </div>
  )
}
