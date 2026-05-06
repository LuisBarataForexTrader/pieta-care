'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api, getElderlyId } from '@/lib/api'
import type { DailyScheduleItem, CalendarEvent, Elderly, Medication, WellbeingLog, VitalSign } from '@/lib/types'

const STATUS_LABEL: Record<string, string> = { taken: 'Tomado', pending: 'Pendente', skipped: 'Saltado', missed: 'Perdido' }
const STATUS_PILL: Record<string, string>  = { taken: 'pill-taken', pending: 'pill-pending', skipped: 'pill-skipped', missed: 'pill-missed' }

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}
function todayGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}
function todayFull() {
  return new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
function age(dob: string | null) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
}

export default function Dashboard() {
  const [schedule,    setSchedule]    = useState<DailyScheduleItem[]>([])
  const [events,      setEvents]      = useState<CalendarEvent[]>([])
  const [elderly,     setElderly]     = useState<Elderly | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [wellbeing,   setWellbeing]   = useState<WellbeingLog | null | undefined>(undefined)
  const [latestVital, setLatestVital] = useState<VitalSign | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [confirming,  setConfirming]  = useState<string | null>(null)
  const elderlyId = getElderlyId()

  const load = useCallback(async () => {
    if (!elderlyId) return
    const [sched, evs, elderlyList, meds, wb, vitals] = await Promise.all([
      api.dailySchedule(elderlyId),
      api.listEvents(elderlyId),
      api.listElderly(),
      api.listMedications(elderlyId),
      api.todayWellbeing(elderlyId),
      api.listVitals(elderlyId, 7),
    ])
    setSchedule(sched)
    const now = new Date()
    setEvents(evs.filter(e => new Date(e.starts_at) >= now).sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(0, 2))
    setElderly(elderlyList.find(e => e.id === elderlyId) ?? elderlyList[0] ?? null)
    setMedications(meds)
    setWellbeing(wb)
    setLatestVital(vitals[0] ?? null)
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

  const pending = schedule.filter(i => i.status === 'pending')
  const done    = schedule.filter(i => i.status !== 'pending')
  const taken   = schedule.filter(i => i.status === 'taken').length
  const compliance = schedule.length ? Math.round((taken / schedule.length) * 100) : 0
  const allDone    = schedule.length > 0 && pending.length === 0

  const elderlyAge = elderly ? age(elderly.date_of_birth) : null

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="page-top">
        <div>
          <div className="page-title">{todayGreeting()} 👋</div>
          <div className="page-subtitle" style={{ textTransform: 'capitalize' }}>{todayFull()}</div>
        </div>
        {allDone && (
          <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700 }}>
            ✓ Todas as tomas confirmadas
          </div>
        )}
      </div>

      <div className="page-body">
        {loading ? (
          <p style={{ textAlign: 'center', padding: 64, color: 'var(--text-3)' }}>A carregar…</p>
        ) : (
          <>
            {/* ── STATS ROW ── */}
            <div className="grid-3" style={{ marginBottom: 28 }}>
              {/* Medication compliance */}
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'var(--brand-light)' }}>💊</div>
                <div>
                  <div className="stat-label">Adesão hoje</div>
                  <div className="stat-value">{compliance}%</div>
                  <div className="compliance-bar"><div className="compliance-fill" style={{ width: `${compliance}%` }} /></div>
                  <div className="stat-sub">{taken} de {schedule.length} tomas</div>
                </div>
              </div>

              {/* Next appointment */}
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#EEF2FF' }}>📅</div>
                <div>
                  <div className="stat-label">Próxima consulta</div>
                  {events.length > 0 ? (
                    <>
                      <div className="stat-value" style={{ fontSize: 17, marginTop: 4 }}>{events[0].title}</div>
                      <div className="stat-sub">
                        {new Date(events[0].starts_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                        {' às '}
                        {new Date(events[0].starts_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="stat-value" style={{ fontSize: 17, marginTop: 4 }}>—</div>
                      <div className="stat-sub">Sem consultas marcadas</div>
                    </>
                  )}
                </div>
              </div>

              {/* Latest vital or wellbeing */}
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#FFF0F0' }}>❤️</div>
                <div>
                  {latestVital?.blood_pressure_sys ? (
                    <>
                      <div className="stat-label">Tensão arterial</div>
                      <div className="stat-value">{latestVital.blood_pressure_sys}/{latestVital.blood_pressure_dia}</div>
                      <div className="stat-sub">
                        {latestVital.heart_rate ? `${latestVital.heart_rate} bpm · ` : ''}
                        {new Date(latestVital.measured_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                      </div>
                    </>
                  ) : wellbeing ? (
                    <>
                      <div className="stat-label">Bem-estar hoje</div>
                      <div className="stat-value" style={{ fontSize: 26 }}>{['','😞','😟','😐','🙂','😄'][wellbeing.mood]}</div>
                      <div className="stat-sub">{['','Mau','Fraco','Razoável','Bom','Muito bom'][wellbeing.mood]}</div>
                    </>
                  ) : (
                    <>
                      <div className="stat-label">Sinais vitais</div>
                      <div className="stat-value" style={{ fontSize: 17, marginTop: 4 }}>—</div>
                      <div className="stat-sub"><Link href="/saude" style={{ color: 'var(--brand)' }}>Registar →</Link></div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── MAIN GRID ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

              {/* LEFT — Medication schedule */}
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
                            <button className="btn-skip" onClick={() => confirm(item, 'skipped')} disabled={busy}>Saltar</button>
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
                          <div key={`${item.medication_id}-${item.scheduled_time}`} className="med-item"
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.75 }}>
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

                {/* Active medications list (non-PRN) */}
                {medications.filter(m => m.is_active && !m.is_prn).length > 0 && schedule.length === 0 && (
                  <div className="card" style={{ marginTop: 20 }}>
                    <div className="section-title" style={{ marginBottom: 14 }}>📋 Medicação activa</div>
                    {medications.filter(m => m.is_active && !m.is_prn).map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.dosage} · {m.schedule_times.join(', ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT SIDEBAR */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>

                {/* ── Patient identity card ── */}
                {elderly && (
                  <Link href="/perfil" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'box-shadow .15s' }}>
                      {/* Avatar */}
                      <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'var(--brand)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, fontWeight: 800, flexShrink: 0, overflow: 'hidden',
                      }}>
                        {elderly.photo_url
                          ? <img src={elderly.photo_url} alt={elderly.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : initials(elderly.full_name)
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {elderly.full_name}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {elderlyAge && (
                            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{elderlyAge} anos</span>
                          )}
                          {elderly.blood_type && (
                            <span className="pill" style={{ background: '#FFF5F5', color: '#C53030', fontSize: 11 }}>🩸 {elderly.blood_type}</span>
                          )}
                          {elderly.health_number && (
                            <span className="pill" style={{ background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 11 }}>SNS {elderly.health_number}</span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>→</span>
                    </div>
                  </Link>
                )}

                {/* ── Wellbeing check-in ── */}
                {wellbeing === null && (
                  <Link href="/saude" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ border: '1.5px dashed var(--brand)', background: 'var(--brand-light)', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 26 }}>😊</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>Como está hoje?</div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Regista o bem-estar diário</div>
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600 }}>Registar →</span>
                      </div>
                    </div>
                  </Link>
                )}
                {wellbeing && (
                  <div className="card">
                    <div className="section-header" style={{ marginBottom: 10 }}>
                      <div className="section-title">😊 Bem-estar hoje</div>
                      <Link href="/saude" className="section-link">Ver →</Link>
                    </div>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <span style={{ fontSize: 34 }}>{['','😞','😟','😐','🙂','😄'][wellbeing.mood]}</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{['','Mau','Fraco','Razoável','Bom','Muito bom'][wellbeing.mood]}</div>
                        {wellbeing.pain_level !== null && wellbeing.pain_level !== undefined && wellbeing.pain_level > 0 && (
                          <div style={{ fontSize: 12, color: wellbeing.pain_level >= 7 ? '#C53030' : wellbeing.pain_level >= 4 ? '#D69E2E' : 'var(--text-3)' }}>
                            Dor: {wellbeing.pain_level}/10
                          </div>
                        )}
                        {wellbeing.notes && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, fontStyle: 'italic' }}>{wellbeing.notes}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Vitals compact ── */}
                {latestVital && (
                  <div className="card" style={{ padding: '12px 16px' }}>
                    <div className="section-header" style={{ marginBottom: 8 }}>
                      <div className="section-title" style={{ fontSize: 13 }}>❤️ Sinais vitais</div>
                      <Link href="/saude" className="section-link">Ver →</Link>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {latestVital.blood_pressure_sys && latestVital.blood_pressure_dia && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', background: 'var(--surface-2)', borderRadius: 6, padding: '3px 8px' }}>
                          {latestVital.blood_pressure_sys}/{latestVital.blood_pressure_dia} mmHg
                        </span>
                      )}
                      {latestVital.oxygen_saturation && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', background: 'var(--surface-2)', borderRadius: 6, padding: '3px 8px' }}>
                          SpO₂ {latestVital.oxygen_saturation}%
                        </span>
                      )}
                      {latestVital.temperature && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', background: 'var(--surface-2)', borderRadius: 6, padding: '3px 8px' }}>
                          {latestVital.temperature}°C
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Next event ── */}
                {events.length > 0 && (
                  <div className="card">
                    <div className="section-header" style={{ marginBottom: 10 }}>
                      <div className="section-title">📅 Próxima consulta</div>
                      <Link href="/calendario" className="section-link">Agenda →</Link>
                    </div>
                    {events.slice(0, 1).map(ev => {
                      const d = new Date(ev.starts_at)
                      return (
                        <div key={ev.id} className="event-item">
                          <div className="event-date-box">
                            <div className="event-day">{d.getDate()}</div>
                            <div className="event-month">{d.toLocaleDateString('pt-PT', { month: 'short' })}</div>
                          </div>
                          <div>
                            <div className="event-title">{ev.title}</div>
                            <div className="event-meta">
                              🕐 {d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                              {ev.location && <> · 📍 {ev.location}</>}
                            </div>
                            {ev.doctor_name && (
                              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>👨‍⚕️ {ev.doctor_name}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <Link href="/calendario">
                      <button className="btn-secondary" style={{ marginTop: 12, padding: '9px', fontSize: 13 }}>
                        + Marcar consulta
                      </button>
                    </Link>
                  </div>
                )}

                {/* ── Emergency contacts (compact) ── */}
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 12 }}>🆘 Emergência</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: elderly?.emergency_contact_phone ? 10 : 0 }}>
                    <a href="tel:112" style={{ textDecoration: 'none' }}>
                      <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, marginBottom: 2 }}>🚨</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#C53030' }}>112</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Emergência</div>
                      </div>
                    </a>
                    <a href="tel:808242424" style={{ textDecoration: 'none' }}>
                      <div style={{ background: 'var(--brand-light)', border: '1px solid rgba(42,96,73,0.2)', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, marginBottom: 2 }}>📞</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand)' }}>SNS 24</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>808 24 24 24</div>
                      </div>
                    </a>
                  </div>
                  {elderly?.emergency_contact_name && (
                    <a href={elderly.emergency_contact_phone ? `tel:${elderly.emergency_contact_phone}` : undefined}
                       style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
                        <span style={{ fontSize: 18 }}>👤</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>{elderly.emergency_contact_name}</div>
                          {elderly.emergency_contact_phone && (
                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{elderly.emergency_contact_phone}</div>
                          )}
                        </div>
                      </div>
                    </a>
                  )}
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
