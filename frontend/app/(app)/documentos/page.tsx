'use client'
import { useEffect, useState, useRef } from 'react'
import { api, getElderlyId } from '@/lib/api'
import type { Document } from '@/lib/types'

function fileIcon(type: string) {
  if (type.includes('pdf')) return '📄'
  if (type.includes('image')) return '🖼'
  if (type.includes('doc') || type.includes('word')) return '📝'
  return '📎'
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
      <div className="page-top">
        <div>
          <div className="page-title">📁 Documentos</div>
          <div className="page-subtitle">{docs.length} documento{docs.length !== 1 ? 's' : ''} guardado{docs.length !== 1 ? 's' : ''}</div>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setError('') }}
          className={showForm ? 'btn-ghost' : 'btn-primary'}
          style={{ width: 'auto', padding: '10px 20px' }}
        >
          {showForm ? '✕ Cancelar' : '⬆ Upload'}
        </button>
      </div>

      <div className="page-body">
        {showForm && (
          <form onSubmit={upload} className="card card-lg" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="section-title">Enviar documento</div>
            <div>
              <label className="field-label">Ficheiro</label>
              <div style={{
                position: 'relative',
                border: '2px dashed var(--border-2)',
                borderRadius: 12,
                padding: '24px',
                textAlign: 'center',
                background: file ? 'var(--brand-light)' : 'var(--surface-2)',
                transition: 'all 0.15s',
              }}>
                {file ? (
                  <div style={{ color: 'var(--brand)', fontWeight: 600 }}>
                    <span style={{ fontSize: 28 }}>{fileIcon(file.type)}</span>
                    <div style={{ marginTop: 6 }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{fmtSize(file.size)}</div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-3)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Clica para seleccionar</div>
                    <div style={{ fontSize: 12 }}>PDF, imagens, documentos Word</div>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={onFile}
                  required
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
              </div>
            </div>
            <div className="grid-2">
              <div>
                <label className="field-label">Nome do documento</label>
                <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Receita médica" required />
              </div>
              <div>
                <label className="field-label">Notas (opcional)</label>
                <input className="field-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Validade até março 2026" />
              </div>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={uploading || !file}>
              {uploading ? 'A enviar…' : 'Enviar documento'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="loading" style={{ textAlign: 'center', padding: 48 }}>A carregar…</p>
        ) : docs.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <div className="empty-state-title">Sem documentos guardados</div>
              <div className="empty-state-text">Guarda receitas, resultados de exames e relatórios médicos num só lugar</div>
              <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 20, width: 'auto', padding: '10px 24px' }}>
                ⬆ Fazer upload
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {docs.map((doc, i) => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < docs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 36, width: 44, textAlign: 'center', flexShrink: 0 }}>
                  {fileIcon(doc.file_type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                  {doc.notes && <div style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 2 }}>{doc.notes}</div>}
                  <div style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 4 }}>
                    📅 {fmtDate(doc.created_at)} · por {doc.uploaded_by_name}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'var(--brand-light)',
                      color: 'var(--brand)',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    ⬇ Ver
                  </a>
                  <button onClick={() => del(doc.id)} className="btn-danger-ghost" title="Apagar">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
