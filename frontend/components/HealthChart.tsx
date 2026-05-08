'use client'
import { useMemo, useState } from 'react'

export interface ChartPoint {
  /** ISO timestamp */
  t: string
  /** Numeric value(s) — single or named for multi-series */
  v: number | Record<string, number>
}

export interface ChartSeries {
  key: string
  label?: string
  color: string
}

interface Props {
  data: ChartPoint[]
  series: ChartSeries[]
  unit?: string
  /** Y-axis range hints */
  yMin?: number
  yMax?: number
  /** Reference bands, e.g. healthy ranges */
  reference?: { min: number; max: number; color?: string; label?: string }
  height?: number
  emptyText?: string
}

const PADDING = { left: 36, right: 12, top: 12, bottom: 22 }

function fmtX(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

export default function HealthChart({
  data, series, unit, yMin, yMax, reference,
  height = 180, emptyText = 'Sem registos no período',
}: Props) {
  const [hover, setHover] = useState<number | null>(null)

  const chart = useMemo(() => {
    if (data.length < 1) return null

    // Collect numeric points per series
    const points = data.map((p) => {
      const obj: Record<string, number | null> = { __t: new Date(p.t).getTime() }
      for (const s of series) {
        const val = typeof p.v === 'number' ? p.v : (p.v as Record<string, number>)[s.key]
        obj[s.key] = (typeof val === 'number' && !Number.isNaN(val)) ? val : null
      }
      return obj
    })

    // Y-axis range
    const allValues: number[] = []
    for (const p of points) {
      for (const s of series) {
        const v = p[s.key] as number | null
        if (typeof v === 'number') allValues.push(v)
      }
    }
    if (reference) { allValues.push(reference.min, reference.max) }
    if (allValues.length < 2) return null

    let lo = yMin ?? Math.min(...allValues)
    let hi = yMax ?? Math.max(...allValues)
    if (lo === hi) { lo -= 1; hi += 1 }
    const pad = (hi - lo) * 0.1
    lo -= pad; hi += pad

    const tMin = (points[0].__t as number)
    const tMax = (points[points.length - 1].__t as number)

    return { points, lo, hi, tMin, tMax }
  }, [data, series, yMin, yMax, reference])

  if (!chart) {
    return (
      <div className="health-chart-empty" style={{ height }}>
        {emptyText}
      </div>
    )
  }

  const { points, lo, hi, tMin, tMax } = chart
  const w = 520
  const h = height
  const innerW = w - PADDING.left - PADDING.right
  const innerH = h - PADDING.top - PADDING.bottom

  const sx = (t: number) => PADDING.left + ((t - tMin) / Math.max(1, tMax - tMin)) * innerW
  const sy = (v: number) => PADDING.top + (1 - (v - lo) / (hi - lo)) * innerH

  // Y-axis ticks
  const ticks = 4
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => lo + (i * (hi - lo)) / ticks)

  return (
    <div className="health-chart-wrap">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="health-chart"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const xRatio = (e.clientX - rect.left) / rect.width
          const xSvg = xRatio * w
          // Find nearest point
          let best = 0
          let bestDx = Infinity
          for (let i = 0; i < points.length; i++) {
            const px = sx(points[i].__t as number)
            const dx = Math.abs(px - xSvg)
            if (dx < bestDx) { bestDx = dx; best = i }
          }
          setHover(best)
        }}
        onMouseLeave={() => setHover(null)}
      >
        {/* Grid */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PADDING.left} x2={w - PADDING.right}
              y1={sy(t)} y2={sy(t)}
              stroke="var(--border)"
              strokeWidth={i === 0 || i === ticks ? 1 : 0.5}
              strokeDasharray={i === 0 || i === ticks ? 'none' : '2 4'}
            />
            <text
              x={PADDING.left - 6} y={sy(t) + 3}
              fontSize={10}
              fill="var(--text-3)"
              textAnchor="end"
              fontFamily="var(--font-sans)"
            >
              {t.toFixed(t > 100 ? 0 : 1)}
            </text>
          </g>
        ))}

        {/* X-axis labels: first, mid, last (deduped for very short series) */}
        {Array.from(new Set(
          [0, Math.floor(points.length / 2), points.length - 1]
        )).map((idx) => (
          <text
            key={idx}
            x={sx(points[idx].__t as number)}
            y={h - 6}
            fontSize={10}
            fill="var(--text-3)"
            textAnchor={idx === 0 && points.length > 1 ? 'start' : idx === points.length - 1 && points.length > 1 ? 'end' : 'middle'}
            fontFamily="var(--font-sans)"
          >
            {fmtX(new Date(points[idx].__t as number).toISOString())}
          </text>
        ))}

        {/* Reference band */}
        {reference && (
          <rect
            x={PADDING.left}
            y={sy(reference.max)}
            width={innerW}
            height={Math.max(0, sy(reference.min) - sy(reference.max))}
            fill={reference.color ?? 'var(--success)'}
            fillOpacity={0.06}
          />
        )}

        {/* Series — area + line + dots. Single-point case shows just the dot
           with a hint label, since a line needs ≥2 points. */}
        {series.map((s) => {
          const pts: { x: number; y: number; v: number }[] = []
          for (const p of points) {
            const v = p[s.key] as number | null
            if (typeof v === 'number') {
              pts.push({ x: sx(p.__t as number), y: sy(v), v })
            }
          }
          if (pts.length === 0) return null

          if (pts.length === 1) {
            const p = pts[0]
            return (
              <g key={s.key}>
                {/* horizontal dashed reference at the value */}
                <line x1={PADDING.left} x2={w - PADDING.right} y1={p.y} y2={p.y}
                  stroke={s.color} strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
                <circle cx={p.x} cy={p.y} r={4} fill={s.color} />
                <circle cx={p.x} cy={p.y} r={8} fill={s.color} fillOpacity={0.18} />
              </g>
            )
          }

          const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
          const areaPath =
            `M ${pts[0].x.toFixed(1)},${(h - PADDING.bottom).toFixed(1)} ` +
            pts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
            ` L ${pts[pts.length - 1].x.toFixed(1)},${(h - PADDING.bottom).toFixed(1)} Z`
          return (
            <g key={s.key}>
              <path d={areaPath} fill={s.color} fillOpacity={0.10} />
              <path d={linePath} fill="none" stroke={s.color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={s.color} />
              ))}
            </g>
          )
        })}

        {/* Hover guide */}
        {hover !== null && points[hover] && (
          <line
            x1={sx(points[hover].__t as number)}
            x2={sx(points[hover].__t as number)}
            y1={PADDING.top}
            y2={h - PADDING.bottom}
            stroke="var(--text-3)"
            strokeWidth={0.75}
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {/* Legend + tooltip */}
      <div className="health-chart-legend">
        {series.map((s) => (
          <span key={s.key} className="health-chart-legend-item">
            <span className="health-chart-legend-dot" style={{ background: s.color }} />
            {s.label ?? s.key}
          </span>
        ))}
        {hover !== null && points[hover] && (
          <span className="health-chart-tooltip">
            {fmtX(new Date(points[hover].__t as number).toISOString())} ·{' '}
            {series.map((s) => {
              const v = points[hover][s.key] as number | null
              if (v === null) return null
              return (
                <span key={s.key} style={{ color: s.color, marginRight: 6, fontWeight: 700 }}>
                  {Number.isInteger(v) ? v : v.toFixed(1)}{unit ? ` ${unit}` : ''}
                </span>
              )
            })}
          </span>
        )}
      </div>
    </div>
  )
}
