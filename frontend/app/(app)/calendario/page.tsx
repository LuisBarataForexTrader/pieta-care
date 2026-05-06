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
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const emptyEForm = { title: '', starts_at: '', location: '', doctor_name: '', preparation_notes: '', items_to_bring: '', description: '' }
  const [eForm, setEForm] = useState(emptyEForm)
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

  function startEditEvent(ev: CalendarEvent) {
    setEForm({
      title: ev.title,
      starts_at: ev.starts_at.slice(0, 16),
      location: ev.location ?? '',
      doctor_name: ev.doctor_name ?? '',
      preparation_notes: ev.preparation_notes ?? '',
      items_to_bring: ev.items_to_bring ?? '',
      description: ev.description ?? '',
    })
    setEditingEventId(ev.id)
    setShowForm(true)
    setTab('eventos')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEventForm() {
    setShowForm(false)
    setEditingEventId(null)
    setEForm(emptyEForm)
    setError('')
  }

  async function saveEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    setSaving(true)
    setError('')
    try {
      if (editingEventId) {
        await api.updateEvent(elderlyId, editingEventId, { ...eForm })
      } else {
        await api.createEvent(elderlyId, { ...eForm, ends_at: undefined })
      }
      cancelEventForm()
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
          onClick={() => showForm ? cancelEventForm() : setShowForm(true)}
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
            <div className="section-title">{editingEventId ? 'Editar evento' : 'Nova consulta / evento'}</div>
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
                <label className="field-label">Local</label>
                <input className="field-input" value={eForm.location} onChange={e => setEForm(f => ({ ...f, location: e.target.value }))} placeholder="Ex: Hospital Santa Maria" />
              </div>
            </div>
            <div>
              <label className="field-label">Médico / especialista</label>
              <input className="field-input" value={eForm.doctor_name} onChange={e => setEForm(f => ({ ...f, doctor_name: e.target.value }))} placeholder="Ex: Dr. João Silva — Cardiologista" />
            </div>
            <div className="grid-2">
              <div>
                <label className="field-label">Preparação necessária</label>
                <textarea className="field-input" value={eForm.preparation_notes} onChange={e => setEForm(f => ({ ...f, preparation_notes: e.target.value }))} placeholder="Ex: Jejum de 8h, não tomar medicação de manhã…" rows={3} />
              </div>
              <div>
                <label className="field-label">Coisas a levar</label>
                <textarea className="field-input" value={eForm.items_to_bring} onChange={e => setEForm(f => ({ ...f, items_to_bring: e.target.value }))} placeholder="Ex: Cartão de cidadão, lista de medicamentos, últimos exames…" rows={3} />
              </div>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : editingEventId ? '💾 Guardar alterações' : 'Guardar evento'}</button>
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
                        <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 20px', borderBottom: i < upcomingEvents.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div className="event-date-box" style={{ flexShrink: 0 }}>
                            <div className="event-day">{d.day}</div>
                            <div className="event-month">{d.month}</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="event-title">{ev.title}</div>
                            <div className="event-meta">
                              🕐 {d.time}
                              {ev.location && <> · 📍 {ev.location}</>}
                            </div>
                            {ev.doctor_name && (
                              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>👨‍⚕️ {ev.doctor_name}</div>
                            )}
                            {ev.preparation_notes && (
                              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, padding: '6px 8px', background: 'var(--surface-2)', borderRadius: 6, borderLeft: '3px solid #D69E2E' }}>
                                <span style={{ fontWeight: 700, color: '#D69E2E' }}>Preparação: </span>{ev.preparation_notes}
                              </div>
                            )}
                            {ev.items_to_bring && (
                              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, padding: '6px 8px', background: 'var(--surface-2)', borderRadius: 6, borderLeft: '3px solid var(--brand)' }}>
                                <span style={{ fontWeight: 700, color: 'var(--brand)' }}>Levar: </span>{ev.items_to_bring}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => startEditEvent(ev)} className="btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }}>✏️</button>
                            <button onClick={() => delEvent(ev.id)} className="btn-danger-ghost" title="Apagar">🗑</button>
                          </div>
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
