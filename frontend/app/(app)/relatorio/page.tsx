'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileBarChart, Printer, Leaf, AlertTriangle, Pill, Calendar as CalendarIcon, Clock, MapPin, User as UserIcon, Siren } from 'lucide-react'
import { api, getElderlyId } from '@/lib/api'
import type { Elderly, Medication, CalendarEvent, MedicationLog } from '@/lib/types'

function age(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
}

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('pt-PT', opts ?? { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
}

const STATUS_PT: Record<string, string> = { taken: 'Tomado', skipped: 'Saltado', missed: 'Perdido' }
const STATUS_COLOR: Record<string, string> = { taken: '#276749', skipped: '#64748B', missed: '#C53030' }

export default function RelatorioPage() {
  const [elderly, setElderly] = useState<Elderly | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [logs, setLogs] = useState<MedicationLog[]>([])
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const elderlyId = getElderlyId()

  async function load(d = days) {
    if (!elderlyId) return
    setLoading(true)
    const [list, meds, evs, history] = await Promise.all([
      api.listElderly(),
      api.listMedications(elderlyId),
      api.listEvents(elderlyId),
      api.medicationHistory(elderlyId, d),
    ])
    setElderly(list.find(e => e.id === elderlyId) ?? list[0] ?? null)
    setMedications(meds)
    setEvents(evs.sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    setLogs(history)
    setLoading(false)
  }

  useEffect(() => { load() }, [elderlyId])

  function sendByEmail() {
    if (!elderly) return
    const active = medications.filter(m => m.is_active)
    const taken = logs.filter(l => l.status === 'taken').length
    const total = logs.length
    const pct = total ? Math.round((taken / total) * 100) : 0

    const lines = [
      `RESUMO CLÍNICO — ${elderly.full_name}`,
      `Gerado em ${new Date().toLocaleDateString('pt-PT')} via pieta.care`,
      ``,
      `IDENTIFICAÇÃO`,
      `Nome: ${elderly.full_name}`,
      elderly.date_of_birth ? `Idade: ${age(elderly.date_of_birth)} anos (${fmtDate(elderly.date_of_birth)})` : '',
      elderly.blood_type ? `Grupo sanguíneo: ${elderly.blood_type}` : '',
      elderly.health_number ? `Nº SNS: ${elderly.health_number}` : '',
      elderly.address ? `Morada: ${elderly.address}` : '',
      ``,
      `CONDIÇÕES MÉDICAS`,
      elderly.medical_conditions || 'Não especificado',
      ``,
      `ALERGIAS`,
      elderly.allergies || 'Sem alergias conhecidas',
      ``,
      `MEDICAÇÃO ACTUAL (${active.length} medicamento${active.length !== 1 ? 's' : ''})`,
      ...active.map(m => `• ${m.name} ${m.dosage} — ${m.schedule_times.join(', ')}${m.instructions ? ` | ${m.instructions}` : ''}`),
      ``,
      `ADESÃO À MEDICAÇÃO (últimos ${days} dias)`,
      `${pct}% (${taken} de ${total} tomas confirmadas)`,
      ``,
      `PRÓXIMAS CONSULTAS`,
      ...events.filter(e => new Date(e.starts_at) >= new Date()).slice(0, 5).map(e =>
        `• ${e.title} — ${fmtDateTime(e.starts_at)}${e.location ? ` @ ${e.location}` : ''}`
      ),
      ``,
      `CONTACTO DE EMERGÊNCIA`,
      elderly.emergency_contact_name
        ? `${elderly.emergency_contact_name}${elderly.emergency_contact_phone ? `: ${elderly.emergency_contact_phone}` : ''}`
        : 'Não especificado',
      ``,
      `---`,
      `Gerado via pieta.care — Sistema de gestão de cuidados de saúde`,
    ].filter(Boolean).join('\n')

    const subject = encodeURIComponent(`Resumo Clínico — ${elderly.full_name}`)
    const body = encodeURIComponent(lines)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const activeMeds = medications.filter(m => m.is_active)
  const inactiveMeds = medications.filter(m => !m.is_active)
  const upcomingEvents = events.filter(e => new Date(e.starts_at) >= new Date())
  const pastEvents = events.filter(e => new Date(e.starts_at) < new Date())
  const takenLogs = logs.filter(l => l.status === 'taken')
  const skippedLogs = logs.filter(l => l.status === 'skipped')
  const missedLogs = logs.filter(l => l.status === 'missed')
  const compliance = logs.length ? Math.round((takenLogs.length / logs.length) * 100) : null

  const generatedAt = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (loading) return (
    <div>
      <div className="page-top"><div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><FileBarChart size={20} strokeWidth={2} /> Relatório Médico</div></div>
      <div className="page-body"><p className="loading" style={{ textAlign: 'center', padding: 48 }}>A gerar relatório…</p></div>
    </div>
  )

  if (!elderly) return (
    <div>
      <div className="page-top"><div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><FileBarChart size={20} strokeWidth={2} /> Relatório Médico</div></div>
      <div className="page-body"><p style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>Sem dados disponíveis.</p></div>
    </div>
  )

  return (
    <div>
      {/* Screen toolbar — hidden on print */}
      <div className="page-top no-print">
        <div>
          <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><FileBarChart size={20} strokeWidth={2} /> Relatório Médico</div>
          <div className="page-subtitle">Gerado em {generatedAt}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>Histórico:</label>
            <select
              value={days}
              onChange={e => { const d = Number(e.target.value); setDays(d); load(d) }}
              className="field-input"
              style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
            >
              <option value={7}>7 dias</option>
              <option value={14}>14 dias</option>
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
            </select>
          </div>
          <button onClick={sendByEmail} className="btn-secondary" style={{ width: 'auto', padding: '10px 18px', fontSize: 13 }}>
            📧 Enviar por email
          </button>
          <button onClick={() => window.print()} className="btn-primary" style={{ width: 'auto', padding: '10px 18px', fontSize: 13 }}>
<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Printer size={15} strokeWidth={2} /> Imprimir / PDF</span>
          </button>
        </div>
      </div>

      <div className="page-body" id="report-content">
        {/* Report header */}
        <div className="report-header">
          <div>
            <div className="report-header-eyebrow">Relatório Clínico</div>
            <div className="report-header-name">{elderly.full_name}</div>
            {elderly.date_of_birth && (
              <div className="report-header-meta">
                {age(elderly.date_of_birth)} anos · {fmtDate(elderly.date_of_birth)}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="report-header-brand"><Leaf size={26} strokeWidth={2.25} /> pieta.care</div>
            <div className="report-header-date">{generatedAt}</div>
          </div>
        </div>

        {/* Quick info badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {elderly.blood_type && (
            <div style={{ background: 'var(--danger-light)', border: '1px solid #FEB2B2', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🩸</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Grupo sanguíneo</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#C53030' }}>{elderly.blood_type}</div>
              </div>
            </div>
          )}
          {elderly.health_number && (
            <div style={{ background: 'var(--brand-light)', border: '1px solid rgba(42,96,73,0.2)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🏥</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Nº SNS</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand)' }}>{elderly.health_number}</div>
              </div>
            </div>
          )}
          {compliance !== null && (
            <div style={{ background: compliance >= 80 ? 'var(--success-light)' : compliance >= 50 ? 'var(--warning-light)' : 'var(--danger-light)', border: `1px solid ${compliance >= 80 ? 'var(--success)' : compliance >= 50 ? 'var(--warning)' : 'var(--danger)'}`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>💊</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Adesão {days}d</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: compliance >= 80 ? 'var(--success)' : compliance >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{compliance}%</div>
              </div>
            </div>
          )}
          {elderly.emergency_contact_phone && (
            <div style={{ background: 'var(--danger-light)', border: '1px solid #FEB2B2', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🚨</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Emergência</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#C53030' }}>{elderly.emergency_contact_phone}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Medical conditions */}
          <div className="card card-lg">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>🩺 Condições médicas</div>
            {elderly.medical_conditions ? (
              <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{elderly.medical_conditions}</div>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text-3)', fontStyle: 'italic' }}>Nenhuma condição registada</div>
            )}
          </div>

          {/* Allergies */}
          <div className="card card-lg" style={{ border: elderly.allergies ? '1px solid #FEB2B2' : '1px solid var(--border)', background: elderly.allergies ? 'var(--danger-light)' : 'var(--surface)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: elderly.allergies ? '#C53030' : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={13} strokeWidth={2.25} /> Alergias conhecidas</div>
            {elderly.allergies ? (
              <div style={{ fontSize: 14, color: '#C53030', lineHeight: 1.7, fontWeight: 600, whiteSpace: 'pre-wrap' }}>{elderly.allergies}</div>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text-3)', fontStyle: 'italic' }}>Sem alergias conhecidas</div>
            )}
          </div>
        </div>

        {/* Medications */}
        <div className="card card-lg" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Pill size={13} strokeWidth={2.25} /> Medicação actual</div>
            <span style={{ background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>{activeMeds.length} activo{activeMeds.length !== 1 ? 's' : ''}</span>
          </div>

          {activeMeds.length === 0 ? (
            <div style={{ fontSize: 14, color: 'var(--text-3)', fontStyle: 'italic', padding: '8px 0' }}>Sem medicação activa registada</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Medicamento', 'Dosagem', 'Horários', 'Instruções'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 10px 10px 0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeMeds.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: i < activeMeds.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 10px 12px 0', fontWeight: 700, fontSize: 15 }}>{m.name}</td>
                    <td style={{ padding: '12px 10px', fontSize: 14 }}>
                      <span style={{ background: 'var(--brand-light)', color: 'var(--brand)', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 13 }}>{m.dosage}</span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {m.schedule_times.map(t => (
                          <span key={t} className="time-chip">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px 0', fontSize: 13, color: 'var(--text-3)', fontStyle: m.instructions ? 'italic' : 'normal' }}>
                      {m.instructions || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {inactiveMeds.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Medicação suspensa</div>
              {inactiveMeds.map(m => (
                <span key={m.id} style={{ display: 'inline-block', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', fontSize: 13, color: 'var(--text-3)', marginRight: 6, marginBottom: 4, textDecoration: 'line-through' }}>
                  {m.name} {m.dosage}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Medication history / compliance */}
        <div className="card card-lg" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📊 Adesão à medicação — últimos {days} dias</div>
            {compliance !== null && (
              <span style={{ fontSize: 22, fontWeight: 800, color: compliance >= 80 ? 'var(--success)' : compliance >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                {compliance}%
              </span>
            )}
          </div>

          {logs.length === 0 ? (
            <div style={{ fontSize: 14, color: 'var(--text-3)', fontStyle: 'italic' }}>Sem registos de tomas neste período</div>
          ) : (
            <>
              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Tomadas', count: takenLogs.length, color: 'var(--success)', bg: 'var(--success-light)', icon: '✓' },
                  { label: 'Saltadas', count: skippedLogs.length, color: '#64748B', bg: '#F1F5F9', icon: '—' },
                  { label: 'Perdidas', count: missedLogs.length, color: 'var(--danger)', bg: 'var(--danger-light)', icon: '✕' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Compliance bar */}
              {compliance !== null && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ height: 12, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${compliance}%`, background: compliance >= 80 ? 'var(--brand)' : compliance >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                    {takenLogs.length} tomas confirmadas de {logs.length} total
                  </div>
                </div>
              )}

              {/* Recent history table */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Ocorrências recentes</div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['Data / Hora', 'Medicamento', 'Dosagem', 'Estado', 'Confirmado por'].map(h => (
                        <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px 10px 0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice().reverse().map((log, i) => (
                      <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none', opacity: log.status === 'taken' ? 1 : 0.65 }}>
                        <td style={{ padding: '9px 8px 9px 0', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{fmtDateTime(log.scheduled_time)}</td>
                        <td style={{ padding: '9px 8px', fontWeight: 600 }}>{log.medication_name}</td>
                        <td style={{ padding: '9px 8px', color: 'var(--text-3)' }}>{log.dosage}</td>
                        <td style={{ padding: '9px 8px' }}>
                          <span style={{ fontWeight: 700, color: STATUS_COLOR[log.status] ?? 'var(--text-3)', fontSize: 12 }}>
                            {STATUS_PT[log.status] ?? log.status}
                          </span>
                        </td>
                        <td style={{ padding: '9px 0', color: 'var(--text-3)', fontSize: 12 }}>{log.confirmed_by_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Calendar events */}
        {(upcomingEvents.length > 0 || pastEvents.length > 0) && (
          <div className="card card-lg" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}><CalendarIcon size={13} strokeWidth={2.25} /> Consultas e eventos</div>

            {upcomingEvents.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 8 }}>Próximas</div>
                {upcomingEvents.map((ev, i) => (
                  <div key={ev.id} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: i < upcomingEvents.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="event-date-box">
                      <div className="event-day">{new Date(ev.starts_at).getDate()}</div>
                      <div className="event-month">{new Date(ev.starts_at).toLocaleDateString('pt-PT', { month: 'short' })}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                        <Clock size={12} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{new Date(ev.starts_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        {ev.location && <> · <MapPin size={12} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{ev.location}</>}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {pastEvents.length > 0 && (
              <div style={{ marginTop: upcomingEvents.length > 0 ? 16 : 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Passadas</div>
                {pastEvents.slice().reverse().slice(0, 5).map((ev, i) => (
                  <div key={ev.id} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: i < Math.min(pastEvents.length, 5) - 1 ? '1px solid var(--border)' : 'none', opacity: 0.6 }}>
                    <div style={{ minWidth: 46, textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-3)' }}>{new Date(ev.starts_at).getDate()}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>{new Date(ev.starts_at).toLocaleDateString('pt-PT', { month: 'short' })}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, textDecoration: 'line-through', color: 'var(--text-3)' }}>{ev.title}</div>
                      {ev.location && <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={12} strokeWidth={2} /> {ev.location}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Personal details + emergency */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="card card-lg">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}><UserIcon size={13} strokeWidth={2.25} /> Dados pessoais</div>
            {[
              { label: 'Nome completo', value: elderly.full_name },
              { label: 'Data de nascimento', value: elderly.date_of_birth ? `${fmtDate(elderly.date_of_birth)} (${age(elderly.date_of_birth)} anos)` : null },
              { label: 'Nº BI / CC', value: elderly.id_number },
              { label: 'Nº SNS', value: elderly.health_number },
              { label: 'Morada', value: elderly.address },
            ].filter(f => f.value).map(f => (
              <div key={f.label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</div>
                <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 2 }}>{f.value}</div>
              </div>
            ))}
          </div>

          <div className="card card-lg" style={{ background: 'var(--danger-light)', border: '1px solid #FEB2B2' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C53030', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Siren size={13} strokeWidth={2.25} /> Contacto de emergência</div>
            {elderly.emergency_contact_name ? (
              <>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Nome</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{elderly.emergency_contact_name}</div>
                </div>
                {elderly.emergency_contact_phone && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Telefone</div>
                    <a href={`tel:${elderly.emergency_contact_phone}`} style={{ fontSize: 20, fontWeight: 800, color: '#C53030', textDecoration: 'none', display: 'block', marginTop: 4 }}>
                      {elderly.emergency_contact_phone}
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text-3)', fontStyle: 'italic' }}>Não especificado</div>
            )}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #FEB2B2' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Números de emergência</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href="tel:112" style={{ flex: 1, background: '#C53030', color: 'white', borderRadius: 8, padding: '10px', textAlign: 'center', fontWeight: 800, fontSize: 18, textDecoration: 'none' }}>112</a>
                <a href="tel:808242424" style={{ flex: 1, background: 'var(--brand)', color: 'white', borderRadius: 8, padding: '10px', textAlign: 'center', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SNS 24<br/>808 24 24 24</a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 12, padding: '8px 0 24px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
          Relatório gerado em {generatedAt} · pieta.care — Sistema de gestão de cuidados de saúde
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .sidebar { display: none !important; }
          .bottom-nav { display: none !important; }
          .main-content { margin-left: 0 !important; }
          body { background: white !important; }
          .page-body { padding: 0 !important; }
          .card { box-shadow: none !important; break-inside: avoid; }
          #report-content { padding: 0 !important; }
        }
      `}</style>
    </div>
  )
}
