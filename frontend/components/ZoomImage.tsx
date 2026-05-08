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
  /** className for the outer wrapper button */
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
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
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
          zIndex: 1,
          isolation: 'isolate',
        }}
      >
        {chrome ? (
          <div className="zoom-image-frame" style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', transition: 'transform 0.4s cubic-bezier(0.2,0.8,0.2,1)' }}>
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
        <span aria-hidden="true" className="zoom-image-hint">
          <Maximize2 size={11} strokeWidth={2.5} /> Ampliar
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={caption ?? alt ?? 'Imagem ampliada'}
          onClick={close}
          className="zoom-image-overlay"
        >
          {/* Top toolbar with explicit close action */}
          <div className="zoom-image-toolbar" onClick={(e) => e.stopPropagation()}>
            <span className="zoom-image-esc" aria-hidden="true">Esc</span>
            <button
              type="button"
              onClick={close}
              aria-label="Fechar imagem ampliada"
              className="zoom-image-close"
            >
              <X size={18} strokeWidth={2.5} />
              <span>Fechar</span>
            </button>
          </div>

          {/* Image container — clicking the image itself does NOT close */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="zoom-image-stage"
          >
            {/* Plain <img> so width:100%/height:100% with object-fit fills the
                stage. next/image wraps in a span that fights flex sizing. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={alt ?? ''}
              src={String(imgProps.src)}
              className="zoom-image-large"
              decoding="async"
            />
            {caption && (
              <p className="zoom-image-caption">{caption}</p>
            )}
          </div>

          {/* Bottom hint — also closes on click */}
          <p className="zoom-image-bottom-hint">Clique fora da imagem ou pressione Esc para fechar</p>
        </div>
      )}

      <style jsx global>{`
        @keyframes zoomImageFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes zoomImagePop { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: scale(1) } }

        .zoom-image-hint {
          position: absolute; top: 14px; right: 14px;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(8px);
          color: #fff;
          font-size: 11px; font-weight: 700;
          padding: 6px 10px; border-radius: 8px;
          display: inline-flex; align-items: center; gap: 5px;
          opacity: 0; transition: opacity 0.2s ease; pointer-events: none;
        }
        button:hover > .zoom-image-hint { opacity: 1; }
        button:hover .zoom-image-frame { transform: translateY(-3px); }

        .zoom-image-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(5,5,7,0.94);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 24px 24px 56px;
          animation: zoomImageFade 0.16s ease-out;
          cursor: zoom-out;
        }
        .zoom-image-toolbar {
          position: fixed; top: 18px; right: 18px;
          display: inline-flex; align-items: center; gap: 12px;
          z-index: 1;
        }
        .zoom-image-esc {
          font-size: 11px; font-weight: 700; letter-spacing: 0.05em;
          color: rgba(255,255,255,0.55);
          padding: 5px 10px; border-radius: 6px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
        }
        .zoom-image-close {
          appearance: none; border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.10);
          backdrop-filter: blur(8px);
          color: #fff; font-weight: 700; font-size: 14px;
          padding: 9px 16px; border-radius: 10px;
          display: inline-flex; align-items: center; gap: 8px;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.15s ease;
          font-family: inherit;
        }
        .zoom-image-close:hover { background: rgba(255,255,255,0.18); }
        .zoom-image-close:active { transform: scale(0.96); }

        .zoom-image-stage {
          width: min(1800px, 96vw);
          height: 92vh;
          display: flex; flex-direction: column; align-items: center; gap: 14px;
          cursor: auto;
          animation: zoomImagePop 0.22s cubic-bezier(0.2,0.8,0.2,1);
        }
        .zoom-image-large {
          flex: 1 1 auto;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: block;
          object-fit: contain;
          object-position: center;
          border-radius: 10px;
          box-shadow: 0 60px 140px rgba(0,0,0,0.7);
          border: 1px solid rgba(255,255,255,0.08);
          background: #0a0a0c;
        }
        .zoom-image-caption {
          color: rgba(255,255,255,0.78);
          font-size: 14px; line-height: 1.55;
          text-align: center;
          max-width: 760px;
          margin: 0; padding: 0 12px;
        }
        .zoom-image-bottom-hint {
          position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);
          font-size: 12px; color: rgba(255,255,255,0.4);
          margin: 0; padding: 0;
          pointer-events: none;
        }

        @media (max-width: 600px) {
          .zoom-image-overlay { padding: 16px 12px 48px; }
          .zoom-image-stage { max-width: 100vw; max-height: 90vh; gap: 10px; }
          .zoom-image-large { max-height: 80vh; }
          .zoom-image-toolbar { top: 12px; right: 12px; gap: 8px; }
          .zoom-image-close span { display: none; }
          .zoom-image-close { padding: 9px; }
          .zoom-image-bottom-hint { font-size: 11px; bottom: 12px; }
        }
      `}</style>
    </>
  )
}
