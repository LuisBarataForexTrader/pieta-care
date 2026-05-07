'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, Sparkles, ArrowRight } from 'lucide-react'
import { api, getElderlyId } from '@/lib/api'
import type { ChatMessage } from '@/lib/types'

const POLL_MS = 3000
const POLL_MS_HIDDEN = 30000

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d >= today) return 'Hoje'
  if (d >= yesterday) return 'Ontem'
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
}
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [meId, setMeId] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paywall, setPaywall] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const elderlyId = getElderlyId()

  // Initial load + polling
  useEffect(() => {
    if (!elderlyId) return
    let alive = true
    let timer: number | undefined

    async function refresh(initial = false) {
      try {
        if (initial) {
          const me = await api.me()
          if (!alive) return
          setMeId(me.id)
          const msgs = await api.listChat(elderlyId!)
          if (!alive) return
          setMessages(msgs)
          setLoading(false)
          if (msgs.length > 0) {
            await api.markChatRead(elderlyId!, msgs[msgs.length - 1].id).catch(() => {})
          }
        } else {
          const lastId = messagesRef.current[messagesRef.current.length - 1]?.id
          const fresh = await api.listChat(elderlyId!, lastId)
          if (!alive || fresh.length === 0) return
          setMessages(prev => [...prev, ...fresh])
          await api.markChatRead(elderlyId!, fresh[fresh.length - 1].id).catch(() => {})
        }
      } catch (e) {
        if (!alive) return
        const msg = e instanceof Error ? e.message : 'Erro'
        if (msg.toLowerCase().includes('família ai') || msg.toLowerCase().includes('upgrade')) {
          setPaywall(true)
          setLoading(false)
        } else {
          setError(msg)
          setLoading(false)
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elderlyId])

  // Keep a ref of latest messages so the polling closure sees them
  const messagesRef = useRef<ChatMessage[]>([])
  useEffect(() => { messagesRef.current = messages }, [messages])

  // Autoscroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId || !input.trim() || sending) return
    setSending(true)
    setError('')
    const text = input.trim()
    setInput('')
    try {
      const msg = await api.sendChat(elderlyId, text)
      setMessages(prev => [...prev, msg])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar')
      setInput(text)  // restore input
    } finally {
      setSending(false)
    }
  }

  // Group messages by day
  const groups: { date: string; messages: ChatMessage[] }[] = []
  for (const m of messages) {
    const day = fmtDate(m.created_at)
    if (groups.length === 0 || groups[groups.length - 1].date !== day) {
      groups.push({ date: day, messages: [m] })
    } else {
      groups[groups.length - 1].messages.push(m)
    }
  }

  if (paywall) {
    return (
      <div>
        <div className="page-top">
          <div>
            <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <MessageCircle size={20} strokeWidth={2} /> Chat familiar
            </div>
            <div className="page-subtitle">Coordenar cuidados em tempo real com a sua família</div>
          </div>
        </div>
        <div className="page-body" style={{ maxWidth: 640 }}>
          <div className="card card-lg" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F2FF 100%)', border: '1.5px solid #C7B8FF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #9F7AEA 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Sparkles size={22} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Disponível no plano Família AI</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>O chat familiar está incluído no plano mais completo</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
              Coordene os cuidados em tempo real com toda a família — quem deu a medicação, quem
              vai à consulta amanhã, dúvidas e observações partilhadas instantaneamente, num
              espaço privado para o vosso familiar.
            </p>
            <Link href="/conta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 20px', background: 'linear-gradient(135deg, #9F7AEA 0%, #7C3AED 100%)', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Fazer upgrade <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <MessageCircle size={20} strokeWidth={2} /> Chat familiar
          </div>
          <div className="page-subtitle">Coordenar cuidados em tempo real com a sua família</div>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 160px)', maxHeight: 'calc(100dvh - 160px)' }}>
        <div ref={scrollRef} className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 4px 16px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>A carregar mensagens…</p>
          ) : messages.length === 0 ? (
            <div className="empty-state" style={{ padding: 48 }}>
              <div className="empty-state-icon" style={{ color: 'var(--text-3)' }}><MessageCircle size={42} strokeWidth={1.4} /></div>
              <div className="empty-state-title">Ainda não há mensagens</div>
              <div className="empty-state-text">Comece a conversa com a sua família abaixo</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {groups.map((g, gi) => (
                <div key={gi}>
                  <div className="chat-day-divider">{g.date}</div>
                  {g.messages.map((m, mi) => {
                    const own = m.sender_id === meId
                    const prev = mi > 0 ? g.messages[mi - 1] : null
                    const showSender = !own && (!prev || prev.sender_id !== m.sender_id)
                    return (
                      <div key={m.id} className={`chat-row ${own ? 'chat-row-own' : ''}`}>
                        {!own && (
                          <div className="chat-avatar" style={{ visibility: showSender ? 'visible' : 'hidden' }}>
                            {initials(m.sender_name)}
                          </div>
                        )}
                        <div className={`chat-bubble ${own ? 'chat-bubble-own' : ''}`}>
                          {showSender && <div className="chat-sender">{m.sender_name}</div>}
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
            placeholder="Escrever mensagem…"
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
