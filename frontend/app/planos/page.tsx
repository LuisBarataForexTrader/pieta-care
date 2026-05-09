import Link from 'next/link'
import { Check, Sparkles, ArrowLeft, Leaf } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planos e Preços - pietas.care',
  description: 'Planos pietas.care a partir de €35/mês + IVA. 14 dias grátis. Cancela quando quiseres.',
}

const PLANS = [
  {
    key: 'familia',
    name: 'Pack Família',
    price: 35,
    sub: 'Para um familiar',
    badge: null,
    highlight: false,
    features: [
      '1 perfil de familiar',
      'Até 2 familiares',
      'Medicação, agenda e sinais vitais',
      'Incidentes e documentos',
      'Notas de turno',
      'Notificações por email',
    ],
  },
  {
    key: 'familia_plus',
    name: 'Pack Família+',
    price: 59,
    sub: 'Para mais de um familiar',
    badge: 'Mais popular',
    highlight: true,
    features: [
      'Até 2 perfis de familiar',
      'Até 5 familiares',
      'Tudo do Pack Família',
      'Relatório médico completo',
      'Dados clínicos avançados',
      'Plano de cuidados detalhado',
      'Indicadores de qualidade',
    ],
  },
  {
    key: 'cuidador_pro',
    name: 'Pack Família Plus + IA',
    price: 88,
    sub: 'Múltiplos familiares + IA',
    badge: 'IA',
    highlight: false,
    ai: true,
    features: [
      'Até 4 perfis de familiar',
      'Familiares ilimitados',
      'Tudo do Pack Família+',
      'Assistente IA - informação clínica de medicação',
      'Resumos automáticos diários',
      'Alertas inteligentes',
      'Suporte prioritário',
    ],
  },
]


const FAQ = [
  {
    q: 'Como funciona o período gratuito?',
    a: 'Tens 14 dias para experimentar qualquer plano sem cobrança. Não pedimos cartão à partida - só quando decidires subscrever.',
  },
  {
    q: 'Posso mudar de plano a qualquer momento?',
    a: 'Sim. Em /conta podes fazer upgrade ou downgrade quando quiseres. A diferença é proporcional ao tempo restante do mês.',
  },
  {
    q: 'O que acontece se cancelar?',
    a: 'Mantens acesso até ao fim do período pago. Após esse momento, os teus dados ficam disponíveis para exportação durante 30 dias.',
  },
  {
    q: 'Os preços incluem IVA?',
    a: 'Os preços são mostrados sem IVA (23% PT). A fatura é emitida pela Flow88 via TOConline com o IVA aplicável.',
  },
  {
    q: 'Os meus dados estão seguros?',
    a: 'Servidores na Alemanha (Hetzner), conformes RGPD. Encriptação em trânsito (TLS) e repouso. Podes exportar ou apagar a tua conta a qualquer momento.',
  },
]

export default function PlanosPage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#FAFAF7' }}>
      {/* Top nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px clamp(20px, 5vw, 64px)',
        background: '#fff', borderBottom: '1px solid #E5E7EB',
      }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 18, fontWeight: 800, color: '#166534', textDecoration: 'none',
        }}>
          <Leaf size={20} strokeWidth={2.25} /> pietas.care
        </Link>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#57534E', textDecoration: 'none', fontWeight: 600,
        }}>
          <ArrowLeft size={14} /> Voltar
        </Link>
      </nav>

      {/* Hero */}
      <section style={{
        padding: 'clamp(56px, 8vw, 96px) clamp(20px, 5vw, 64px) clamp(32px, 5vw, 56px)',
        textAlign: 'center', maxWidth: 760, margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-block', background: '#DCFCE7', color: '#166534',
          fontSize: 12, fontWeight: 800, padding: '5px 14px', borderRadius: 99,
          letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 18,
        }}>
          14 dias grátis · Cancela quando quiseres
        </div>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900,
          letterSpacing: '-0.03em', color: '#0A0A0C', lineHeight: 1.1, marginBottom: 18,
        }}>
          Cuidar em conjunto, sem complicações.
        </h1>
        <p style={{
          fontSize: 'clamp(15px, 1.7vw, 18px)', color: '#57534E',
          lineHeight: 1.5, maxWidth: 600, margin: '0 auto',
        }}>
          Escolhe o plano que melhor se adapta à tua família. Todos incluem 14 dias de uso gratuito -
          sem cartão de crédito.
        </p>
      </section>

      {/* Pricing cards */}
      <section style={{
        padding: '0 clamp(20px, 5vw, 64px) clamp(48px, 6vw, 80px)',
        maxWidth: 1200, margin: '0 auto',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 18, alignItems: 'start',
        }}>
          {PLANS.map(p => (
            <div key={p.key} style={{ position: 'relative' }}>
              {p.badge && (
                <div style={{
                  position: 'absolute', top: -14, left: 22,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: p.ai
                    ? 'linear-gradient(135deg, #9F7AEA 0%, #7C3AED 100%)'
                    : '#166534',
                  color: '#fff', fontSize: 11, fontWeight: 800,
                  padding: '5px 12px', borderRadius: 99,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  zIndex: 1,
                }}>
                  {p.ai && <Sparkles size={11} strokeWidth={2.5} />} {p.badge}
                </div>
              )}
              <div style={{
                background: p.highlight ? '#0F172A' : '#fff',
                border: `1.5px solid ${p.highlight ? '#0F172A' : p.ai ? '#C7B8FF' : '#E5E7EB'}`,
                borderRadius: 18,
                padding: '28px 26px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: p.highlight ? '0 12px 40px rgba(15,23,42,0.18)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  fontSize: 22, fontWeight: 900,
                  color: p.highlight ? '#fff' : '#0A0A0C',
                  letterSpacing: '-0.02em',
                }}>{p.name}</div>
                <div style={{
                  fontSize: 13,
                  color: p.highlight ? 'rgba(255,255,255,0.6)' : '#9CA3AF',
                  marginTop: 4, marginBottom: 22,
                }}>{p.sub}</div>

                <div style={{ marginBottom: 26 }}>
                  <span style={{
                    fontSize: 52, fontWeight: 900,
                    color: p.highlight ? '#fff' : '#0A0A0C',
                    letterSpacing: '-0.04em', lineHeight: 1,
                  }}>€{p.price}</span>
                  <span style={{
                    fontSize: 15,
                    color: p.highlight ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
                    marginLeft: 4,
                  }}>/mês</span>
                  <div style={{
                    fontSize: 11,
                    color: p.highlight ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
                    marginTop: 4, fontWeight: 600,
                  }}>+ IVA · 14 dias grátis</div>
                </div>

                <ul style={{
                  listStyle: 'none', padding: 0, margin: 0,
                  display: 'flex', flexDirection: 'column', gap: 11,
                  marginBottom: 26, flex: 1,
                }}>
                  {p.features.map(f => (
                    <li key={f} style={{
                      display: 'flex', gap: 10,
                      fontSize: 14,
                      color: p.highlight ? 'rgba(255,255,255,0.85)' : '#374151',
                      lineHeight: 1.5,
                    }}>
                      <Check size={16} strokeWidth={2.5} style={{
                        color: p.ai ? '#9F7AEA' : (p.highlight ? '#4ADE80' : '#166534'),
                        flexShrink: 0, marginTop: 3,
                      }} /> {f}
                    </li>
                  ))}
                </ul>

                {/* Primary: pay-now */}
                <Link href={`/register?plan=${p.key}&pay=1`} style={{
                  display: 'block', textAlign: 'center',
                  fontSize: 15, fontWeight: 800,
                  padding: 14, borderRadius: 12,
                  textDecoration: 'none',
                  background: p.ai
                    ? 'linear-gradient(135deg, #9F7AEA 0%, #7C3AED 100%)'
                    : (p.highlight ? '#4ADE80' : '#166534'),
                  color: p.highlight && !p.ai ? '#0D2B1E' : '#fff',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}>
                  Subscrever — €{p.price}/mês →
                </Link>
                {/* Secondary: free 14-day trial (no card) */}
                <Link href={`/register?plan=${p.key}`} style={{
                  display: 'block', textAlign: 'center',
                  fontSize: 13, fontWeight: 700,
                  padding: '10px 12px', marginTop: 8,
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: p.highlight
                    ? 'rgba(255,255,255,0.85)'
                    : (p.ai ? '#7C3AED' : '#166534'),
                  border: `1px solid ${p.highlight
                    ? 'rgba(255,255,255,0.25)'
                    : (p.ai ? 'rgba(124,58,237,0.25)' : 'rgba(22,101,52,0.25)')}`,
                  transition: 'background 0.15s',
                }}>
                  Ou experimente 14 dias grátis
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section style={{
        padding: '0 clamp(20px, 5vw, 64px) clamp(48px, 6vw, 80px)',
        maxWidth: 920, margin: '0 auto',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16, padding: 28, background: '#fff',
          border: '1px solid #E5E7EB', borderRadius: 16,
        }}>
          {[
            ['🇵🇹', 'Servidores na UE', 'Hetzner Alemanha · RGPD'],
            ['🔒', 'Encriptação completa', 'TLS · em repouso'],
            ['🧾', 'Faturação Flow88', 'TOConline · IVA incluído'],
            ['↩️', 'Cancela facilmente', 'Em 1 clique no portal Stripe'],
          ].map(([emoji, t, d]) => (
            <div key={t} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0C', marginBottom: 3 }}>{t}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{
        padding: '0 clamp(20px, 5vw, 64px) clamp(64px, 8vw, 112px)',
        maxWidth: 760, margin: '0 auto',
      }}>
        <h2 style={{
          fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900,
          letterSpacing: '-0.025em', color: '#0A0A0C',
          marginBottom: 32, textAlign: 'center',
        }}>
          Perguntas frequentes
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQ.map(item => (
            <details key={item.q} style={{
              background: '#fff', border: '1px solid #E5E7EB',
              borderRadius: 12, padding: '16px 20px',
            }}>
              <summary style={{
                fontSize: 15, fontWeight: 700, color: '#0A0A0C',
                cursor: 'pointer', listStyle: 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                {item.q}
                <span style={{ fontSize: 18, color: '#9CA3AF', fontWeight: 400 }}>＋</span>
              </summary>
              <p style={{
                fontSize: 14, color: '#57534E', lineHeight: 1.6,
                marginTop: 10,
              }}>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section style={{
        padding: 'clamp(48px, 6vw, 80px) clamp(20px, 5vw, 64px)',
        background: '#0F172A', textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900,
          color: '#fff', letterSpacing: '-0.025em', marginBottom: 14,
        }}>
          Pronto a começar?
        </h2>
        <p style={{
          fontSize: 15, color: 'rgba(255,255,255,0.65)',
          marginBottom: 28, maxWidth: 460, margin: '0 auto 28px',
        }}>
          14 dias grátis. Sem cartão. Sem compromissos.
        </p>
        <Link href="/register" style={{
          display: 'inline-block', fontSize: 16, fontWeight: 800,
          color: '#0D2B1E', background: '#4ADE80',
          textDecoration: 'none', padding: '15px 36px', borderRadius: 12,
        }}>
          Começar agora →
        </Link>
      </section>
    </div>
  )
}
