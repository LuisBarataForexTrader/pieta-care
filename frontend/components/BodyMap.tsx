'use client'
import { useState } from 'react'

export const BODY_ZONES: Record<string, string> = {
  // Front
  cabeca:    'Cabeça',
  torax:     'Tórax / Peito',
  abdomem:   'Abdómen',
  bacia:     'Bacia / Pélvis',
  braco_esq: 'Braço esq.',
  braco_dir: 'Braço dir.',
  mao_esq:   'Mão / Pulso esq.',
  mao_dir:   'Mão / Pulso dir.',
  coxa_esq:  'Coxa esq.',
  coxa_dir:  'Coxa dir.',
  perna_esq: 'Perna / Joelho esq.',
  perna_dir: 'Perna / Joelho dir.',
  // Back
  p_cabeca:    'Cabeça (costas)',
  p_torax:     'Costas superiores',
  p_abdomem:   'Lombar',
  p_bacia:     'Glúteos',
  p_braco_esq: 'Braço post. esq.',
  p_braco_dir: 'Braço post. dir.',
  p_mao_esq:   'Mão post. esq.',
  p_mao_dir:   'Mão post. dir.',
  p_coxa_esq:  'Coxa post. esq.',
  p_coxa_dir:  'Coxa post. dir.',
  p_perna_esq: 'Gémeo / Calcanhar esq.',
  p_perna_dir: 'Gémeo / Calcanhar dir.',
}

interface BodyMapProps {
  value?: string[]
  onChange?: (zones: string[]) => void
  readOnly?: boolean
}

type Gender = 'female' | 'male'

// viewBox 0 0 200 500
// Female pelvis path (wider hips)
const BACIA_F = 'M 44,226 L 44,270 Q 44,290 100,292 Q 156,290 156,270 L 156,226 C 156,236 136,242 100,242 C 64,242 44,236 44,226 Z'
// Male pelvis path (narrower)
const BACIA_M = 'M 50,226 L 50,268 Q 50,286 100,288 Q 150,286 150,268 L 150,226 C 150,234 136,240 100,240 C 64,240 50,234 50,226 Z'
// Female thigh left (wider)
const COXA_ESQ_F = 'M 45,292 L 45,374 Q 45,392 76,394 Q 100,392 100,374 L 100,292 Z'
const COXA_DIR_F = 'M 155,292 L 155,374 Q 155,392 124,394 Q 100,392 100,374 L 100,292 Z'
// Male thigh (normal)
const COXA_ESQ_M = 'M 51,288 L 51,370 Q 51,388 76,390 Q 100,388 100,370 L 100,288 Z'
const COXA_DIR_M = 'M 149,288 L 149,370 Q 149,388 124,390 Q 100,388 100,370 L 100,288 Z'
// Female lower leg
const PERNA_ESQ_F = 'M 47,394 L 47,462 Q 47,478 76,480 Q 98,478 97,464 L 95,394 Z'
const PERNA_DIR_F = 'M 153,394 L 153,462 Q 153,478 124,480 Q 102,478 103,464 L 105,394 Z'
const PERNA_ESQ_M = 'M 53,390 L 53,460 Q 53,474 76,476 Q 98,474 97,462 L 95,390 Z'
const PERNA_DIR_M = 'M 147,390 L 147,460 Q 147,474 124,476 Q 102,474 103,462 L 105,390 Z'

export default function BodyMap({ value = [], onChange, readOnly = false }: BodyMapProps) {
  const [gender, setGender] = useState<Gender>('female')
  const [view, setView] = useState<'front' | 'back'>('front')
  const [hovered, setHovered] = useState<string | null>(null)

  const selected = new Set(value)
  const prefix = view === 'back' ? 'p_' : ''

  function toggle(id: string) {
    if (readOnly) return
    const key = prefix + id
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange?.(Array.from(next))
  }

  function rp(id: string) {
    const key = prefix + id
    const on = selected.has(key)
    const hov = hovered === id
    return {
      fill: on ? 'rgba(220,38,38,0.32)' : hov ? 'rgba(220,38,38,0.10)' : 'rgba(0,0,0,0)',
      stroke: on ? '#DC2626' : '#374151',
      strokeWidth: on ? 1.8 : 1.0,
      strokeLinejoin: 'round' as const,
      style: { cursor: readOnly ? 'default' : 'pointer', transition: 'all 0.1s' },
      onClick: readOnly ? undefined : () => toggle(id),
      onMouseEnter: readOnly ? undefined : () => setHovered(id),
      onMouseLeave: readOnly ? undefined : () => setHovered(null),
    }
  }

  const isF = gender === 'female'
  const baciaPath  = isF ? BACIA_F  : BACIA_M
  const coxaEPath  = isF ? COXA_ESQ_F : COXA_ESQ_M
  const coxaDPath  = isF ? COXA_DIR_F : COXA_DIR_M
  const pernaEPath = isF ? PERNA_ESQ_F : PERNA_ESQ_M
  const pernaDPath = isF ? PERNA_DIR_F : PERNA_DIR_M

  // Chest: slightly different for female (bust curve)
  const toraxPath = isF
    ? 'M 52,86 Q 58,65 100,63 Q 142,65 148,86 C 148,100 148,122 148,144 Q 130,156 100,158 Q 70,156 52,144 C 52,122 52,100 52,86 Z'
    : 'M 52,86 Q 58,65 100,63 Q 142,65 148,86 C 148,118 146,148 144,170 L 56,170 C 54,148 52,118 52,86 Z'

  const abdomenPath = isF
    ? 'M 52,144 Q 70,156 100,158 Q 130,156 148,144 L 144,230 C 136,242 100,244 100,244 C 100,244 64,242 56,230 Z'
    : 'M 56,170 L 56,230 C 56,236 64,240 100,240 C 136,240 144,236 144,230 L 144,170 Z'

  const selectedKeys = Array.from(selected)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Controls */}
      {!readOnly && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 8, padding: 3, gap: 2 }}>
            {(['female', 'male'] as Gender[]).map(g => (
              <button key={g} type="button" onClick={() => setGender(g)} style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: gender === g ? 'var(--brand)' : 'transparent',
                color: gender === g ? '#fff' : 'var(--text-3)',
                transition: 'all 0.15s',
              }}>
                {g === 'female' ? '♀ Mulher' : '♂ Homem'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 8, padding: 3, gap: 2 }}>
            {(['front', 'back'] as const).map(v => (
              <button key={v} type="button" onClick={() => setView(v)} style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: view === v ? 'var(--brand)' : 'transparent',
                color: view === v ? '#fff' : 'var(--text-3)',
                transition: 'all 0.15s',
              }}>
                {v === 'front' ? 'Frente' : 'Costas'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SVG Body */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 200 500" width={160} height={400} style={{ display: 'block', overflow: 'visible' }}>

          {/* Arms */}
          <path d="M 52,86 C 52,100 50,122 46,146 C 42,168 40,186 38,202 L 22,202 C 20,188 16,170 14,148 C 12,126 14,104 18,94 C 22,84 26,80 32,82 Z"
            {...rp('braco_esq')} />
          <path d="M 148,86 C 148,100 150,122 154,146 C 158,168 160,186 162,202 L 178,202 C 180,188 184,170 186,148 C 188,126 186,104 182,94 C 178,84 174,80 168,82 Z"
            {...rp('braco_dir')} />

          {/* Torso */}
          <path d={toraxPath} {...rp('torax')} />
          <path d={abdomenPath} {...rp('abdomem')} />
          <path d={baciaPath} {...rp('bacia')} />

          {/* Thighs */}
          <path d={coxaEPath} {...rp('coxa_esq')} />
          <path d={coxaDPath} {...rp('coxa_dir')} />

          {/* Lower legs */}
          <path d={pernaEPath} {...rp('perna_esq')} />
          <path d={pernaDPath} {...rp('perna_dir')} />

          {/* Hands */}
          <ellipse cx={20} cy={214} rx={13} ry={19} {...rp('mao_esq')} />
          <ellipse cx={180} cy={214} rx={13} ry={19} {...rp('mao_dir')} />

          {/* Neck strip (non-interactive, visual only) */}
          <rect x={89} y={58} width={22} height={27} rx={7}
            fill="rgba(0,0,0,0)" stroke="#374151" strokeWidth={1}
            style={{ pointerEvents: 'none' }} />

          {/* Head */}
          <ellipse cx={100} cy={34} rx={25} ry={29} {...rp('cabeca')} />

          {/* Female bust hint (decorative, non-interactive) */}
          {isF && view === 'front' && (
            <g style={{ pointerEvents: 'none' }}>
              <path d="M 70,120 Q 80,138 100,140 Q 120,138 130,120"
                fill="none" stroke="#374151" strokeWidth={0.8} opacity={0.5} />
            </g>
          )}

          {/* View label */}
          <text x={100} y={496} textAnchor="middle" fontSize={9} fill="#9CA3AF" style={{ pointerEvents: 'none' }}>
            {view === 'front' ? '▲ Frente' : '▼ Costas'}
          </text>
        </svg>
      </div>

      {/* Selected tags */}
      {selectedKeys.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {selectedKeys.map(key => (
            <span key={key} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(220,38,38,0.08)', color: '#DC2626',
              border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600,
            }}>
              {BODY_ZONES[key] ?? key}
              {!readOnly && (
                <button type="button" onClick={() => {
                  const next = new Set(selected); next.delete(key); onChange?.(Array.from(next))
                }} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
              )}
            </span>
          ))}
        </div>
      )}
      {selectedKeys.length === 0 && !readOnly && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
          Toca nas áreas afectadas do corpo
        </p>
      )}
    </div>
  )
}
