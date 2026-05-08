'use client'
import { ReactNode } from 'react'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'ai'

interface Props {
  icon?: ReactNode
  label: string
  value: ReactNode
  unit?: string
  trend?: 'up' | 'down' | 'flat'
  trendLabel?: string
  sub?: ReactNode
  footer?: ReactNode
  tone?: Tone
  href?: string
  onClick?: () => void
  children?: ReactNode  // custom slot below value (sparkline etc)
}

const TONE_BG: Record<Tone, string> = {
  neutral: 'var(--surface-2)',
  success: 'var(--success-light)',
  warning: 'var(--warning-light)',
  danger:  'var(--danger-light)',
  info:    '#EEF2FF',
  ai:      'var(--ai-light)',
}
const TONE_FG: Record<Tone, string> = {
  neutral: 'var(--text-2)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger:  'var(--danger)',
  info:    '#4F46E5',
  ai:      'var(--ai-text)',
}

export default function MetricTile({
  icon, label, value, unit, trend, trendLabel,
  sub, footer, tone = 'neutral', href, onClick, children,
}: Props) {
  const Wrapper: 'a' | 'div' | 'button' = href ? 'a' : (onClick ? 'button' : 'div')
  const wrapperProps: Record<string, unknown> = {}
  if (href) wrapperProps.href = href
  if (onClick) wrapperProps.onClick = onClick

  return (
    <Wrapper className="metric-tile" {...wrapperProps}>
      <div className="metric-tile-head">
        {icon && (
          <div className="metric-tile-icon" style={{ background: TONE_BG[tone], color: TONE_FG[tone] }}>
            {icon}
          </div>
        )}
        <div className="metric-tile-label">{label}</div>
      </div>
      <div className="metric-tile-value">
        <span className="metric-tile-value-num">{value}</span>
        {unit && <span className="metric-tile-value-unit">{unit}</span>}
      </div>
      {(trend || sub) && (
        <div className="metric-tile-meta">
          {trend && (
            <span className={`metric-tile-trend metric-tile-trend-${trend}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              {trendLabel && <span style={{ marginLeft: 4 }}>{trendLabel}</span>}
            </span>
          )}
          {sub && <span className="metric-tile-sub">{sub}</span>}
        </div>
      )}
      {children && <div className="metric-tile-slot">{children}</div>}
      {footer && <div className="metric-tile-footer">{footer}</div>}
    </Wrapper>
  )
}
