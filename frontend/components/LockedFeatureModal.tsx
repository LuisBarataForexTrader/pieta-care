'use client'
import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { X, Sparkles, Lock, ArrowRight } from 'lucide-react'
import { PLAN_LABEL, type PlanKey } from '@/lib/access'

export interface LockedFeature {
  /** Page path the locked item points to (used as identifier). */
  path: string
  /** Display name (e.g. "Relatório Médico"). */
  name: string
  /** Plan tier required to unlock. */
  requires: PlanKey
  /** Lucide icon for the feature (rendered larger inside the modal). */
  icon: React.ReactNode
  /** Short value-prop sentence (1 line). */
  pitch: string
  /** 3-4 concrete bullets describing what's inside. */
  bullets: string[]
  /** Plan tier the user is currently on (for context messaging). */
  current?: PlanKey | null
}

interface Props {
  feature: LockedFeature | null
  onClose: () => void
}

function planAccent(p: PlanKey): { from: string; to: string; soft: string; ring: string } {
  if (p === 'cuidador_pro') return {
    from: '#7C3AED', to: '#A78BFA',
    soft: 'rgba(124,58,237,0.10)', ring: 'rgba(124,58,237,0.32)',
  }
  return {
    from: '#166534', to: '#22C55E',
    soft: 'rgba(22,101,52,0.10)', ring: 'rgba(22,101,52,0.30)',
  }
}

export default function LockedFeatureModal({ feature, onClose }: Props) {
  const close = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    if (!feature) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [feature, close])

  if (!feature) return null
  const accent = planAccent(feature.requires)
  const isUpgrade = !!feature.current
  const requiredLabel = PLAN_LABEL[feature.requires]

  // The badge wording differs by tier:
  //   - cuidador_pro features (chat, IA) are TRULY exclusive to that plan
  //   - familia_plus features are also accessible to cuidador_pro users
  //     (so they're "Incluído desde o Pack Família+" rather than "Exclusivo")
  const badgeText = feature.requires === 'cuidador_pro'
    ? `Exclusivo ${requiredLabel}`
    : `Incluído desde ${requiredLabel}`
  const ctaText = isUpgrade
    ? `Fazer upgrade para ${requiredLabel}`
    : `Subscrever ${requiredLabel}`

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${feature.name} - exclusivo do plano ${requiredLabel}`}
      onClick={close}
      className="locked-feature-overlay"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Fechar"
        className="locked-feature-close"
      >
        <X size={18} strokeWidth={2.25} />
      </button>

      <div
        className="locked-feature-card"
        onClick={(e) => e.stopPropagation()}
        style={{ ['--accent-from' as never]: accent.from, ['--accent-to' as never]: accent.to, ['--accent-soft' as never]: accent.soft, ['--accent-ring' as never]: accent.ring }}
      >
        {/* Top: gradient header with icon + plan badge */}
        <div className="locked-feature-header">
          <div className="locked-feature-icon" aria-hidden="true">
            {feature.icon}
          </div>
          <div className="locked-feature-badge">
            {feature.requires === 'cuidador_pro' ? <Sparkles size={11} strokeWidth={2.5} /> : <Lock size={11} strokeWidth={2.5} />}
            {badgeText}
          </div>
        </div>

        <div className="locked-feature-body">
          <h2 className="locked-feature-title">{feature.name}</h2>
          <p className="locked-feature-pitch">{feature.pitch}</p>

          {feature.bullets.length > 0 && (
            <ul className="locked-feature-bullets">
              {feature.bullets.map((b, i) => (
                <li key={i}>
                  <span className="locked-feature-bullet-dot" aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="locked-feature-actions">
            <Link
              href={`/conta?plan=${feature.requires}`}
              className="locked-feature-cta"
              onClick={close}
            >
              {ctaText}
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <button type="button" onClick={close} className="locked-feature-cancel">
              Talvez mais tarde
            </button>
          </div>

          {feature.current && (
            <p className="locked-feature-current">
              Atualmente no plano <strong>{PLAN_LABEL[feature.current]}</strong>.
              {feature.requires !== 'cuidador_pro' && ' Esta feature também está incluída no Pack Família Plus + IA.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
