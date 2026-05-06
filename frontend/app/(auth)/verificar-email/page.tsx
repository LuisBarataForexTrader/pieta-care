'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Leaf, Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react'
import { api, setToken, setElderlyId } from '@/lib/api'

function VerificarEmailInner() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'notoken'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) { setStatus('notoken'); return }
    api.verifyEmail(token)
      .then(async res => {
        setToken(res.access_token)
        const list = await api.listElderly()
        if (list.length > 0) setElderlyId(list[0].id)
        setStatus('success')
        setTimeout(() => router.replace('/dashboard'), 1800)
      })
      .catch(err => {
        setErrorMsg(err instanceof Error ? err.message : 'Link inválido ou já utilizado')
        setStatus('error')
      })
  }, [token, router])

  return (
    <div className="auth-card" style={{ textAlign: 'center' }}>
      {status === 'loading' && (
        <>
          <div style={{ width: 60, height: 60, margin: '0 auto 16px', borderRadius: 16, background: 'var(--brand-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={28} strokeWidth={1.75} style={{ color: 'var(--brand)', animation: 'spin 1s linear infinite' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>A verificar o seu email…</h2>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </>
      )}
      {status === 'success' && (
        <>
          <div style={{ width: 60, height: 60, margin: '0 auto 16px', borderRadius: 16, background: 'var(--success-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={32} strokeWidth={1.75} style={{ color: 'var(--success)' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>Email confirmado!</h2>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>A redirecionar para o dashboard…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div style={{ width: 60, height: 60, margin: '0 auto 16px', borderRadius: 16, background: 'var(--danger-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={32} strokeWidth={1.75} style={{ color: 'var(--danger)' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>Link inválido</h2>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>{errorMsg}</p>
          <Link href="/register">
            <button className="btn-primary" style={{ width: 'auto', padding: '12px 32px' }}>Criar nova conta</button>
          </Link>
        </>
      )}
      {status === 'notoken' && (
        <>
          <div style={{ width: 60, height: 60, margin: '0 auto 16px', borderRadius: 16, background: 'var(--brand-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={28} strokeWidth={1.75} style={{ color: 'var(--brand)' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>Verifique o seu email</h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>
            Enviámos um link de confirmação para o seu endereço de email. Por favor, clique no link para activar a sua conta.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 16 }}>O link expira em 24 horas.</p>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 14 }}>Ir para o login</Link>
          </div>
        </>
      )}
    </div>
  )
}

export default function VerificarEmail() {
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
        </div>
        <Suspense fallback={<div className="auth-card" style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>⏳</div></div>}>
          <VerificarEmailInner />
        </Suspense>
      </div>
    </div>
  )
}
