'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Home, Pill, Calendar, Users, HeartPulse, AlertTriangle, FileText,
  User as UserIcon, NotebookPen, ClipboardList, BarChart3,
  Stethoscope, FileBarChart, Settings, MessagesSquare, MoreHorizontal,
  LifeBuoy, X, LogOut, Check, Plus,
} from 'lucide-react'
import { api, clearToken, getElderlyId, setElderlyId } from '@/lib/api'
import type { User, Elderly } from '@/lib/types'

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

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
  const [elderlyList, setElderlyList] = useState<Elderly[]>([])
  const [activeElderlyId, setActiveElderlyId] = useState<number | null>(null)
  const [chatUnread, setChatUnread] = useState(0)
  const [supportUnread, setSupportUnread] = useState(0)

  useEffect(() => {
    api.me().then(setUser).catch(() => {})
    api.listElderly().then(list => {
      setElderlyList(list)
      const stored = getElderlyId()
      const active = list.find(e => e.id === stored) ?? list[0] ?? null
      setActiveElderlyId(active?.id ?? null)
    }).catch(() => {})
  }, [])

  function switchTo(id: number) {
    setElderlyId(id)
    setActiveElderlyId(id)
    setOpen(false)
    // Force a refresh so all pages re-fetch with new elderly_id
    router.refresh()
    if (typeof window !== 'undefined') window.location.reload()
  }

  const activeElderly = elderlyList.find(e => e.id === activeElderlyId) ?? null

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

            {/* Elderly switcher */}
            {elderlyList.length > 0 && (
              <div style={{ padding: '12px 12px 8px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px 8px' }}>
                  Perfil de familiar
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--surface-2)', borderRadius: 12, padding: 4 }}>
                  {elderlyList.map(e => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => e.id === activeElderlyId ? setOpen(false) : switchTo(e.id)}
                      className="drawer-elderly"
                      style={{
                        background: e.id === activeElderlyId ? 'var(--surface)' : 'transparent',
                        boxShadow: e.id === activeElderlyId ? 'var(--shadow-xs)' : 'none',
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0, overflow: 'hidden' }}>
                        {e.photo_url
                          ? <img src={e.photo_url} alt={e.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : initials(e.full_name)
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          {e.family_members?.length ?? 0} membro{(e.family_members?.length ?? 0) !== 1 ? 's' : ''}
                        </div>
                      </div>
                      {e.id === activeElderlyId && <Check size={16} strokeWidth={2.5} style={{ color: 'var(--brand)' }} />}
                    </button>
                  ))}
                  <Link
                    href="/novo-familiar"
                    onClick={() => setOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--brand)', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}
                  >
                    <Plus size={16} strokeWidth={2.5} /> Adicionar familiar
                  </Link>
                </div>
              </div>
            )}

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
