'use client'
import { useEffect, useState, useRef } from 'react'
import { api, getElderlyId, clearToken } from '@/lib/api'
import { useRouter } from 'next/navigation'
import type { Elderly } from '@/lib/types'

const SECTION_FIELDS = [
  {
    title: '👤 Dados pessoais',
    fields: [
      { key: 'full_name',         label: 'Nome completo',          type: 'text',     required: true, placeholder: 'Nome do familiar' },
      { key: 'date_of_birth',     label: 'Data de nascimento',     type: 'date' },
      { key: 'address',           label: 'Morada',                 type: 'text',     placeholder: 'Rua, número, código postal' },
    ],
  },
  {
    title: '🩺 Informação de saúde',
    fields: [
      { key: 'health_number',     label: 'Nº de utente (SNS)',     type: 'text',     placeholder: 'Ex: 123456789' },
      { key: 'blood_type',        label: 'Grupo sanguíneo',        type: 'text',     placeholder: 'Ex: A+, O-, B+' },
      { key: 'medical_conditions',label: 'Condições médicas',      type: 'textarea', placeholder: 'Ex: Diabetes tipo 2, hipertensão…' },
      { key: 'allergies',         label: 'Alergias conhecidas',    type: 'textarea', placeholder: 'Ex: Penicilina, frutos secos…' },
    ],
  },
  {
    title: '🪪 Identificação',
    fields: [
      { key: 'id_number',         label: 'Nº de BI / Cartão de Cidadão', type: 'text', placeholder: 'Ex: 12345678 9 ZZ4' },
    ],
  },
  {
    title: '🚨 Contacto de emergência',
    fields: [
      { key: 'emergency_contact_name',  label: 'Nome',     type: 'text', placeholder: 'Ex: Ana Silva' },
      { key: 'emergency_contact_phone', label: 'Telefone', type: 'tel',  placeholder: 'Ex: +351 912 345 678' },
    ],
  },
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function PerfilPage() {
  const router    = useRouter()
  const fileRef   = useRef<HTMLInputElement>(null)
  const elderlyId = getElderlyId()

  const [elderly,      setElderly]      = useState<Elderly | null>(null)
  const [form,         setForm]         = useState<Record<string, string>>({})
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState('')
  const [uploading,    setUploading]    = useState(false)
  const [photoHover,   setPhotoHover]   = useState(false)

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
    setSaving(true); setError('')
    try {
      const patch: Record<string, string | null> = {}
      SECTION_FIELDS.flatMap(s => s.fields).forEach(({ key }) => { patch[key] = form[key] || null })
      await api.updateElderly(elderlyId, patch as Partial<Elderly>)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar')
    } finally { setSaving(false) }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !elderlyId) return
    setUploading(true); setError('')
    try {
      const { photo_url } = await api.uploadElderlyPhoto(elderlyId, file)
      setElderly(prev => prev ? { ...prev, photo_url } : prev)
    } catch {
      setError('Erro ao carregar a foto. Verifica se o armazenamento está configurado.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function logout() { clearToken(); router.replace('/login') }

  if (!elderly) return (
    <div>
      <div className="page-top"><div className="page-title">Perfil do Familiar</div></div>
      <div className="page-body"><p style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>A carregar…</p></div>
    </div>
  )

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

          {/* ── Profile header — photo + name ── */}
          <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>

            {/* Clickable avatar */}
            <div
              style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
              onMouseEnter={() => setPhotoHover(true)}
              onMouseLeave={() => setPhotoHover(false)}
              onClick={() => fileRef.current?.click()}
              title="Alterar foto"
            >
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800, color: 'white',
                overflow: 'hidden',
                border: '3px solid var(--brand-light)',
              }}>
                {elderly.photo_url
                  ? <img src={elderly.photo_url} alt={elderly.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials(elderly.full_name)
                }
              </div>

              {/* Hover / uploading overlay */}
              {(photoHover || uploading) && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.52)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 2,
                }}>
                  <span style={{ fontSize: uploading ? 20 : 18 }}>{uploading ? '⏳' : '📷'}</span>
                  {!uploading && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700, letterSpacing: 0.3 }}>ALTERAR</span>}
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />

            {/* Name + info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{elderly.full_name}</div>
              {elderly.date_of_birth && (
                <div style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 3 }}>
                  Nascido/a em {new Date(elderly.date_of_birth).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {elderly.blood_type && (
                  <span className="pill" style={{ background: '#FFF5F5', color: '#C53030' }}>🩸 {elderly.blood_type}</span>
                )}
                {elderly.health_number && (
                  <span className="pill" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>SNS {elderly.health_number}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                Clica na foto para alterar
              </div>
            </div>
          </div>

          {/* ── Form sections ── */}
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
            <button type="button" onClick={logout} className="btn-ghost" style={{ width: 'auto', padding: '12px 20px' }}>
              Sair da conta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
