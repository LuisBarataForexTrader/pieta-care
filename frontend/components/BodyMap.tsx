'use client'

export const BODY_ZONES: Record<string, string> = {
  cabeca:    'Cabeça',
  torax:     'Tórax / Costelas',
  abdomem:   'Abdómen / Lombar',
  bacia:     'Bacia / Anca',
  braco_esq: 'Braço Esquerdo',
  braco_dir: 'Braço Direito',
  mao_esq:   'Mão / Pulso Esquerdo',
  mao_dir:   'Mão / Pulso Direito',
  coxa_esq:  'Coxa Esquerda',
  coxa_dir:  'Coxa Direita',
  perna_esq: 'Perna / Joelho Esquerdo',
  perna_dir: 'Perna / Joelho Direito',
}

interface BodyMapProps {
  value: string | null
  onChange?: (zone: string | null) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}

export default function BodyMap({ value, onChange, readonly = false, size = 'md' }: BodyMapProps) {
  const IDLE   = '#DDE4EC'
  const ACTIVE = '#2A6049'
  const S_IDLE = '#8FA8BA'
  const S_ON   = '#1A4035'
  const T_IDLE = '#4A6572'
  const T_ON   = '#FFFFFF'

  const w = size === 'sm' ? 118 : 172
  const h = size === 'sm' ? 298 : 434

  function zp(id: string) {
    const on = value === id
    return {
      fill:        on ? ACTIVE : IDLE,
      stroke:      on ? S_ON   : S_IDLE,
      strokeWidth: on ? 1.6    : 0.9,
      strokeLinejoin: 'round' as const,
      style: { transition: 'fill .14s, stroke .14s', cursor: readonly ? 'default' : 'pointer' },
      onClick: readonly ? undefined : () => onChange?.(value === id ? null : id),
    }
  }

  function t(id: string) { return value === id ? T_ON : T_IDLE }
  const showLabels = !readonly || size === 'md'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg viewBox="0 0 200 510" width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>

        {/* ── ARMS (rendered before torso so torso shoulder overlaps) ── */}

        {/* Left arm — tapered parallelogram wider at shoulder */}
        <path d="M 17,92 L 50,80 L 52,194 L 21,204
                 C 18,204 15,202 15,199 Z"
              {...zp('braco_esq')} />

        {/* Right arm */}
        <path d="M 183,92 L 150,80 L 148,194 L 179,204
                 C 182,204 185,202 185,199 Z"
              {...zp('braco_dir')} />

        {/* ── TORSO ── */}

        {/* Thorax — arch at top follows shoulder/neck curve */}
        <path d="M 52,86
                 C 54,72 66,65 100,64
                 C 134,65 146,72 148,86
                 L 148,166 L 52,166 Z"
              {...zp('torax')} />

        {/* Abdomen */}
        <path d="M 54,166 L 54,228
                 C 54,234 62,238 100,238
                 C 138,238 146,234 146,228
                 L 146,166 Z"
              {...zp('abdomem')} />

        {/* Bacia / Hips — slightly wider than abdomen */}
        <path d="M 50,224 L 50,266
                 Q 50,282 100,284
                 Q 150,282 150,266
                 L 150,224
                 C 150,232 138,238 100,238
                 C 62,238 50,232 50,224 Z"
              {...zp('bacia')} />

        {/* ── THIGHS ── */}
        <path d="M 52,284 L 52,370
                 Q 52,384 76,386
                 Q 100,384 100,370
                 L 100,284 Z"
              {...zp('coxa_esq')} />

        <path d="M 148,284 L 148,370
                 Q 148,384 124,386
                 Q 100,384 100,370
                 L 100,284 Z"
              {...zp('coxa_dir')} />

        {/* ── LOWER LEGS ── */}
        <path d="M 54,386 L 54,458
                 Q 54,470 76,472
                 Q 98,470 98,460
                 L 96,386 Z"
              {...zp('perna_esq')} />

        <path d="M 146,386 L 146,458
                 Q 146,470 124,472
                 Q 102,470 102,460
                 L 104,386 Z"
              {...zp('perna_dir')} />

        {/* ── HANDS ── */}
        <ellipse cx={18}  cy={216} rx={14} ry={19} {...zp('mao_esq')} />
        <ellipse cx={182} cy={216} rx={14} ry={19} {...zp('mao_dir')} />

        {/* ── NECK FILL (not clickable, blends with torax) ── */}
        <rect x={89} y={62} width={22} height={26} rx={6}
          fill={value === 'torax' ? ACTIVE : IDLE}
          stroke={value === 'torax' ? S_ON : S_IDLE}
          strokeWidth={value === 'torax' ? 1.6 : 0.9}
          style={{ pointerEvents: 'none' }} />

        {/* ── HEAD (rendered last — always on top) ── */}
        <ellipse cx={100} cy={34} rx={26} ry={30} {...zp('cabeca')} />

        {/* ── LABELS ── */}
        {showLabels && (
          <g style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <text x={100} y={38}  textAnchor="middle" fontSize={8.5} fontWeight={700} fill={t('cabeca')}>Cabeça</text>
            <text x={100} y={122} textAnchor="middle" fontSize={8}   fontWeight={700} fill={t('torax')}>Tórax</text>
            <text x={100} y={202} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={t('abdomem')}>Abdómen</text>
            <text x={100} y={255} textAnchor="middle" fontSize={7}   fontWeight={700} fill={t('bacia')}>Bacia</text>
            <text x={33}  y={140} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={t('braco_esq')}>Braço E</text>
            <text x={167} y={140} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={t('braco_dir')}>Braço D</text>
            <text x={18}  y={220} textAnchor="middle" fontSize={5.5} fontWeight={700} fill={t('mao_esq')}>Mão E</text>
            <text x={182} y={220} textAnchor="middle" fontSize={5.5} fontWeight={700} fill={t('mao_dir')}>Mão D</text>
            <text x={73}  y={336} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={t('coxa_esq')}>Coxa E</text>
            <text x={127} y={336} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={t('coxa_dir')}>Coxa D</text>
            <text x={73}  y={426} textAnchor="middle" fontSize={6}   fontWeight={700} fill={t('perna_esq')}>Perna E</text>
            <text x={127} y={426} textAnchor="middle" fontSize={6}   fontWeight={700} fill={t('perna_dir')}>Perna D</text>
          </g>
        )}
      </svg>

      {value && (
        <div style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700, textAlign: 'center' }}>
          📍 {BODY_ZONES[value]}
        </div>
      )}
      {!value && !readonly && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
          Toca na zona afectada
        </div>
      )}
    </div>
  )
}
