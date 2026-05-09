'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Star, Heart, Send, Check } from 'lucide-react'
import { api } from '@/lib/api'

function StarRow({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div className="rating-row" role="radiogroup" aria-label="Avaliação">
      {[1, 2, 3, 4, 5].map(n => {
        const lit = (hover ?? value) >= n
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            disabled={disabled}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            className={`rating-star${lit ? ' rating-star-lit' : ''}`}
            title={`${n} estrela${n !== 1 ? 's' : ''}`}
          >
            <Star size={36} strokeWidth={2} fill={lit ? '#F59E0B' : 'transparent'} stroke={lit ? '#F59E0B' : 'currentColor'} />
          </button>
        )
      })}
    </div>
  )
}

function AvaliacaoInner() {
  const router = useRouter()
  const params = useSearchParams()
  const source = params.get('source') ?? 'manual'

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (rating < 1) return
    setSaving(true); setError('')
    try {
      await api.submitFeedback(rating, comment.trim() || undefined, source)
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível enviar a avaliação.')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="page-body" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="card card-lg" style={{ maxWidth: 480, textAlign: 'center', padding: 'clamp(40px,5vw,64px) clamp(24px,3vw,40px)' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: 16, background: 'var(--brand-light)', color: 'var(--on-tinted-brand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={28} strokeWidth={1.75} fill="currentColor" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Obrigado!</h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
            A sua avaliação foi enviada para a equipa do pietas.care. Cada feedback ajuda-nos a melhorar a app para todas as famílias.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Star size={20} strokeWidth={2} fill="currentColor" /> Como tem sido a experiência?
          </div>
          <div className="page-subtitle">A sua opinião ajuda-nos a melhorar.</div>
        </div>
      </div>
      <div className="page-body" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="card card-lg" style={{ maxWidth: 600, width: '100%' }}>
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <div className="field-label" style={{ marginBottom: 14 }}>De 1 a 5 estrelas, que nota daria ao pietas.care?</div>
            <StarRow value={rating} onChange={setRating} disabled={saving} />
            {rating > 0 && (
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
                {rating === 5 ? 'Excelente · obrigado!' : rating === 4 ? 'Muito bom' : rating === 3 ? 'Razoável' : rating === 2 ? 'Pode melhorar' : 'Não gostou'}
              </div>
            )}
          </div>

          <label className="field-label">Comentário <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>(opcional)</span></label>
          <textarea
            className="field-input"
            rows={5}
            value={comment}
            onChange={e => setComment(e.target.value.slice(0, 2000))}
            placeholder="O que está a funcionar bem? O que está em falta? Há algo que mudaria?"
            disabled={saving}
            style={{ resize: 'vertical' }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', marginTop: 4 }}>
            {comment.length} / 2000
          </div>

          {error && <div className="alert-error" style={{ marginTop: 14 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            <button
              onClick={submit}
              disabled={saving || rating < 1}
              className="btn-primary"
              style={{ width: 'auto', padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {saving ? 'A enviar…' : <><Send size={15} strokeWidth={2.25} /> Enviar avaliação</>}
            </button>
            <Link href="/dashboard" className="btn-secondary" style={{ width: 'auto', padding: '12px 24px', textDecoration: 'none' }}>
              Mais tarde
            </Link>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .rating-row {
          display: inline-flex; gap: 6px; align-items: center;
        }
        .rating-star {
          appearance: none; border: none; background: transparent;
          cursor: pointer; padding: 4px;
          color: var(--text-3);
          transition: transform 0.12s ease, color 0.12s ease;
          border-radius: 6px;
        }
        .rating-star:hover { transform: scale(1.10); }
        .rating-star:active { transform: scale(0.95); }
        .rating-star-lit { color: #F59E0B; }
        .rating-star:disabled { cursor: default; opacity: 0.6; transform: none; }
      `}</style>
    </div>
  )
}

export default function AvaliacaoPage() {
  return (
    <Suspense fallback={<div className="page-body"><div className="loading">A carregar…</div></div>}>
      <AvaliacaoInner />
    </Suspense>
  )
}
