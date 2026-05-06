'use client'
import { useEffect, useState } from 'react'
import { Users, Mail, Lock, Trash2 } from 'lucide-react'
import { api, getElderlyId } from '@/lib/api'
import type { Elderly, FamilyMember } from '@/lib/types'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

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
    setSent(false)
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
    if (!elderlyId || !confirm(`Remover ${member.full_name ?? member.invited_email}?`)) return
    await api.removeFamilyMember(elderlyId, member.id)
    await load()
  }

  const members = elderly?.family_members ?? []
  const active = members.filter(m => m.is_accepted)
  const pending = members.filter(m => !m.is_accepted)

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><Users size={20} strokeWidth={2} /> Família</div>
          <div className="page-subtitle">{active.length} membro{active.length !== 1 ? 's' : ''} activo{active.length !== 1 ? 's' : ''}{pending.length > 0 ? ` · ${pending.length} convite${pending.length !== 1 ? 's' : ''} pendente${pending.length !== 1 ? 's' : ''}` : ''}</div>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* Members list */}
          <div>
            {members.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon" style={{ color: 'var(--text-3)' }}><Users size={42} strokeWidth={1.4} /></div>
                  <div className="empty-state-title">Ainda não há membros</div>
                  <div className="empty-state-text">Convida familiares para acompanharem os cuidados em conjunto</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {active.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                      Membros activos ({active.length})
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      {active.map((m, i) => (
                        <div key={m.id} className="member-item" style={{ padding: '16px 20px', borderBottom: i < active.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div className="member-avatar">
                            {m.full_name ? initials(m.full_name) : m.invited_email[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{m.full_name ?? m.invited_email}</div>
                            {m.full_name && <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{m.invited_email}</div>}
                            <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                              {m.relation && (
                                <span className="pill" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>{m.relation}</span>
                              )}
                              <span className="pill pill-taken">Activo</span>
                            </div>
                          </div>
                          <button onClick={() => remove(m)} className="btn-danger-ghost" title="Remover"><Trash2 size={15} strokeWidth={2} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pending.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                      Convites pendentes ({pending.length})
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      {pending.map((m, i) => (
                        <div key={m.id} className="member-item" style={{ padding: '16px 20px', borderBottom: i < pending.length - 1 ? '1px solid var(--border)' : 'none', opacity: 0.75 }}>
                          <div className="member-avatar" style={{ background: 'var(--bg)' }}>
                            {m.invited_email[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{m.invited_email}</div>
                            {m.relation && <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{m.relation}</div>}
                            <span className="pill pill-pending" style={{ marginTop: 5 }}>Aguarda aceitação</span>
                          </div>
                          <button onClick={() => remove(m)} className="btn-danger-ghost" title="Cancelar convite"><Trash2 size={15} strokeWidth={2} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Invite form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card card-lg">
              <div className="section-title" style={{ marginBottom: 16 }}><Mail size={16} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Convidar familiar</div>
              <form onSubmit={invite} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="field-label">Email</label>
                  <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" required />
                </div>
                <div>
                  <label className="field-label">Relação (opcional)</label>
                  <input className="field-input" value={relation} onChange={e => setRelation(e.target.value)} placeholder="Ex: Filha, Neto…" />
                </div>
                {error && <div className="alert-error">{error}</div>}
                {sent && <div className="alert-success">✓ Convite enviado com sucesso!</div>}
                <button className="btn-primary" type="submit" disabled={sending}>
                  {sending ? 'A enviar…' : 'Enviar convite'}
                </button>
              </form>
            </div>

            <div className="card" style={{ background: 'var(--brand-light)', border: '1px solid rgba(42,96,73,0.15)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Lock size={13} strokeWidth={2.25} /> Partilha segura</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                O familiar convidado receberá um email para criar a sua conta e aceder à informação do doente. Pode remover o acesso a qualquer momento.
              </div>
            </div>
          </div>
        </div>

        <style>{`@media(max-width:900px){.familia-grid{grid-template-columns:1fr!important}}`}</style>
      </div>
    </div>
  )
}
