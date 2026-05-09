'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api, setToken, setElderlyId } from '@/lib/api'

export default function AcceptInvite() {
  const router = useRouter()
  const { token } = useParams<{ token: string }>()
  const [form, setForm] = useState({ full_name: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.acceptInvite(token, form.password, form.full_name)
      setToken(res.access_token)
      // Always use the elderly_id from the invite - don't depend on first
      // listElderly() result, which could be a different profile if the
      // invitee already had their own.
      setElderlyId(res.elderly_id)
      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Convite inválido ou expirado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>💌</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Aceitar convite</h1>
        <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>Crie a sua conta para aceder ao perfil familiar</p>
      </div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="label">O seu nome</label>
          <input className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Nome completo" required />
        </div>
        <div>
          <label className="label">Escolhe uma password</label>
          <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 8 caracteres" required minLength={8} />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 14, textAlign: 'center' }}>{error}</p>}
        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'A entrar…' : 'Juntar à família →'}
        </button>
      </form>
    </div>
  )
}
