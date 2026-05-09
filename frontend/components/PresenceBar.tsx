'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Wifi, Users as UsersIcon } from 'lucide-react'
import { api, getElderlyId } from '@/lib/api'
import type { Elderly, FamilyMember, User } from '@/lib/types'

const ONLINE_WINDOW_MS = 90_000  // 90s - covers gap between 30s heartbeats
const HEARTBEAT_MS = 30_000

function isOnline(lastSeen: string | null | undefined): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function PresenceBar() {
  const [me, setMe] = useState<User | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [tick, setTick] = useState(0)  // forces re-render every 15s for staleness
  const elderlyId = getElderlyId()

  useEffect(() => {
    if (!elderlyId) return
    let alive = true

    async function refresh() {
      try {
        await api.ping().catch(() => {})
        const [list, user] = await Promise.all([api.listElderly(), api.me()])
        if (!alive) return
        setMe(user)
        const e: Elderly | undefined = list.find(x => x.id === elderlyId) ?? list[0]
        setMembers(e?.family_members.filter(m => m.is_accepted && m.full_name) ?? [])
      } catch {
        /* silent */
      }
    }

    refresh()
    const heartbeat = setInterval(refresh, HEARTBEAT_MS)
    const stale = setInterval(() => setTick(t => t + 1), 15_000)
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', refresh)

    return () => {
      alive = false
      clearInterval(heartbeat)
      clearInterval(stale)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', refresh)
    }
  }, [elderlyId])

  if (!me) return null
  void tick  // referenced so isOnline re-evaluates as the staleness ticker fires

  const filtered = members.filter(m => m.full_name !== me.full_name && isOnline(m.last_seen_at))
  const totalOnline = filtered.length + 1

  return (
    <Link href="/familia" className="presence-bar" title="Ver família">
      <Wifi size={13} strokeWidth={2.25} className="presence-pulse" />
      <span className="presence-count">{totalOnline} online</span>
      <div className="presence-avatars">
        {/* me */}
        <div className="presence-avatar presence-avatar-me" title={`${me.full_name} (você)`}>
          {initials(me.full_name)}
          <span className="presence-avatar-dot" />
        </div>
        {filtered.slice(0, 4).map(m => (
          <div key={m.id} className="presence-avatar" title={`${m.full_name ?? m.invited_email} - online`}>
            {initials(m.full_name ?? m.invited_email)}
            <span className="presence-avatar-dot" />
          </div>
        ))}
        {filtered.length > 4 && <span className="presence-more">+{filtered.length - 4}</span>}
        {filtered.length === 0 && (
          <span className="presence-empty"><UsersIcon size={11} strokeWidth={2} /> só você</span>
        )}
      </div>
    </Link>
  )
}
