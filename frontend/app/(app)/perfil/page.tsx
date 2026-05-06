'use client'
import { useEffect, useState } from 'react'
import { api, getElderlyId, clearToken } from '@/lib/api'
import { useRouter } from 'next/navigation'
import type { Elderly } from '@/lib/types'

const SECTION_FIELDS = [
  {
    title: '👤 Dados pessoais',
    fields: [
      { key: 'full_name', label: 'Nome completo', type: 'text', required: true, placeholder: 'Nome do familiar' },
      { key: 'date_of_birth', label: 'Data de nascimento', type: 'date' },
      { key: 'address', label: 'Morada', type: 'text', placeholder: 'Rua, número, código postal' },
    ],
  },
  {
    title: '🩺 Informação de saúde',
    fields: [
      { key: 'health_number', label: 'Nº de utente (SNS)', type: 'text', placeholder: 'Ex: 123456789' },
      { key: 'blood_type', label: 'Grupo sanguíneo', type: 'text', placeholder: 'Ex: A+, O-, B+' },
      { key: 'medical_conditions', label: 'Condições médicas', type: 'textarea', placeholder: 'Ex: Diabetes tipo 2, hipertensão…' },
      { key: 'allergies', label: 'Alergias conhecidas', type: 'textarea', placeholder: 'Ex: Penicilina, frutos secos…' },
    ],
  },
  {
    title: '🪪 Documentos de identificação',
    fields: [
      { key: 'id_number', label: 'Nº de BI / Cartão de Cidadão', type: 'text', placeholder: 'Ex: 12345678 9 ZZ4' },
    ],
  },
  {
    title: '🚨 Contacto de emergência',
    fields: [
      { key: 'emergency_contact_name', label: 'Nome', type: 'text', placeholder: 'Ex: Ana Silva' },
      { key: 'emergency_contact_phone', label: 'Telefone', type: 'tel', placeholder: 'Ex: +351 912 345 678' },
    ],
  },
]

export default function PerfilPage() {
  const router = useRouter()
  const [elderly, setElderly] = useState<Elderly | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const elderlyId = getElderlyId()

  useEffect(() => {
    if (!elderlyId) return
    api.listElderly().then(list => {
      const e = list.find(x => x.id === elderlyId) ?? list[0]
      if (!e) return
      setElderly(e)
      const f: Record<string, string> = {}
      SECTION_FIELDS.flatMap(s => s.fields).forEach(({ key }) => {
        f[key] = ((e as unknown) as Record<string, unknown>)[key] as string ?? ''
      })
      setForm(f)
    })
  }, [elderlyId])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId || !elderly) return
    setSaving(true)
    setError('')
    try {
      const patch: Record<string, string | null> = {}
      SECTION_FIELDS.flatMap(s => s.fields).forEach(({ key }) => { patch[key] = form[key] || null })
      await api.updateElderly(elderlyId, patch as Partial<Elderly>)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  function logout() {
    clearToken()
    router.replace('/login')
  }

  if (!elderly) return (
    <div>
      <div className="page-top"><div className="page-title">Perfil do Familiar</div></div>
      <div className="page-body"><p className="loading" style={{ textAlign: 'center', padding: 48 }}>A carregar…</p></div>
    </div>
  )

  const initials = elderly.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title">Perfil do Familiar</div>
          <div className="page-subtitle">Informação clínica e dados pessoais</div>
        </div>
        {saved && (
          <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700 }}>
            ✓ Guardado com sucesso
          </div>
        )}
      </div>

      <div className="page-body">
        <form onSubmit={save}>
          {/* Profile header card */}
          <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 800,
              color: 'white',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{elderly.full_name}</div>
              {elderly.date_of_birth && (
                <div style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 3 }}>
                  Nascido/a em {new Date(elderly.date_of_birth).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {elderly.blood_type && (
                  <span className="pill" style={{ background: '#FFF5F5', color: '#C53030' }}>🩸 {elderly.blood_type}</span>
                )}
                {elderly.health_number && (
                  <span className="pill" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>SNS {elderly.health_number}</span>
                )}
              </div>
            </div>
          </div>

          {/* Field sections */}
          {SECTION_FIELDS.map(section => (
            <div key={section.title} className="card card-lg" style={{ marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 18 }}>{section.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {section.fields.map(({ key, label, type, placeholder, required }) => (
                  <div key={key}>
                    <label className="field-label">{label}</label>
                    {type === 'textarea' ? (
                      <textarea
                        className="field-input"
                        value={form[key] ?? ''}
                        onChange={e => set(key, e.target.value)}
                        placeholder={placeholder}
                        rows={3}
                      />
                    ) : (
                      <input
                        className="field-input"
                        type={type}
                        value={form[key] ?? ''}
                        onChange={e => set(key, e.target.value)}
                        placeholder={placeholder}
                        required={required}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'A guardar…' : '💾 Guardar alterações'}
            </button>
            <button
              type="button"
              onClick={logout}
              className="btn-ghost"
              style={{ width: 'auto', padding: '12px 20px' }}
            >
              Sair da conta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
