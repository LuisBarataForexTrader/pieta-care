'use client'
import { useEffect, useRef, useState } from 'react'
import { LifeBuoy, Send, ArrowLeft, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { SupportThread, SupportMessage } from '@/lib/types'

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

export default function AdminSuportePage() {
  const [threads, setThreads] = useState<SupportThread[]>([])
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

    async function loadThreads() {
      try {
        const me = await api.me()
        if (!alive) return
        setMeId(me.id)
        if (!me.is_admin) {
          setAuthError(true)
          setLoading(false)
          return
        }
        const list = await api.adminListSupportThreads()
        if (!alive) return
        setThreads(list)
        // Auto-select on desktop only — mobile shows the list first
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 769
        if (selectedId === null && list.length > 0 && isDesktop) {
          setSelectedId(list[0].id)
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
          const list = await api.adminListSupportThreads()
          if (alive) setThreads(list)
        } catch { /* polling errors stay silent */ }
        if (alive) schedule()
      }, POLL_MS)
    }

    loadThreads().then(() => { if (alive) schedule() })

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
        setThreads(prev => prev.map(t => t.id === selectedId ? { ...t, admin_unread: 0 } : t))
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

  const selected = threads.find(t => t.id === selectedId)

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <LifeBuoy size={20} strokeWidth={2} /> Painel de Suporte
          </div>
          <div className="page-subtitle">{threads.length} conversa{threads.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="page-body admin-support-body">
        <div className="admin-support-grid">

          {/* Thread list */}
          <div className={`card admin-support-list${selectedId ? ' admin-support-list-hidden-mobile' : ''}`} style={{ padding: 0, overflowY: 'auto' }}>
            {threads.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-state-icon" style={{ color: 'var(--text-3)' }}><LifeBuoy size={32} strokeWidth={1.4} /></div>
                <div className="empty-state-title">Sem conversas</div>
              </div>
            ) : (
              threads.map((t, i) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: i < threads.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    background: selectedId === t.id ? 'var(--brand-light)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (selectedId !== t.id) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selectedId === t.id ? 'var(--brand-light)' : 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.user_name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.last_message_preview ?? t.user_email}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                        {fmtRelative(t.last_message_at)}
                      </div>
                    </div>
                    {t.admin_unread > 0 && (
                      <span className="nav-badge" style={{ marginLeft: 0 }}>{t.admin_unread > 99 ? '99+' : t.admin_unread}</span>
                    )}
                  </div>
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
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.user_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{selected.user_email}</div>
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
