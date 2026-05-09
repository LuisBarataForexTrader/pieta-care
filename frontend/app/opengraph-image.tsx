import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'pietas.care — App para cuidar de pais idosos em Portugal'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const features = ['Medicação', 'Agenda', 'Sinais vitais', 'Família']

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(150deg, #1C3D2B 0%, #0E2119 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Decorative large circle — top right */}
        <div
          style={{
            position: 'absolute',
            top: '-180px',
            right: '-180px',
            width: '560px',
            height: '560px',
            borderRadius: '50%',
            border: '80px solid rgba(42, 96, 73, 0.22)',
            display: 'flex',
          }}
        />
        {/* Decorative small circle — top right inner */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            border: '2px solid rgba(92, 196, 138, 0.12)',
            display: 'flex',
          }}
        />
        {/* Decorative circle — bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: '-220px',
            left: '-120px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(42, 96, 73, 0.18)',
            display: 'flex',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '68px 84px',
            flex: 1,
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: '#2A6049',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"
                  fill="rgba(255,255,255,0.92)"
                />
                <path
                  d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
            <span
              style={{
                color: '#EAE5DC',
                fontSize: '30px',
                fontWeight: '700',
                letterSpacing: '-0.5px',
              }}
            >
              pietas
              <span style={{ color: '#5CC48A' }}>.care</span>
            </span>
          </div>

          {/* Headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                fontSize: '66px',
                fontWeight: '800',
                color: '#EAE5DC',
                lineHeight: '1.07',
                letterSpacing: '-2.5px',
                maxWidth: '820px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span>Cuide dos seus pais.</span>
              <span style={{ color: '#5CC48A' }}>Família toda a par.</span>
            </div>
            <div
              style={{
                fontSize: '22px',
                color: '#7EB898',
                lineHeight: '1.5',
                maxWidth: '680px',
              }}
            >
              Medicação, consultas, sinais vitais e documentos — numa só app.
              Coordenação familiar simples e sem esforço.
            </div>
          </div>

          {/* Bottom row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Feature pills */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {features.map((f) => (
                <div
                  key={f}
                  style={{
                    background: 'rgba(42, 96, 73, 0.5)',
                    border: '1px solid rgba(92, 196, 138, 0.2)',
                    borderRadius: '100px',
                    padding: '8px 20px',
                    color: '#9ECDB0',
                    fontSize: '17px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {f}
                </div>
              ))}
            </div>

            {/* CTA badge */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '6px',
              }}
            >
              <div
                style={{
                  background: '#2A6049',
                  borderRadius: '12px',
                  padding: '13px 28px',
                  color: '#EAE5DC',
                  fontSize: '19px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="#5CC48A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                14 dias grátis
              </div>
              <span style={{ color: '#4A7A61', fontSize: '14px' }}>
                Cancele quando quiser
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
