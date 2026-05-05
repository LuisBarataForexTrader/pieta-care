'use client'
import { useEffect, useState, useRef } from 'react'
import { api, getElderlyId } from '@/lib/api'
import type { Document } from '@/lib/types'

const TYPE_ICON: Record<string, string> = {
  pdf: '📄',
  image: '🖼',
  doc: '📝',
  other: '📎',
}

function fileIcon(type: string) {
  if (type.includes('pdf')) return TYPE_ICON.pdf
  if (type.includes('image')) return TYPE_ICON.image
  if (type.includes('doc') || type.includes('word')) return TYPE_ICON.doc
  return TYPE_ICON.other
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DocumentosPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const elderlyId = getElderlyId()

  async function load() {
    if (!elderlyId) return
    setDocs(await api.listDocuments(elderlyId))
    setLoading(false)
  }

  useEffect(() => { load() }, [elderlyId])

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''))
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId || !file) return
    setUploading(true)
    setError('')
    try {
      await api.uploadDocument(elderlyId, file, name, notes || undefined)
      setFile(null)
      setName('')
      setNotes('')
      setShowForm(false)
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  async function del(id: number) {
    if (!elderlyId || !confirm('Apagar documento?')) return
    await api.deleteDocument(elderlyId, id)
    await load()
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Documentos</h1>
          <button
            onClick={() => { setShowForm(v => !v); setError('') }}
            style={{ background: 'var(--sage)', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            {showForm ? '✕' : '+ Upload'}
          </button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {showForm && (
          <form onSubmit={upload} className="card" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Enviar documento</h2>
            <div>
              <label className="label">Ficheiro</label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={onFile}
                required
                style={{ width: '100%', fontSize: 14 }}
              />
            </div>
            <div>
              <label className="label">Nome do documento</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Receita médica" required />
            </div>
            <div>
              <label className="label">Notas (opcional)</label>
              <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Validade até março 2026" />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14, margin: 0 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={uploading || !file}>
              {uploading ? 'A enviar…' : 'Enviar documento'}
            </button>
          </form>
        )}

        {loading ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 32 }}>A carregar…</p>
        ) : docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
            <p style={{ fontWeight: 600 }}>Sem documentos</p>
            <p style={{ fontSize: 14 }}>Faz upload de receitas, exames e relatórios</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {docs.map(doc => (
              <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 32, flexShrink: 0 }}>{fileIcon(doc.file_type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                  {doc.notes && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{doc.notes}</div>}
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{fmtDate(doc.created_at)} · {doc.uploaded_by_name}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sage)', fontSize: 20 }}>⬇</a>
                  <button onClick={() => del(doc.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
