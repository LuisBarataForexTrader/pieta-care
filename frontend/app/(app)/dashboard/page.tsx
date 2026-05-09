'use client'
import { useEffect, useId, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Pill, CalendarDays as CalendarIcon, HeartPulse, Activity,
  Stethoscope, Phone, Siren, ArrowRight, Check, Clock, ChevronRight,
  AlertTriangle, User as UserIcon, Droplet, Plus, TrendingUp, TrendingDown,
  Minus, FileText, Smile, Frown, Meh, ShieldAlert, Syringe, NotebookPen,
  PersonStanding,
} from 'lucide-react'
import { api, getElderlyId } from '@/lib/api'
import type {
  DailyScheduleItem, CalendarEvent, Elderly, WellbeingLog, VitalSign,
  Incident, DailyNote, ClinicalDiagnosis, Vaccination,
} from '@/lib/types'
import AIInsightsPanel from '@/components/AIInsightsPanel'
import { BODY_ZONES } from '@/components/BodyMap'
import HealthChartsPanel from '@/components/HealthChartsPanel'

const STATUS_LABEL: Record<string, string> = { taken: 'Tomado', pending: 'Pendente', skipped: 'Saltado', missed: 'Perdido' }
const STATUS_PILL: Record<string, string>  = { taken: 'pill-taken', pending: 'pill-pending', skipped: 'pill-skipped', missed: 'pill-missed' }
const MOOD_LABEL = ['', 'Mau', 'Fraco', 'Razoável', 'Bom', 'Muito bom']

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
function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`
  const d = Math.floor(diff / 86400)
  if (d < 7) return `há ${d} dia${d > 1 ? 's' : ''}`
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}
function MoodIcon({ mood, size = 16 }: { mood: number; size?: number }) {
  if (mood <= 2) return <Frown size={size} strokeWidth={1.75} />
  if (mood === 3) return <Meh size={size} strokeWidth={1.75} />
  return <Smile size={size} strokeWidth={1.75} />
}

function Sparkline({
  values, color = '#2A6049', height = 32, fill = true, unit,
}: { values: number[]; color?: string; height?: number; fill?: boolean; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  // Stable id per render of this Sparkline so multiple cards don't share defs
  const gid = useId().replace(/:/g, '_')
  if (values.length < 2) {
    return <div style={{ height, display: 'flex', alignItems: 'center', color: 'var(--text-3)', fontSize: 11 }}>Sem dados</div>
  }
  const w = 100, h = height
  const min = Math.min(...values), max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return { x, y, v }
  })
  const path = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
  const area = `M 0,${h} L ${path} L ${w},${h} Z`
  const hoveredPt = hover !== null ? pts[hover] : null
  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block', cursor: 'crosshair' }}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          const idx = Math.round(ratio * (pts.length - 1))
          setHover(Math.max(0, Math.min(pts.length - 1, idx)))
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.34} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {fill && <path d={area} fill={`url(#spark-${gid})`} />}
        <path d={`M ${path}`} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {hoveredPt && (
          <>
            <circle cx={hoveredPt.x} cy={hoveredPt.y} r={3.5} fill={color} opacity={0.18} />
            <circle cx={hoveredPt.x} cy={hoveredPt.y} r={1.8} fill={color} />
          </>
        )}
      </svg>
      {hoveredPt && (
        <div
          style={{
            position: 'absolute',
            top: -22,
            left: `${(hoveredPt.x / w) * 100}%`,
            transform: 'translateX(-50%)',
            padding: '2px 7px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 10.5,
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          }}
        >
          {Number.isInteger(hoveredPt.v) ? hoveredPt.v : hoveredPt.v.toFixed(1)}
          {unit ? ` ${unit}` : ''}
        </div>
      )}
    </div>
  )
}

function trendOf(values: number[]): 'up' | 'down' | 'flat' {
  if (values.length < 2) return 'flat'
  const first = values.slice(0, Math.ceil(values.length / 2))
  const last = values.slice(Math.ceil(values.length / 2))
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const a = avg(first), b = avg(last)
  if (Math.abs(b - a) / (a || 1) < 0.03) return 'flat'
  return b > a ? 'up' : 'down'
}

export default function Dashboard() {
  const [schedule,    setSchedule]    = useState<DailyScheduleItem[]>([])
  const [events,      setEvents]      = useState<CalendarEvent[]>([])
  const [elderly,     setElderly]     = useState<Elderly | null>(null)
  const [me,          setMe]          = useState<{ full_name: string } | null>(null)
  const [wellbeing,   setWellbeing]   = useState<WellbeingLog | null | undefined>(undefined)
  const [vitals,      setVitals]      = useState<VitalSign[]>([])
  const [wbHistory,   setWbHistory]   = useState<WellbeingLog[]>([])
  const [incidents,   setIncidents]   = useState<Incident[]>([])
  const [notes,       setNotes]       = useState<DailyNote[]>([])
  const [diagnoses,   setDiagnoses]   = useState<ClinicalDiagnosis[]>([])
  const [vaccinations,setVaccinations]= useState<Vaccination[]>([])
  const [loading,     setLoading]     = useState(true)
  const [confirming,  setConfirming]  = useState<string | null>(null)
  const elderlyId = getElderlyId()

  const load = useCallback(async () => {
    if (!elderlyId) return
    const [sched, evs, elderlyList, wb, v, wbHist, inc, ns, dx, vac, user] = await Promise.all([
      api.dailySchedule(elderlyId),
      api.listEvents(elderlyId),
      api.listElderly(),
      api.todayWellbeing(elderlyId),
      api.listVitals(elderlyId, 30).catch(() => []),
      api.listWellbeing(elderlyId, 14).catch(() => []),
      api.listIncidents(elderlyId, false).catch(() => []),
      api.listNotes(elderlyId, 7).catch(() => []),
      api.listDiagnoses(elderlyId, false).catch(() => []),
      api.listVaccinations(elderlyId).catch(() => []),
      api.me().catch(() => null),
    ])
    setSchedule(sched)
    setEvents(evs.sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    setElderly(elderlyList.find(e => e.id === elderlyId) ?? elderlyList[0] ?? null)
    setWellbeing(wb)
    setVitals(v)
    setWbHistory(wbHist)
    setIncidents(inc)
    setNotes(ns)
    setDiagnoses(dx)
    setVaccinations(vac)
    setMe(user)
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

  // ── Derived data ──
  const pending = schedule.filter(i => i.status === 'pending')
  const done    = schedule.filter(i => i.status !== 'pending')
  const taken   = schedule.filter(i => i.status === 'taken').length
  const compliance = schedule.length ? Math.round((taken / schedule.length) * 100) : 0
  const allDone    = schedule.length > 0 && pending.length === 0

  const elderlyAge = elderly ? age(elderly.date_of_birth) : null
  const upcomingEvents = events.filter(e => new Date(e.starts_at) >= new Date()).slice(0, 3)
  const nextEvent = upcomingEvents[0]

  const latestVital = vitals[0] ?? null
  const sysSeries  = vitals.slice(0, 14).reverse().map(v => v.blood_pressure_sys).filter((x): x is number => x !== null)
  const wbSeries   = wbHistory.slice(0, 14).reverse().map(w => w.mood)
  const wbAvg7     = wbHistory.slice(0, 7).reduce((s, w) => s + w.mood, 0) / (wbHistory.slice(0, 7).length || 1)

  const incidents7d = incidents.filter(i => (Date.now() - new Date(i.occurred_at).getTime()) / 86400000 < 7)
  const openIncidents = incidents.filter(i => !i.resolved)
  const dueVaccines = vaccinations.filter(v => v.next_due_date && new Date(v.next_due_date) < new Date(Date.now() + 30 * 86400000))

  // Activity feed: last 8 events sorted by time
  type Activity = { type: 'note' | 'vital' | 'incident' | 'wellbeing'; date: string; title: string; sub: string; author: string; icon: React.ReactNode; tone?: string }
  const activity: Activity[] = [
    ...notes.slice(0, 5).map<Activity>(n => ({
      type: 'note', date: n.created_at,
      title: 'Nota de turno', sub: n.content.slice(0, 80) + (n.content.length > 80 ? '…' : ''),
      author: n.recorded_by_name,
      icon: <NotebookPen size={14} strokeWidth={2} />,
    })),
    ...vitals.slice(0, 3).map<Activity>(v => ({
      type: 'vital', date: v.measured_at,
      title: 'Sinais vitais',
      sub: [v.blood_pressure_sys && `${v.blood_pressure_sys}/${v.blood_pressure_dia} mmHg`, v.heart_rate && `${v.heart_rate} bpm`, v.oxygen_saturation && `SpO₂ ${v.oxygen_saturation}%`].filter(Boolean).join(' · ') || 'Registo',
      author: v.recorded_by_name,
      icon: <HeartPulse size={14} strokeWidth={2} />,
      tone: '#E53E3E',
    })),
    ...incidents7d.slice(0, 3).map<Activity>(i => ({
      type: 'incident', date: i.occurred_at,
      title: i.severity === 'high' ? 'Incidente grave' : 'Incidente',
      sub: i.description.slice(0, 80),
      author: i.reported_by_name,
      icon: <AlertTriangle size={14} strokeWidth={2} />,
      tone: i.severity === 'high' ? '#C53030' : '#C05621',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  // Today's combined timeline (medications + events today)
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
  const todayEvents = events.filter(e => {
    const d = new Date(e.starts_at)
    return d >= todayStart && d <= todayEnd
  })
  type TimelineItem =
    | { kind: 'med'; time: string; data: DailyScheduleItem }
    | { kind: 'event'; time: string; data: CalendarEvent }
  const timeline: TimelineItem[] = [
    ...schedule.map<TimelineItem>(s => ({ kind: 'med', time: s.scheduled_time, data: s })),
    ...todayEvents.map<TimelineItem>(e => ({ kind: 'event', time: e.starts_at, data: e })),
  ].sort((a, b) => a.time.localeCompare(b.time))

  // Alerts
  const alerts: { tone: 'warn' | 'danger'; icon: React.ReactNode; title: string; sub: string; href: string }[] = []
  if (openIncidents.length > 0) {
    alerts.push({ tone: 'danger', icon: <AlertTriangle size={16} strokeWidth={2} />,
      title: `${openIncidents.length} incidente${openIncidents.length > 1 ? 's' : ''} por resolver`,
      sub: openIncidents[0].description.slice(0, 60),
      href: '/incidentes',
    })
  }
  if (dueVaccines.length > 0) {
    alerts.push({ tone: 'warn', icon: <Syringe size={16} strokeWidth={2} />,
      title: `Vacina${dueVaccines.length > 1 ? 's' : ''} a renovar`,
      sub: dueVaccines.map(v => v.vaccine_name).slice(0, 2).join(', '),
      href: '/saude',
    })
  }

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="page-top">
        <div>
          <div className="page-title">
            {todayGreeting()}{me?.full_name ? `, ${me.full_name.split(' ')[0]}` : ''}
          </div>
          <div className="page-subtitle" style={{ textTransform: 'capitalize' }}>{todayFull()}</div>
        </div>
        {allDone && (
          <div style={{ background: 'var(--success-light)', color: 'var(--on-tinted-success)', padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Check size={15} strokeWidth={2.5} /> Tudo confirmado hoje
          </div>
        )}
      </div>

      <div className="page-body">
        {loading ? (
          <p style={{ textAlign: 'center', padding: 64, color: 'var(--text-3)' }}>A carregar…</p>
        ) : (
          <>
            {/* ── HERO PATIENT CARD ── */}
            {elderly && (
              <Link href="/perfil" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
                <div className="hero-card">
                  <div className="hero-avatar">
                    {elderly.photo_url
                      ? <img src={elderly.photo_url} alt={elderly.full_name} />
                      : <span>{initials(elderly.full_name)}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="hero-name">{elderly.full_name}</div>
                    <div className="hero-meta">
                      {elderlyAge && <span>{elderlyAge} anos</span>}
                      {elderly.blood_type && <span className="hero-chip"><Droplet size={11} strokeWidth={2.25} /> {elderly.blood_type}</span>}
                      {elderly.health_number && <span className="hero-chip">SNS {elderly.health_number}</span>}
                      {diagnoses.map(d => (
                        <span key={d.id} className="hero-chip hero-chip-dx" title={d.description}>
                          {d.description.length > 32 ? d.description.slice(0, 32) + '…' : d.description}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                </div>
              </Link>
            )}

            {/* ── KPI STRIP ── */}
            <div className="kpi-grid">
              {/* Adesão */}
              <div className="kpi-card">
                <div className="kpi-head">
                  <div className="kpi-icon" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}><Pill size={18} strokeWidth={1.9} /></div>
                  <div className="kpi-label">Medicação de hoje</div>
                </div>
                <div className="kpi-value">{compliance}<span className="kpi-unit">%</span></div>
                <div className="compliance-bar"><div className="compliance-fill" style={{ width: `${compliance}%` }} /></div>
                <div className="kpi-sub">{taken} de {schedule.length} tomas</div>
              </div>

              {/* Tensão arterial */}
              <div className="kpi-card">
                <div className="kpi-head">
                  <div className="kpi-icon" style={{ background: '#FFF0F0', color: '#E53E3E' }}><HeartPulse size={18} strokeWidth={1.9} /></div>
                  <div className="kpi-label">Tensão arterial</div>
                </div>
                {latestVital?.blood_pressure_sys ? (
                  <>
                    <div className="kpi-value">{latestVital.blood_pressure_sys}<span className="kpi-unit">/{latestVital.blood_pressure_dia}</span></div>
                    {sysSeries.length >= 2
                      ? <div style={{ marginTop: 4 }}><Sparkline values={sysSeries} color="#E53E3E" unit="mmHg" /></div>
                      : <div style={{ height: 32 }} />}
                    <div className="kpi-sub">{timeAgo(latestVital.measured_at)}{latestVital.heart_rate ? ` · ${latestVital.heart_rate} bpm` : ''}</div>
                  </>
                ) : (
                  <>
                    <div className="kpi-value-muted">-</div>
                    <div style={{ height: 32 }} />
                    <div className="kpi-sub"><Link href="/saude" className="section-link" style={{ fontSize: 12 }}>Registar →</Link></div>
                  </>
                )}
              </div>

              {/* Bem-estar */}
              <div className="kpi-card">
                <div className="kpi-head">
                  <div className="kpi-icon" style={{ background: '#FFF7E6', color: '#D69E2E' }}><Activity size={18} strokeWidth={1.9} /></div>
                  <div className="kpi-label">Bem-estar 7d</div>
                </div>
                {wbSeries.length > 0 ? (
                  <>
                    <div className="kpi-value">{wbAvg7.toFixed(1)}<span className="kpi-unit">/5</span></div>
                    {wbSeries.length >= 2
                      ? <div style={{ marginTop: 4 }}><Sparkline values={wbSeries} color="#D69E2E" unit="/5" /></div>
                      : <div style={{ height: 32 }} />}
                    <div className="kpi-sub">
                      {trendOf(wbSeries) === 'up' && <><TrendingUp size={11} strokeWidth={2.25} style={{ display: 'inline', verticalAlign: '-2px', color: 'var(--success)' }} /> a melhorar</>}
                      {trendOf(wbSeries) === 'down' && <><TrendingDown size={11} strokeWidth={2.25} style={{ display: 'inline', verticalAlign: '-2px', color: 'var(--danger)' }} /> a piorar</>}
                      {trendOf(wbSeries) === 'flat' && <><Minus size={11} strokeWidth={2.25} style={{ display: 'inline', verticalAlign: '-2px' }} /> estável</>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="kpi-value-muted">-</div>
                    <div style={{ height: 32 }} />
                    <div className="kpi-sub"><Link href="/saude" className="section-link" style={{ fontSize: 12 }}>Registar →</Link></div>
                  </>
                )}
              </div>

              {/* Próxima consulta */}
              <div className="kpi-card">
                <div className="kpi-head">
                  <div className="kpi-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}><CalendarIcon size={18} strokeWidth={1.9} /></div>
                  <div className="kpi-label">Próxima consulta</div>
                </div>
                {nextEvent ? (
                  <>
                    <div className="kpi-value-sm">
                      {new Date(nextEvent.starts_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="kpi-event-title">{nextEvent.title}</div>
                    <div className="kpi-sub">
                      <Clock size={11} strokeWidth={2.25} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                      {new Date(nextEvent.starts_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      {nextEvent.doctor_name && ` · ${nextEvent.doctor_name}`}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="kpi-value-muted">-</div>
                    <div className="kpi-event-title" style={{ color: 'var(--text-3)' }}>Sem consultas marcadas</div>
                    <div className="kpi-sub"><Link href="/calendario" className="section-link" style={{ fontSize: 12 }}>Marcar →</Link></div>
                  </>
                )}
              </div>
            </div>

            {/* ── ALERTS BANNER ── */}
            {alerts.length > 0 && (
              <div className="alerts-row">
                {alerts.map((a, i) => (
                  <Link key={i} href={a.href} className={`alert-card alert-${a.tone}`}>
                    <div className="alert-icon">{a.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="alert-title">{a.title}</div>
                      <div className="alert-sub">{a.sub}</div>
                    </div>
                    <ChevronRight size={16} />
                  </Link>
                ))}
              </div>
            )}

            {/* ── AI INSIGHTS (top-tier) ── */}
            <div style={{ marginBottom: 20 }}>
              <AIInsightsPanel />
            </div>

            {/* ── HEALTH CHARTS (vitals over time) ── */}
            <HealthChartsPanel vitals={vitals} days={30} />

            {/* ── MAIN GRID ── */}
            <div className="dash-grid">

              {/* LEFT - Today's timeline */}
              <div>
                <div className="section-header">
                  <div className="section-title"><Clock size={17} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Plano de hoje</div>
                  {schedule.length > 0 && <Link href="/medicacao" className="section-link">Medicação <ArrowRight size={13} /></Link>}
                </div>

                {timeline.length === 0 ? (
                  <div className="card">
                    <div className="empty-state">
                      <div className="empty-state-icon" style={{ color: 'var(--text-3)' }}><Pill size={42} strokeWidth={1.4} /></div>
                      <div className="empty-state-title">Nada agendado para hoje</div>
                      <div className="empty-state-text">Adicione medicação ou marque uma consulta para começar</div>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                        <Link href="/medicacao"><button className="btn-primary" style={{ width: 'auto', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Plus size={15} strokeWidth={2.5} /> Medicação</button></Link>
                        <Link href="/calendario"><button className="btn-secondary" style={{ width: 'auto', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}><CalendarIcon size={15} strokeWidth={2} /> Agenda</button></Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="timeline">
                    {timeline.map((item, i) => {
                      const isPendingMed = item.kind === 'med' && item.data.status === 'pending'
                      const isDoneMed    = item.kind === 'med' && item.data.status !== 'pending'
                      const dotClass     = item.kind === 'event'
                        ? 'tl-dot-event'
                        : isPendingMed ? 'tl-dot-pending'
                        : item.data.status === 'taken' ? 'tl-dot-taken'
                        : 'tl-dot-other'
                      return (
                        <div key={`${item.kind}-${i}`} className="tl-row">
                          <div className="tl-time">{timeLabel(item.time)}</div>
                          <div className="tl-rail">
                            <div className={`tl-dot ${dotClass}`} />
                            {i < timeline.length - 1 && <div className="tl-line" />}
                          </div>
                          <div className="tl-body">
                            {item.kind === 'med' ? (
                              <div className={`tl-card ${isPendingMed ? 'tl-card-pending' : isDoneMed ? 'tl-card-done' : ''}`}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="tl-title"><Pill size={14} strokeWidth={2} style={{ color: 'var(--brand)', marginRight: 6, verticalAlign: '-2px' }} />{item.data.name}</div>
                                    <div className="tl-meta">{item.data.dosage}{item.data.instructions ? ` · ${item.data.instructions}` : ''}</div>
                                    {item.data.confirmed_by_name && (
                                      <div className="tl-foot">por {item.data.confirmed_by_name}{item.data.confirmed_at ? ` · ${timeAgo(item.data.confirmed_at)}` : ''}</div>
                                    )}
                                  </div>
                                  <span className={`pill ${STATUS_PILL[item.data.status]}`}>{STATUS_LABEL[item.data.status]}</span>
                                </div>
                                {isPendingMed && (() => {
                                  const key = `${item.data.medication_id}-${item.data.scheduled_time}`
                                  const busy = confirming === key
                                  return (
                                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                      <button className="btn-confirm" onClick={() => confirm(item.data, 'taken')} disabled={busy}>
                                        {busy ? '…' : <><Check size={16} strokeWidth={2.5} /> Confirmar toma</>}
                                      </button>
                                      <button className="btn-skip" onClick={() => confirm(item.data, 'skipped')} disabled={busy}>Saltar</button>
                                    </div>
                                  )
                                })()}
                              </div>
                            ) : (
                              <div className="tl-card tl-card-event">
                                <div className="tl-title"><CalendarIcon size={14} strokeWidth={2} style={{ color: '#4F46E5', marginRight: 6, verticalAlign: '-2px' }} />{item.data.title}</div>
                                <div className="tl-meta">
                                  {item.data.doctor_name && <><Stethoscope size={12} strokeWidth={2} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />{item.data.doctor_name}</>}
                                  {item.data.location && <>{item.data.doctor_name ? ' · ' : ''}{item.data.location}</>}
                                </div>
                                {item.data.preparation_notes && <div className="tl-foot" style={{ marginTop: 4 }}>📋 {item.data.preparation_notes}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Trends panel */}
                {(sysSeries.length >= 2 || wbSeries.length >= 2) && (
                  <div className="trends-panel">
                    <div className="section-header" style={{ marginBottom: 8 }}>
                      <div className="section-title"><TrendingUp size={16} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Tendências (14 dias)</div>
                      <Link href="/saude" className="section-link">Detalhes <ArrowRight size={13} /></Link>
                    </div>
                    <div className="trends-grid">
                      {sysSeries.length >= 2 && (
                        <div className="trend-cell">
                          <div className="trend-label">Tensão sistólica</div>
                          <div className="trend-value">{sysSeries[sysSeries.length - 1]} <span className="kpi-unit">mmHg</span></div>
                          <Sparkline values={sysSeries} color="#E53E3E" height={36} unit="mmHg" />
                          <div className="trend-foot">
                            min {Math.min(...sysSeries)} · máx {Math.max(...sysSeries)} · {sysSeries.length} registos
                          </div>
                        </div>
                      )}
                      {wbSeries.length >= 2 && (
                        <div className="trend-cell">
                          <div className="trend-label">Bem-estar</div>
                          <div className="trend-value">{MOOD_LABEL[Math.round(wbSeries[wbSeries.length - 1])]}</div>
                          <Sparkline values={wbSeries} color="#D69E2E" height={36} unit="/5" />
                          <div className="trend-foot">
                            média {wbAvg7.toFixed(1)}/5 · {wbSeries.length} dias
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT SIDEBAR */}
              <aside className="dash-aside">
                {/* Wellbeing today */}
                {wellbeing === null && (
                  <Link href="/saude" style={{ textDecoration: 'none' }}>
                    <div className="prompt-card">
                      <Smile size={24} strokeWidth={1.75} style={{ color: 'var(--brand)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>Como está hoje?</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Regista o bem-estar diário</div>
                      </div>
                      <ArrowRight size={16} style={{ color: 'var(--brand)' }} />
                    </div>
                  </Link>
                )}
                {wellbeing && (
                  <div className="card">
                    <div className="section-header" style={{ marginBottom: 10 }}>
                      <div className="section-title"><Activity size={15} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Bem-estar hoje</div>
                      <Link href="/saude" className="section-link">Ver <ArrowRight size={13} /></Link>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-light)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MoodIcon mood={wellbeing.mood} size={22} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{MOOD_LABEL[wellbeing.mood]}</div>
                        {wellbeing.pain_level !== null && wellbeing.pain_level !== undefined && wellbeing.pain_level > 0 && (
                          <div style={{ fontSize: 12, color: wellbeing.pain_level >= 7 ? '#C53030' : wellbeing.pain_level >= 4 ? '#D69E2E' : 'var(--text-3)', fontWeight: 600 }}>
                            Dor {wellbeing.pain_level}/10
                          </div>
                        )}
                        {wellbeing.notes && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wellbeing.notes}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent activity */}
                {activity.length > 0 && (
                  <div className="card">
                    <div className="section-header" style={{ marginBottom: 12 }}>
                      <div className="section-title"><Activity size={15} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Atividade recente</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {activity.map((a, i) => (
                        <div key={i} className="activity-item">
                          <div className="activity-icon" style={{ color: a.tone || 'var(--text-2)' }}>{a.icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="activity-title">{a.title}</div>
                            <div className="activity-sub">{a.sub}</div>
                            <div className="activity-foot">{a.author} · {timeAgo(a.date)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body zones with recent incidents */}
                {(() => {
                  const recentZones = Array.from(new Set(
                    incidents
                      .filter(i => i.body_zone && (Date.now() - new Date(i.occurred_at).getTime()) / 86400000 < 30)
                      .map(i => i.body_zone as string)
                  ))
                  if (recentZones.length === 0) return null
                  return (
                    <div className="card">
                      <div className="section-header" style={{ marginBottom: 10 }}>
                        <div className="section-title"><PersonStanding size={15} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Zonas com queixas (30d)</div>
                        <Link href="/incidentes" className="section-link">Ver <ArrowRight size={13} /></Link>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {recentZones.map(z => (
                          <span key={z} className="dx-chip" style={{ background: 'var(--danger-light)', color: 'var(--on-tinted-danger)', borderColor: 'rgba(197,48,48,0.18)' }}>
                            {BODY_ZONES[z] ?? z}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Diagnoses */}
                {diagnoses.length > 0 && (
                  <div className="card">
                    <div className="section-header" style={{ marginBottom: 10 }}>
                      <div className="section-title"><ShieldAlert size={15} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Diagnósticos ativos</div>
                      <Link href="/clinico" className="section-link">Ver <ArrowRight size={13} /></Link>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {diagnoses.slice(0, 6).map(d => (
                        <span key={d.id} className="dx-chip" title={d.description}>
                          {d.is_chronic && <span className="dx-dot" />}
                          {d.description.length > 32 ? d.description.slice(0, 32) + '…' : d.description}
                        </span>
                      ))}
                      {diagnoses.length > 6 && <span className="dx-chip" style={{ color: 'var(--text-3)' }}>+{diagnoses.length - 6}</span>}
                    </div>
                  </div>
                )}

                {/* Emergency */}
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Siren size={15} strokeWidth={2} style={{ color: 'var(--danger)' }} /> Emergência</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: elderly?.emergency_contact_phone ? 10 : 0 }}>
                    <a href="tel:112" style={{ textDecoration: 'none' }}>
                      <div className="emergency-btn" style={{ background: 'var(--danger-light)', borderColor: 'var(--danger)' }}>
                        <Siren size={20} strokeWidth={1.75} style={{ color: 'var(--on-tinted-danger)' }} />
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--on-tinted-danger)' }}>112</div>
                        <div style={{ fontSize: 10, color: 'var(--on-tinted-danger)', opacity: 0.7 }}>Emergência</div>
                      </div>
                    </a>
                    <a href="tel:808242424" style={{ textDecoration: 'none' }}>
                      <div className="emergency-btn" style={{ background: 'var(--brand-light)', borderColor: 'rgba(42,96,73,0.2)' }}>
                        <Phone size={20} strokeWidth={1.75} style={{ color: 'var(--on-tinted-brand)' }} />
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--on-tinted-brand)' }}>SNS 24</div>
                        <div style={{ fontSize: 10, color: 'var(--on-tinted-brand)', opacity: 0.7 }}>808 24 24 24</div>
                      </div>
                    </a>
                  </div>
                  {elderly?.emergency_contact_name && (
                    <a href={elderly.emergency_contact_phone ? `tel:${elderly.emergency_contact_phone}` : undefined} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
                        <UserIcon size={16} strokeWidth={1.75} style={{ color: 'var(--text-2)' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>{elderly.emergency_contact_name}</div>
                          {elderly.emergency_contact_phone && (
                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{elderly.emergency_contact_phone}</div>
                          )}
                        </div>
                      </div>
                    </a>
                  )}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
