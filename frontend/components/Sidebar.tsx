'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { api, clearToken, getElderlyId, setElderlyId } from '@/lib/api'
import type { Elderly, User } from '@/lib/types'

const NAV = [
  { href: '/dashboard', label: 'Hoje', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { href: '/medicacao', label: 'Medicação', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
  { href: '/calendario', label: 'Agenda', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { href: '/familia', label: 'Família', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { href: '/saude', label: 'Saúde', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
  { href: '/incidentes', label: 'Incidentes', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
  { href: '/documentos', label: 'Documentos', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { href: '/perfil', label: 'Perfil do Familiar', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  { href: '/notas', label: 'Notas de Turno', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
  { href: '/plano', label: 'Plano de Cuidados', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12l2 2 4-4" /></svg> },
  { href: '/qualidade', label: 'Qualidade', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { href: '/clinico', label: 'Dados Clínicos', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { href: '/relatorio', label: 'Relatório Médico', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { href: '/conta', label: 'A minha conta', icon: <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
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
        <Link href="/dashboard" className="sidebar-logo-mark">
          <span>🌿</span> pieta.care
        </Link>
        <div className="sidebar-tagline">Cuidar com confiança</div>
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
            <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              style={{ flexShrink: 0, color: 'var(--text-3)', transform: showSwitcher ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
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
                    <svg width={14} height={14} fill="none" stroke="var(--brand)" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
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
                  <span style={{ fontSize: 16 }}>+</span> Adicionar familiar
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navegação</div>
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${pathname.startsWith(item.href) ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
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
