'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Home, Pill, Calendar, Users, HeartPulse, AlertTriangle, FileText,
  User as UserIcon, NotebookPen, ClipboardList, BarChart3,
  Stethoscope, FileBarChart, Settings, MessagesSquare, MoreHorizontal,
  LifeBuoy, X, LogOut,
} from 'lucide-react'
import { api, clearToken, getElderlyId } from '@/lib/api'
import type { User } from '@/lib/types'

const PRIMARY = [
  { href: '/dashboard', label: 'Hoje', icon: Home },
  { href: '/medicacao', label: 'Medicação', icon: Pill },
  { href: '/chat',      label: 'Chat',     icon: MessagesSquare, badge: 'chat' as const },
  { href: '/calendario', label: 'Agenda',  icon: Calendar },
] as const

const DRAWER_LINKS = [
  { href: '/familia',   label: 'Família',          icon: Users },
  { href: '/saude',     label: 'Saúde',            icon: HeartPulse },
  { href: '/incidentes',label: 'Incidentes',       icon: AlertTriangle },
  { href: '/documentos',label: 'Documentos',       icon: FileText },
  { href: '/perfil',    label: 'Perfil familiar',  icon: UserIcon },
  { href: '/notas',     label: 'Notas de turno',   icon: NotebookPen },
  { href: '/plano',     label: 'Plano de cuidados',icon: ClipboardList },
  { href: '/qualidade', label: 'Qualidade',        icon: BarChart3 },
  { href: '/clinico',   label: 'Dados clínicos',   icon: Stethoscope },
  { href: '/relatorio', label: 'Relatório médico', icon: FileBarChart },
  { href: '/conta',     label: 'A minha conta',    icon: Settings },
  { href: '/suporte',   label: 'Ajuda · Suporte',  icon: LifeBuoy, badge: 'support' as const },
] as const

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [chatUnread, setChatUnread] = useState(0)
  const [supportUnread, setSupportUnread] = useState(0)

  useEffect(() => {
    api.me().then(setUser).catch(() => {})
  }, [])

  // Poll chat unread badge
  useEffect(() => {
    let alive = true
    const elderlyId = getElderlyId()
    if (!elderlyId) return
    const fetchUnread = () => {
      api.chatUnread(elderlyId)
        .then(r => { if (alive) setChatUnread(r.unread) })
        .catch(() => {})
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 25000)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchUnread() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user])

  // Poll support unread
  useEffect(() => {
    if (!user) return
    let alive = true
    const fetchUnread = () => {
      api.supportSummary()
        .then(s => { if (alive) setSupportUnread(s.unread) })
        .catch(() => {})
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => { alive = false; clearInterval(interval) }
  }, [user])

  // Reset badges when on those pages
  useEffect(() => {
    if (pathname === '/chat') setChatUnread(0)
    if (pathname === '/suporte') setSupportUnread(0)
  }, [pathname])

  // Lock scroll when drawer open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function logout() {
    clearToken()
    router.replace('/login')
  }

  function getBadge(key?: 'chat' | 'support'): number {
    if (key === 'chat') return chatUnread
    if (key === 'support') return supportUnread
    return 0
  }

  return (
    <>
      <div className="bottom-nav">
        <div className="bottom-nav-inner">
          {PRIMARY.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
            const badge = getBadge((item as { badge?: 'chat' | 'support' }).badge)
            return (
              <Link key={item.href} href={item.href} className={`bottom-nav-item${active ? ' active' : ''}`}>
                <div style={{ position: 'relative' }}>
                  <Icon size={22} strokeWidth={1.9} />
                  {badge > 0 && (
                    <span className="bottom-nav-badge">{badge > 9 ? '9+' : badge}</span>
                  )}
                </div>
                {item.label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`bottom-nav-item${open ? ' active' : ''}`}
            aria-label="Mais opções"
          >
            <div style={{ position: 'relative' }}>
              <MoreHorizontal size={22} strokeWidth={1.9} />
              {supportUnread > 0 && <span className="bottom-nav-badge">{supportUnread > 9 ? '9+' : supportUnread}</span>}
            </div>
            Mais
          </button>
        </div>
      </div>

      {/* Drawer */}
      {open && (
        <>
          <div className="drawer-backdrop" onClick={() => setOpen(false)} />
          <div className="drawer-sheet">
            <div className="drawer-handle" />
            <div className="drawer-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Mais</div>
                {user && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{user.full_name} · {user.email}</div>}
              </div>
              <button onClick={() => setOpen(false)} className="drawer-close" aria-label="Fechar">
                <X size={18} strokeWidth={2.25} />
              </button>
            </div>

            <div className="drawer-grid">
              {DRAWER_LINKS.map(item => {
                const Icon = item.icon
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                const badge = getBadge((item as { badge?: 'chat' | 'support' }).badge)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`drawer-link${active ? ' active' : ''}`}
                  >
                    <Icon size={20} strokeWidth={1.85} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {badge > 0 && (
                      <span className="nav-badge" style={{ marginLeft: 0 }}>{badge > 99 ? '99+' : badge}</span>
                    )}
                  </Link>
                )
              })}

              {user?.is_admin && (
                <Link
                  href="/admin/suporte"
                  onClick={() => setOpen(false)}
                  className="drawer-link drawer-link-admin"
                >
                  <LifeBuoy size={20} strokeWidth={1.85} />
                  <span style={{ flex: 1 }}>Painel suporte</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => { setOpen(false); logout() }}
                className="drawer-link"
                style={{ color: 'var(--danger)' }}
              >
                <LogOut size={20} strokeWidth={1.85} />
                <span>Sair da conta</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
