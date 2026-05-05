'use client'
import { useEffect, useState, useCallback } from 'react'
import { api, getElderlyId } from '@/lib/api'
import type { DailyScheduleItem, Elderly } from '@/lib/types'

const STATUS_LABEL: Record<string, string> = {
  taken: 'Tomado ✓',
  pending: 'Pendente',
  skipped: 'Saltado',
  missed: 'Perdido',
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

function todayPt() {
  return new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function Dashboard() {
  const [elderly, setElderly] = useState<Elderly | null>(null)
  const [schedule, setSchedule] = useState<DailyScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)

  const elderlyId = getElderlyId()

  const load = useCallback(async () => {
    if (!elderlyId) return
    const [list, sched] = await Promise.all([
      api.listElderly(),
      api.dailySchedule(elderlyId),
    ])
    setElderly(list.find(e => e.id === elderlyId) ?? list[0] ?? null)
    setSchedule(sched)
    setLoading(false)
  }, [elderlyId])

  useEffect(() => { load() }, [load])

  async function confirm(item: DailyScheduleItem, status: 'taken' | 'skipped') {
    if (!elderlyId || item.status !== 'pending') return
    const key = `${item.medication_id}-${item.scheduled_time}`
    setConfirming(key)
    try {
      await api.confirmMedication(elderlyId, item.medication_id, item.scheduled_time, status)
      await load()
    } finally {
      setConfirming(null)
    }
  }

  const pending = schedule.filter(i => i.status === 'pending')
  const done = schedule.filter(i => i.status !== 'pending')
  const allTaken = schedule.length > 0 && pending.length === 0

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              {elderly ? elderly.full_name : 'pieta.care'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0', textTransform: 'capitalize' }}>
              {todayPt()}
            </p>
          </div>
          <div style={{ fontSize: 28 }}>🌿</div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* summary card */}
        <div className="card" style={{
          background: allTaken ? 'var(--sage)' : 'var(--sage-light)',
          color: allTaken ? 'white' : 'var(--text)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <div style={{ fontSize: 36 }}>{allTaken ? '🎉' : '💊'}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {loading ? 'A carregar…' : allTaken
                ? 'Todas as tomas confirmadas!'
                : `${pending.length} toma${pending.length !== 1 ? 's' : ''} por confirmar`}
            </div>
            {!allTaken && !loading && (
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>
                {done.length} de {schedule.length} concluídas hoje
              </div>
            )}
          </div>
        </div>

        {/* pending items */}
        {pending.length > 0 && (
          <>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
              Por confirmar
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {pending.map(item => {
                const key = `${item.medication_id}-${item.scheduled_time}`
                const busy = confirming === key
                return (
                  <div key={key} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 17 }}>{item.name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 2 }}>{item.dosage}</div>
                        {item.instructions && (
                          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>{item.instructions}</div>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--sage)', flexShrink: 0, marginLeft: 8 }}>
                        {timeLabel(item.scheduled_time)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => confirm(item, 'taken')}
                        disabled={busy}
                        style={{
                          flex: 1,
                          background: 'var(--sage)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 10,
                          padding: '12px 0',
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: busy ? 'not-allowed' : 'pointer',
                          opacity: busy ? 0.6 : 1,
                        }}
                      >
                        {busy ? '…' : '✓ Tomado'}
                      </button>
                      <button
                        onClick={() => confirm(item, 'skipped')}
                        disabled={busy}
                        style={{
                          flex: 0,
                          background: '#F3F4F6',
                          color: 'var(--muted)',
                          border: 'none',
                          borderRadius: 10,
                          padding: '12px 16px',
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: busy ? 'not-allowed' : 'pointer',
                          opacity: busy ? 0.6 : 1,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Saltar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* completed items */}
        {done.length > 0 && (
          <>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
              Histórico de hoje
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {done.map(item => {
                const key = `${item.medication_id}-${item.scheduled_time}`
                return (
                  <div key={key} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{item.dosage} · {timeLabel(item.scheduled_time)}</div>
                    </div>
                    <span className={`status-pill status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {!loading && schedule.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
            <p style={{ fontWeight: 600 }}>Sem medicação registada</p>
            <p style={{ fontSize: 14 }}>Adiciona medicamentos no separador Medicação</p>
          </div>
        )}
      </div>
    </div>
  )
}
