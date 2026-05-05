'use client'
import { useEffect, useState } from 'react'
import { api, getElderlyId } from '@/lib/api'
import type { CalendarEvent, Task } from '@/lib/types'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function CalendarioPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [tab, setTab] = useState<'eventos' | 'tarefas'>('eventos')
  const [showForm, setShowForm] = useState(false)
  const [eForm, setEForm] = useState({ title: '', starts_at: '', location: '', description: '' })
  const [tForm, setTForm] = useState({ title: '', due_date: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const elderlyId = getElderlyId()

  async function load() {
    if (!elderlyId) return
    const [ev, tk] = await Promise.all([api.listEvents(elderlyId), api.listTasks(elderlyId)])
    setEvents(ev)
    setTasks(tk)
  }

  useEffect(() => { load() }, [elderlyId])

  async function saveEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    setSaving(true)
    setError('')
    try {
      await api.createEvent(elderlyId, { ...eForm, ends_at: undefined })
      setEForm({ title: '', starts_at: '', location: '', description: '' })
      setShowForm(false)
      await load()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro') }
    finally { setSaving(false) }
  }

  async function saveTask(e: React.FormEvent) {
    e.preventDefault()
    if (!elderlyId) return
    setSaving(true)
    setError('')
    try {
      await api.createTask(elderlyId, { ...tForm, due_date: tForm.due_date || undefined })
      setTForm({ title: '', due_date: '', description: '' })
      setShowForm(false)
      await load()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro') }
    finally { setSaving(false) }
  }

  async function toggleTask(task: Task) {
    if (!elderlyId) return
    await api.updateTask(elderlyId, task.id, { is_completed: !task.is_completed })
    await load()
  }

  async function delEvent(id: number) {
    if (!elderlyId || !confirm('Apagar evento?')) return
    await api.deleteEvent(elderlyId, id)
    await load()
  }

  async function delTask(id: number) {
    if (!elderlyId || !confirm('Apagar tarefa?')) return
    await api.deleteTask(elderlyId, id)
    await load()
  }

  const pendingTasks = tasks.filter(t => !t.is_completed)
  const doneTasks = tasks.filter(t => t.is_completed)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Agenda</h1>
          <button
            onClick={() => { setShowForm(v => !v); setError('') }}
            style={{ background: 'var(--sage)', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            {showForm ? '✕' : '+ Adicionar'}
          </button>
        </div>
        {/* tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 12, background: '#F3F4F6', borderRadius: 10, padding: 3 }}>
          {(['eventos', 'tarefas'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                background: tab === t ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 8,
                padding: '8px 0',
                fontWeight: tab === t ? 700 : 500,
                color: tab === t ? 'var(--text)' : 'var(--muted)',
                cursor: 'pointer',
                fontSize: 14,
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {t === 'eventos' ? `Consultas (${events.length})` : `Tarefas (${pendingTasks.length})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* add event form */}
        {showForm && tab === 'eventos' && (
          <form onSubmit={saveEvent} className="card" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Nova consulta / evento</h2>
            <div>
              <label className="label">Título</label>
              <input className="input" value={eForm.title} onChange={e => setEForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Consulta de cardiologia" required />
            </div>
            <div>
              <label className="label">Data e hora</label>
              <input className="input" type="datetime-local" value={eForm.starts_at} onChange={e => setEForm(f => ({ ...f, starts_at: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Local (opcional)</label>
              <input className="input" value={eForm.location} onChange={e => setEForm(f => ({ ...f, location: e.target.value }))} placeholder="Ex: Hospital Santa Maria" />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14, margin: 0 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : 'Guardar evento'}</button>
          </form>
        )}

        {/* add task form */}
        {showForm && tab === 'tarefas' && (
          <form onSubmit={saveTask} className="card" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Nova tarefa</h2>
            <div>
              <label className="label">Título</label>
              <input className="input" value={tForm.title} onChange={e => setTForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Ir à farmácia" required />
            </div>
            <div>
              <label className="label">Data limite (opcional)</label>
              <input className="input" type="date" value={tForm.due_date} onChange={e => setTForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14, margin: 0 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'A guardar…' : 'Guardar tarefa'}</button>
          </form>
        )}

        {/* events list */}
        {tab === 'eventos' && (
          events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
              <p style={{ fontWeight: 600 }}>Sem eventos</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.sort((a, b) => a.starts_at.localeCompare(b.starts_at)).map(ev => (
                <div key={ev.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{ev.title}</div>
                    <div style={{ color: 'var(--sage)', fontSize: 13, marginTop: 3, fontWeight: 600 }}>{fmtDate(ev.starts_at)}</div>
                    {ev.location && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>📍 {ev.location}</div>}
                  </div>
                  <button onClick={() => delEvent(ev.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer', padding: '0 0 0 12px' }}>🗑</button>
                </div>
              ))}
            </div>
          )
        )}

        {/* tasks list */}
        {tab === 'tarefas' && (
          tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <p style={{ fontWeight: 600 }}>Sem tarefas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingTasks.map(t => (
                <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => toggleTask(t)} style={{ width: 24, height: 24, borderRadius: 6, border: '2px solid var(--border)', background: 'white', cursor: 'pointer', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                    {t.due_date && <div style={{ fontSize: 13, color: 'var(--muted)' }}>até {new Date(t.due_date).toLocaleDateString('pt-PT')}</div>}
                  </div>
                  <button onClick={() => delTask(t.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer' }}>🗑</button>
                </div>
              ))}
              {doneTasks.map(t => (
                <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5 }}>
                  <button onClick={() => toggleTask(t)} style={{ width: 24, height: 24, borderRadius: 6, border: '2px solid var(--sage)', background: 'var(--sage)', cursor: 'pointer', flexShrink: 0, color: 'white', fontSize: 14 }}>✓</button>
                  <div style={{ flex: 1, textDecoration: 'line-through', color: 'var(--muted)' }}>{t.title}</div>
                  <button onClick={() => delTask(t.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer' }}>🗑</button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
