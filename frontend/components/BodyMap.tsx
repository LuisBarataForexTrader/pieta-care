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
  const IDLE     = '#DCE7EF'
  const ACTIVE   = '#2A6049'
  const S_IDLE   = '#8FAFC0'
  const S_ON     = '#1A4035'
  const OUTLINE  = '#C4D6E0'   // subtle full-body silhouette outline

  const w = size === 'sm' ? 116 : 170
  const h = size === 'sm' ? 296 : 434

  function zp(id: string) {
    const on = value === id
    return {
      fill: on ? ACTIVE : IDLE,
      stroke: on ? S_ON : S_IDLE,
      strokeWidth: on ? 1.8 : 0.8,
      strokeLinejoin: 'round' as const,
      style: { transition: 'fill .12s, stroke .12s', cursor: readonly ? 'default' : 'pointer' },
      onClick: readonly ? undefined : () => onChange?.(value === id ? null : id),
    }
  }

  function tc(id: string) { return value === id ? '#fff' : '#4A6677' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg viewBox="0 0 200 500" width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>

        {/* ── SILHOUETTE BACKGROUND — gives the "body" shape even unselected ── */}
        <g style={{ pointerEvents: 'none' }}>
          {/* Full-body outline in very light stroke so it reads as one figure */}
          {/* Left arm silhouette */}
          <path d="M 52,86 C 52,100 50,122 46,146 C 42,168 40,186 38,202 L 22,202 C 20,188 16,170 14,148 C 12,126 14,104 18,94 C 22,84 26,80 32,82 Z"
            fill="none" stroke={OUTLINE} strokeWidth={1} />
          {/* Right arm silhouette */}
          <path d="M 148,86 C 148,100 150,122 154,146 C 158,168 160,186 162,202 L 178,202 C 180,188 184,170 186,148 C 188,126 186,104 182,94 C 178,84 174,80 168,82 Z"
            fill="none" stroke={OUTLINE} strokeWidth={1} />
          {/* Torso+legs silhouette */}
          <path d="M 52,86 Q 58,65 100,63 Q 142,65 148,86 C 148,118 146,148 144,170 L 144,230 C 144,236 136,240 100,240 C 64,240 56,236 56,230 L 56,170 C 54,148 52,118 52,86 Z"
            fill="none" stroke={OUTLINE} strokeWidth={1} />
          <path d="M 50,230 L 50,268 Q 50,286 100,288 Q 150,286 150,268 L 150,230"
            fill="none" stroke={OUTLINE} strokeWidth={1} />
          <path d="M 51,288 L 51,372 Q 51,388 76,390 Q 100,388 100,372 L 100,288"
            fill="none" stroke={OUTLINE} strokeWidth={1} />
          <path d="M 149,288 L 149,372 Q 149,388 124,390 Q 100,388 100,372 L 100,288"
            fill="none" stroke={OUTLINE} strokeWidth={1} />
          <path d="M 53,390 L 53,460 Q 53,474 76,476 Q 98,474 97,462 L 95,390"
            fill="none" stroke={OUTLINE} strokeWidth={1} />
          <path d="M 147,390 L 147,460 Q 147,474 124,476 Q 102,474 103,462 L 105,390"
            fill="none" stroke={OUTLINE} strokeWidth={1} />
        </g>

        {/* ── ARMS — rendered before torso so torso shoulder overlaps cleanly ── */}

        {/* Left arm — properly curved: wider at bicep, narrows to wrist */}
        <path d="M 52,86
                 C 52,100 50,122 46,146
                 C 42,168 40,186 38,202
                 L 22,202
                 C 20,188 16,170 14,148
                 C 12,126 14,104 18,94
                 C 22,84 26,80 32,82
                 Z"
              {...zp('braco_esq')} />

        {/* Right arm — mirror */}
        <path d="M 148,86
                 C 148,100 150,122 154,146
                 C 158,168 160,186 162,202
                 L 178,202
                 C 180,188 184,170 186,148
                 C 188,126 186,104 182,94
                 C 178,84 174,80 168,82
                 Z"
              {...zp('braco_dir')} />

        {/* ── TORSO ── */}

        {/* Thorax — arch at shoulders, slight waist taper on sides */}
        <path d="M 52,86
                 Q 58,65 100,63
                 Q 142,65 148,86
                 C 148,118 146,148 144,170
                 L 56,170
                 C 54,148 52,118 52,86 Z"
              {...zp('torax')} />

        {/* Abdomen */}
        <path d="M 56,170 L 56,230
                 C 56,236 64,240 100,240
                 C 136,240 144,236 144,230
                 L 144,170 Z"
              {...zp('abdomem')} />

        {/* Pelvis / Bacia — wider hip flare */}
        <path d="M 50,226 L 50,268
                 Q 50,286 100,288
                 Q 150,286 150,268
                 L 150,226
                 C 150,234 136,240 100,240
                 C 64,240 50,234 50,226 Z"
              {...zp('bacia')} />

        {/* ── THIGHS ── */}
        <path d="M 51,288 L 51,370
                 Q 51,388 76,390
                 Q 100,388 100,370
                 L 100,288 Z"
              {...zp('coxa_esq')} />

        <path d="M 149,288 L 149,370
                 Q 149,388 124,390
                 Q 100,388 100,370
                 L 100,288 Z"
              {...zp('coxa_dir')} />

        {/* ── LOWER LEGS ── */}
        <path d="M 53,390 L 53,460
                 Q 53,474 76,476
                 Q 98,474 97,462
                 L 95,390 Z"
              {...zp('perna_esq')} />

        <path d="M 147,390 L 147,460
                 Q 147,474 124,476
                 Q 102,474 103,462
                 L 105,390 Z"
              {...zp('perna_dir')} />

        {/* ── HANDS ── */}
        <ellipse cx={20}  cy={214} rx={13} ry={19} {...zp('mao_esq')} />
        <ellipse cx={180} cy={214} rx={13} ry={19} {...zp('mao_dir')} />

        {/* ── ELBOW JOINT MARKERS (anatomical detail) ── */}
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={15} cy={150} r={3.5}
            fill={value === 'braco_esq' ? '#1A4035' : '#A8C4D0'}
            stroke={value === 'braco_esq' ? '#0E2820' : '#8FAFC0'}
            strokeWidth={0.6} />
          <circle cx={185} cy={150} r={3.5}
            fill={value === 'braco_dir' ? '#1A4035' : '#A8C4D0'}
            stroke={value === 'braco_dir' ? '#0E2820' : '#8FAFC0'}
            strokeWidth={0.6} />
          {/* Knee markers */}
          <circle cx={73}  cy={390} r={3.5}
            fill={value === 'coxa_esq' || value === 'perna_esq' ? '#1A4035' : '#A8C4D0'}
            stroke="#8FAFC0" strokeWidth={0.6} />
          <circle cx={127} cy={390} r={3.5}
            fill={value === 'coxa_dir' || value === 'perna_dir' ? '#1A4035' : '#A8C4D0'}
            stroke="#8FAFC0" strokeWidth={0.6} />
        </g>

        {/* ── NECK FILL — blends with thorax ── */}
        <rect x={89} y={61} width={22} height={27} rx={7}
          fill={value === 'torax' ? ACTIVE : IDLE}
          stroke={value === 'torax' ? S_ON : S_IDLE}
          strokeWidth={value === 'torax' ? 1.8 : 0.8}
          style={{ pointerEvents: 'none' }} />

        {/* ── HEAD — always rendered last (on top) ── */}
        <ellipse cx={100} cy={34} rx={25} ry={29} {...zp('cabeca')} />

        {/* ── LABELS ── */}
        {!readonly && (
          <g style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <text x={100} y={38}  textAnchor="middle" fontSize={8.5} fontWeight={700} fill={tc('cabeca')}>Cabeça</text>
            <text x={100} y={122} textAnchor="middle" fontSize={8}   fontWeight={700} fill={tc('torax')}>Tórax</text>
            <text x={100} y={202} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={tc('abdomem')}>Abdómen</text>
            <text x={100} y={257} textAnchor="middle" fontSize={7}   fontWeight={700} fill={tc('bacia')}>Bacia</text>
            <text x={33}  y={142} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={tc('braco_esq')}>Braço E</text>
            <text x={167} y={142} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={tc('braco_dir')}>Braço D</text>
            <text x={20}  y={218} textAnchor="middle" fontSize={5.5} fontWeight={700} fill={tc('mao_esq')}>Mão E</text>
            <text x={180} y={218} textAnchor="middle" fontSize={5.5} fontWeight={700} fill={tc('mao_dir')}>Mão D</text>
            <text x={73}  y={340} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={tc('coxa_esq')}>Coxa E</text>
            <text x={127} y={340} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={tc('coxa_dir')}>Coxa D</text>
            <text x={73}  y={432} textAnchor="middle" fontSize={6}   fontWeight={700} fill={tc('perna_esq')}>Perna E</text>
            <text x={127} y={432} textAnchor="middle" fontSize={6}   fontWeight={700} fill={tc('perna_dir')}>Perna D</text>
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
