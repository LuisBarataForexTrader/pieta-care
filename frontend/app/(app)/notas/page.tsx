'use client'
import { useEffect, useState } from 'react'
import { FileText, Sunrise, Sun, Moon } from 'lucide-react'
import { api, getElderlyId } from '@/lib/api'
import type { DailyNote } from '@/lib/types'

const SHIFT_LABEL: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' }
function ShiftIcon({ shift, size = 18 }: { shift: string; size?: number }) {
  const props = { size, strokeWidth: 1.75 }
  if (shift === 'manha') return <Sunrise {...props} />
  if (shift === 'tarde') return <Sun {...props} />
  return <Moon {...props} />
}
const SHIFT_COLOR: Record<string, string> = { manha: '#D69E2E', tarde: '#DD6B20', noite: '#553C9A' }
const SHIFT_BG: Record<string, string> = { manha: 'var(--warning-light)', tarde: '#FFF5F0', noite: '#F5F3FF' }

const MOOD_LABEL: Record<string, string> = {
  alegre: '😄 Alegre', calmo: '😊 Calmo', ansioso: '😟 Ansioso',
  agitado: '😠 Agitado', triste: '😢 Triste', confuso: '😵 Confuso',
}
const MOODS = Object.keys(MOOD_LABEL)

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
}

function groupByDate(notes: DailyNote[]) {
  const map = new Map<string, DailyNote[]>()
  for (const n of notes) {
    const key = n.note_date
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(n)
  }
  return map
}

export default function NotasPage() {
  const [notes, setNotes] = useState<DailyNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [days, setDays] = useState(14)
  const elderlyId = getElderlyId()

  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    note_date: today,
    shift: 'manha',
    content: '',
    mood_observed: '' as string,
  })

  async function load() {
    if (!elderlyId) return
    setLoading(true)
    setNotes(await api.listNotes(elderlyId, days))
    setLoading(false)
  }
  useEffect(() => { load() }, [elderlyId, days])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    setSaving(true); setError('')
    try {
      await api.createNote(elderlyId, {
        note_date: form.note_date,
        shift: form.shift,
        content: form.content,
        mood_observed: form.mood_observed || undefined,
      })
      setForm({ note_date: today, shift: 'manha', content: '', mood_observed: '' })
      setShowForm(false)
      await load()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro') }
    finally { setSaving(false) }
  }

  async function del(id: number) {
    if (!elderlyId || !confirm('Apagar nota?')) return
    await api.deleteNote(elderlyId, id)
    await load()
  }

  const grouped = groupByDate(notes)

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title">Notas de Turno</div>
          <div className="page-subtitle">{notes.length} nota{notes.length !== 1 ? 's' : ''} nos últimos {days} dias</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="field-input"
            style={{ width: 'auto', padding: '10px 14px', fontSize: 13 }}
          >
            <option value={7}>7 dias</option>
            <option value={14}>14 dias</option>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
          </select>
          <button onClick={() => { setShowForm(v => !v); setError('') }} className={showForm ? 'btn-ghost' : 'btn-primary'} style={{ width: 'auto', padding: '10px 20px' }}>
            {showForm ? '✕ Cancelar' : '+ Registar nota'}
          </button>
        </div>
      </div>

      <div className="page-body">
        {showForm && (
          <form onSubmit={save} className="card card-lg" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="section-title">Nova nota de turno</div>

            <div className="grid-2">
              <div>
                <label className="field-label">Data</label>
                <input className="field-input" type="date" value={form.note_date} onChange={e => setForm(f => ({ ...f, note_date: e.target.value }))} required />
              </div>
              <div>
                <label className="field-label">Turno</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {(['manha', 'tarde', 'noite'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, shift: s }))}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: 10,
                        border: `2px solid ${form.shift === s ? SHIFT_COLOR[s] : 'var(--border)'}`,
                        background: form.shift === s ? SHIFT_BG[s] : 'var(--surface)',
                        cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        color: form.shift === s ? SHIFT_COLOR[s] : 'var(--text-3)',
                      }}
                    >
                      <ShiftIcon shift={s} size={13} /> {SHIFT_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="field-label">Estado observado (opcional)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {MOODS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, mood_observed: f.mood_observed === m ? '' : m }))}
                    style={{
                      padding: '7px 14px', borderRadius: 20,
                      border: `1.5px solid ${form.mood_observed === m ? 'var(--brand)' : 'var(--border)'}`,
                      background: form.mood_observed === m ? 'var(--brand-light)' : 'var(--surface)',
                      color: form.mood_observed === m ? 'var(--brand)' : 'var(--text-3)',
                      cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    }}
                  >
                    {MOOD_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">Nota de turno</label>
              <textarea
                className="field-input"
                rows={4}
                placeholder="Como correu o turno? Alimentação, sono, higiene, comportamento, medicação…"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                required
              />
            </div>

            {error && <div className="alert-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : 'Guardar nota'}</button>
          </form>
        )}

        {loading ? (
          <p className="loading" style={{ textAlign: 'center', padding: 48 }}>A carregar…</p>
        ) : notes.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon" style={{ color: 'var(--text-3)' }}><FileText size={42} strokeWidth={1.4} /></div>
              <div className="empty-state-title">Sem notas registadas</div>
              <div className="empty-state-text">Regista as observações de cada turno — alimentação, sono, comportamento, eventos relevantes</div>
              <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 20, width: 'auto', padding: '10px 24px' }}>+ Registar nota</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[...grouped.entries()].map(([dateKey, dayNotes]) => (
              <div key={dateKey}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'capitalize', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                  {fmtDate(dateKey)}
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dayNotes.map(note => (
                    <div key={note.id} className="card" style={{ borderLeft: `3px solid ${SHIFT_COLOR[note.shift]}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                          <span style={{ width: 38, height: 38, borderRadius: 10, background: SHIFT_BG[note.shift], display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: SHIFT_COLOR[note.shift], flexShrink: 0 }}><ShiftIcon shift={note.shift} size={17} /></span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                              <span style={{ background: SHIFT_BG[note.shift], color: SHIFT_COLOR[note.shift], fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 99 }}>
                                {SHIFT_LABEL[note.shift]}
                              </span>
                              {note.mood_observed && (
                                <span style={{ fontSize: 13 }}>{MOOD_LABEL[note.mood_observed]}</span>
                              )}
                              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>por {note.recorded_by_name}</span>
                            </div>
                            <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{note.content}</div>
                          </div>
                        </div>
                        <button onClick={() => del(note.id)} className="btn-danger-ghost" style={{ marginLeft: 8, flexShrink: 0 }}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
