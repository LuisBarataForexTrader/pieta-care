'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  Home, Pill, Calendar, Users, HeartPulse, AlertTriangle,
  FileText, User as UserIcon, NotebookPen, ClipboardList,
  BarChart3, Stethoscope, FileBarChart, Settings, ChevronDown,
  Plus, Check, LogOut, Leaf, LifeBuoy, MessagesSquare, Lock,
} from 'lucide-react'
import { api, clearToken, getElderlyId, setElderlyId } from '@/lib/api'
import { notifyNewChatMessage } from '@/lib/notify'
import type { Elderly, User, BillingStatus } from '@/lib/types'
import ThemeToggle from '@/components/ThemeToggle'
import { canAccess, requiredPlanFor, PLAN_LABEL, FEATURE_INFO, type PlanKey } from '@/lib/access'
import LockedFeatureModal, { type LockedFeature } from '@/components/LockedFeatureModal'
import PlanBadge from '@/components/PlanBadge'

const ICON_PROPS = { size: 19, strokeWidth: 1.75 }

const NAV = [
  { href: '/dashboard', label: 'Hoje', icon: <Home {...ICON_PROPS} /> },
  { href: '/medicacao', label: 'Medicação', icon: <Pill {...ICON_PROPS} /> },
  { href: '/calendario', label: 'Agenda', icon: <Calendar {...ICON_PROPS} /> },
  { href: '/familia', label: 'Família', icon: <Users {...ICON_PROPS} /> },
  { href: '/chat', label: 'Chat familiar', icon: <MessagesSquare {...ICON_PROPS} /> },
  { href: '/saude', label: 'Saúde', icon: <HeartPulse {...ICON_PROPS} /> },
  { href: '/incidentes', label: 'Incidentes', icon: <AlertTriangle {...ICON_PROPS} /> },
  { href: '/documentos', label: 'Documentos', icon: <FileText {...ICON_PROPS} /> },
  { href: '/perfil', label: 'Perfil do Familiar', icon: <UserIcon {...ICON_PROPS} /> },
  { href: '/notas', label: 'Notas de Turno', icon: <NotebookPen {...ICON_PROPS} /> },
  { href: '/plano', label: 'Plano de Cuidados', icon: <ClipboardList {...ICON_PROPS} /> },
  { href: '/qualidade', label: 'Qualidade', icon: <BarChart3 {...ICON_PROPS} /> },
  { href: '/clinico', label: 'Dados Clínicos', icon: <Stethoscope {...ICON_PROPS} /> },
  { href: '/relatorio', label: 'Relatório Médico', icon: <FileBarChart {...ICON_PROPS} /> },
  { href: '/conta', label: 'A minha conta', icon: <Settings {...ICON_PROPS} /> },
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [elderlyList, setElderlyList] = useState<Elderly[]>([])
  const [elderly, setElderly] = useState<Elderly | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [chatUnread, setChatUnread] = useState(0)
  const [supportUnread, setSupportUnread] = useState(0)
  const [adminSupportUnread, setAdminSupportUnread] = useState(0)
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  const switcherRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = getElderlyId()
    Promise.all([api.listElderly(), api.me()]).then(([list, me]) => {
      setElderlyList(list)
      setUser(me)
      const active = list.find(e => e.id === id) ?? list[0] ?? null
      if (active && !id) setElderlyId(active.id)
      setElderly(active)
    }).catch(() => {})
  }, [])

  // Fetch billing status (effective plan) once + on visibility for fresh
  // tier after upgrade/downgrade. Re-poll when navigating back from /conta.
  useEffect(() => {
    let alive = true
    const fetchBilling = () =>
      api.billingStatus()
        .then(s => { if (alive) setBilling(s) })
        .catch(() => { if (alive) setBilling(null) })
    fetchBilling()
    const onVisible = () => { if (document.visibilityState === 'visible') fetchBilling() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [pathname])

  const effectivePlan = (billing?.effective_plan ?? null) as PlanKey | null
  const [lockedFeature, setLockedFeature] = useState<LockedFeature | null>(null)

  // Close switcher on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setShowSwitcher(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Poll chat unread count for badge (every 20s)
  useEffect(() => {
    if (!elderly) return
    let alive = true
    let prev = chatUnread
    const fetchUnread = () => {
      api.chatUnread(elderly.id)
        .then(r => {
          if (!alive) return
          // Fire sound/vibration if unread increased AND user isn't on /chat
          if (r.unread > prev && pathname !== '/chat') {
            notifyNewChatMessage({
              title: 'Nova mensagem no chat familiar',
              body: 'Toque para abrir',
            })
          }
          prev = r.unread
          setChatUnread(r.unread)
        })
        .catch(() => { if (alive) setChatUnread(0) })
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 20000)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchUnread() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elderly, pathname])

  // Reset chat badge when navigating to chat page
  useEffect(() => {
    if (pathname === '/chat') setChatUnread(0)
    if (pathname === '/suporte') setSupportUnread(0)
    if (pathname.startsWith('/admin/suporte')) setAdminSupportUnread(0)
  }, [pathname])

  // Poll support unread (own thread)
  useEffect(() => {
    if (!user) return
    let alive = true
    const fetchUnread = () => {
      api.supportSummary()
        .then(s => { if (alive) setSupportUnread(s.unread) })
        .catch(() => { if (alive) setSupportUnread(0) })
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchUnread() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user])

  // Poll admin support unread (admins only)
  useEffect(() => {
    if (!user?.is_admin) return
    let alive = true
    const fetchUnread = () => {
      api.adminSupportUnread()
        .then(r => { if (alive) setAdminSupportUnread(r.unread) })
        .catch(() => { if (alive) setAdminSupportUnread(0) })
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 20000)
    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [user])

  function switchTo(id: number) {
    setElderlyId(id)
    const next = elderlyList.find(e => e.id === id) ?? null
    setElderly(next)
    setShowSwitcher(false)
    router.push('/dashboard')
    router.refresh()
  }

  function logout() {
    clearToken()
    router.replace('/login')
  }

  const elderlyAge = elderly?.date_of_birth
    ? new Date().getFullYear() - new Date(elderly.date_of_birth).getFullYear()
    : null

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Link href="/dashboard" className="sidebar-logo-mark">
            <Leaf size={20} strokeWidth={2.25} /> pietas.care
          </Link>
          <ThemeToggle className="sidebar-theme-toggle" />
        </div>
        <div className="sidebar-tagline">Cuidar com confiança</div>
        <div className="sidebar-plan-row"><PlanBadge /></div>
      </div>

      {/* Elder card + switcher */}
      {elderly && (
        <div className="sidebar-elder" ref={switcherRef}>
          <div
            className="sidebar-elder-card"
            onClick={() => setShowSwitcher(v => !v)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <div className="elder-avatar">
              {elderly.photo_url
                ? <img src={elderly.photo_url} alt={elderly.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : initials(elderly.full_name)
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="elder-name">{elderly.full_name}</div>
              <div className="elder-sub">
                {elderlyAge ? `${elderlyAge} anos` : 'Familiar'}
                {elderly.blood_type ? ` · ${elderly.blood_type}` : ''}
              </div>
            </div>
            {/* Chevron */}
            <ChevronDown size={14} strokeWidth={2.25}
              style={{ flexShrink: 0, color: 'var(--text-3)', transform: showSwitcher ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {/* Dropdown */}
          {showSwitcher && (
            <div style={{
              position: 'absolute', left: 12, right: 12, zIndex: 50,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              overflow: 'hidden',
            }}>
              {elderlyList.map(e => (
                <div
                  key={e.id}
                  onClick={() => switchTo(e.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', cursor: 'pointer',
                    background: e.id === elderly.id ? 'var(--brand-light)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={ev => { if (e.id !== elderly.id) (ev.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
                  onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = e.id === elderly.id ? 'var(--brand-light)' : 'transparent' }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--brand)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, overflow: 'hidden',
                  }}>
                    {e.photo_url
                      ? <img src={e.photo_url} alt={e.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initials(e.full_name)
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.full_name}</div>
                  </div>
                  {e.id === elderly.id && (
                    <Check size={14} strokeWidth={2.5} style={{ color: 'var(--brand)' }} />
                  )}
                </div>
              ))}

              <div style={{ borderTop: '1px solid var(--border)', padding: '4px' }}>
                <div
                  onClick={() => { setShowSwitcher(false); router.push('/novo-familiar') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                    color: 'var(--brand)', fontWeight: 700, fontSize: 13,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = 'var(--brand-light)' }}
                  onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <Plus size={15} strokeWidth={2.5} /> Adicionar familiar
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav - accessible items first, locked items grouped at the bottom */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navegação</div>
        {(() => {
          const billingLoaded = billing !== null
          // Always-open final entry (A minha conta) goes at the very end
          const ALWAYS_OPEN_PATHS = new Set(['/conta'])

          // Partition NAV into accessible and locked, preserving original order
          const accessible = NAV.filter(item => {
            const required = requiredPlanFor(item.href)
            if (required === null) return true
            // While billing loads, render as accessible to avoid the flash
            if (!billingLoaded) return true
            return canAccess(effectivePlan, item.href)
          })
          const locked = billingLoaded
            ? NAV.filter(item => {
                const required = requiredPlanFor(item.href)
                if (required === null) return false
                return !canAccess(effectivePlan, item.href)
              })
            : []

          // Move /conta to the bottom of the accessible list (visual rhythm)
          const accessibleSorted = [
            ...accessible.filter(i => !ALWAYS_OPEN_PATHS.has(i.href)),
            ...accessible.filter(i => ALWAYS_OPEN_PATHS.has(i.href)),
          ]

          const renderAccessible = (item: typeof NAV[number]) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link${isActive ? ' active' : ''}`}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.href === '/chat' && chatUnread > 0 && (
                  <span className="nav-badge">{chatUnread > 99 ? '99+' : chatUnread}</span>
                )}
              </Link>
            )
          }

          const renderLocked = (item: typeof NAV[number]) => {
            const required = requiredPlanFor(item.href) as PlanKey
            const info = FEATURE_INFO[item.href] ?? { pitch: '', bullets: [] }
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => setLockedFeature({
                  path: item.href,
                  name: item.label,
                  requires: required,
                  icon: item.icon,
                  pitch: info.pitch,
                  bullets: info.bullets,
                  current: effectivePlan,
                })}
                className="nav-link locked locked-clickable"
                title={`Disponível no plano ${PLAN_LABEL[required]} - clique para saber mais`}
                aria-label={`${item.label} - exclusivo do plano ${PLAN_LABEL[required]}`}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                <Lock size={13} strokeWidth={2.25} className="nav-lock-icon" style={{ flexShrink: 0, color: 'var(--text-3)', opacity: 0.7 }} />
              </button>
            )
          }

          return (
            <>
              {accessibleSorted.map(renderAccessible)}
              {locked.length > 0 && (
                <>
                  <div className="nav-section-locked-divider" aria-hidden="true" />
                  {locked.map(renderLocked)}
                </>
              )}
            </>
          )
        })()}
      </nav>

      {/* Locked feature modal — shown when user clicks a locked sidebar item */}
      <LockedFeatureModal feature={lockedFeature} onClose={() => setLockedFeature(null)} />

      {/* User footer */}
      <div className="sidebar-footer">
        {user?.is_admin && (
          <Link
            href="/admin/suporte"
            className="sidebar-help"
            title="Painel de suporte"
            style={{ background: 'rgba(124,58,237,0.18)', borderColor: 'rgba(124,58,237,0.3)' }}
          >
            <LifeBuoy size={16} strokeWidth={2} />
            <span style={{ flex: 1 }}>Painel suporte</span>
            {adminSupportUnread > 0 && (
              <span className="nav-badge" style={{ marginLeft: 0 }}>{adminSupportUnread > 99 ? '99+' : adminSupportUnread}</span>
            )}
          </Link>
        )}
        <Link
          href="/suporte"
          className="sidebar-help"
          title="Falar com o suporte"
        >
          <LifeBuoy size={16} strokeWidth={2} />
          <span style={{ flex: 1 }}>Ajuda · Falar connosco</span>
          {supportUnread > 0 && (
            <span className="nav-badge" style={{ marginLeft: 0 }}>{supportUnread > 99 ? '99+' : supportUnread}</span>
          )}
        </Link>
        {user && (
          <div className="sidebar-user" onClick={logout} title="Sair da conta">
            <div className="user-avatar">{initials(user.full_name)}</div>
            <div>
              <div className="user-name">{user.full_name.split(' ')[0]}</div>
              <div className="user-role">Sair da conta</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
