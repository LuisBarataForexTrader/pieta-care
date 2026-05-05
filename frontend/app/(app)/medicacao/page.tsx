'use client'
import { useEffect, useState } from 'react'
import { api, getElderlyId } from '@/lib/api'
import type { Medication } from '@/lib/types'

const TIMES = ['06:00','07:00','08:00','09:00','10:00','12:00','13:00','14:00','16:00','18:00','20:00','21:00','22:00']

export default function MedicacaoPage() {
  const [meds, setMeds] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', dosage: '', instructions: '', times: [] as string[] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
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
    if (form.times.length === 0) { setError('Selecciona pelo menos um horário'); return }
    setSaving(true)
    setError('')
    try {
      await api.createMedication(elderlyId, {
        name: form.name,
        dosage: form.dosage,
        instructions: form.instructions || undefined,
        schedule_times: form.times,
      })
      setForm({ name: '', dosage: '', instructions: '', times: [] })
      setShowForm(false)
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  async function deactivate(medId: number) {
    if (!elderlyId || !confirm('Remover este medicamento?')) return
    await api.deleteMedication(elderlyId, medId)
    await load()
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Medicação</h1>
          <button
            onClick={() => { setShowForm(v => !v); setError('') }}
            style={{ background: 'var(--sage)', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            {showForm ? '✕' : '+ Adicionar'}
          </button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {showForm && (
          <form onSubmit={save} className="card" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Novo medicamento</h2>
            <div>
              <label className="label">Nome</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Omeprazol" required />
            </div>
            <div>
              <label className="label">Dosagem</label>
              <input className="input" value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="Ex: 20mg" required />
            </div>
            <div>
              <label className="label">Instruções (opcional)</label>
              <input className="input" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Ex: Tomar em jejum" />
            </div>
            <div>
              <label className="label">Horários</label>
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
                      borderColor: form.times.includes(t) ? 'var(--sage)' : 'var(--border)',
                      background: form.times.includes(t) ? 'var(--sage-light)' : 'white',
                      color: form.times.includes(t) ? 'var(--sage-dark)' : 'var(--muted)',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14, margin: 0 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'A guardar…' : 'Guardar medicamento'}
            </button>
          </form>
        )}

        {loading ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 32 }}>A carregar…</p>
        ) : meds.length === 0 && !showForm ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
            <p style={{ fontWeight: 600 }}>Sem medicamentos</p>
            <p style={{ fontSize: 14 }}>Clica em "+ Adicionar" para começar</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meds.map(med => (
              <div key={med.id} className="card" style={{ opacity: med.is_active ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{med.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 2 }}>{med.dosage}</div>
                    {med.instructions && (
                      <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3, fontStyle: 'italic' }}>{med.instructions}</div>
                    )}
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {med.schedule_times.map(t => (
                        <span key={t} style={{ background: 'var(--sage-light)', color: 'var(--sage-dark)', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  {med.is_active && (
                    <button
                      onClick={() => deactivate(med.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', padding: '0 0 0 12px', flexShrink: 0 }}
                      title="Remover"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
