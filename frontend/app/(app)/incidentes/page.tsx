'use client'
import { useEffect, useState } from 'react'
import { api, getElderlyId } from '@/lib/api'
import type { Incident } from '@/lib/types'
import BodyMap, { BODY_ZONES } from '@/components/BodyMap'

const TYPE_LABEL: Record<string, string> = {
  queda: 'Queda',
  medicacao: 'Erro de medicação',
  emergencia: 'Emergência médica',
  hospitalizacao: 'Hospitalização',
  comportamento: 'Comportamento',
  outro: 'Outro',
}
const TYPE_ICON: Record<string, string> = {
  queda: '🤕', medicacao: '💊', emergencia: '🚨', hospitalizacao: '🏥', comportamento: '🧠', outro: '📋',
}
const SEV_COLOR: Record<string, string> = {
  baixa: '#276749', media: '#D69E2E', alta: '#C05621', critica: '#C53030',
}
const SEV_BG: Record<string, string> = {
  baixa: 'var(--success-light)', media: '#FFFAF0', alta: 'var(--warning-light)', critica: '#FFF5F5',
}
const SEV_LABEL: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica' }

function fmtDT(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function IncidentesPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showResolved, setShowResolved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const elderlyId = getElderlyId()

  const emptyForm = {
    occurred_at: new Date().toISOString().slice(0, 16),
    type: 'queda',
    severity: 'media',
    description: '',
    actions_taken: '',
    follow_up_required: false,
    body_zone: null as string | null,
  }
  const [form, setForm] = useState(emptyForm)

  async function load() {
    if (!elderlyId) return
    setLoading(true)
    setIncidents(await api.listIncidents(elderlyId, showResolved))
    setLoading(false)
  }
  useEffect(() => { load() }, [elderlyId, showResolved])

  function startEdit(inc: Incident) {
    setForm({
      occurred_at: inc.occurred_at.slice(0, 16),
      type: inc.type,
      severity: inc.severity,
      description: inc.description,
      actions_taken: inc.actions_taken ?? '',
      follow_up_required: inc.follow_up_required,
      body_zone: inc.body_zone,
    })
    setEditingId(inc.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    setSaving(true); setError('')
    try {
      if (editingId) {
        await api.updateIncident(elderlyId, editingId, form)
      } else {
        await api.createIncident(elderlyId, form)
      }
      cancelForm()
      await load()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro') }
    finally { setSaving(false) }
  }

  async function resolve(id: number) {
    if (!elderlyId) return
    await api.updateIncident(elderlyId, id, { resolved: true })
    await load()
  }

  async function del(id: number) {
    if (!elderlyId || !confirm('Apagar incidente?')) return
    await api.deleteIncident(elderlyId, id)
    await load()
  }

  const open = incidents.filter(i => !i.resolved)
  const resolved = incidents.filter(i => i.resolved)

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title">⚠️ Incidentes</div>
          <div className="page-subtitle">{open.length} aberto{open.length !== 1 ? 's' : ''}{resolved.length > 0 ? ` · ${resolved.length} resolvido${resolved.length !== 1 ? 's' : ''}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowResolved(v => !v)} className="btn-ghost" style={{ width: 'auto', padding: '10px 16px', fontSize: 13 }}>
            {showResolved ? 'Ocultar resolvidos' : 'Ver resolvidos'}
          </button>
          <button onClick={() => showForm ? cancelForm() : setShowForm(true)} className={showForm ? 'btn-ghost' : 'btn-primary'} style={{ width: 'auto', padding: '10px 20px' }}>
            {showForm ? '✕ Cancelar' : '+ Registar incidente'}
          </button>
        </div>
      </div>

      <div className="page-body">
        {showForm && (
          <form onSubmit={save} className="card card-lg" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="section-title">{editingId ? 'Editar incidente' : 'Novo incidente'}</div>

            <div className="grid-2">
              <div>
                <label className="field-label">Data e hora da ocorrência</label>
                <input className="field-input" type="datetime-local" value={form.occurred_at} onChange={e => setForm(f => ({ ...f, occurred_at: e.target.value }))} required />
              </div>
              <div>
                <label className="field-label">Tipo de incidente</label>
                <select className="field-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{TYPE_ICON[k]} {v}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="field-label">Gravidade</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                {Object.entries(SEV_LABEL).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => setForm(f => ({ ...f, severity: k }))} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${form.severity === k ? SEV_COLOR[k] : 'var(--border)'}`, background: form.severity === k ? SEV_BG[k] : 'var(--surface)', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: form.severity === k ? SEV_COLOR[k] : 'var(--text-3)', transition: 'all 0.15s' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">Zona do corpo afectada (opcional)</label>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', padding: '12px', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <BodyMap value={form.body_zone} onChange={zone => setForm(f => ({ ...f, body_zone: zone }))} />
              </div>
            </div>

            <div>
              <label className="field-label">Descrição do incidente</label>
              <textarea className="field-input" rows={3} placeholder="O que aconteceu? Onde? Como?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            </div>

            <div>
              <label className="field-label">Acções tomadas (opcional)</label>
              <textarea className="field-input" rows={2} placeholder="O que foi feito? Quem foi contactado?" value={form.actions_taken} onChange={e => setForm(f => ({ ...f, actions_taken: e.target.value }))} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.follow_up_required} onChange={e => setForm(f => ({ ...f, follow_up_required: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--brand)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Requer acompanhamento médico</span>
            </label>

            {error && <div className="alert-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : editingId ? '💾 Guardar alterações' : 'Registar incidente'}</button>
          </form>
        )}

        {loading ? <p className="loading" style={{ textAlign: 'center', padding: 48 }}>A carregar…</p> :
          incidents.length === 0 && !showForm ? (
            <div className="card"><div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-title">Sem incidentes registados</div><div className="empty-state-text">Regista quedas, erros de medicação e outros eventos para manter um historial completo</div><button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 20, width: 'auto', padding: '10px 24px' }}>+ Registar incidente</button></div></div>
          ) : incidents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {open.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Abertos ({open.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {open.map(inc => (
                      <div key={inc.id} className="card" style={{ borderLeft: `4px solid ${SEV_COLOR[inc.severity]}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                            <span style={{ fontSize: 28, flexShrink: 0 }}>{TYPE_ICON[inc.type]}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                                <span style={{ fontWeight: 700, fontSize: 15 }}>{TYPE_LABEL[inc.type]}</span>
                                <span style={{ background: SEV_BG[inc.severity], color: SEV_COLOR[inc.severity], fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{SEV_LABEL[inc.severity]}</span>
                                {inc.follow_up_required && <span style={{ background: '#FFF5F5', color: '#C53030', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>⚕️ Acompanhamento</span>}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
                                📅 {fmtDT(inc.occurred_at)} · por {inc.reported_by_name}
                                {inc.body_zone && <> · <span style={{ color: 'var(--brand)', fontWeight: 600 }}>📍 {BODY_ZONES[inc.body_zone] ?? inc.body_zone}</span></>}
                              </div>
                              <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{inc.description}</div>
                              {inc.actions_taken && expandedId === inc.id && (
                                <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                                  <strong>Acções tomadas:</strong> {inc.actions_taken}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                            {inc.actions_taken && (
                              <button onClick={() => setExpandedId(expandedId === inc.id ? null : inc.id)} className="btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }}>
                                {expandedId === inc.id ? 'Ocultar' : 'Ver acções'}
                              </button>
                            )}
                            <button onClick={() => startEdit(inc)} className="btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }}>✏️ Editar</button>
                            <button onClick={() => resolve(inc.id)} style={{ background: 'var(--success-light)', color: 'var(--success)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Resolver</button>
                            <button onClick={() => del(inc.id)} className="btn-danger-ghost">🗑</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showResolved && resolved.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Resolvidos ({resolved.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {resolved.map(inc => (
                      <div key={inc.id} className="card" style={{ opacity: 0.6, display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span>{TYPE_ICON[inc.type]}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, textDecoration: 'line-through', color: 'var(--text-3)' }}>{TYPE_LABEL[inc.type]}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>{fmtDT(inc.occurred_at)}</span>
                        </div>
                        <button onClick={() => del(inc.id)} className="btn-danger-ghost">🗑</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null
        }
      </div>
    </div>
  )
}
