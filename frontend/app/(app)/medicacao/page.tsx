'use client'
import { useEffect, useState } from 'react'
import { api, getElderlyId } from '@/lib/api'
import type { Medication } from '@/lib/types'

const TIMES = ['06:00','07:00','08:00','09:00','10:00','12:00','13:00','14:00','16:00','18:00','20:00','21:00','22:00']

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
          <div className="page-title">💊 Medicação</div>
          <div className="page-subtitle">{active.length + prn.length} medicamento{active.length + prn.length !== 1 ? 's' : ''} activo{active.length + prn.length !== 1 ? 's' : ''}{prn.length > 0 ? ` · ${prn.length} SOS` : ''}</div>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: form.is_prn ? '#FFFAF0' : 'var(--surface-2)', border: `1.5px solid ${form.is_prn ? '#D69E2E' : 'var(--border)'}`, borderRadius: 10, transition: 'all 0.15s' }}>
              <input type="checkbox" checked={form.is_prn} onChange={e => setForm(f => ({ ...f, is_prn: e.target.checked }))} style={{ width: 18, height: 18, accentColor: '#D69E2E' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: form.is_prn ? '#B7791F' : 'var(--text)' }}>⚡ Medicamento SOS / PRN</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Tomar quando necessário — sem horário fixo</div>
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
              <div className="empty-state-icon">💊</div>
              <div className="empty-state-title">Sem medicamentos registados</div>
              <div className="empty-state-text">Adiciona os medicamentos do familiar para acompanhar as tomas diárias</div>
              <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 20, width: 'auto', padding: '10px 24px' }}>
                + Adicionar medicamento
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {prn.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#B7791F', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  ⚡ SOS / Quando necessário ({prn.length})
                </div>
                {prn.map(med => (
                  <div key={med.id} className="card" style={{ borderLeft: '3px solid #D69E2E' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <div className="med-name">{med.name}</div>
                          <span style={{ background: '#FFFAF0', color: '#B7791F', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 99 }}>{med.dosage}</span>
                          <span style={{ background: '#FFFAF0', color: '#B7791F', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>PRN</span>
                        </div>
                        {med.instructions && (
                          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10, fontStyle: 'italic' }}>{med.instructions}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                        <button
                          onClick={() => takePrn(med.id)}
                          disabled={prnLogging === med.id}
                          style={{ background: '#FFFAF0', color: '#B7791F', border: '1.5px solid #D69E2E', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                        >
                          {prnLogging === med.id ? '…' : '⚡ Tomar agora'}
                        </button>
                        <button onClick={() => deactivate(med.id)} className="btn-danger-ghost" title="Remover">🗑</button>
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
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <div className="med-name">{med.name}</div>
                      <span style={{ background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 99 }}>
                        {med.dosage}
                      </span>
                    </div>
                    {med.instructions && (
                      <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10, fontStyle: 'italic' }}>{med.instructions}</div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {med.schedule_times.map(t => (
                        <span key={t} className="time-chip">{t}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => deactivate(med.id)}
                    className="btn-danger-ghost"
                    title="Remover medicamento"
                    style={{ marginLeft: 8 }}
                  >
                    🗑
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
