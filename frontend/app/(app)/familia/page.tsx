'use client'
import { useEffect, useState } from 'react'
import { api, getElderlyId } from '@/lib/api'
import type { Elderly, FamilyMember } from '@/lib/types'

export default function FamiliaPage() {
  const [elderly, setElderly] = useState<Elderly | null>(null)
  const [email, setEmail] = useState('')
  const [relation, setRelation] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const elderlyId = getElderlyId()

  async function load() {
    if (!elderlyId) return
    const list = await api.listElderly()
    setElderly(list.find(e => e.id === elderlyId) ?? list[0] ?? null)
  }

  useEffect(() => { load() }, [elderlyId])

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    setSending(true)
    setError('')
    try {
      await api.inviteFamily(elderlyId, email, relation || undefined)
      setSent(true)
      setEmail('')
      setRelation('')
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar convite')
    } finally {
      setSending(false)
    }
  }

  async function remove(member: FamilyMember) {
    if (!elderlyId || !confirm(`Remover ${member.invited_email}?`)) return
    await api.removeFamilyMember(elderlyId, member.id)
    await load()
  }

  const members = elderly?.family_members ?? []

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Família</h1>
      </div>

      <div style={{ padding: 16 }}>
        {/* invite form */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>Convidar familiar</h2>
          <form onSubmit={invite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" required />
            </div>
            <div>
              <label className="label">Relação (opcional)</label>
              <input className="input" value={relation} onChange={e => setRelation(e.target.value)} placeholder="Ex: Filha, Neto…" />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14, margin: 0 }}>{error}</p>}
            {sent && <p style={{ color: 'var(--success)', fontSize: 14, margin: 0 }}>✓ Convite enviado!</p>}
            <button className="btn-primary" type="submit" disabled={sending}>
              {sending ? 'A enviar…' : 'Enviar convite'}
            </button>
          </form>
        </div>

        {/* members list */}
        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
          Membros ({members.length})
        </p>

        {members.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>
            Ainda não há membros da família. Convida alguém!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map(m => (
              <div key={m.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{m.full_name ?? m.invited_email}</div>
                  {m.full_name && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{m.invited_email}</div>}
                  <div style={{ fontSize: 12, marginTop: 4, display: 'flex', gap: 6 }}>
                    {m.relation && (
                      <span style={{ background: 'var(--sage-light)', color: 'var(--sage-dark)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                        {m.relation}
                      </span>
                    )}
                    <span style={{
                      background: m.is_accepted ? '#DCFCE7' : '#FEF9C3',
                      color: m.is_accepted ? '#16A34A' : '#92400E',
                      padding: '2px 8px',
                      borderRadius: 99,
                      fontWeight: 600,
                    }}>
                      {m.is_accepted ? 'Activo' : 'Pendente'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => remove(m)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
