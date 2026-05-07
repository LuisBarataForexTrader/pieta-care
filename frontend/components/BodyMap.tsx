'use client'
import { useState } from 'react'

export const BODY_ZONES: Record<string, string> = {
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
  pe_esq:    'Pé esq.',
  pe_dir:    'Pé dir.',
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
  p_pe_esq:    'Planta do pé esq.',
  p_pe_dir:    'Planta do pé dir.',
}

interface BodyMapProps {
  value?: string[]
  onChange?: (zones: string[]) => void
  readOnly?: boolean
}

type Gender = 'female' | 'male'

// ── Pelvis ────────────────────────────────────────────
const BACIA_F = 'M 60,246 C 54,260 48,274 48,294 Q 48,312 100,316 Q 152,312 152,294 C 152,274 146,260 140,246 Z'
const BACIA_M = 'M 56,246 C 52,260 50,274 52,292 Q 52,308 100,312 Q 148,308 148,292 C 150,274 148,260 144,246 Z'

// ── Thighs ────────────────────────────────────────────
const COXA_ESQ_F = 'M 48,304 L 52,390 Q 52,408 78,410 Q 100,408 100,390 L 100,304 Z'
const COXA_ESQ_M = 'M 52,300 L 56,388 Q 56,406 78,408 Q 100,406 100,388 L 100,300 Z'
const COXA_DIR_F = 'M 152,304 L 148,390 Q 148,408 122,410 Q 100,408 100,390 L 100,304 Z'
const COXA_DIR_M = 'M 148,300 L 144,388 Q 144,406 122,408 Q 100,406 100,388 L 100,300 Z'

// ── Lower legs ────────────────────────────────────────
const PERNA_ESQ_F = 'M 52,410 L 48,474 Q 48,490 76,492 Q 98,490 97,474 L 95,410 Z'
const PERNA_ESQ_M = 'M 56,408 L 52,472 Q 52,488 76,490 Q 98,488 97,472 L 95,408 Z'
const PERNA_DIR_F = 'M 148,410 L 152,474 Q 152,490 124,492 Q 102,490 103,474 L 105,410 Z'
const PERNA_DIR_M = 'M 144,408 L 148,472 Q 148,488 124,490 Q 102,488 103,472 L 105,408 Z'

// ── Torso ─────────────────────────────────────────────
const TORAX_F = 'M 90,78 L 48,86 C 40,92 38,110 38,132 C 38,152 50,168 66,178 Q 83,186 100,188 Q 117,186 134,178 C 150,168 162,152 162,132 C 162,110 160,92 152,86 L 110,78 Z'
const TORAX_M = 'M 90,78 L 48,86 C 40,92 38,110 38,132 C 38,156 40,172 46,186 L 154,186 C 160,172 162,156 162,132 C 162,110 160,92 152,86 L 110,78 Z'

// ── Abdomen ───────────────────────────────────────────
const ABDOMEM_F = 'M 66,178 Q 83,186 100,188 Q 117,186 134,178 C 136,196 138,220 140,246 L 60,246 C 62,220 64,196 66,178 Z'
const ABDOMEM_M = 'M 46,186 C 50,202 54,222 56,246 L 144,246 C 146,222 150,202 154,186 Z'

// ── Arms (same shape for both genders) ───────────────
const ARM_ESQ = 'M 62,84 C 56,112 48,156 44,190 C 42,216 36,252 32,274 L 18,272 C 22,250 28,214 30,188 C 34,154 40,110 42,84 Z'
const ARM_DIR = 'M 138,84 C 144,112 152,156 156,190 C 158,216 164,252 168,274 L 182,272 C 178,250 172,214 170,188 C 166,154 160,110 158,84 Z'

// ── Feet (front view) ─────────────────────────────────
const PE_ESQ = 'M 52,490 L 40,506 Q 36,522 66,526 Q 84,524 84,512 L 82,492 Z'
const PE_DIR = 'M 148,490 L 160,506 Q 164,522 134,526 Q 116,524 116,512 L 118,492 Z'

const SKIN   = 'rgba(240,217,200,0.60)'
const SKIN_S = '#C4A57A'

export default function BodyMap({ value = [], onChange, readOnly = false }: BodyMapProps) {
  const [gender, setGender] = useState<Gender>('female')
  const [view, setView]     = useState<'front' | 'back'>('front')
  const [hovered, setHovered] = useState<string | null>(null)

  const selected = new Set(value)
  const prefix   = view === 'back' ? 'p_' : ''

  function toggle(id: string) {
    if (readOnly) return
    const key  = prefix + id
    const next = new Set(selected)
    next.has(key) ? next.delete(key) : next.add(key)
    onChange?.(Array.from(next))
  }

  function zp(id: string) {
    const key = prefix + id
    const on  = selected.has(key)
    const hov = hovered === id
    return {
      fill:            on ? 'rgba(220,38,38,0.28)' : hov ? 'rgba(220,38,38,0.09)' : SKIN,
      stroke:          on ? '#DC2626' : SKIN_S,
      strokeWidth:     on ? 1.6 : 0.8,
      strokeLinejoin:  'round' as const,
      style:           { cursor: readOnly ? 'default' : 'pointer', transition: 'fill 0.12s, stroke 0.12s' },
      onClick:         readOnly ? undefined : () => toggle(id),
      onMouseEnter:    readOnly ? undefined : () => setHovered(id),
      onMouseLeave:    readOnly ? undefined : () => setHovered(null),
    }
  }

  const isF        = gender === 'female'
  const toraxPath  = isF ? TORAX_F  : TORAX_M
  const abdPath    = isF ? ABDOMEM_F : ABDOMEM_M
  const baciaPath  = isF ? BACIA_F  : BACIA_M
  const coxaE      = isF ? COXA_ESQ_F : COXA_ESQ_M
  const coxaD      = isF ? COXA_DIR_F : COXA_DIR_M
  const pernaE     = isF ? PERNA_ESQ_F : PERNA_ESQ_M
  const pernaD     = isF ? PERNA_DIR_F : PERNA_DIR_M

  const selectedKeys = Array.from(selected)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

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

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 200 540" width={150} height={405} style={{ display: 'block', overflow: 'visible' }}>

          {/* ── Arms ── */}
          <path d={ARM_ESQ} {...zp('braco_esq')} />
          <path d={ARM_DIR} {...zp('braco_dir')} />

          {/* ── Torso ── */}
          <path d={toraxPath}  {...zp('torax')} />
          <path d={abdPath}    {...zp('abdomem')} />
          <path d={baciaPath}  {...zp('bacia')} />

          {/* ── Legs ── */}
          <path d={coxaE}  {...zp('coxa_esq')} />
          <path d={coxaD}  {...zp('coxa_dir')} />
          <path d={pernaE} {...zp('perna_esq')} />
          <path d={pernaD} {...zp('perna_dir')} />

          {/* ── Feet ── */}
          <path d={PE_ESQ} {...zp('pe_esq')} />
          <path d={PE_DIR} {...zp('pe_dir')} />

          {/* ── Hands ── */}
          <ellipse cx={25}  cy={288} rx={11} ry={17} {...zp('mao_esq')} />
          <ellipse cx={175} cy={288} rx={11} ry={17} {...zp('mao_dir')} />

          {/* ── Neck (decorative, non-interactive) ── */}
          <rect x={90} y={58} width={20} height={22} rx={5}
            fill={SKIN} stroke={SKIN_S} strokeWidth={0.8}
            style={{ pointerEvents: 'none' }} />

          {/* ── Head (rendered last so it's on top of arms) ── */}
          <ellipse cx={100} cy={31} rx={24} ry={27} {...zp('cabeca')} />

          {/* ── Female bust suggestion (decorative) ── */}
          {isF && view === 'front' && (
            <path d="M 72,132 Q 82,148 100,150 Q 118,148 128,132"
              fill="none" stroke="#C4A088" strokeWidth={0.7} opacity={0.5}
              style={{ pointerEvents: 'none' }} />
          )}

          {/* ── View label ── */}
          <text x={100} y={536} textAnchor="middle" fontSize={8} fill="#9CA3AF"
            style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {view === 'front' ? '▲ FRENTE' : '▼ COSTAS'}
          </text>
        </svg>
      </div>

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
                }} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14 }}>
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {selectedKeys.length === 0 && !readOnly && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
          Toca nas áreas afectadas
        </p>
      )}
    </div>
  )
}
