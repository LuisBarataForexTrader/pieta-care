'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api, clearToken, getElderlyId } from '@/lib/api'
import type { Elderly, User } from '@/lib/types'

const NAV = [
  {
    href: '/dashboard',
    label: 'Hoje',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/medicacao',
    label: 'Medicação',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/calendario',
    label: 'Agenda',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/familia',
    label: 'Família',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/saude',
    label: 'Saúde',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    href: '/incidentes',
    label: 'Incidentes',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    href: '/documentos',
    label: 'Documentos',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/perfil',
    label: 'Perfil do Familiar',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: '/notas',
    label: 'Notas de Turno',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    href: '/plano',
    label: 'Plano de Cuidados',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/relatorio',
    label: 'Relatório Médico',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [elderly, setElderly] = useState<Elderly | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const elderlyId = getElderlyId()
    Promise.all([api.listElderly(), api.me()]).then(([list, me]) => {
      setUser(me)
      setElderly(list.find(e => e.id === elderlyId) ?? list[0] ?? null)
    }).catch(() => {})
  }, [])

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

      {/* Elder card */}
      {elderly && (
        <div className="sidebar-elder">
          <div className="sidebar-elder-card">
            <div className="elder-avatar">
              {elderly.photo_url
                ? <img src={elderly.photo_url} alt={elderly.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : initials(elderly.full_name)
              }
            </div>
            <div>
              <div className="elder-name">{elderly.full_name}</div>
              <div className="elder-sub">
                {elderlyAge ? `${elderlyAge} anos` : 'Familiar'}
                {elderly.blood_type ? ` · ${elderly.blood_type}` : ''}
              </div>
            </div>
          </div>
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
