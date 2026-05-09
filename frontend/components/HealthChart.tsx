'use client'
import { useId, useMemo, useState } from 'react'

export interface ChartPoint {
  /** ISO timestamp */
  t: string
  /** Numeric value(s) - single or named for multi-series */
  v: number | Record<string, number>
}

export interface ChartSeries {
  key: string
  label?: string
  color: string
}

/** Pull a CSS-color string apart so we can build an `rgba()` from it.
 *  Handles 3-/6-digit hex; falls back to the original string for anything else
 *  (var(--…), already-rgba(), etc. - those will just lose the opacity step but
 *  still render). */
function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const hex = color.length === 4
      ? color.slice(1).split('').map(c => c + c).join('')
      : color.slice(1)
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `rgba(${r},${g},${b},${alpha})`
    }
  }
  return color
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
  const gradId = useId().replace(/:/g, '_')   // unique gradient ids per chart instance

  const chart = useMemo(() => {
    if (data.length < 1) return null

    // Coerce numeric strings (Pydantic Decimals) to numbers; null/NaN → null
    const toNum = (v: unknown): number | null => {
      if (v === null || v === undefined) return null
      const n = typeof v === 'number' ? v : parseFloat(String(v))
      return Number.isFinite(n) ? n : null
    }

    // Collect numeric points per series
    const points = data.map((p) => {
      const obj: Record<string, number | null> = { __t: new Date(p.t).getTime() }
      for (const s of series) {
        const raw = typeof p.v === 'number' || typeof p.v === 'string'
          ? p.v
          : (p.v as Record<string, number | string | null>)[s.key]
        obj[s.key] = toNum(raw)
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
    if (allValues.length < 1) return null

    let lo = yMin ?? Math.min(...allValues)
    let hi = yMax ?? Math.max(...allValues)
    if (lo === hi) {
      // Single value with no reference: pad ±5% (or ±1 absolute floor)
      const span = Math.max(Math.abs(lo) * 0.05, 1)
      lo -= span; hi += span
    }
    const pad = (hi - lo) * 0.1
    lo -= pad; hi += pad

    const tMin = (points[0].__t as number)
    // For single-point case give a synthetic span so the dot can sit centred
    const tMax = points.length > 1
      ? (points[points.length - 1].__t as number)
      : (points[0].__t as number) + 1

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

  // Pixel-space x for the hovered point (used by the floating tooltip)
  const hoverX = hover !== null && points[hover]
    ? (sx(points[hover].__t as number) / w) * 100   // % within the SVG
    : null

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
        onTouchMove={(e) => {
          const touch = e.touches[0]
          if (!touch) return
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const xRatio = (touch.clientX - rect.left) / rect.width
          const xSvg = xRatio * w
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
        onTouchEnd={() => setHover(null)}
      >
        {/* SVG gradient defs - one per series for premium area fills */}
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${gradId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.32} />
              <stop offset="60%" stopColor={s.color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
          <filter id={`glow-${gradId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
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

        {/* Series - area + line + dots. Single-point case shows just the dot
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
            // Centre the lone dot horizontally - left edge looks like a glitch
            const cx = PADDING.left + innerW / 2
            const p = { ...pts[0], x: cx }
            return (
              <g key={s.key}>
                {/* horizontal dashed reference at the value */}
                <line x1={PADDING.left} x2={w - PADDING.right} y1={p.y} y2={p.y}
                  stroke={s.color} strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
                <circle cx={p.x} cy={p.y} r={5} fill={s.color} />
                <circle cx={p.x} cy={p.y} r={10} fill={s.color} fillOpacity={0.18} />
              </g>
            )
          }

          // Smooth line via cubic Bezier averaging neighbouring slopes
          const lineCmds: string[] = []
          for (let i = 0; i < pts.length; i++) {
            const p = pts[i]
            if (i === 0) { lineCmds.push(`M ${p.x.toFixed(1)},${p.y.toFixed(1)}`); continue }
            const prev = pts[i - 1]
            // Tension: 0 = straight; we use ~0.3 for premium curve
            const cp1x = prev.x + (p.x - prev.x) * 0.4
            const cp1y = prev.y
            const cp2x = p.x - (p.x - prev.x) * 0.4
            const cp2y = p.y
            lineCmds.push(`C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
          }
          const linePath = lineCmds.join(' ')
          const areaPath = linePath
            + ` L ${pts[pts.length - 1].x.toFixed(1)},${(h - PADDING.bottom).toFixed(1)}`
            + ` L ${pts[0].x.toFixed(1)},${(h - PADDING.bottom).toFixed(1)} Z`
          // Find the hovered point's index within THIS series' filtered pts
          const hoveredPt = hover !== null && points[hover]
            ? pts.find(p => Math.abs(p.x - sx(points[hover].__t as number)) < 0.5)
            : null
          return (
            <g key={s.key}>
              <path d={areaPath} fill={`url(#grad-${gradId}-${s.key})`} />
              <path d={linePath} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={2} fill={s.color} opacity={0.45} />
              ))}
              {hoveredPt && (
                <>
                  {/* outer halo */}
                  <circle cx={hoveredPt.x} cy={hoveredPt.y} r={9} fill={withAlpha(s.color, 0.18)} />
                  {/* solid dot with glow */}
                  <circle cx={hoveredPt.x} cy={hoveredPt.y} r={4.5} fill={s.color} filter={`url(#glow-${gradId})`} />
                  <circle cx={hoveredPt.x} cy={hoveredPt.y} r={2.5} fill="#fff" />
                </>
              )}
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

      {/* Floating tooltip near the cursor's column */}
      {hover !== null && points[hover] && hoverX !== null && (
        <div
          className="health-chart-bubble"
          style={{ left: `${hoverX}%` }}
        >
          <div className="health-chart-bubble-date">
            {fmtX(new Date(points[hover].__t as number).toISOString())}
          </div>
          {series.map((s) => {
            const v = points[hover][s.key] as number | null
            if (v === null) return null
            return (
              <div key={s.key} className="health-chart-bubble-row">
                <span className="health-chart-bubble-dot" style={{ background: s.color }} />
                <span className="health-chart-bubble-label">{s.label ?? s.key}</span>
                <span className="health-chart-bubble-val" style={{ color: s.color }}>
                  {Number.isInteger(v) ? v : v.toFixed(1)}{unit ? ` ${unit}` : ''}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend (the floating bubble above replaces the inline tooltip) */}
      <div className="health-chart-legend">
        {series.map((s) => (
          <span key={s.key} className="health-chart-legend-item">
            <span className="health-chart-legend-dot" style={{ background: s.color }} />
            {s.label ?? s.key}
          </span>
        ))}
      </div>
    </div>
  )
}
