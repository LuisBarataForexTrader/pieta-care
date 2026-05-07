'use client'
import { useEffect, useRef, useState } from 'react'
import { LifeBuoy, Send } from 'lucide-react'
import { api } from '@/lib/api'
import type { SupportMessage } from '@/lib/types'

const POLL_MS = 5000
const POLL_MS_HIDDEN = 60000

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(iso: string) {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d >= today) return 'Hoje'
  if (d >= yesterday) return 'Ontem'
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function SuportePage() {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [meId, setMeId] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<SupportMessage[]>([])

  useEffect(() => { messagesRef.current = messages }, [messages])

  useEffect(() => {
    let alive = true
    let timer: number | undefined

    async function refresh(initial = false) {
      try {
        if (initial) {
          const me = await api.me()
          if (!alive) return
          setMeId(me.id)
        }
        const msgs = await api.listSupportMessages()
        if (!alive) return
        if (initial || msgs.length !== messagesRef.current.length) {
          setMessages(msgs)
        }
        if (initial) setLoading(false)
      } catch (e) {
        if (!alive) return
        if (initial) setLoading(false)
        setError(e instanceof Error ? e.message : 'Erro ao carregar mensagens')
      }
    }

    function schedule() {
      const delay = document.visibilityState === 'visible' ? POLL_MS : POLL_MS_HIDDEN
      timer = window.setTimeout(async () => {
        await refresh(false)
        if (alive) schedule()
      }, delay)
    }

    refresh(true).then(() => { if (alive) schedule() })

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh(false)
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      alive = false
      if (timer) window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    setError('')
    const text = input.trim()
    setInput('')
    try {
      const msg = await api.sendSupportMessage(text)
      setMessages(prev => [...prev, msg])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar')
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  const groups: { date: string; messages: SupportMessage[] }[] = []
  for (const m of messages) {
    const day = fmtDate(m.created_at)
    if (groups.length === 0 || groups[groups.length - 1].date !== day) {
      groups.push({ date: day, messages: [m] })
    } else {
      groups[groups.length - 1].messages.push(m)
    }
  }

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <LifeBuoy size={20} strokeWidth={2} /> Suporte pieta.care
          </div>
          <div className="page-subtitle">Pagamentos, bugs, dúvidas — respondemos em poucas horas</div>
        </div>
      </div>

      <div className="page-body chat-page-body" style={{ maxWidth: 760 }}>
        <div ref={scrollRef} className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 4px 16px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>A carregar…</p>
          ) : messages.length === 0 ? (
            <div className="empty-state" style={{ padding: 48 }}>
              <div className="empty-state-icon" style={{ color: 'var(--text-3)' }}><LifeBuoy size={42} strokeWidth={1.4} /></div>
              <div className="empty-state-title">Conversa com a equipa pieta.care</div>
              <div className="empty-state-text">Escreve a tua dúvida ou problema abaixo. Respondemos rapidamente — vais receber um email quando responderemos.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {groups.map((g, gi) => (
                <div key={gi}>
                  <div className="chat-day-divider">{g.date}</div>
                  {g.messages.map((m) => {
                    const own = m.sender_id === meId && !m.is_admin_reply
                    return (
                      <div key={m.id} className={`chat-row ${own ? 'chat-row-own' : ''}`}>
                        {!own && (
                          <div className="chat-avatar" style={{ background: m.is_admin_reply ? '#7C3AED' : 'var(--brand)' }}>
                            {m.is_admin_reply ? 'P' : (m.sender_name[0] || '?').toUpperCase()}
                          </div>
                        )}
                        <div className={`chat-bubble ${own ? 'chat-bubble-own' : ''}`}>
                          {!own && (
                            <div className="chat-sender" style={{ color: m.is_admin_reply ? '#7C3AED' : 'var(--brand)' }}>
                              {m.is_admin_reply ? 'pieta.care · suporte' : m.sender_name}
                            </div>
                          )}
                          <div className="chat-content">{m.content}</div>
                          <div className="chat-time">{fmtTime(m.created_at)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="alert-error" style={{ marginBottom: 8 }}>{error}</div>}

        <form onSubmit={send} className="chat-composer">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escreve a tua questão…"
            disabled={sending}
            maxLength={4000}
            className="chat-input"
          />
          <button type="submit" disabled={!input.trim() || sending} className="chat-send">
            {sending ? '…' : <Send size={16} strokeWidth={2.25} />}
          </button>
        </form>
      </div>
    </div>
  )
}
