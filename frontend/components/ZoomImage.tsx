'use client'
import Image, { type ImageProps } from 'next/image'
import { useEffect, useState, useCallback } from 'react'
import { X, Maximize2 } from 'lucide-react'

type Props = Omit<ImageProps, 'placeholder'> & {
  /** Optional overlay caption shown in the lightbox */
  caption?: string
  /** Wrap the image in a fake browser-frame chrome */
  chrome?: boolean
  /** Address shown in the chrome bar */
  chromeUrl?: string
  /** className for the outer wrapper */
  wrapperClassName?: string
}

export default function ZoomImage({
  caption, chrome, chromeUrl, wrapperClassName,
  className, style, alt, ...imgProps
}: Props) {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, close])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={wrapperClassName}
        aria-label={`Ampliar: ${alt ?? 'imagem'}`}
        style={{
          appearance: 'none',
          border: 'none',
          background: 'transparent',
          padding: 0,
          margin: 0,
          cursor: 'zoom-in',
          display: 'block',
          width: '100%',
          textAlign: 'left',
          position: 'relative',
        }}
      >
        {chrome ? (
          <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', transition: 'transform 0.4s cubic-bezier(0.2,0.8,0.2,1)' }}
               className="zoom-image-frame">
            <div style={{ background: '#050507', padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
              {[0,1,2].map(i => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', display: 'inline-block' }} />)}
              {chromeUrl && (
                <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{chromeUrl}</span>
              )}
            </div>
            <Image
              alt={alt ?? ''}
              {...imgProps}
              className={className}
              style={{ width: '100%', height: 'auto', display: 'block', ...style }}
            />
          </div>
        ) : (
          <Image
            alt={alt ?? ''}
            {...imgProps}
            className={className}
            style={{ width: '100%', height: 'auto', display: 'block', ...style }}
          />
        )}
        <span aria-hidden="true" className="zoom-image-hint" style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          padding: '6px 10px',
          borderRadius: 8,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          opacity: 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: 'none',
        }}>
          <Maximize2 size={11} strokeWidth={2.5} /> Ampliar
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={caption ?? alt ?? 'Imagem ampliada'}
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(5,5,7,0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            animation: 'zoomImageFade 0.18s ease-out',
            cursor: 'zoom-out',
          }}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 40, height: 40, borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            <X size={18} strokeWidth={2.25} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 'min(1400px, 96vw)',
              maxHeight: '88vh',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 60px 140px rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'auto',
            }}
          >
            <Image
              alt={alt ?? ''}
              src={imgProps.src}
              width={imgProps.width as number}
              height={imgProps.height as number}
              style={{ width: 'auto', maxWidth: '100%', maxHeight: '88vh', display: 'block', objectFit: 'contain' }}
              priority
              sizes="100vw"
            />
          </div>
          {caption && (
            <p style={{ marginTop: 16, color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', maxWidth: 720 }}>
              {caption}
            </p>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes zoomImageFade { from { opacity: 0 } to { opacity: 1 } }
        .zoom-image-frame { transform: translateZ(0); }
        button:hover > .zoom-image-hint { opacity: 1; }
        button:hover .zoom-image-frame { transform: translateY(-3px); }
      `}</style>
    </>
  )
}
