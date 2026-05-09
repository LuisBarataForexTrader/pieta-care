'use client'
import { Heart, HeartPulse, Wind, Thermometer, Scale, Droplet, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import HealthChart, { ChartPoint, ChartSeries } from './HealthChart'
import type { VitalSign } from '@/lib/types'

interface Props {
  vitals: VitalSign[]
  /** how many days are these measurements covering, for the title hint */
  days?: number
}

const CHART_SPECS: {
  key: keyof VitalSign | 'bp'
  title: string
  unit: string
  icon: React.ReactNode
  color: string
  reference?: { min: number; max: number }
  format?: (v: number) => string
}[] = [
  { key: 'bp', title: 'Tensão arterial', unit: 'mmHg', icon: <Heart size={14} strokeWidth={2.25} />, color: '#E53E3E', reference: { min: 60, max: 140 } },
  { key: 'heart_rate', title: 'Frequência cardíaca', unit: 'bpm', icon: <HeartPulse size={14} strokeWidth={2.25} />, color: '#EC4899', reference: { min: 60, max: 100 } },
  { key: 'oxygen_saturation', title: 'Saturação O₂', unit: '%', icon: <Wind size={14} strokeWidth={2.25} />, color: '#06B6D4', reference: { min: 95, max: 100 } },
  { key: 'temperature', title: 'Temperatura', unit: '°C', icon: <Thermometer size={14} strokeWidth={2.25} />, color: '#F59E0B', reference: { min: 36, max: 37.5 } },
  { key: 'weight', title: 'Peso', unit: 'kg', icon: <Scale size={14} strokeWidth={2.25} />, color: '#7C3AED' },
  { key: 'blood_glucose', title: 'Glicemia', unit: 'mg/dL', icon: <Droplet size={14} strokeWidth={2.25} />, color: '#DC2626', reference: { min: 70, max: 140 } },
]

export default function HealthChartsPanel({ vitals, days = 14 }: Props) {
  if (!vitals || vitals.length === 0) {
    return (
      <div className="card">
        <div className="empty-state" style={{ padding: 32 }}>
          <div className="empty-state-icon" style={{ color: 'var(--text-3)' }}>
            <TrendingUp size={32} strokeWidth={1.4} />
          </div>
          <div className="empty-state-title">Sem registos de sinais vitais</div>
          <div className="empty-state-text">Os gráficos aparecem aqui assim que registar a primeira medição</div>
          <Link href="/saude" style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>
            Registar agora <ArrowRight size={14} strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    )
  }

  // Sort ascending by measured_at for chart
  const sorted = [...vitals].sort((a, b) =>
    new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  )

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 14 }}>
        <div className="section-title">
          <TrendingUp size={17} strokeWidth={2} style={{ color: 'var(--brand)' }} />
          Tendências de saúde · últimos {days} dias
        </div>
        <Link href="/saude" className="section-link">
          Detalhes <ArrowRight size={13} />
        </Link>
      </div>

      <div className="health-charts-grid">
        {CHART_SPECS.map((spec) => {
          let data: ChartPoint[] = []
          let series: ChartSeries[] = []
          let latest: string | null = null

          // Coerce numeric strings (Pydantic Decimals) to numbers; null → NaN
          const num = (v: unknown): number => {
            if (v === null || v === undefined) return NaN
            const n = typeof v === 'number' ? v : parseFloat(String(v))
            return Number.isFinite(n) ? n : NaN
          }

          if (spec.key === 'bp') {
            // Two-series: sys + dia
            data = sorted
              .filter(v => v.blood_pressure_sys !== null || v.blood_pressure_dia !== null)
              .map(v => ({
                t: v.measured_at,
                v: {
                  sys: num(v.blood_pressure_sys),
                  dia: num(v.blood_pressure_dia),
                },
              }))
            series = [
              { key: 'sys', label: 'Sistólica', color: '#E53E3E' },
              { key: 'dia', label: 'Diastólica', color: '#F472B6' },
            ]
            const last = sorted.filter(v => v.blood_pressure_sys).slice(-1)[0]
            if (last) latest = `${last.blood_pressure_sys}/${last.blood_pressure_dia ?? '-'}`
          } else {
            const k = spec.key as keyof VitalSign
            data = sorted
              .filter(v => v[k] !== null && v[k] !== undefined)
              .map(v => ({ t: v.measured_at, v: num(v[k]) }))
              .filter(p => Number.isFinite(p.v as number))
            series = [{ key: 'v', label: spec.title, color: spec.color }]
            const last = sorted.filter(v => v[k] !== null && v[k] !== undefined).slice(-1)[0]
            if (last) {
              const val = num(last[k])
              if (Number.isFinite(val)) {
                latest = spec.format ? spec.format(val) : (Number.isInteger(val) ? String(val) : val.toFixed(1))
              }
            }
          }

          return (
            <div key={String(spec.key)} className="health-chart-card">
              <div className="health-chart-card-head">
                <div className="health-chart-card-title">
                  <span style={{ color: spec.color, display: 'inline-flex' }}>{spec.icon}</span>
                  {spec.title}
                </div>
                {latest !== null && (
                  <div className="health-chart-card-latest">
                    <strong>{latest}</strong>{spec.unit}
                  </div>
                )}
              </div>
              <HealthChart
                data={data}
                series={series}
                unit={spec.unit}
                reference={spec.reference}
                height={140}
                emptyText="Sem dados suficientes"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
