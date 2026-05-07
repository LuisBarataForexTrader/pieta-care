'use client'
import { useEffect, useRef, useState } from 'react'
import { LifeBuoy, Send, ArrowLeft, Trash2, Phone, Mail, Sparkles, Crown } from 'lucide-react'
import { api } from '@/lib/api'
import type { SupportHousehold, SupportMessage } from '@/lib/types'

const POLL_MS = 8000

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}
function fmtRelative(iso: string | null) {
  if (!iso) return '—'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`
  const d = Math.floor(diff / 86400)
  if (d < 7) return `há ${d} dia${d > 1 ? 's' : ''}`
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}

const PLAN_LABEL: Record<string, string> = {
  familia: 'Família',
  familia_plus: 'Família+',
  cuidador_pro: 'Família AI',
}

export default function AdminSuportePage() {
  const [households, setHouseholds] = useState<SupportHousehold[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [meId, setMeId] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Initial load + thread polling
  useEffect(() => {
    let alive = true
    let timer: number | undefined

    async function loadHouseholds() {
      try {
        const me = await api.me()
        if (!alive) return
        setMeId(me.id)
        if (!me.is_admin) {
          setAuthError(true)
          setLoading(false)
          return
        }
        const list = await api.adminListSupportHouseholds()
        if (!alive) return
        setHouseholds(list)
        // Auto-select first thread on desktop only — mobile shows the list first
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 769
        if (selectedId === null && isDesktop) {
          const first = list.flatMap(h => h.members)[0]
          if (first) setSelectedId(first.thread_id)
        }
        setLoading(false)
      } catch (e) {
        if (!alive) return
        const msg = e instanceof Error ? e.message : 'Erro'
        if (msg.toLowerCase().includes('administrador') || msg.toLowerCase().includes('forbidden')) {
          setAuthError(true)
        } else {
          setError(msg)
        }
        setLoading(false)
      }
    }

    function schedule() {
      timer = window.setTimeout(async () => {
        if (!alive || authError) return
        try {
          const list = await api.adminListSupportHouseholds()
          if (alive) setHouseholds(list)
        } catch { /* polling errors stay silent */ }
        if (alive) schedule()
      }, POLL_MS)
    }

    loadHouseholds().then(() => { if (alive) schedule() })

    return () => {
      alive = false
      if (timer) window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load messages when thread changes
  useEffect(() => {
    if (!selectedId) { setMessages([]); return }
    let alive = true
    let timer: number | undefined
    let consecutiveFailures = 0

    async function loadMsgs(initial = false) {
      try {
        const data = await api.adminGetSupportThread(selectedId!)
        if (!alive) return
        setMessages(data.messages)
        setHouseholds(prev => prev.map(h => ({
          ...h,
          members: h.members.map(m => m.thread_id === selectedId ? { ...m, admin_unread: 0 } : m),
          total_admin_unread: h.members.reduce(
            (sum, m) => sum + (m.thread_id === selectedId ? 0 : m.admin_unread), 0
          ),
        })))
        consecutiveFailures = 0
        if (error) setError('')
      } catch (e) {
        if (!alive) return
        consecutiveFailures += 1
        // Only surface the error to the user if the initial load fails or
        // if many polls in a row fail (transient blips are common during
        // deploys / network hiccups and shouldn't disrupt the admin)
        if (initial || consecutiveFailures >= 3) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar thread')
        }
      }
    }

    function schedule() {
      timer = window.setTimeout(async () => {
        if (!alive) return
        await loadMsgs(false)
        if (alive) schedule()
      }, POLL_MS)
    }

    loadMsgs(true).then(() => { if (alive) schedule() })

    return () => {
      alive = false
      if (timer) window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, selectedId])

  async function deleteOwnMessage(msgId: number) {
    if (!confirm('Apagar esta mensagem? O cliente deixará de a ver.')) return
    try {
      await api.adminDeleteSupportMessage(msgId)
      setMessages(prev => prev.filter(m => m.id !== msgId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao apagar mensagem')
    }
  }

  async function reply(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !input.trim() || sending) return
    setSending(true)
    setError('')
    const text = input.trim()
    setInput('')
    try {
      const msg = await api.adminReplySupport(selectedId, text)
      setMessages(prev => [...prev, msg])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar')
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-3)' }}>A carregar…</div>
  }

  if (authError) {
    return (
      <div>
        <div className="page-top">
          <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <LifeBuoy size={20} strokeWidth={2} /> Painel de Suporte
          </div>
        </div>
        <div className="page-body" style={{ maxWidth: 480 }}>
          <div className="alert-error">Esta página é exclusiva para administradores.</div>
        </div>
      </div>
    )
  }

  // Find the selected member + their household across all households
  let selectedHousehold: SupportHousehold | null = null
  let selected: SupportHousehold['members'][number] | null = null
  for (const h of households) {
    const m = h.members.find(m => m.thread_id === selectedId)
    if (m) { selectedHousehold = h; selected = m; break }
  }

  const totalThreads = households.reduce((s, h) => s + h.members.length, 0)
  const totalUnread = households.reduce((s, h) => s + h.total_admin_unread, 0)

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <LifeBuoy size={20} strokeWidth={2} /> Painel de Suporte
          </div>
          <div className="page-subtitle">
            {households.length} {households.length === 1 ? 'cliente' : 'clientes'}
            {totalThreads > 0 && <> · {totalThreads} conversa{totalThreads !== 1 ? 's' : ''}</>}
            {totalUnread > 0 && <> · <span style={{ color: '#EF4444', fontWeight: 700 }}>{totalUnread} por ler</span></>}
          </div>
        </div>
      </div>

      <div className="page-body admin-support-body">
        <div className="admin-support-grid">

          {/* Household list */}
          <div className={`card admin-support-list${selectedId ? ' admin-support-list-hidden-mobile' : ''}`} style={{ padding: 0, overflowY: 'auto' }}>
            {households.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-state-icon" style={{ color: 'var(--text-3)' }}><LifeBuoy size={32} strokeWidth={1.4} /></div>
                <div className="empty-state-title">Sem conversas</div>
              </div>
            ) : (
              households.map((h, hi) => (
                <div key={h.owner_user_id} style={{ borderBottom: hi < households.length - 1 ? '6px solid var(--bg)' : 'none' }}>
                  {/* Household header */}
                  <div className="household-header">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <Crown size={12} strokeWidth={2.25} style={{ color: '#D69E2E', flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.owner_name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', lineHeight: 1.4 }}>
                          {h.owner_phone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Phone size={10} strokeWidth={2.25} /> {h.owner_phone}</span>}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                            <Mail size={10} strokeWidth={2.25} /> {h.owner_email}
                          </span>
                        </div>
                        <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {h.subscription_plan === 'cuidador_pro' && (
                            <span className="household-plan-pill" style={{ background: 'linear-gradient(135deg, #9F7AEA 0%, #7C3AED 100%)', color: '#fff' }}>
                              <Sparkles size={9} strokeWidth={2.5} /> {PLAN_LABEL[h.subscription_plan]}
                            </span>
                          )}
                          {h.subscription_plan && h.subscription_plan !== 'cuidador_pro' && (
                            <span className="household-plan-pill" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>{PLAN_LABEL[h.subscription_plan] ?? h.subscription_plan}</span>
                          )}
                          {!h.subscription_plan && h.subscription_status === 'trial' && (
                            <span className="household-plan-pill" style={{ background: '#FFF7E6', color: '#B7791F' }}>Trial</span>
                          )}
                          {h.subscription_status && h.subscription_status !== 'trial' && (
                            <span className="household-plan-pill" style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>{h.subscription_status}</span>
                          )}
                          {h.elderly_names.map(name => (
                            <span key={name} className="household-plan-pill" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>{name}</span>
                          ))}
                        </div>
                      </div>
                      {h.total_admin_unread > 0 && (
                        <span className="nav-badge" style={{ marginLeft: 0, marginTop: 2 }}>
                          {h.total_admin_unread > 99 ? '99+' : h.total_admin_unread}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Members of this household */}
                  {h.members.map(m => (
                    <div
                      key={m.thread_id}
                      onClick={() => setSelectedId(m.thread_id)}
                      className={`household-member${selectedId === m.thread_id ? ' selected' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="household-member-avatar" style={{ background: m.is_owner ? 'var(--brand)' : 'var(--text-2)' }}>
                          {(m.user_name[0] || '?').toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.user_name}</span>
                            <span style={{ fontSize: 10, color: m.is_owner ? '#D69E2E' : 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
                              {m.is_owner ? 'titular' : 'familiar'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.last_message_preview ?? m.user_email}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                            {fmtRelative(m.last_message_at)}
                          </div>
                        </div>
                        {m.admin_unread > 0 && (
                          <span className="nav-badge" style={{ marginLeft: 0 }}>
                            {m.admin_unread > 99 ? '99+' : m.admin_unread}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Conversation */}
          <div className={`card admin-support-detail${!selectedId ? ' admin-support-detail-hidden-mobile' : ''}`} style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            {!selected ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                Selecciona uma conversa
              </div>
            ) : (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="admin-support-back"
                    aria-label="Voltar à lista"
                  >
                    <ArrowLeft size={18} strokeWidth={2.25} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{selected.user_name}</span>
                      <span style={{ fontSize: 10, color: selected.is_owner ? '#D69E2E' : 'var(--text-3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {selected.is_owner ? '👑 titular' : 'familiar'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Mail size={10} strokeWidth={2.25} /> {selected.user_email}
                      </span>
                      {selected.user_phone && (
                        <a href={`tel:${selected.user_phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--brand)', textDecoration: 'none' }}>
                          <Phone size={10} strokeWidth={2.25} /> {selected.user_phone}
                        </a>
                      )}
                      {!selected.is_owner && selectedHousehold && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Crown size={10} strokeWidth={2.25} style={{ color: '#D69E2E' }} />
                          família de <strong>{selectedHousehold.owner_name}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                  {messages.map(m => {
                    const own = m.sender_id === meId && m.is_admin_reply
                    return (
                      <div key={m.id} className={`chat-row ${own ? 'chat-row-own' : ''}`}>
                        {!own && (
                          <div className="chat-avatar">
                            {(m.sender_name[0] || '?').toUpperCase()}
                          </div>
                        )}
                        <div className={`chat-bubble chat-bubble-deletable ${own ? 'chat-bubble-own' : ''}`} style={{ maxWidth: '78%' }}>
                          <div className="chat-sender" style={{ color: m.is_admin_reply ? '#7C3AED' : 'var(--brand)' }}>
                            {m.is_admin_reply ? `${m.sender_name} (suporte)` : m.sender_name}
                          </div>
                          <div className="chat-content">{m.content}</div>
                          <div className="chat-time">{fmtTime(m.created_at)}</div>
                          {m.is_admin_reply && (
                            <button
                              type="button"
                              onClick={() => deleteOwnMessage(m.id)}
                              className="chat-bubble-trash"
                              title="Apagar mensagem"
                              aria-label="Apagar mensagem"
                            >
                              <Trash2 size={13} strokeWidth={2.25} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {error && <div className="alert-error" style={{ margin: '0 14px 8px' }}>{error}</div>}
                <form onSubmit={reply} className="chat-composer" style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Responder ao cliente…"
                    disabled={sending}
                    maxLength={4000}
                    className="chat-input"
                  />
                  <button type="submit" disabled={!input.trim() || sending} className="chat-send">
                    {sending ? '…' : <Send size={16} strokeWidth={2.25} />}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
