'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, setElderlyId } from '@/lib/api'

export default function NovoFamiliarPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    health_number: '',
    blood_type: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    allergies: '',
    medical_conditions: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload: Record<string, string | null> = {}
      Object.entries(form).forEach(([k, v]) => { payload[k] = v || null })
      const created = await api.createElderly(payload)
      setElderlyId(created.id)
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar perfil')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title">👤 Novo familiar</div>
          <div className="page-subtitle">Adicione um novo perfil de cuidado</div>
        </div>
        <button onClick={() => router.back()} className="btn-ghost" style={{ width: 'auto', padding: '10px 20px' }}>
          ✕ Cancelar
        </button>
      </div>

      <div className="page-body">
        <div className="card card-lg" style={{ marginBottom: 16, padding: '16px 20px', background: 'var(--brand-light)', border: '1px solid rgba(42,96,73,0.2)' }}>
          <div style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 600 }}>
            🌿 Ao adicionar um segundo familiar, o seu plano será ajustado para Família+ (€59/mês).
          </div>
        </div>

        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-lg">
            <div className="section-title" style={{ marginBottom: 18 }}>👤 Dados pessoais</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">Nome completo *</label>
                <input className="field-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Nome do familiar" required />
              </div>
              <div className="grid-2">
                <div>
                  <label className="field-label">Data de nascimento</label>
                  <input className="field-input" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Grupo sanguíneo</label>
                  <input className="field-input" value={form.blood_type} onChange={e => set('blood_type', e.target.value)} placeholder="Ex: A+, O-" />
                </div>
              </div>
              <div>
                <label className="field-label">Morada</label>
                <input className="field-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rua, número, código postal" />
              </div>
            </div>
          </div>

          <div className="card card-lg">
            <div className="section-title" style={{ marginBottom: 18 }}>🩺 Saúde</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">Nº de utente (SNS)</label>
                <input className="field-input" value={form.health_number} onChange={e => set('health_number', e.target.value)} placeholder="Ex: 123456789" />
              </div>
              <div>
                <label className="field-label">Condições médicas</label>
                <textarea className="field-input" rows={2} value={form.medical_conditions} onChange={e => set('medical_conditions', e.target.value)} placeholder="Ex: Diabetes tipo 2, hipertensão…" />
              </div>
              <div>
                <label className="field-label">Alergias</label>
                <textarea className="field-input" rows={2} value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="Ex: Penicilina, frutos secos…" />
              </div>
            </div>
          </div>

          <div className="card card-lg">
            <div className="section-title" style={{ marginBottom: 18 }}>🚨 Contacto de emergência</div>
            <div className="grid-2">
              <div>
                <label className="field-label">Nome</label>
                <input className="field-input" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Ex: Ana Silva" />
              </div>
              <div>
                <label className="field-label">Telefone</label>
                <input className="field-input" type="tel" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} placeholder="+351 912 345 678" />
              </div>
            </div>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button className="btn-primary" type="submit" disabled={saving} style={{ fontSize: 15 }}>
            {saving ? 'A criar perfil…' : '✓ Criar perfil e continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
