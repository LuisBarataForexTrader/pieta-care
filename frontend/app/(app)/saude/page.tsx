'use client'
import { useEffect, useState } from 'react'
import { api, getElderlyId } from '@/lib/api'
import type { VitalSign, WellbeingLog } from '@/lib/types'

// ── Reference ranges ────────────────────────────────────
function bpColor(sys: number | null, dia: number | null) {
  if (!sys || !dia) return 'var(--text-3)'
  if (sys < 120 && dia < 80) return 'var(--success)'
  if (sys < 130 && dia < 80) return '#D69E2E'
  if (sys < 140 || dia < 90) return 'var(--warning)'
  return 'var(--danger)'
}
function hrColor(v: number | null) {
  if (!v) return 'var(--text-3)'
  return v >= 60 && v <= 100 ? 'var(--success)' : v >= 50 && v <= 110 ? '#D69E2E' : 'var(--danger)'
}
function tempColor(v: number | null) {
  if (!v) return 'var(--text-3)'
  return v < 37.3 ? 'var(--success)' : v < 38 ? '#D69E2E' : 'var(--danger)'
}
function spo2Color(v: number | null) {
  if (!v) return 'var(--text-3)'
  return v >= 95 ? 'var(--success)' : v >= 92 ? '#D69E2E' : 'var(--danger)'
}
function glucoseColor(v: number | null) {
  if (!v) return 'var(--text-3)'
  return v >= 70 && v <= 140 ? 'var(--success)' : v < 70 || v > 200 ? 'var(--danger)' : '#D69E2E'
}

const MOOD_EMOJI = ['', '😞', '😟', '😐', '🙂', '😄']
const MOOD_LABEL = ['', 'Muito mal', 'Mal', 'Regular', 'Bem', 'Muito bem']
const MOOD_COLOR = ['', 'var(--danger)', '#D69E2E', '#64748B', 'var(--success)', 'var(--brand)']

function fmtDT(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
}

// ── Mini sparkline ──────────────────────────────────────
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 80, H = 28, pad = 3
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - 2 * pad)
    const y = H - pad - ((v - min) / range) * (H - 2 * pad)
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(' ').pop()?.split(',')[0]} cy={pts.split(' ').pop()?.split(',')[1]} r={3} fill={color} />
    </svg>
  )
}

export default function SaudePage() {
  const [tab, setTab] = useState<'vitais' | 'bemestar'>('vitais')
  const [vitals, setVitals] = useState<VitalSign[]>([])
  const [wellbeing, setWellbeing] = useState<WellbeingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showVitalForm, setShowVitalForm] = useState(false)
  const [showMoodForm, setShowMoodForm] = useState(false)
  const [todayLog, setTodayLog] = useState<WellbeingLog | null>(null)

  // vital form
  const [vForm, setVForm] = useState({
    measured_at: new Date().toISOString().slice(0, 16),
    blood_pressure_sys: '', blood_pressure_dia: '',
    heart_rate: '', temperature: '', weight: '',
    oxygen_saturation: '', blood_glucose: '', notes: '',
  })

  // wellbeing form
  const [wForm, setWForm] = useState({ mood: 3, energy: 3, pain_level: 0, appetite: 3, notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const elderlyId = getElderlyId()

  async function load() {
    if (!elderlyId) return
    const [vs, wb, today] = await Promise.all([
      api.listVitals(elderlyId, 60),
      api.listWellbeing(elderlyId, 60),
      api.todayWellbeing(elderlyId),
    ])
    setVitals(vs)
    setWellbeing(wb)
    setTodayLog(today)
    setLoading(false)
  }
  useEffect(() => { load() }, [elderlyId])

  async function saveVital(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    setSaving(true); setError('')
    try {
      const payload: Record<string, string | number | null> = { measured_at: vForm.measured_at }
      if (vForm.blood_pressure_sys) payload.blood_pressure_sys = Number(vForm.blood_pressure_sys)
      if (vForm.blood_pressure_dia) payload.blood_pressure_dia = Number(vForm.blood_pressure_dia)
      if (vForm.heart_rate) payload.heart_rate = Number(vForm.heart_rate)
      if (vForm.temperature) payload.temperature = Number(vForm.temperature)
      if (vForm.weight) payload.weight = Number(vForm.weight)
      if (vForm.oxygen_saturation) payload.oxygen_saturation = Number(vForm.oxygen_saturation)
      if (vForm.blood_glucose) payload.blood_glucose = Number(vForm.blood_glucose)
      if (vForm.notes) payload.notes = vForm.notes
      await api.createVital(elderlyId, payload)
      setVForm({ measured_at: new Date().toISOString().slice(0, 16), blood_pressure_sys: '', blood_pressure_dia: '', heart_rate: '', temperature: '', weight: '', oxygen_saturation: '', blood_glucose: '', notes: '' })
      setShowVitalForm(false)
      await load()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro') }
    finally { setSaving(false) }
  }

  async function saveMood(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    setSaving(true); setError('')
    try {
      await api.logWellbeing(elderlyId, { logged_date: new Date().toISOString().split('T')[0], ...wForm })
      setShowMoodForm(false)
      await load()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro') }
    finally { setSaving(false) }
  }

  const latest = vitals[0]
  const bpSeries = vitals.filter(v => v.blood_pressure_sys).map(v => v.blood_pressure_sys!).reverse()
  const hrSeries = vitals.filter(v => v.heart_rate).map(v => v.heart_rate!).reverse()
  const weightSeries = vitals.filter(v => v.weight).map(v => Number(v.weight)).reverse()
  const spo2Series = vitals.filter(v => v.oxygen_saturation).map(v => v.oxygen_saturation!).reverse()

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title">🩺 Saúde</div>
          <div className="page-subtitle">Sinais vitais e bem-estar diário</div>
        </div>
        <button
          onClick={() => { tab === 'vitais' ? setShowVitalForm(v => !v) : setShowMoodForm(v => !v); setError('') }}
          className={showVitalForm || showMoodForm ? 'btn-ghost' : 'btn-primary'}
          style={{ width: 'auto', padding: '10px 20px' }}
        >
          {showVitalForm || showMoodForm ? '✕ Cancelar' : tab === 'vitais' ? '+ Registar sinais vitais' : '+ Registar bem-estar'}
        </button>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
          {(['vitais', 'bemestar'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? 'var(--brand)' : 'transparent', border: 'none', borderRadius: 9, padding: '8px 22px', fontWeight: 700, color: tab === t ? 'white' : 'var(--text-3)', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }}>
              {t === 'vitais' ? '❤️ Sinais Vitais' : '😊 Bem-estar'}
            </button>
          ))}
        </div>

        {/* ── VITAIS TAB ─────────────────────────────────── */}
        {tab === 'vitais' && (
          <>
            {showVitalForm && (
              <form onSubmit={saveVital} className="card card-lg" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="section-title">Novo registo de sinais vitais</div>
                <div>
                  <label className="field-label">Data e hora</label>
                  <input className="field-input" type="datetime-local" value={vForm.measured_at} onChange={e => setVForm(f => ({ ...f, measured_at: e.target.value }))} required />
                </div>
                <div className="grid-2">
                  <div>
                    <label className="field-label">Tensão arterial sistólica (mmHg)</label>
                    <input className="field-input" type="number" placeholder="Ex: 120" min={50} max={300} value={vForm.blood_pressure_sys} onChange={e => setVForm(f => ({ ...f, blood_pressure_sys: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Tensão arterial diastólica (mmHg)</label>
                    <input className="field-input" type="number" placeholder="Ex: 80" min={30} max={200} value={vForm.blood_pressure_dia} onChange={e => setVForm(f => ({ ...f, blood_pressure_dia: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Frequência cardíaca (bpm)</label>
                    <input className="field-input" type="number" placeholder="Ex: 72" min={20} max={300} value={vForm.heart_rate} onChange={e => setVForm(f => ({ ...f, heart_rate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Temperatura (°C)</label>
                    <input className="field-input" type="number" step="0.1" placeholder="Ex: 36.5" min={30} max={45} value={vForm.temperature} onChange={e => setVForm(f => ({ ...f, temperature: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Peso (kg)</label>
                    <input className="field-input" type="number" step="0.1" placeholder="Ex: 72.5" min={10} max={300} value={vForm.weight} onChange={e => setVForm(f => ({ ...f, weight: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Saturação O₂ (%)</label>
                    <input className="field-input" type="number" placeholder="Ex: 98" min={50} max={100} value={vForm.oxygen_saturation} onChange={e => setVForm(f => ({ ...f, oxygen_saturation: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Glicemia (mg/dL)</label>
                    <input className="field-input" type="number" placeholder="Ex: 95" min={20} max={600} value={vForm.blood_glucose} onChange={e => setVForm(f => ({ ...f, blood_glucose: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Notas</label>
                    <input className="field-input" placeholder="Observações adicionais…" value={vForm.notes} onChange={e => setVForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                {error && <div className="alert-error">{error}</div>}
                <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : 'Guardar medição'}</button>
              </form>
            )}

            {loading ? <p className="loading" style={{ textAlign: 'center', padding: 48 }}>A carregar…</p> : vitals.length === 0 ? (
              <div className="card"><div className="empty-state"><div className="empty-state-icon">❤️</div><div className="empty-state-title">Sem medições registadas</div><div className="empty-state-text">Regista sinais vitais para acompanhar a evolução da saúde</div><button className="btn-primary" onClick={() => setShowVitalForm(true)} style={{ marginTop: 20, width: 'auto', padding: '10px 24px' }}>+ Registar agora</button></div></div>
            ) : (
              <>
                {/* Latest reading cards */}
                {latest && (
                  <div className="grid-2" style={{ marginBottom: 20 }}>
                    {latest.blood_pressure_sys && latest.blood_pressure_dia && (
                      <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#FFF5F5' }}>🫀</div>
                        <div style={{ flex: 1 }}>
                          <div className="stat-label">Tensão arterial</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: bpColor(latest.blood_pressure_sys, latest.blood_pressure_dia) }}>
                            {latest.blood_pressure_sys}/{latest.blood_pressure_dia}
                          </div>
                          <div className="stat-sub">mmHg · {fmtDT(latest.measured_at)}</div>
                          <Sparkline values={bpSeries} color={bpColor(latest.blood_pressure_sys, latest.blood_pressure_dia)} />
                        </div>
                      </div>
                    )}
                    {latest.heart_rate && (
                      <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#FFF5F5' }}>💓</div>
                        <div style={{ flex: 1 }}>
                          <div className="stat-label">Frequência cardíaca</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: hrColor(latest.heart_rate) }}>{latest.heart_rate}</div>
                          <div className="stat-sub">bpm · {fmtDT(latest.measured_at)}</div>
                          <Sparkline values={hrSeries} color={hrColor(latest.heart_rate)} />
                        </div>
                      </div>
                    )}
                    {latest.oxygen_saturation && (
                      <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#EEF2FF' }}>🫁</div>
                        <div style={{ flex: 1 }}>
                          <div className="stat-label">Saturação O₂</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: spo2Color(latest.oxygen_saturation) }}>{latest.oxygen_saturation}%</div>
                          <div className="stat-sub">{fmtDT(latest.measured_at)}</div>
                          <Sparkline values={spo2Series} color={spo2Color(latest.oxygen_saturation)} />
                        </div>
                      </div>
                    )}
                    {latest.temperature && (
                      <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#FFFAF0' }}>🌡️</div>
                        <div style={{ flex: 1 }}>
                          <div className="stat-label">Temperatura</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: tempColor(latest.temperature) }}>{Number(latest.temperature).toFixed(1)}°C</div>
                          <div className="stat-sub">{fmtDT(latest.measured_at)}</div>
                        </div>
                      </div>
                    )}
                    {latest.weight && (
                      <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'var(--brand-light)' }}>⚖️</div>
                        <div style={{ flex: 1 }}>
                          <div className="stat-label">Peso</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{Number(latest.weight).toFixed(1)}</div>
                          <div className="stat-sub">kg · {fmtDT(latest.measured_at)}</div>
                          <Sparkline values={weightSeries} color="var(--brand)" />
                        </div>
                      </div>
                    )}
                    {latest.blood_glucose && (
                      <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#FFFAF0' }}>🩸</div>
                        <div style={{ flex: 1 }}>
                          <div className="stat-label">Glicemia</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: glucoseColor(latest.blood_glucose) }}>{Number(latest.blood_glucose).toFixed(0)}</div>
                          <div className="stat-sub">mg/dL · {fmtDT(latest.measured_at)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* History table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="section-title">Histórico de medições</div>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{vitals.length} registos</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                          {['Data / Hora', 'T.A.', 'F.C.', 'Temp.', 'Peso', 'SpO₂', 'Glicemia', 'Notas', ''].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {vitals.map((v, i) => (
                          <tr key={v.id} style={{ borderBottom: i < vitals.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <td style={{ padding: '12px', whiteSpace: 'nowrap', color: 'var(--text-3)', fontSize: 12 }}>{fmtDT(v.measured_at)}</td>
                            <td style={{ padding: '12px', fontWeight: 700, color: bpColor(v.blood_pressure_sys, v.blood_pressure_dia) }}>
                              {v.blood_pressure_sys && v.blood_pressure_dia ? `${v.blood_pressure_sys}/${v.blood_pressure_dia}` : '—'}
                            </td>
                            <td style={{ padding: '12px', fontWeight: 600, color: hrColor(v.heart_rate) }}>{v.heart_rate ?? '—'}</td>
                            <td style={{ padding: '12px', color: tempColor(v.temperature) }}>{v.temperature ? `${Number(v.temperature).toFixed(1)}°` : '—'}</td>
                            <td style={{ padding: '12px' }}>{v.weight ? `${Number(v.weight).toFixed(1)} kg` : '—'}</td>
                            <td style={{ padding: '12px', color: spo2Color(v.oxygen_saturation) }}>{v.oxygen_saturation ? `${v.oxygen_saturation}%` : '—'}</td>
                            <td style={{ padding: '12px', color: glucoseColor(v.blood_glucose) }}>{v.blood_glucose ? `${Number(v.blood_glucose).toFixed(0)} mg/dL` : '—'}</td>
                            <td style={{ padding: '12px', color: 'var(--text-3)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.notes ?? '—'}</td>
                            <td style={{ padding: '12px' }}>
                              <button onClick={() => { if (confirm('Apagar medição?')) { api.deleteVital(elderlyId!, v.id).then(load) } }} className="btn-danger-ghost">🗑</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── BEM-ESTAR TAB ──────────────────────────────── */}
        {tab === 'bemestar' && (
          <>
            {showMoodForm && (
              <form onSubmit={saveMood} className="card card-lg" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="section-title">Como está hoje?</div>

                {/* Mood picker */}
                <div>
                  <label className="field-label">Humor geral</label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setWForm(f => ({ ...f, mood: n }))} style={{ flex: 1, padding: '16px 8px', borderRadius: 12, border: `2px solid ${wForm.mood === n ? MOOD_COLOR[n] : 'var(--border)'}`, background: wForm.mood === n ? `${MOOD_COLOR[n]}18` : 'var(--surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
                        <span style={{ fontSize: 28 }}>{MOOD_EMOJI[n]}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: wForm.mood === n ? MOOD_COLOR[n] : 'var(--text-3)' }}>{MOOD_LABEL[n]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid-2">
                  {/* Energy */}
                  <div>
                    <label className="field-label">Energia (1-5)</label>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} type="button" onClick={() => setWForm(f => ({ ...f, energy: n }))} style={{ flex: 1, padding: '10px 4px', borderRadius: 8, border: `2px solid ${wForm.energy === n ? 'var(--brand)' : 'var(--border)'}`, background: wForm.energy === n ? 'var(--brand-light)' : 'var(--surface)', cursor: 'pointer', fontWeight: 800, fontSize: 14, color: wForm.energy === n ? 'var(--brand)' : 'var(--text-3)', transition: 'all 0.15s' }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Appetite */}
                  <div>
                    <label className="field-label">Apetite (1-5)</label>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} type="button" onClick={() => setWForm(f => ({ ...f, appetite: n }))} style={{ flex: 1, padding: '10px 4px', borderRadius: 8, border: `2px solid ${wForm.appetite === n ? 'var(--brand)' : 'var(--border)'}`, background: wForm.appetite === n ? 'var(--brand-light)' : 'var(--surface)', cursor: 'pointer', fontWeight: 800, fontSize: 14, color: wForm.appetite === n ? 'var(--brand)' : 'var(--text-3)', transition: 'all 0.15s' }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pain slider */}
                <div>
                  <label className="field-label">Dor (0 = sem dor · 10 = dor máxima): <strong style={{ color: wForm.pain_level > 6 ? 'var(--danger)' : wForm.pain_level > 3 ? 'var(--warning)' : 'var(--success)' }}>{wForm.pain_level}</strong></label>
                  <input type="range" min={0} max={10} value={wForm.pain_level} onChange={e => setWForm(f => ({ ...f, pain_level: Number(e.target.value) }))} style={{ width: '100%', marginTop: 8, accentColor: 'var(--brand)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                    <span>Sem dor</span><span>Dor máxima</span>
                  </div>
                </div>

                <div>
                  <label className="field-label">Observações (opcional)</label>
                  <textarea className="field-input" rows={2} placeholder="Como correu o dia? Algo relevante a notar…" value={wForm.notes} onChange={e => setWForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                {error && <div className="alert-error">{error}</div>}
                <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : 'Guardar registo'}</button>
              </form>
            )}

            {/* Today's check-in */}
            {todayLog && !showMoodForm && (
              <div className="card" style={{ marginBottom: 20, background: 'var(--brand-light)', border: '1px solid rgba(42,96,73,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 48 }}>{MOOD_EMOJI[todayLog.mood]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Check-in de hoje</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: MOOD_COLOR[todayLog.mood] }}>{MOOD_LABEL[todayLog.mood]}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, display: 'flex', gap: 12 }}>
                      {todayLog.energy && <span>⚡ Energia: {todayLog.energy}/5</span>}
                      {todayLog.appetite && <span>🍽 Apetite: {todayLog.appetite}/5</span>}
                      {todayLog.pain_level !== null && <span>🩹 Dor: {todayLog.pain_level}/10</span>}
                    </div>
                    {todayLog.notes && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, fontStyle: 'italic' }}>"{todayLog.notes}"</div>}
                  </div>
                  <button onClick={() => setShowMoodForm(true)} className="btn-ghost" style={{ fontSize: 13 }}>Editar</button>
                </div>
              </div>
            )}

            {loading ? <p className="loading" style={{ textAlign: 'center', padding: 48 }}>A carregar…</p> : wellbeing.length === 0 ? (
              <div className="card"><div className="empty-state"><div className="empty-state-icon">😊</div><div className="empty-state-title">Sem registos de bem-estar</div><div className="empty-state-text">Regista diariamente como o familiar se sente para identificar tendências</div><button className="btn-primary" onClick={() => setShowMoodForm(true)} style={{ marginTop: 20, width: 'auto', padding: '10px 24px' }}>+ Registar agora</button></div></div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {wellbeing.map((w, i) => (
                  <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < wellbeing.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 32, minWidth: 40, textAlign: 'center' }}>{MOOD_EMOJI[w.mood]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700, color: MOOD_COLOR[w.mood] }}>{MOOD_LABEL[w.mood]}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{new Date(w.logged_date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, display: 'flex', gap: 10 }}>
                        {w.energy && <span>⚡ {w.energy}/5</span>}
                        {w.appetite && <span>🍽 {w.appetite}/5</span>}
                        {w.pain_level !== null && w.pain_level > 0 && <span style={{ color: w.pain_level > 6 ? 'var(--danger)' : w.pain_level > 3 ? 'var(--warning)' : 'var(--text-3)' }}>🩹 Dor {w.pain_level}/10</span>}
                        <span>por {w.recorded_by_name}</span>
                      </div>
                      {w.notes && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, fontStyle: 'italic' }}>"{w.notes}"</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
