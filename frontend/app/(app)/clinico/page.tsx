'use client'
import { useEffect, useState } from 'react'
import {
  Stethoscope, Hospital, Syringe, Calendar as CalendarIcon, AlertTriangle,
  Trash2, X, Plus, ExternalLink, FlaskConical, CalendarDays, RotateCcw, FileBadge,
} from 'lucide-react'
import { api, getElderlyId } from '@/lib/api'
import type { ClinicalDiagnosis, Vaccination } from '@/lib/types'

const SOURCE_LABEL: Record<string, string> = { sns: 'SNS', manual: 'Manual', medico: 'Médico' }
const SOURCE_COLOR: Record<string, string> = { sns: '#2B6CB0', manual: '#4A5568', medico: '#276749' }

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(d: string | null) {
  if (!d) return null
  const diff = new Date(d).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export default function ClinicoPage() {
  const elderlyId = getElderlyId()
  const [tab, setTab] = useState<'diagnoses' | 'vaccinations'>('diagnoses')
  const [loading, setLoading] = useState(true)
  const [diagnoses, setDiagnoses] = useState<ClinicalDiagnosis[]>([])
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [dxForm, setDxForm] = useState({
    description: '', icd_code: '', diagnosed_date: '', is_chronic: false, source: 'manual', notes: '',
  })
  const [vacForm, setVacForm] = useState({
    vaccine_name: '', administered_date: '', next_due_date: '', lot_number: '', source: 'manual', notes: '',
  })

  async function load() {
    if (!elderlyId) return
    setLoading(true)
    const [dx, vac] = await Promise.all([api.listDiagnoses(elderlyId), api.listVaccinations(elderlyId)])
    setDiagnoses(dx)
    setVaccinations(vac)
    setLoading(false)
  }
  useEffect(() => { load() }, [elderlyId])

  async function saveDx(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    setSaving(true); setError('')
    try {
      await api.createDiagnosis(elderlyId, {
        description: dxForm.description,
        icd_code: dxForm.icd_code || undefined,
        diagnosed_date: dxForm.diagnosed_date || undefined,
        is_chronic: dxForm.is_chronic,
        source: dxForm.source,
        notes: dxForm.notes || undefined,
      })
      setDxForm({ description: '', icd_code: '', diagnosed_date: '', is_chronic: false, source: 'manual', notes: '' })
      setShowForm(false)
      await load()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro') }
    finally { setSaving(false) }
  }

  async function saveVac(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    setSaving(true); setError('')
    try {
      await api.createVaccination(elderlyId, {
        vaccine_name: vacForm.vaccine_name,
        administered_date: vacForm.administered_date || undefined,
        next_due_date: vacForm.next_due_date || undefined,
        lot_number: vacForm.lot_number || undefined,
        source: vacForm.source,
        notes: vacForm.notes || undefined,
      })
      setVacForm({ vaccine_name: '', administered_date: '', next_due_date: '', lot_number: '', source: 'manual', notes: '' })
      setShowForm(false)
      await load()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro') }
    finally { setSaving(false) }
  }

  async function delDx(id: number) {
    if (!elderlyId || !confirm('Remover diagnóstico?')) return
    await api.deleteDiagnosis(elderlyId, id); await load()
  }

  async function delVac(id: number) {
    if (!elderlyId || !confirm('Remover vacina?')) return
    await api.deleteVaccination(elderlyId, id); await load()
  }

  const chronicDx = diagnoses.filter(d => d.is_chronic)
  const acuteDx = diagnoses.filter(d => !d.is_chronic)
  const overdueVac = vaccinations.filter(v => v.next_due_date && daysUntil(v.next_due_date)! < 0)
  const soonVac = vaccinations.filter(v => v.next_due_date && daysUntil(v.next_due_date)! >= 0 && daysUntil(v.next_due_date)! <= 30)

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><Stethoscope size={20} strokeWidth={2} /> Dados Clínicos</div>
          <div className="page-subtitle">
            {diagnoses.length} diagnóstico{diagnoses.length !== 1 ? 's' : ''} · {vaccinations.length} vacina{vaccinations.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="https://www.sns.gov.pt/apps/mysns-carteira/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button className="btn-ghost" style={{ width: 'auto', padding: '10px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ExternalLink size={14} strokeWidth={2} /> Portal SNS
            </button>
          </a>
          <button onClick={() => { setShowForm(v => !v); setError('') }} className={showForm ? 'btn-ghost' : 'btn-primary'} style={{ width: 'auto', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {showForm ? <><X size={14} strokeWidth={2.5} /> Cancelar</> : <><Plus size={14} strokeWidth={2.5} /> Adicionar</>}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* SNS integration status */}
        <div className="info-banner" style={{ marginBottom: 20 }}>
          <FlaskConical size={18} strokeWidth={1.85} style={{ color: '#2B6CB0', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2B6CB0' }}>Integração SNS FHIR — em desenvolvimento</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
              A SPMS está a desenvolver a API pública SNS/FHIR. Quando disponível, os dados serão importados automaticamente.
              Por agora, pode consultar o seu histórico no <strong>Portal SNS</strong> e registar manualmente.
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(overdueVac.length > 0 || soonVac.length > 0) && (
          <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {overdueVac.map(v => (
              <div key={v.id} style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--on-tinted-danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} strokeWidth={2.25} />
                <span><strong>{v.vaccine_name}</strong> — reforço em atraso ({fmtDate(v.next_due_date)})</span>
              </div>
            ))}
            {soonVac.map(v => (
              <div key={v.id} style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--on-tinted-warning)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarDays size={14} strokeWidth={2.25} />
                <span><strong>{v.vaccine_name}</strong> — reforço em {daysUntil(v.next_due_date)} dia{daysUntil(v.next_due_date) !== 1 ? 's' : ''} ({fmtDate(v.next_due_date)})</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface-2)', borderRadius: 10, padding: 4 }}>
          {([['diagnoses', <span key="d" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Hospital size={14} strokeWidth={2.25} /> Diagnósticos</span>, diagnoses.length], ['vaccinations', <span key="v" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Syringe size={14} strokeWidth={2.25} /> Vacinação</span>, vaccinations.length]] as const).map(([t, label, count]) => (
            <button
              key={t}
              onClick={() => { setTab(t); setShowForm(false) }}
              style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: tab === t ? 'white' : 'transparent',
                fontWeight: tab === t ? 700 : 500,
                color: tab === t ? 'var(--brand)' : 'var(--text-3)',
                fontSize: 14,
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label} <span style={{ fontSize: 12, opacity: 0.7 }}>({count})</span>
            </button>
          ))}
        </div>

        {/* DIAGNOSIS FORM */}
        {showForm && tab === 'diagnoses' && (
          <form onSubmit={saveDx} className="card card-lg" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="section-title">Novo diagnóstico</div>

            <div>
              <label className="field-label">Descrição *</label>
              <input className="field-input" value={dxForm.description} onChange={e => setDxForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Hipertensão arterial" required />
            </div>

            <div className="grid-2">
              <div>
                <label className="field-label">Código ICD-10 (opcional)</label>
                <input className="field-input" value={dxForm.icd_code} onChange={e => setDxForm(f => ({ ...f, icd_code: e.target.value }))} placeholder="Ex: I10" />
              </div>
              <div>
                <label className="field-label">Data do diagnóstico (opcional)</label>
                <input className="field-input" type="date" value={dxForm.diagnosed_date} onChange={e => setDxForm(f => ({ ...f, diagnosed_date: e.target.value }))} />
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label className="field-label">Fonte</label>
                <select className="field-input" value={dxForm.source} onChange={e => setDxForm(f => ({ ...f, source: e.target.value }))}>
                  <option value="manual">Registo manual</option>
                  <option value="sns">Portal SNS</option>
                  <option value="medico">Indicação médica</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 22 }}>
                  <input type="checkbox" checked={dxForm.is_chronic} onChange={e => setDxForm(f => ({ ...f, is_chronic: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--brand)' }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Doença crónica</span>
                </label>
              </div>
            </div>

            <div>
              <label className="field-label">Notas (opcional)</label>
              <textarea className="field-input" rows={2} value={dxForm.notes} onChange={e => setDxForm(f => ({ ...f, notes: e.target.value }))} placeholder="Medicação associada, observações do médico…" />
            </div>

            {error && <div className="alert-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : 'Guardar diagnóstico'}</button>
          </form>
        )}

        {/* VACCINATION FORM */}
        {showForm && tab === 'vaccinations' && (
          <form onSubmit={saveVac} className="card card-lg" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="section-title">Nova vacina</div>

            <div>
              <label className="field-label">Nome da vacina *</label>
              <input className="field-input" value={vacForm.vaccine_name} onChange={e => setVacForm(f => ({ ...f, vaccine_name: e.target.value }))} placeholder="Ex: Gripe sazonal, COVID-19, Tétano…" required />
            </div>

            <div className="grid-2">
              <div>
                <label className="field-label">Data de administração</label>
                <input className="field-input" type="date" value={vacForm.administered_date} onChange={e => setVacForm(f => ({ ...f, administered_date: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Próximo reforço</label>
                <input className="field-input" type="date" value={vacForm.next_due_date} onChange={e => setVacForm(f => ({ ...f, next_due_date: e.target.value }))} />
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label className="field-label">Nº de lote (opcional)</label>
                <input className="field-input" value={vacForm.lot_number} onChange={e => setVacForm(f => ({ ...f, lot_number: e.target.value }))} placeholder="Ex: AF2024B" />
              </div>
              <div>
                <label className="field-label">Fonte</label>
                <select className="field-input" value={vacForm.source} onChange={e => setVacForm(f => ({ ...f, source: e.target.value }))}>
                  <option value="manual">Registo manual</option>
                  <option value="sns">Portal SNS (Boletim)</option>
                </select>
              </div>
            </div>

            {error && <div className="alert-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : 'Guardar vacina'}</button>
          </form>
        )}

        {/* DIAGNOSES LIST */}
        {tab === 'diagnoses' && (
          loading ? <p className="loading" style={{ textAlign: 'center', padding: 48 }}>A carregar…</p> :
          diagnoses.length === 0 && !showForm ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon" style={{ color: 'var(--text-3)' }}><Hospital size={42} strokeWidth={1.4} /></div>
                <div className="empty-state-title">Sem diagnósticos registados</div>
                <div className="empty-state-text">Registe as condições médicas - pode consultar o historial no Portal SNS e copiar para aqui</div>
                <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 20, width: 'auto', padding: '10px 24px' }}>+ Adicionar diagnóstico</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {chronicDx.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                    Crónicas ({chronicDx.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {chronicDx.map(dx => (
                      <div key={dx.id} className="card" style={{ borderLeft: '3px solid #C53030' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 15 }}>{dx.description}</span>
                              {dx.icd_code && <span style={{ background: 'var(--danger-light)', color: 'var(--on-tinted-danger)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, fontFamily: 'monospace' }}>{dx.icd_code}</span>}
                              <span style={{ background: 'var(--danger-light)', color: 'var(--on-tinted-danger)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>Crónica</span>
                              {dx.source && <span style={{ background: 'var(--surface-2)', color: SOURCE_COLOR[dx.source] ?? 'var(--text-3)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{SOURCE_LABEL[dx.source] ?? dx.source}</span>}
                            </div>
                            {dx.diagnosed_date && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Desde {fmtDate(dx.diagnosed_date)}</div>}
                            {dx.notes && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, fontStyle: 'italic' }}>{dx.notes}</div>}
                          </div>
                          <button onClick={() => delDx(dx.id)} className="btn-danger-ghost" style={{ marginLeft: 8 }} title="Apagar"><Trash2 size={14} strokeWidth={2} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {acuteDx.length > 0 && (
                <div>
                  {chronicDx.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Agudas / Outras ({acuteDx.length})</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {acuteDx.map(dx => (
                      <div key={dx.id} className="card" style={{ borderLeft: '3px solid var(--brand)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 15 }}>{dx.description}</span>
                              {dx.icd_code && <span style={{ background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, fontFamily: 'monospace' }}>{dx.icd_code}</span>}
                              {dx.source && <span style={{ background: 'var(--surface-2)', color: SOURCE_COLOR[dx.source] ?? 'var(--text-3)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{SOURCE_LABEL[dx.source] ?? dx.source}</span>}
                            </div>
                            {dx.diagnosed_date && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Diagnosticado em {fmtDate(dx.diagnosed_date)}</div>}
                            {dx.notes && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, fontStyle: 'italic' }}>{dx.notes}</div>}
                          </div>
                          <button onClick={() => delDx(dx.id)} className="btn-danger-ghost" style={{ marginLeft: 8 }} title="Apagar"><Trash2 size={14} strokeWidth={2} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* VACCINATIONS LIST */}
        {tab === 'vaccinations' && (
          loading ? <p className="loading" style={{ textAlign: 'center', padding: 48 }}>A carregar…</p> :
          vaccinations.length === 0 && !showForm ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon" style={{ color: 'var(--text-3)' }}><Syringe size={42} strokeWidth={1.4} /></div>
                <div className="empty-state-title">Sem vacinas registadas</div>
                <div className="empty-state-text">Regista o historial de vacinação — gripe sazonal, COVID-19, tétano, pneumococos…</div>
                <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 20, width: 'auto', padding: '10px 24px' }}>+ Adicionar vacina</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {vaccinations.map(vac => {
                const days = daysUntil(vac.next_due_date)
                const overdue = days !== null && days < 0
                const soon = days !== null && days >= 0 && days <= 30
                return (
                  <div key={vac.id} className="card" style={{ borderLeft: `3px solid ${overdue ? '#C53030' : soon ? '#D69E2E' : 'var(--brand)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          <Syringe size={15} strokeWidth={2} style={{ color: 'var(--brand)' }} />
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{vac.vaccine_name}</span>
                          {vac.source && <span style={{ background: 'var(--surface-2)', color: SOURCE_COLOR[vac.source] ?? 'var(--text-3)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{SOURCE_LABEL[vac.source] ?? vac.source}</span>}
                          {overdue && <span style={{ background: 'var(--danger-light)', color: 'var(--on-tinted-danger)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>Reforço em atraso</span>}
                          {soon && <span style={{ background: 'var(--warning-light)', color: 'var(--on-tinted-warning)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>Reforço em breve</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {vac.administered_date && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CalendarDays size={11} strokeWidth={2.25} /> Administrada: {fmtDate(vac.administered_date)}</span>}
                          {vac.next_due_date && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><RotateCcw size={11} strokeWidth={2.25} /> Próximo reforço: {fmtDate(vac.next_due_date)}{days !== null ? ` (${days < 0 ? `${Math.abs(days)} dias atrás` : `em ${days} dias`})` : ''}</span>}
                          {vac.lot_number && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FileBadge size={11} strokeWidth={2.25} /> Lote: {vac.lot_number}</span>}
                        </div>
                        {vac.notes && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, fontStyle: 'italic' }}>{vac.notes}</div>}
                      </div>
                      <button onClick={() => delVac(vac.id)} className="btn-danger-ghost" style={{ marginLeft: 8 }} title="Apagar"><Trash2 size={14} strokeWidth={2} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
