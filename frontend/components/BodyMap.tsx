'use client'

export const BODY_ZONES: Record<string, string> = {
  cabeca: 'Cabeça',
  torax: 'Tórax / Costelas',
  abdomem: 'Abdómen / Lombar',
  bacia: 'Bacia / Anca',
  braco_esq: 'Braço Esquerdo',
  braco_dir: 'Braço Direito',
  mao_esq: 'Mão / Pulso Esquerdo',
  mao_dir: 'Mão / Pulso Direito',
  coxa_esq: 'Coxa Esquerda',
  coxa_dir: 'Coxa Direita',
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
  const w = size === 'sm' ? 110 : 160
  const h = size === 'sm' ? 260 : 380

  function z(id: string) {
    const active = value === id
    return {
      fill: active ? '#2A6049' : '#E2E8F0',
      stroke: active ? '#1E4A38' : '#94A3B8',
      strokeWidth: active ? 1.5 : 0.8,
      style: { transition: 'all 0.15s', cursor: readonly ? 'default' : 'pointer' },
      onClick: readonly ? undefined : () => onChange?.(value === id ? null : id),
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg viewBox="0 0 180 390" width={w} height={h} style={{ display: 'block' }}>
        {/* Head */}
        <circle cx={90} cy={36} r={30} {...z('cabeca')} />

        {/* Arms — drawn before torso so torso clips them */}
        <rect x={16} y={66} width={38} height={115} rx={12} {...z('braco_esq')} />
        <rect x={126} y={66} width={38} height={115} rx={12} {...z('braco_dir')} />

        {/* Hands */}
        <ellipse cx={35} cy={197} rx={17} ry={21} {...z('mao_esq')} />
        <ellipse cx={145} cy={197} rx={17} ry={21} {...z('mao_dir')} />

        {/* Torso */}
        <rect x={54} y={66} width={72} height={68} rx={14} {...z('torax')} />
        <rect x={57} y={132} width={66} height={50} rx={10} {...z('abdomem')} />
        <rect x={57} y={180} width={66} height={32} rx={12} {...z('bacia')} />

        {/* Thighs */}
        <rect x={57} y={210} width={31} height={80} rx={10} {...z('coxa_esq')} />
        <rect x={92} y={210} width={31} height={80} rx={10} {...z('coxa_dir')} />

        {/* Lower legs */}
        <rect x={57} y={290} width={29} height={80} rx={10} {...z('perna_esq')} />
        <rect x={94} y={290} width={29} height={80} rx={10} {...z('perna_dir')} />

        {/* Zone labels (small) */}
        {!readonly && (
          <g style={{ pointerEvents: 'none' }}>
            <text x={90} y={40} textAnchor="middle" fontSize={7} fill={value === 'cabeca' ? 'white' : '#64748B'} fontWeight={600}>Cabeça</text>
            <text x={90} y={103} textAnchor="middle" fontSize={6.5} fill={value === 'torax' ? 'white' : '#64748B'} fontWeight={600}>Tórax</text>
            <text x={90} y={160} textAnchor="middle" fontSize={6} fill={value === 'abdomem' ? 'white' : '#64748B'} fontWeight={600}>Abdómen</text>
            <text x={90} y={200} textAnchor="middle" fontSize={6} fill={value === 'bacia' ? 'white' : '#64748B'} fontWeight={600}>Bacia</text>
            <text x={35} y={115} textAnchor="middle" fontSize={5.5} fill={value === 'braco_esq' ? 'white' : '#64748B'} fontWeight={600}>Braço E</text>
            <text x={145} y={115} textAnchor="middle" fontSize={5.5} fill={value === 'braco_dir' ? 'white' : '#64748B'} fontWeight={600}>Braço D</text>
            <text x={72} y={254} textAnchor="middle" fontSize={5.5} fill={value === 'coxa_esq' ? 'white' : '#64748B'} fontWeight={600}>Coxa E</text>
            <text x={107} y={254} textAnchor="middle" fontSize={5.5} fill={value === 'coxa_dir' ? 'white' : '#64748B'} fontWeight={600}>Coxa D</text>
            <text x={71} y={334} textAnchor="middle" fontSize={5} fill={value === 'perna_esq' ? 'white' : '#64748B'} fontWeight={600}>Perna E</text>
            <text x={109} y={334} textAnchor="middle" fontSize={5} fill={value === 'perna_dir' ? 'white' : '#64748B'} fontWeight={600}>Perna D</text>
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
