'use client'
import { useEffect, useState } from 'react'
import { Pill, Plus, X, Zap, Trash2, BookOpen, RefreshCw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { api, getElderlyId } from '@/lib/api'
import type { Medication } from '@/lib/types'

const TIMES = ['06:00','07:00','08:00','09:00','10:00','12:00','13:00','14:00','16:00','18:00','20:00','21:00','22:00']

function renderDescription(text: string) {
  // Render the markdown-ish description: **Heading** then paragraph
  const parts: { heading?: string; body: string }[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  let current: { heading?: string; body: string } | null = null
  for (const line of lines) {
    const m = line.match(/^\*\*(.+?)\*\*:?(.*)$/)
    if (m) {
      if (current) parts.push(current)
      current = { heading: m[1].trim(), body: m[2].trim() }
    } else if (current) {
      current.body = current.body ? current.body + ' ' + line : line
    } else {
      parts.push({ body: line })
    }
  }
  if (current) parts.push(current)
  return parts
}

function MedicationInfoBlock({ med, onFetched }: { med: Medication; onFetched: () => void }) {
  const elderlyId = getElderlyId()
  const [open, setOpen] = useState(!!med.description)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchInfo(refresh = false) {
    if (!elderlyId) return
    setLoading(true)
    setError('')
    try {
      await api.fetchMedicationInfo(elderlyId, med.id, refresh)
      onFetched()
      setOpen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao obter informação')
    } finally {
      setLoading(false)
    }
  }

  if (!med.description) {
    return (
      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => fetchInfo(false)}
          disabled={loading}
          className="info-fetch-btn"
        >
          {loading
            ? <><Sparkles size={13} strokeWidth={2.25} /> A consultar…</>
            : <><BookOpen size={13} strokeWidth={2.25} /> Buscar informação clínica</>}
        </button>
        {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{error}</div>}
      </div>
    )
  }

  const parts = renderDescription(med.description)
  return (
    <div className="med-info" style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="med-info-toggle"
      >
        <BookOpen size={13} strokeWidth={2.25} />
        Informação clínica
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="med-info-body">
          {parts.map((p, i) => (
            <div key={i} className="med-info-section">
              {p.heading && <div className="med-info-heading">{p.heading}</div>}
              <div className="med-info-text">{p.body}</div>
            </div>
          ))}
          <button
            onClick={() => fetchInfo(true)}
            disabled={loading}
            className="med-info-refresh"
            title="Voltar a consultar"
          >
            <RefreshCw size={11} strokeWidth={2.25} /> {loading ? 'A actualizar…' : 'Actualizar'}
          </button>
          {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{error}</div>}
        </div>
      )}
    </div>
  )
}

export default function MedicacaoPage() {
  const [meds, setMeds] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', dosage: '', instructions: '', times: [] as string[], is_prn: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [prnLogging, setPrnLogging] = useState<number | null>(null)
  const elderlyId = getElderlyId()

  async function load() {
    if (!elderlyId) return
    setMeds(await api.listMedications(elderlyId))
    setLoading(false)
  }

  useEffect(() => { load() }, [elderlyId])

  function toggleTime(t: string) {
    setForm(f => ({
      ...f,
      times: f.times.includes(t) ? f.times.filter(x => x !== t) : [...f.times, t].sort(),
    }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    if (!form.is_prn && form.times.length === 0) { setError('Selecciona pelo menos um horário'); return }
    setSaving(true)
    setError('')
    try {
      await api.createMedication(elderlyId, {
        name: form.name,
        dosage: form.dosage,
        instructions: form.instructions || undefined,
        schedule_times: form.is_prn ? [] : form.times,
        is_prn: form.is_prn,
      })
      setForm({ name: '', dosage: '', instructions: '', times: [], is_prn: false })
      setShowForm(false)
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  async function takePrn(medId: number) {
    if (!elderlyId) return
    setPrnLogging(medId)
    try { await api.logPrn(elderlyId, medId) }
    catch { /* silent */ }
    finally { setPrnLogging(null) }
  }

  async function deactivate(medId: number) {
    if (!elderlyId || !confirm('Remover este medicamento?')) return
    await api.deleteMedication(elderlyId, medId)
    await load()
  }

  const active = meds.filter(m => m.is_active && !m.is_prn)
  const prn = meds.filter(m => m.is_active && m.is_prn)
  const inactive = meds.filter(m => !m.is_active)

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><Pill size={20} strokeWidth={2} /> Medicação</div>
          <div className="page-subtitle">{active.length + prn.length} medicamento{active.length + prn.length !== 1 ? 's' : ''} activo{active.length + prn.length !== 1 ? 's' : ''}{prn.length > 0 ? ` · ${prn.length} SOS` : ''}</div>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setError('') }}
          className={showForm ? 'btn-ghost' : 'btn-primary'}
          style={{ width: 'auto', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {showForm ? <><X size={15} strokeWidth={2.5} /> Cancelar</> : <><Plus size={15} strokeWidth={2.5} /> Adicionar</>}
        </button>
      </div>

      <div className="page-body">
        {showForm && (
          <form onSubmit={save} className="card card-lg" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="section-title" style={{ marginBottom: 4 }}>Novo medicamento</div>
            <div className="grid-2">
              <div>
                <label className="field-label">Nome do medicamento</label>
                <input className="field-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Omeprazol" required />
              </div>
              <div>
                <label className="field-label">Dosagem</label>
                <input className="field-input" value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="Ex: 20mg" required />
              </div>
            </div>
            <div>
              <label className="field-label">Instruções (opcional)</label>
              <input className="field-input" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Ex: Tomar em jejum" />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: form.is_prn ? 'var(--warning-light)' : 'var(--surface-2)', border: `1.5px solid ${form.is_prn ? '#D69E2E' : 'var(--border)'}`, borderRadius: 10, transition: 'all 0.15s' }}>
              <input type="checkbox" checked={form.is_prn} onChange={e => setForm(f => ({ ...f, is_prn: e.target.checked }))} style={{ width: 18, height: 18, accentColor: '#D69E2E' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: form.is_prn ? '#B7791F' : 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Zap size={15} strokeWidth={2.25} /> Medicamento SOS / PRN</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Tomar quando necessário - sem horário fixo</div>
              </div>
            </label>

            {!form.is_prn && (
              <div>
                <label className="field-label">Horários de toma</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {TIMES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTime(t)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        border: '1.5px solid',
                        borderColor: form.times.includes(t) ? 'var(--brand)' : 'var(--border)',
                        background: form.times.includes(t) ? 'var(--brand-light)' : 'var(--surface)',
                        color: form.times.includes(t) ? 'var(--brand)' : 'var(--text-3)',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {error && <div className="alert-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop: 4 }}>
              {saving ? 'A guardar…' : 'Guardar medicamento'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="loading" style={{ textAlign: 'center', padding: 48 }}>A carregar medicamentos…</p>
        ) : active.length === 0 && prn.length === 0 && !showForm ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon" style={{ color: 'var(--text-3)' }}><Pill size={42} strokeWidth={1.4} /></div>
              <div className="empty-state-title">Sem medicamentos registados</div>
              <div className="empty-state-text">Adicione os medicamentos do familiar para acompanhar as tomas diárias</div>
              <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 20, width: 'auto', padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={15} strokeWidth={2.5} /> Adicionar medicamento
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {prn.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#B7791F', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={12} strokeWidth={2.25} /> SOS / Quando necessário ({prn.length})
                </div>
                {prn.map(med => (
                  <div key={med.id} className="card" style={{ borderLeft: '3px solid #D69E2E' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                          <div className="med-name">{med.name}</div>
                          <span style={{ background: 'var(--warning-light)', color: '#B7791F', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 99 }}>{med.dosage}</span>
                          <span style={{ background: 'var(--warning-light)', color: '#B7791F', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>PRN</span>
                        </div>
                        {med.instructions && (
                          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6, fontStyle: 'italic' }}>{med.instructions}</div>
                        )}
                        <MedicationInfoBlock med={med} onFetched={load} />
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                        <button
                          onClick={() => takePrn(med.id)}
                          disabled={prnLogging === med.id}
                          style={{ background: 'var(--warning-light)', color: '#B7791F', border: '1.5px solid #D69E2E', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                        >
                          {prnLogging === med.id ? '…' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Zap size={13} strokeWidth={2.25} /> Tomar agora</span>}
                        </button>
                        <button onClick={() => deactivate(med.id)} className="btn-danger-ghost" title="Remover"><Trash2 size={15} strokeWidth={2} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {active.length > 0 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4 }}>
                    Horário fixo ({active.length})
                  </div>
                )}
              </>
            )}
            {active.map(med => (
              <div key={med.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <div className="med-name">{med.name}</div>
                      <span style={{ background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 99 }}>
                        {med.dosage}
                      </span>
                    </div>
                    {med.instructions && (
                      <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8, fontStyle: 'italic' }}>{med.instructions}</div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {med.schedule_times.map(t => (
                        <span key={t} className="time-chip">{t}</span>
                      ))}
                    </div>
                    <MedicationInfoBlock med={med} onFetched={load} />
                  </div>
                  <button
                    onClick={() => deactivate(med.id)}
                    className="btn-danger-ghost"
                    title="Remover medicamento"
                    style={{ marginLeft: 8 }}
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}

            {inactive.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '8px 0 4px' }}>
                  Inactivos
                </div>
                {inactive.map(med => (
                  <div key={med.id} className="card" style={{ opacity: 0.5 }}>
                    <div className="med-name" style={{ fontSize: 15 }}>{med.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{med.dosage}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
