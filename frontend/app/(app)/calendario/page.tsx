'use client'
import { useEffect, useState } from 'react'
import { api, getElderlyId } from '@/lib/api'
import type { CalendarEvent, Task } from '@/lib/types'

function fmtEventDate(iso: string) {
  const d = new Date(iso)
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('pt-PT', { month: 'short' }),
    time: d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    full: d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }),
  }
}

export default function CalendarioPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [tab, setTab] = useState<'eventos' | 'tarefas'>('eventos')
  const [showForm, setShowForm] = useState(false)
  const [eForm, setEForm] = useState({ title: '', starts_at: '', location: '', description: '' })
  const [tForm, setTForm] = useState({ title: '', due_date: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const elderlyId = getElderlyId()

  async function load() {
    if (!elderlyId) return
    const [ev, tk] = await Promise.all([api.listEvents(elderlyId), api.listTasks(elderlyId)])
    setEvents(ev.sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    setTasks(tk)
  }

  useEffect(() => { load() }, [elderlyId])

  async function saveEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    setSaving(true)
    setError('')
    try {
      await api.createEvent(elderlyId, { ...eForm, ends_at: undefined })
      setEForm({ title: '', starts_at: '', location: '', description: '' })
      setShowForm(false)
      await load()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro') }
    finally { setSaving(false) }
  }

  async function saveTask(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    setSaving(true)
    setError('')
    try {
      await api.createTask(elderlyId, { ...tForm, due_date: tForm.due_date || undefined })
      setTForm({ title: '', due_date: '', description: '' })
      setShowForm(false)
      await load()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro') }
    finally { setSaving(false) }
  }

  async function toggleTask(task: Task) {
    if (!elderlyId) return
    await api.updateTask(elderlyId, task.id, { is_completed: !task.is_completed })
    await load()
  }

  async function delEvent(id: number) {
    if (!elderlyId || !confirm('Apagar evento?')) return
    await api.deleteEvent(elderlyId, id)
    await load()
  }

  async function delTask(id: number) {
    if (!elderlyId || !confirm('Apagar tarefa?')) return
    await api.deleteTask(elderlyId, id)
    await load()
  }

  const pendingTasks = tasks.filter(t => !t.is_completed)
  const doneTasks = tasks.filter(t => t.is_completed)
  const upcomingEvents = events.filter(e => new Date(e.starts_at) >= new Date())
  const pastEvents = events.filter(e => new Date(e.starts_at) < new Date())

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title">📅 Agenda</div>
          <div className="page-subtitle">{upcomingEvents.length} consulta{upcomingEvents.length !== 1 ? 's' : ''} · {pendingTasks.length} tarefa{pendingTasks.length !== 1 ? 's' : ''} pendente{pendingTasks.length !== 1 ? 's' : ''}</div>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setError('') }}
          className={showForm ? 'btn-ghost' : 'btn-primary'}
          style={{ width: 'auto', padding: '10px 20px' }}
        >
          {showForm ? '✕ Cancelar' : '+ Adicionar'}
        </button>
      </div>

      <div className="page-body">
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
          {(['eventos', 'tarefas'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? 'var(--brand)' : 'transparent',
                border: 'none',
                borderRadius: 9,
                padding: '8px 20px',
                fontWeight: 700,
                color: tab === t ? 'white' : 'var(--text-3)',
                cursor: 'pointer',
                fontSize: 14,
                transition: 'all 0.15s',
              }}
            >
              {t === 'eventos' ? `📅 Consultas (${events.length})` : `✅ Tarefas (${pendingTasks.length})`}
            </button>
          ))}
        </div>

        {/* Add event form */}
        {showForm && tab === 'eventos' && (
          <form onSubmit={saveEvent} className="card card-lg" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="section-title">Nova consulta / evento</div>
            <div>
              <label className="field-label">Título</label>
              <input className="field-input" value={eForm.title} onChange={e => setEForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Consulta de cardiologia" required />
            </div>
            <div className="grid-2">
              <div>
                <label className="field-label">Data e hora</label>
                <input className="field-input" type="datetime-local" value={eForm.starts_at} onChange={e => setEForm(f => ({ ...f, starts_at: e.target.value }))} required />
              </div>
              <div>
                <label className="field-label">Local (opcional)</label>
                <input className="field-input" value={eForm.location} onChange={e => setEForm(f => ({ ...f, location: e.target.value }))} placeholder="Ex: Hospital Santa Maria" />
              </div>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : 'Guardar evento'}</button>
          </form>
        )}

        {/* Add task form */}
        {showForm && tab === 'tarefas' && (
          <form onSubmit={saveTask} className="card card-lg" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="section-title">Nova tarefa</div>
            <div className="grid-2">
              <div>
                <label className="field-label">Título</label>
                <input className="field-input" value={tForm.title} onChange={e => setTForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Ir à farmácia" required />
              </div>
              <div>
                <label className="field-label">Data limite (opcional)</label>
                <input className="field-input" type="date" value={tForm.due_date} onChange={e => setTForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : 'Guardar tarefa'}</button>
          </form>
        )}

        {/* Events tab */}
        {tab === 'eventos' && (
          upcomingEvents.length === 0 && pastEvents.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-title">Sem consultas agendadas</div>
                <div className="empty-state-text">Regista consultas e exames para não perderes nenhum compromisso</div>
                <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 20, width: 'auto', padding: '10px 24px' }}>
                  + Marcar consulta
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {upcomingEvents.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                    Próximas
                  </div>
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {upcomingEvents.map((ev, i) => {
                      const d = fmtEventDate(ev.starts_at)
                      return (
                        <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < upcomingEvents.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div className="event-date-box">
                            <div className="event-day">{d.day}</div>
                            <div className="event-month">{d.month}</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="event-title">{ev.title}</div>
                            <div className="event-meta">
                              🕐 {d.time}
                              {ev.location && <> · 📍 {ev.location}</>}
                            </div>
                          </div>
                          <button onClick={() => delEvent(ev.id)} className="btn-danger-ghost" title="Apagar">🗑</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                    Passadas
                  </div>
                  <div className="card" style={{ padding: 0, overflow: 'hidden', opacity: 0.6 }}>
                    {pastEvents.slice().reverse().map((ev, i) => {
                      const d = fmtEventDate(ev.starts_at)
                      return (
                        <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < pastEvents.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div className="event-date-box" style={{ background: 'var(--bg)' }}>
                            <div className="event-day" style={{ color: 'var(--text-3)' }}>{d.day}</div>
                            <div className="event-month">{d.month}</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="event-title" style={{ textDecoration: 'line-through', color: 'var(--text-3)' }}>{ev.title}</div>
                            <div className="event-meta">🕐 {d.time}{ev.location && <> · 📍 {ev.location}</>}</div>
                          </div>
                          <button onClick={() => delEvent(ev.id)} className="btn-danger-ghost" title="Apagar">🗑</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* Tasks tab */}
        {tab === 'tarefas' && (
          tasks.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-title">Sem tarefas</div>
                <div className="empty-state-text">Cria tarefas para te lembrares de coisas importantes</div>
                <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 20, width: 'auto', padding: '10px 24px' }}>
                  + Nova tarefa
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {pendingTasks.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                    Pendentes ({pendingTasks.length})
                  </div>
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {pendingTasks.map((t, i) => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < pendingTasks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <button
                          onClick={() => toggleTask(t)}
                          className="task-check"
                          title="Marcar como feita"
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>{t.title}</div>
                          {t.due_date && (
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                              📅 até {new Date(t.due_date).toLocaleDateString('pt-PT')}
                            </div>
                          )}
                        </div>
                        <button onClick={() => delTask(t.id)} className="btn-danger-ghost" title="Apagar">🗑</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {doneTasks.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                    Concluídas ({doneTasks.length})
                  </div>
                  <div className="card" style={{ padding: 0, overflow: 'hidden', opacity: 0.6 }}>
                    {doneTasks.map((t, i) => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < doneTasks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <button
                          onClick={() => toggleTask(t)}
                          className="task-check done"
                          title="Desmarcar"
                        />
                        <div style={{ flex: 1, textDecoration: 'line-through', color: 'var(--text-3)', fontSize: 15 }}>{t.title}</div>
                        <button onClick={() => delTask(t.id)} className="btn-danger-ghost" title="Apagar">🗑</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}
