'use client'
import { useEffect, useState } from 'react'
import { api, getElderlyId, clearToken } from '@/lib/api'
import { useRouter } from 'next/navigation'
import type { Elderly } from '@/lib/types'

const FIELDS = [
  { key: 'full_name', label: 'Nome completo', type: 'text', required: true },
  { key: 'date_of_birth', label: 'Data de nascimento', type: 'date' },
  { key: 'blood_type', label: 'Grupo sanguíneo', type: 'text', placeholder: 'Ex: A+' },
  { key: 'health_number', label: 'Nº de utente (SNS)', type: 'text' },
  { key: 'id_number', label: 'Nº de BI / CC', type: 'text' },
  { key: 'address', label: 'Morada', type: 'text' },
  { key: 'medical_conditions', label: 'Condições médicas', type: 'textarea' },
  { key: 'allergies', label: 'Alergias', type: 'textarea' },
  { key: 'emergency_contact_name', label: 'Contacto de emergência — Nome', type: 'text' },
  { key: 'emergency_contact_phone', label: 'Contacto de emergência — Telefone', type: 'tel' },
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
      FIELDS.forEach(({ key }) => {
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
      FIELDS.forEach(({ key }) => { patch[key] = form[key] || null })
      await api.updateElderly(elderlyId, patch as Partial<Elderly>)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
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

  if (!elderly) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>A carregar…</div>

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Perfil</h1>
      </div>

      <form onSubmit={save} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {FIELDS.map(({ key, label, type, placeholder, required }) => (
          <div key={key}>
            <label className="label">{label}</label>
            {type === 'textarea' ? (
              <textarea
                className="input"
                style={{ minHeight: 72, resize: 'vertical' }}
                value={form[key] ?? ''}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
              />
            ) : (
              <input
                className="input"
                type={type}
                value={form[key] ?? ''}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                required={required}
              />
            )}
          </div>
        ))}

        {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}

        <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop: 8 }}>
          {saving ? 'A guardar…' : saved ? '✓ Guardado!' : 'Guardar alterações'}
        </button>

        <button
          type="button"
          onClick={logout}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 15, cursor: 'pointer', padding: '12px 0', textAlign: 'center' }}
        >
          Sair da conta
        </button>
      </form>
    </div>
  )
}
