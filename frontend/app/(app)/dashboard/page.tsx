'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api, getElderlyId } from '@/lib/api'
import type { DailyScheduleItem, CalendarEvent, Task } from '@/lib/types'

const STATUS_LABEL: Record<string, string> = { taken: 'Tomado', pending: 'Pendente', skipped: 'Saltado', missed: 'Perdido' }
const STATUS_PILL: Record<string, string> = { taken: 'pill-taken', pending: 'pill-pending', skipped: 'pill-skipped', missed: 'pill-missed' }

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

function todayGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function todayFull() {
  return new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtEventDate(iso: string) {
  const d = new Date(iso)
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('pt-PT', { month: 'short' }),
    time: d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
  }
}

export default function Dashboard() {
  const [schedule, setSchedule] = useState<DailyScheduleItem[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)
  const elderlyId = getElderlyId()

  const load = useCallback(async () => {
    if (!elderlyId) return
    const [sched, evs, tks] = await Promise.all([
      api.dailySchedule(elderlyId),
      api.listEvents(elderlyId),
      api.listTasks(elderlyId),
    ])
    setSchedule(sched)
    const now = new Date()
    setEvents(evs.filter(e => new Date(e.starts_at) >= now).sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(0, 4))
    setTasks(tks.filter(t => !t.is_completed).slice(0, 5))
    setLoading(false)
  }, [elderlyId])

  useEffect(() => { load() }, [load])

  async function confirm(item: DailyScheduleItem, status: 'taken' | 'skipped') {
    if (!elderlyId || item.status !== 'pending') return
    const key = `${item.medication_id}-${item.scheduled_time}`
    setConfirming(key)
    try {
      await api.confirmMedication(elderlyId, item.medication_id, item.scheduled_time, status)
      await load()
    } finally { setConfirming(null) }
  }

  async function completeTask(taskId: number) {
    if (!elderlyId) return
    await api.updateTask(elderlyId, taskId, { is_completed: true })
    setTasks(t => t.filter(x => x.id !== taskId))
  }

  const pending = schedule.filter(i => i.status === 'pending')
  const done = schedule.filter(i => i.status !== 'pending')
  const taken = schedule.filter(i => i.status === 'taken').length
  const compliance = schedule.length ? Math.round((taken / schedule.length) * 100) : 0
  const allDone = schedule.length > 0 && pending.length === 0

  return (
    <div>
      {/* Page header */}
      <div className="page-top">
        <div>
          <div className="page-title">{todayGreeting()} 👋</div>
          <div className="page-subtitle" style={{ textTransform: 'capitalize' }}>{todayFull()}</div>
        </div>
        {allDone && schedule.length > 0 && (
          <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            ✓ Todas as tomas confirmadas
          </div>
        )}
      </div>

      <div className="page-body">
        {loading ? (
          <p className="loading" style={{ textAlign: 'center', padding: 48 }}>A carregar dados…</p>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid-3" style={{ marginBottom: 28 }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'var(--brand-light)' }}>💊</div>
                <div>
                  <div className="stat-label">Adesão hoje</div>
                  <div className="stat-value">{compliance}%</div>
                  <div className="compliance-bar">
                    <div className="compliance-fill" style={{ width: `${compliance}%` }} />
                  </div>
                  <div className="stat-sub">{taken} de {schedule.length} tomas</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#EEF2FF' }}>📅</div>
                <div>
                  <div className="stat-label">Próxima consulta</div>
                  {events.length > 0 ? (
                    <>
                      <div className="stat-value" style={{ fontSize: 18, marginTop: 4 }}>{events[0].title}</div>
                      <div className="stat-sub">{new Date(events[0].starts_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })} às {new Date(events[0].starts_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</div>
                    </>
                  ) : (
                    <>
                      <div className="stat-value" style={{ fontSize: 18, marginTop: 4 }}>—</div>
                      <div className="stat-sub">Sem consultas marcadas</div>
                    </>
                  )}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>✅</div>
                <div>
                  <div className="stat-label">Tarefas pendentes</div>
                  <div className="stat-value">{tasks.length}</div>
                  <div className="stat-sub">{tasks.length === 0 ? 'Tudo em dia!' : `${tasks.length} por completar`}</div>
                </div>
              </div>
            </div>

            {/* Main grid: meds + sidebar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

              {/* Medications */}
              <div>
                <div className="section-header">
                  <div className="section-title">💊 Medicação de hoje</div>
                  <Link href="/medicacao" className="section-link">Ver tudo →</Link>
                </div>

                {schedule.length === 0 ? (
                  <div className="card">
                    <div className="empty-state">
                      <div className="empty-state-icon">💊</div>
                      <div className="empty-state-title">Sem medicação registada</div>
                      <div className="empty-state-text">Adiciona os medicamentos no separador Medicação</div>
                      <Link href="/medicacao" style={{ marginTop: 16 }}>
                        <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>+ Adicionar medicação</button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pending.map(item => {
                      const key = `${item.medication_id}-${item.scheduled_time}`
                      const busy = confirming === key
                      return (
                        <div key={key} className="med-item med-item-pending">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <div>
                              <div className="med-name">{item.name}</div>
                              <div className="med-dose">{item.dosage}</div>
                              {item.instructions && (
                                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic' }}>{item.instructions}</div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div className="med-time">{timeLabel(item.scheduled_time)}</div>
                              <span className="pill pill-pending" style={{ marginTop: 4 }}>Pendente</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-confirm" onClick={() => confirm(item, 'taken')} disabled={busy}>
                              {busy ? '…' : <><span>✓</span> Confirmar toma</>}
                            </button>
                            <button className="btn-skip" onClick={() => confirm(item, 'skipped')} disabled={busy}>
                              Saltar
                            </button>
                          </div>
                        </div>
                      )
                    })}

                    {done.length > 0 && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '8px 0 4px' }}>
                          Histórico de hoje
                        </div>
                        {done.map(item => (
                          <div key={`${item.medication_id}-${item.scheduled_time}`} className="med-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.75 }}>
                            <div>
                              <div className="med-name" style={{ fontSize: 15 }}>{item.name}</div>
                              <div className="med-dose">{item.dosage} · {timeLabel(item.scheduled_time)}</div>
                              {item.confirmed_by_name && (
                                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>por {item.confirmed_by_name}</div>
                              )}
                            </div>
                            <span className={`pill ${STATUS_PILL[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Upcoming events */}
                <div className="card">
                  <div className="section-header" style={{ marginBottom: 8 }}>
                    <div className="section-title">📅 Próximas consultas</div>
                    <Link href="/calendario" className="section-link">Ver agenda →</Link>
                  </div>
                  {events.length === 0 ? (
                    <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '16px 0', textAlign: 'center' }}>
                      Sem consultas agendadas
                    </div>
                  ) : (
                    events.map(ev => {
                      const d = fmtEventDate(ev.starts_at)
                      return (
                        <div key={ev.id} className="event-item">
                          <div className="event-date-box">
                            <div className="event-day">{d.day}</div>
                            <div className="event-month">{d.month}</div>
                          </div>
                          <div>
                            <div className="event-title">{ev.title}</div>
                            <div className="event-meta">
                              🕐 {d.time}
                              {ev.location && <> · 📍 {ev.location}</>}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <Link href="/calendario">
                    <button className="btn-secondary" style={{ marginTop: 14, padding: '10px', fontSize: 13 }}>
                      + Marcar consulta
                    </button>
                  </Link>
                </div>

                {/* Pending tasks */}
                <div className="card">
                  <div className="section-header" style={{ marginBottom: 8 }}>
                    <div className="section-title">✅ Tarefas</div>
                    <Link href="/calendario" className="section-link">Ver todas →</Link>
                  </div>
                  {tasks.length === 0 ? (
                    <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '16px 0', textAlign: 'center' }}>
                      🎉 Nenhuma tarefa pendente!
                    </div>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} className="task-item">
                        <button className="task-check" onClick={() => completeTask(task.id)} title="Marcar como feita" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{task.title}</div>
                          {task.due_date && (
                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                              até {new Date(task.due_date).toLocaleDateString('pt-PT')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Info card */}
                <div className="card" style={{ background: 'var(--brand-light)', border: '1px solid rgba(42,96,73,0.15)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', marginBottom: 8 }}>🔒 Dados seguros</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                    Toda a informação de saúde está encriptada e só é acessível aos membros da família que convidares.
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: hide right column on small screens */}
            <style>{`@media(max-width:900px){.dashboard-grid-right{display:none}}`}</style>
          </>
        )}
      </div>
    </div>
  )
}
