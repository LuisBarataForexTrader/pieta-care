'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, User as UserIcon, CreditCard, Download, Trash2, AlertTriangle } from 'lucide-react'
import { api, clearToken } from '@/lib/api'
import type { User } from '@/lib/types'

export default function ContaPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletePending, setDeletePending] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    api.me().then(u => { setUser(u); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  async function handleExport() {
    setExportLoading(true)
    setMsg(null)
    try {
      const data = await api.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pieta-care-dados-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMsg({ type: 'success', text: 'Dados exportados com sucesso.' })
    } catch {
      setMsg({ type: 'error', text: 'Erro ao exportar dados. Tente novamente.' })
    } finally {
      setExportLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return }
    setDeletePending(true)
    setMsg(null)
    try {
      await api.deleteAccount()
      setMsg({ type: 'success', text: 'Conta marcada para eliminação. Receberá um email de confirmação. Os seus dados ficam disponíveis para exportação durante 30 dias.' })
      setTimeout(() => { clearToken(); router.replace('/login') }, 4000)
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao eliminar conta.' })
      setDeletePending(false)
      setDeleteConfirm(false)
    }
  }

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>A carregar…</div>

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><Settings size={20} strokeWidth={2} /> A minha conta</div>
          <div className="page-subtitle">Gerir dados e preferências da conta</div>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 640 }}>
        {msg && (
          <div className={msg.type === 'success' ? 'alert-success' : 'alert-error'} style={{ marginBottom: 20 }}>
            {msg.text}
          </div>
        )}

        {/* Profile info */}
        {user && (
          <div className="card card-lg" style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}><UserIcon size={16} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Informação da conta</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-3)' }}>Nome</span>
                <span style={{ fontWeight: 600 }}>{user.full_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-3)' }}>Email</span>
                <span style={{ fontWeight: 600 }}>{user.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0' }}>
                <span style={{ color: 'var(--text-3)' }}>Plano</span>
                <span className="pill pill-taken" style={{ fontSize: 12 }}>
                  {user.subscription_status === 'trial' ? 'Período de experimentação' :
                   user.subscription_status === 'active' ? 'Activo' :
                   user.subscription_status === 'member' ? 'Membro' : user.subscription_status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Subscription */}
        <div className="card card-lg" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 12 }}><CreditCard size={16} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Subscrição</div>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
            Pode cancelar a sua subscrição a qualquer momento. Após o cancelamento, o acesso mantém-se activo até ao fim do período pago.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Para cancelar a subscrição, contacte-nos em{' '}
            <a href="mailto:suporte@pieta.care" style={{ color: 'var(--brand)' }}>suporte@pieta.care</a>.
          </p>
        </div>

        {/* Export data */}
        <div className="card card-lg" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 12 }}><Download size={16} strokeWidth={2} style={{ color: 'var(--brand)' }} /> Exportar dados</div>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
            De acordo com o RGPD, tem o direito de obter uma cópia de todos os seus dados pessoais e dos perfis de cuidado que gere.
          </p>
          <button
            className="btn-secondary"
            onClick={handleExport}
            disabled={exportLoading}
            style={{ width: 'auto', padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            {exportLoading ? 'A exportar…' : <><Download size={15} strokeWidth={2} /> Exportar todos os dados (JSON)</>}
          </button>
        </div>

        {/* Delete account */}
        <div className="card card-lg" style={{ border: '1px solid #FEB2B2' }}>
          <div className="section-title" style={{ marginBottom: 12, color: '#C53030' }}><Trash2 size={16} strokeWidth={2} /> Eliminar conta</div>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 8 }}>
            Ao eliminar a sua conta, todos os dados ficam disponíveis para exportação durante <strong>30 dias</strong>, após os quais são eliminados definitivamente dos nossos sistemas.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.6 }}>
            Esta acção não pode ser revertida após o período de 30 dias. Receberá um email de confirmação com os detalhes.
          </p>

          {deleteConfirm && !deletePending && (
            <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 10, padding: '14px 16px', marginBottom: 16, fontSize: 14, color: '#744210', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertTriangle size={18} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Tem a certeza? Clique novamente em &ldquo;Confirmar eliminação&rdquo; para prosseguir. Esta acção iniciará o processo de eliminação da conta.</span>
            </div>
          )}

          <button
            onClick={handleDelete}
            disabled={deletePending}
            style={{
              background: deleteConfirm ? '#C53030' : 'transparent',
              color: deleteConfirm ? '#fff' : '#C53030',
              border: '1px solid #C53030',
              borderRadius: 10,
              padding: '10px 24px',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              width: 'auto',
            }}
          >
            {deletePending ? 'A processar…' : deleteConfirm ? 'Confirmar eliminação' : 'Eliminar conta'}
          </button>
          {deleteConfirm && !deletePending && (
            <button
              onClick={() => setDeleteConfirm(false)}
              style={{ marginLeft: 12, background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: 14, cursor: 'pointer' }}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
