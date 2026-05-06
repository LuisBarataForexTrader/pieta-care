'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>A verificar o seu email…</h2>
        </>
      )}
      {status === 'success' && (
        <>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Email confirmado!</h2>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>A redirecionar para o dashboard…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div style={{ fontSize: 52, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Link inválido</h2>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>{errorMsg}</p>
          <Link href="/register">
            <button className="btn-primary" style={{ width: 'auto', padding: '12px 32px' }}>Criar nova conta</button>
          </Link>
        </>
      )}
      {status === 'notoken' && (
        <>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Verifique o seu email</h2>
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
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand)', letterSpacing: '-0.5px' }}>pieta.care</h1>
        </div>
        <Suspense fallback={<div className="auth-card" style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>⏳</div></div>}>
          <VerificarEmailInner />
        </Suspense>
      </div>
    </div>
  )
}
