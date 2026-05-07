'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Pill, Smile, AlertTriangle, Lightbulb } from 'lucide-react'
import { api, getElderlyId } from '@/lib/api'
import type { MedicationLog, WellbeingLog, Incident } from '@/lib/types'

const R = 72
const CIRC = 2 * Math.PI * R

function inRange(dateStr: string, daysBack: number, daysBackEnd = 0) {
  const t = new Date(dateStr).getTime()
  const now = Date.now()
  return t >= now - daysBack * 86400000 && t <= now - daysBackEnd * 86400000
}

function mean(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

function scoreColor(s: number) {
  if (s >= 85) return '#276749'
  if (s >= 70) return '#2B6CB0'
  if (s >= 55) return '#D69E2E'
  return '#C53030'
}

function scoreGrade(s: number) {
  if (s >= 85) return 'Excelente'
  if (s >= 70) return 'Bom'
  if (s >= 55) return 'Razoável'
  return 'A melhorar'
}

function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score)
  const filled = (score / 100) * CIRC
  return (
    <svg width={200} height={200} viewBox="0 0 200 200">
      <circle cx={100} cy={100} r={R} fill="none" stroke="var(--surface-2)" strokeWidth={14} />
      <circle
        cx={100} cy={100} r={R} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"
        strokeDasharray={`${filled} ${CIRC - filled}`}
        transform="rotate(-90 100 100)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x={100} y={96} textAnchor="middle" fontSize={42} fontWeight={800} fill={color}>{Math.round(score)}</text>
      <text x={100} y={116} textAnchor="middle" fontSize={12} fill="var(--text-3)" fontWeight={700}>{scoreGrade(score)}</text>
    </svg>
  )
}

function Bar({ label, score, sub, lastScore }: { label: string; score: number; sub: string; lastScore?: number }) {
  const color = scoreColor(score)
  const trend = lastScore != null ? (score > lastScore + 3 ? '↑' : score < lastScore - 3 ? '↓' : '→') : null
  return (
    <div className="card">
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, marginBottom: 2 }}>{Math.round(score)}%</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>{sub}</div>
      <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: 6, background: color, borderRadius: 99, width: `${score}%`, transition: 'width 0.8s' }} />
      </div>
      {lastScore != null && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
          Semana passada: {Math.round(lastScore)}% {trend}
        </div>
      )}
    </div>
  )
}

function weekScore(medLogs: MedicationLog[], wellbeing: WellbeingLog[], daysBack: number, daysBackEnd = 0) {
  const logs = medLogs.filter(l => inRange(l.confirmed_at, daysBack, daysBackEnd))
  const taken = logs.filter(l => l.status === 'taken').length
  const ms = logs.length > 0 ? (taken / logs.length) * 100 : 100
  const wb = wellbeing.filter(w => inRange(w.logged_date, daysBack, daysBackEnd))
  const ws = (wb.length / 7) * 100
  return Math.max(0, Math.min(100, ms * 0.5 + ws * 0.3 + 20))
}

export default function QualidadePage() {
  const elderlyId = getElderlyId()
  const [loading, setLoading] = useState(true)
  const [medLogs, setMedLogs] = useState<MedicationLog[]>([])
  const [wellbeing, setWellbeing] = useState<WellbeingLog[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])

  useEffect(() => {
    if (!elderlyId) return
    Promise.all([
      api.medicationHistory(elderlyId, 28),
      api.listWellbeing(elderlyId, 28),
      api.listIncidents(elderlyId, true),
    ]).then(([logs, wb, inc]) => {
      setMedLogs(logs); setWellbeing(wb); setIncidents(inc); setLoading(false)
    })
  }, [elderlyId])

  // This week
  const thisLogs = medLogs.filter(l => inRange(l.confirmed_at, 7))
  const medTaken = thisLogs.filter(l => l.status === 'taken').length
  const medTotal = thisLogs.length
  const medScore = medTotal > 0 ? (medTaken / medTotal) * 100 : 100

  const lastLogs = medLogs.filter(l => inRange(l.confirmed_at, 14, 7))
  const lastMedScore = lastLogs.length > 0 ? (lastLogs.filter(l => l.status === 'taken').length / lastLogs.length) * 100 : 100

  const thisWB = wellbeing.filter(w => inRange(w.logged_date, 7))
  const lastWB = wellbeing.filter(w => inRange(w.logged_date, 14, 7))
  const wbDays = thisWB.length
  const wbScore = (wbDays / 7) * 100
  const lastWbScore = (lastWB.length / 7) * 100

  const avgMoodThis = wbDays > 0 ? mean(thisWB.map(w => w.mood)) : null
  const avgMoodLast = lastWB.length > 0 ? mean(lastWB.map(w => w.mood)) : null
  const moodTrend: 'up' | 'down' | 'stable' | 'new' =
    avgMoodThis && avgMoodLast
      ? avgMoodThis > avgMoodLast + 0.3 ? 'up' : avgMoodThis < avgMoodLast - 0.3 ? 'down' : 'stable'
      : 'new'

  const thisInc = incidents.filter(i => inRange(i.created_at, 7))
  const critCount = thisInc.filter(i => i.severity === 'critica' || i.severity === 'alta').length

  const overall = Math.max(0, Math.min(100, medScore * 0.5 + wbScore * 0.3 + 20 - critCount * 8))
  const lastOverall = weekScore(medLogs, wellbeing, 14, 7)
  const overallTrend = overall > lastOverall + 3 ? 'up' : overall < lastOverall - 3 ? 'down' : 'stable'

  // 4-week history
  const weekHistory = [
    { label: '-3 sem.', score: weekScore(medLogs, wellbeing, 28, 21) },
    { label: '-2 sem.', score: weekScore(medLogs, wellbeing, 21, 14) },
    { label: '-1 sem.', score: weekScore(medLogs, wellbeing, 14, 7) },
    { label: 'Esta sem.', score: overall, current: true },
  ]

  const barH = 100

  if (loading) return (
    <div>
      <div className="page-top"><div className="page-title">📊 Qualidade de Cuidados</div></div>
      <div className="page-body"><p className="loading" style={{ textAlign: 'center', padding: 48 }}>A calcular…</p></div>
    </div>
  )

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title">📊 Qualidade de Cuidados</div>
          <div className="page-subtitle">Score semanal · medicação + bem-estar + incidentes</div>
        </div>
      </div>

      <div className="page-body">
        {/* Main gauge */}
        <div className="card card-lg" style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Esta semana
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ScoreGauge score={overall} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: -4 }}>
            {overallTrend === 'up' && <span style={{ color: '#276749' }}>↑ Melhorou vs semana passada ({Math.round(lastOverall)})</span>}
            {overallTrend === 'down' && <span style={{ color: '#C53030' }}>↓ Piorou vs semana passada ({Math.round(lastOverall)})</span>}
            {overallTrend === 'stable' && <span style={{ color: 'var(--text-3)' }}>→ Estável vs semana passada ({Math.round(lastOverall)})</span>}
          </div>
        </div>

        {/* Component breakdown */}
        <div className="grid-3" style={{ marginBottom: 24 }}>
          <Bar
            label="Medicação"
            score={medScore}
            sub={medTotal > 0 ? `${medTaken}/${medTotal} tomas confirmadas` : 'Sem medicação agendada'}
            lastScore={lastLogs.length > 0 ? lastMedScore : undefined}
          />
          <Bar
            label="Bem-estar"
            score={wbScore}
            sub={`${wbDays}/7 dias registados${avgMoodThis ? ` · humor médio ${avgMoodThis.toFixed(1)}/5` : ''}`}
            lastScore={lastWbScore}
          />
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={12} strokeWidth={2} /> Incidentes</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: thisInc.length === 0 ? '#276749' : critCount > 0 ? '#C53030' : '#D69E2E', marginBottom: 2 }}>
              {thisInc.length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
              {thisInc.length === 0 ? 'nenhum esta semana' : `${critCount > 0 ? `${critCount} grave${critCount !== 1 ? 's' : ''} + ` : ''}${thisInc.length - critCount} leve${thisInc.length - critCount !== 1 ? 's' : ''}`}
            </div>
            {critCount > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: '#C53030' }}>⚠ Requer atenção</div>}
            {thisInc.length === 0 && <div style={{ fontSize: 12, color: '#276749', fontWeight: 600 }}>✓ Semana sem incidentes</div>}
          </div>
        </div>

        {/* 4-week trend bar chart */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-title" style={{ marginBottom: 20 }}>Evolução das últimas 4 semanas</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: barH + 40 }}>
            {weekHistory.map((w, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: w.current ? scoreColor(w.score) : 'var(--text-3)' }}>
                  {Math.round(w.score)}
                </div>
                <div style={{
                  width: '100%', borderRadius: '8px 8px 0 0',
                  height: Math.max(8, (w.score / 100) * barH),
                  background: w.current ? scoreColor(w.score) : 'var(--surface-2)',
                  border: w.current ? 'none' : '1.5px solid var(--border)',
                  transition: 'height 0.8s ease',
                }} />
                <div style={{ fontSize: 12, color: w.current ? 'var(--brand)' : 'var(--text-3)', fontWeight: w.current ? 700 : 400 }}>
                  {w.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mood heatmap this week */}
        {thisWB.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>Humor esta semana</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {thisWB.map(w => (
                <div key={w.id} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24 }}>{['', '😞', '😟', '😐', '🙂', '😄'][w.mood]}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                    {new Date(w.logged_date).toLocaleDateString('pt-PT', { weekday: 'short' })}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: w.mood >= 4 ? '#276749' : w.mood <= 2 ? '#C53030' : '#D69E2E' }}>
                    {w.mood}/5
                  </div>
                </div>
              ))}
              {moodTrend !== 'new' && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: moodTrend === 'up' ? '#276749' : moodTrend === 'down' ? '#C53030' : 'var(--text-3)' }}>
                  {moodTrend === 'up' ? '↑ A melhorar' : moodTrend === 'down' ? '↓ A piorar' : '→ Estável'}
                  {avgMoodLast && <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 4 }}>
                    (sem. passada: {avgMoodLast.toFixed(1)}/5)
                  </span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="card" style={{ marginBottom: 24, background: 'var(--brand-light)', border: '1px solid rgba(42,96,73,0.15)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Lightbulb size={14} strokeWidth={2} /> Insights desta semana</div>
          <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {medTotal === 0 && <li style={{ fontSize: 13, color: 'var(--text-2)' }}>Sem medicação agendada — adiciona medicamentos para acompanhar a adesão</li>}
            {medTotal > 0 && medScore >= 90 && <li style={{ fontSize: 13, color: 'var(--text-2)' }}>Excelente adesão à medicação esta semana ({Math.round(medScore)}%)</li>}
            {medTotal > 0 && medScore < 70 && <li style={{ fontSize: 13, color: 'var(--text-2)' }}>Adesão à medicação baixa — {medTotal - medTaken} toma{medTotal - medTaken !== 1 ? 's' : ''} em falta esta semana</li>}
            {wbDays < 3 && <li style={{ fontSize: 13, color: 'var(--text-2)' }}>Poucos registos de bem-estar — tenta registar pelo menos 5 dias por semana</li>}
            {wbDays >= 5 && <li style={{ fontSize: 13, color: 'var(--text-2)' }}>Bom registo de bem-estar ({wbDays}/7 dias) — mantém a regularidade</li>}
            {moodTrend === 'up' && avgMoodThis && <li style={{ fontSize: 13, color: 'var(--text-2)' }}>Humor a melhorar esta semana (média {avgMoodThis.toFixed(1)}/5) ↑</li>}
            {moodTrend === 'down' && avgMoodThis && <li style={{ fontSize: 13, color: 'var(--text-2)' }}>Tendência de humor negativa (média {avgMoodThis.toFixed(1)}/5) — verifica o que mudou</li>}
            {critCount > 0 && <li style={{ fontSize: 13, color: 'var(--text-2)' }}>{critCount} incidente{critCount !== 1 ? 's' : ''} grave{critCount !== 1 ? 's' : ''} esta semana — requer acompanhamento</li>}
            {thisInc.length === 0 && <li style={{ fontSize: 13, color: 'var(--text-2)' }}>Nenhum incidente registado esta semana ✓</li>}
          </ul>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { href: '/medicacao', Icon: Pill, label: 'Medicação' },
            { href: '/saude', Icon: Smile, label: 'Bem-estar' },
            { href: '/incidentes', Icon: AlertTriangle, label: 'Incidentes' },
          ].map(({ href, Icon, label }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: 'var(--brand)' }}><Icon size={22} strokeWidth={1.75} /></div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>{label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
