'use client'
import { useEffect, useState } from 'react'
import { api, getElderlyId } from '@/lib/api'
import type { CarePlanItem } from '@/lib/types'

const CAT_LABEL: Record<string, string> = {
  higiene: 'Higiene e Conforto',
  nutricao: 'Nutrição e Hidratação',
  mobilidade: 'Mobilidade e Exercício',
  social: 'Actividades Sociais',
  medico: 'Cuidados Médicos',
  outro: 'Outro',
}
const CAT_ICON: Record<string, string> = {
  higiene: '🛁', nutricao: '🍽️', mobilidade: '🚶', social: '👥', medico: '💊', outro: '📋',
}
const CAT_COLOR: Record<string, string> = {
  higiene: '#2B6CB0', nutricao: '#276749', mobilidade: '#C05621', social: '#553C9A', medico: '#C53030', outro: '#4A5568',
}
const CAT_BG: Record<string, string> = {
  higiene: '#EBF8FF', nutricao: 'var(--success-light)', mobilidade: 'var(--warning-light)', social: '#F5F3FF', medico: '#FFF5F5', outro: 'var(--surface-2)',
}
const FREQ_LABEL: Record<string, string> = {
  diario: 'Diário', semanal: 'Semanal', mensal: 'Mensal', conforme_necessario: 'Conforme necessário',
}

const CATEGORIES = Object.keys(CAT_LABEL)

export default function PlanoPage() {
  const [items, setItems] = useState<CarePlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const elderlyId = getElderlyId()

  const [form, setForm] = useState({
    category: 'higiene',
    title: '',
    description: '',
    frequency: 'diario',
  })

  async function load() {
    if (!elderlyId) return
    setLoading(true)
    setItems(await api.listCarePlan(elderlyId, showInactive))
    setLoading(false)
  }
  useEffect(() => { load() }, [elderlyId, showInactive])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    setSaving(true); setError('')
    try {
      await api.createCarePlanItem(elderlyId, {
        category: form.category,
        title: form.title,
        description: form.description || undefined,
        frequency: form.frequency,
      })
      setForm({ category: 'higiene', title: '', description: '', frequency: 'diario' })
      setShowForm(false)
      await load()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro') }
    finally { setSaving(false) }
  }

  async function toggleActive(item: CarePlanItem) {
    if (!elderlyId) return
    await api.updateCarePlanItem(elderlyId, item.id, { is_active: !item.is_active })
    await load()
  }

  async function del(id: number) {
    if (!elderlyId || !confirm('Remover este item do plano?')) return
    await api.deleteCarePlanItem(elderlyId, id)
    await load()
  }

  const active = items.filter(i => i.is_active)
  const inactive = items.filter(i => !i.is_active)

  // group active by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = active.filter(i => i.category === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {} as Record<string, CarePlanItem[]>)

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title">🗂️ Plano de Cuidados</div>
          <div className="page-subtitle">{active.length} item{active.length !== 1 ? 's' : ''} activo{active.length !== 1 ? 's' : ''}{inactive.length > 0 ? ` · ${inactive.length} inactivo${inactive.length !== 1 ? 's' : ''}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {inactive.length > 0 && (
            <button onClick={() => setShowInactive(v => !v)} className="btn-ghost" style={{ width: 'auto', padding: '10px 16px', fontSize: 13 }}>
              {showInactive ? 'Ocultar inactivos' : 'Ver inactivos'}
            </button>
          )}
          <button onClick={() => { setShowForm(v => !v); setError('') }} className={showForm ? 'btn-ghost' : 'btn-primary'} style={{ width: 'auto', padding: '10px 20px' }}>
            {showForm ? '✕ Cancelar' : '+ Adicionar'}
          </button>
        </div>
      </div>

      <div className="page-body">
        {showForm && (
          <form onSubmit={save} className="card card-lg" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="section-title">Novo item do plano</div>

            <div>
              <label className="field-label">Categoria</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: c }))}
                    style={{
                      padding: '8px 14px', borderRadius: 20,
                      border: `2px solid ${form.category === c ? CAT_COLOR[c] : 'var(--border)'}`,
                      background: form.category === c ? CAT_BG[c] : 'var(--surface)',
                      color: form.category === c ? CAT_COLOR[c] : 'var(--text-3)',
                      cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    }}
                  >
                    {CAT_ICON[c]} {CAT_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">Título</label>
              <input className="field-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Banho diário às 9h" required />
            </div>

            <div>
              <label className="field-label">Descrição / Instruções (opcional)</label>
              <textarea className="field-input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes, preferências, alergias a ter em conta…" />
            </div>

            <div>
              <label className="field-label">Frequência</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {Object.entries(FREQ_LABEL).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, frequency: k }))}
                    style={{
                      padding: '8px 16px', borderRadius: 20,
                      border: `1.5px solid ${form.frequency === k ? 'var(--brand)' : 'var(--border)'}`,
                      background: form.frequency === k ? 'var(--brand-light)' : 'var(--surface)',
                      color: form.frequency === k ? 'var(--brand)' : 'var(--text-3)',
                      cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="alert-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : 'Adicionar ao plano'}</button>
          </form>
        )}

        {loading ? (
          <p className="loading" style={{ textAlign: 'center', padding: 48 }}>A carregar…</p>
        ) : active.length === 0 && !showForm ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🗂️</div>
              <div className="empty-state-title">Plano de cuidados vazio</div>
              <div className="empty-state-text">Define as rotinas de cuidado — higiene, nutrição, mobilidade, actividades sociais e cuidados médicos</div>
              <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 20, width: 'auto', padding: '10px 24px' }}>+ Adicionar item</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>{CAT_ICON[cat]}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: CAT_COLOR[cat] }}>{CAT_LABEL[cat]}</div>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {catItems.map(item => (
                    <div key={item.id} className="card" style={{ borderLeft: `3px solid ${CAT_COLOR[item.category]}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</span>
                            {item.frequency && (
                              <span style={{ background: CAT_BG[item.category], color: CAT_COLOR[item.category], fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                                {FREQ_LABEL[item.frequency] ?? item.frequency}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{item.description}</div>
                          )}
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>adicionado por {item.created_by_name}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexShrink: 0 }}>
                          <button
                            onClick={() => toggleActive(item)}
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--text-3)' }}
                          >
                            Pausar
                          </button>
                          <button onClick={() => del(item.id)} className="btn-danger-ghost">🗑</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {showInactive && inactive.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                  Pausados ({inactive.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {inactive.map(item => (
                    <div key={item.id} className="card" style={{ opacity: 0.55, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, textDecoration: 'line-through', color: 'var(--text-3)' }}>{CAT_ICON[item.category]} {item.title}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>{CAT_LABEL[item.category]}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => toggleActive(item)}
                          style={{ background: 'var(--brand-light)', border: '1px solid var(--brand)', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--brand)', fontWeight: 600 }}
                        >
                          Reactivar
                        </button>
                        <button onClick={() => del(item.id)} className="btn-danger-ghost">🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
