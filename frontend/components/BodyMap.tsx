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

/* ────────────────────────────────────────────────────────
   Anatomically-proportioned body silhouette.
   Coordinate system 0..200 wide, 0..540 tall.
   Each path is a clickable zone; subtle decorative paths
   layer on top to suggest muscle definition without
   adding interactivity (pointerEvents: none).
   ─────────────────────────────────────────────────────── */

// Head (anatomical oval, slightly tapered jaw)
const HEAD = 'M 100,12 C 84,12 73,22 72,40 C 71,52 76,60 78,64 C 80,68 84,72 100,72 C 116,72 120,68 122,64 C 124,60 129,52 128,40 C 127,22 116,12 100,12 Z'

// Neck - short trapezoidal with subtle clavicle hint
const NECK = 'M 90,72 L 88,84 Q 88,88 100,90 Q 112,88 112,84 L 110,72 Z'

// Trapezius / clavicle area (decorative, top of torso)
const TRAP_DEC = 'M 60,84 Q 80,76 100,82 Q 120,76 140,84 Q 145,90 142,98 L 58,98 Q 55,90 60,84 Z'

// Female torso - narrow waist, soft chest curve
const TORAX_F = 'M 60,84 Q 78,76 100,82 Q 122,76 140,84 C 144,88 152,98 156,118 C 158,140 156,160 152,180 Q 148,196 132,200 L 68,200 Q 52,196 48,180 C 44,160 42,140 44,118 C 48,98 56,88 60,84 Z'
const ABD_F   = 'M 68,200 Q 100,206 132,200 C 134,218 134,236 132,250 L 68,250 C 66,236 66,218 68,200 Z'
const BACIA_F = 'M 68,250 L 68,260 C 60,272 54,290 54,302 Q 56,318 100,322 Q 144,318 146,302 C 146,290 140,272 132,260 L 132,250 Z'

// Male torso - broader shoulders, V-taper
const TORAX_M = 'M 56,82 Q 78,72 100,80 Q 122,72 144,82 C 152,90 158,108 160,128 C 158,150 152,170 146,184 L 54,184 C 48,170 42,150 40,128 C 42,108 48,90 56,82 Z'
const ABD_M   = 'M 54,184 Q 100,194 146,184 C 146,200 144,222 140,250 L 60,250 C 56,222 54,200 54,184 Z'
const BACIA_M = 'M 60,250 L 60,260 C 56,272 52,290 54,302 Q 60,318 100,322 Q 140,318 146,302 C 148,290 144,272 140,260 L 140,250 Z'

// Arms - deltoid bulge, biceps narrow, forearm wider towards wrist
const ARM_ESQ = 'M 56,82 C 44,86 36,96 32,110 C 26,138 22,170 20,200 C 18,230 16,260 22,288 L 36,290 C 38,260 42,230 44,200 C 48,170 52,140 58,112 C 60,98 60,90 58,84 Z'
const ARM_DIR = 'M 144,82 C 156,86 164,96 168,110 C 174,138 178,170 180,200 C 182,230 184,260 178,288 L 164,290 C 162,260 158,230 156,200 C 152,170 148,140 142,112 C 140,98 140,90 142,84 Z'

// Decorative muscle hints on arms (deltoid + biceps lines)
const DELT_L = 'M 50,92 Q 38,108 36,130'
const DELT_R = 'M 150,92 Q 162,108 164,130'

// Hands
const HAND_L = 'M 22,290 C 14,290 10,300 12,316 C 14,330 22,336 30,332 L 36,326 L 36,294 Z'
const HAND_R = 'M 178,290 C 186,290 190,300 188,316 C 186,330 178,336 170,332 L 164,326 L 164,294 Z'

// Thighs - quad bulge inside
const COXA_ESQ_F = 'M 68,322 L 60,398 Q 60,420 80,422 Q 100,420 100,398 L 100,322 Z'
const COXA_ESQ_M = 'M 60,322 L 56,398 Q 56,420 80,422 Q 100,420 100,398 L 100,322 Z'
const COXA_DIR_F = 'M 132,322 L 140,398 Q 140,420 120,422 Q 100,420 100,398 L 100,322 Z'
const COXA_DIR_M = 'M 140,322 L 144,398 Q 144,420 120,422 Q 100,420 100,398 L 100,322 Z'

// Knee crease
const KNEE_L = 'M 64,422 Q 80,426 96,422'
const KNEE_R = 'M 104,422 Q 120,426 136,422'

// Lower legs (calves narrowing to ankle)
const PERNA_ESQ_F = 'M 64,422 L 60,490 Q 60,506 80,508 Q 98,506 98,490 L 96,422 Z'
const PERNA_ESQ_M = 'M 60,422 L 56,490 Q 56,506 80,508 Q 98,506 98,490 L 96,422 Z'
const PERNA_DIR_F = 'M 136,422 L 140,490 Q 140,506 120,508 Q 102,506 102,490 L 104,422 Z'
const PERNA_DIR_M = 'M 140,422 L 144,490 Q 144,506 120,508 Q 102,506 102,490 L 104,422 Z'

// Feet (front view - ovalish)
const PE_ESQ = 'M 64,506 L 56,520 Q 52,532 80,534 Q 96,532 96,524 L 96,508 Z'
const PE_DIR = 'M 136,506 L 144,520 Q 148,532 120,534 Q 104,532 104,524 L 104,508 Z'

/* ── Decorative "anatomy" hints (non-interactive) ───── */
// Pectoral sketch line for male front
const PECTORAL_M = 'M 60,108 Q 100,124 140,108'
// Sternum / linea alba
const STERNUM = 'M 100,108 L 100,250'
// Abs cross lines
const ABS_LINE_1 = 'M 80,200 L 120,200'
const ABS_LINE_2 = 'M 80,222 L 120,222'
// Female bust
const BUST = 'M 72,128 Q 84,148 100,150 Q 116,148 128,128'

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
      fill:            on ? 'rgba(220,38,38,0.32)' : hov ? 'rgba(220,38,38,0.10)' : 'url(#bodySkin)',
      stroke:          on ? '#DC2626' : 'var(--body-stroke)',
      strokeWidth:     on ? 1.6 : 0.85,
      strokeLinejoin:  'round' as const,
      style:           { cursor: readOnly ? 'default' : 'pointer', transition: 'fill 0.12s, stroke 0.12s' },
      onClick:         readOnly ? undefined : () => toggle(id),
      onMouseEnter:    readOnly ? undefined : () => setHovered(id),
      onMouseLeave:    readOnly ? undefined : () => setHovered(null),
    }
  }

  const isF        = gender === 'female'
  const toraxPath  = isF ? TORAX_F  : TORAX_M
  const abdPath    = isF ? ABD_F    : ABD_M
  const baciaPath  = isF ? BACIA_F  : BACIA_M
  const coxaE      = isF ? COXA_ESQ_F : COXA_ESQ_M
  const coxaD      = isF ? COXA_DIR_F : COXA_DIR_M
  const pernaE     = isF ? PERNA_ESQ_F : PERNA_ESQ_M
  const pernaD     = isF ? PERNA_DIR_F : PERNA_DIR_M

  const selectedKeys = Array.from(selected)

  return (
    <div className="body-map" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

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
        <svg viewBox="0 0 200 545" width={170} height={462} style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            {/* Subtle dimensional skin gradient */}
            <linearGradient id="bodySkin" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--body-skin-1)" />
              <stop offset="0.5" stopColor="var(--body-skin-2)" />
              <stop offset="1" stopColor="var(--body-skin-1)" />
            </linearGradient>
            {/* Soft shadow under figure */}
            <radialGradient id="bodyShadow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#000" stopOpacity="0.15" />
              <stop offset="1" stopColor="#000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Foot shadow */}
          <ellipse cx={100} cy={538} rx={68} ry={6} fill="url(#bodyShadow)" />

          {/* Arms (drawn first, head on top later) */}
          <path d={ARM_ESQ} {...zp('braco_esq')} />
          <path d={ARM_DIR} {...zp('braco_dir')} />
          {/* Deltoid hint */}
          <path d={DELT_L} fill="none" stroke="var(--body-detail)" strokeWidth={0.6} opacity={0.55} style={{ pointerEvents: 'none' }} />
          <path d={DELT_R} fill="none" stroke="var(--body-detail)" strokeWidth={0.6} opacity={0.55} style={{ pointerEvents: 'none' }} />

          {/* Trapezius (decorative behind torso) */}
          <path d={TRAP_DEC} fill="url(#bodySkin)" stroke="var(--body-stroke)" strokeWidth={0.6} style={{ pointerEvents: 'none' }} />

          {/* Torso */}
          <path d={toraxPath} {...zp('torax')} />
          <path d={abdPath}   {...zp('abdomem')} />
          <path d={baciaPath} {...zp('bacia')} />

          {/* Anatomy hints on torso (front view only) */}
          {view === 'front' && (
            <g style={{ pointerEvents: 'none' }}>
              {/* Sternum / abs midline */}
              <path d={STERNUM} fill="none" stroke="var(--body-detail)" strokeWidth={0.55} opacity={0.4} />
              <path d={ABS_LINE_1} fill="none" stroke="var(--body-detail)" strokeWidth={0.5} opacity={0.35} />
              <path d={ABS_LINE_2} fill="none" stroke="var(--body-detail)" strokeWidth={0.5} opacity={0.35} />
              {!isF && <path d={PECTORAL_M} fill="none" stroke="var(--body-detail)" strokeWidth={0.6} opacity={0.45} />}
              {isF && <path d={BUST} fill="none" stroke="var(--body-detail)" strokeWidth={0.6} opacity={0.4} />}
            </g>
          )}

          {/* Legs */}
          <path d={coxaE}  {...zp('coxa_esq')} />
          <path d={coxaD}  {...zp('coxa_dir')} />
          {/* Knee crease hint */}
          <path d={KNEE_L} fill="none" stroke="var(--body-detail)" strokeWidth={0.55} opacity={0.4} style={{ pointerEvents: 'none' }} />
          <path d={KNEE_R} fill="none" stroke="var(--body-detail)" strokeWidth={0.55} opacity={0.4} style={{ pointerEvents: 'none' }} />
          <path d={pernaE} {...zp('perna_esq')} />
          <path d={pernaD} {...zp('perna_dir')} />

          {/* Feet */}
          <path d={PE_ESQ} {...zp('pe_esq')} />
          <path d={PE_DIR} {...zp('pe_dir')} />

          {/* Hands */}
          <path d={HAND_L} {...zp('mao_esq')} />
          <path d={HAND_R} {...zp('mao_dir')} />

          {/* Neck (decorative) */}
          <path d={NECK} fill="url(#bodySkin)" stroke="var(--body-stroke)" strokeWidth={0.6} style={{ pointerEvents: 'none' }} />

          {/* Head - drawn last so on top */}
          <path d={HEAD} {...zp('cabeca')} />

          {/* View label */}
          <text x={100} y={538} textAnchor="middle" fontSize={9} fontWeight={700}
            fill="var(--text-3)" letterSpacing="0.08em"
            style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {view === 'front' ? 'FRENTE' : 'COSTAS'}
          </text>
        </svg>
      </div>

      {selectedKeys.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {selectedKeys.map(key => (
            <span key={key} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(220,38,38,0.10)', color: '#DC2626',
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
