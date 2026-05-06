'use client'
import Link from 'next/link'

const FEATURES = [
  { icon: '💊', title: 'Gestão de Medicação', desc: 'Registos, horários e alertas para nunca falhar uma toma.' },
  { icon: '📅', title: 'Agenda de Consultas', desc: 'Acompanha consultas, exames e terapias num só calendário.' },
  { icon: '❤️', title: 'Sinais Vitais', desc: 'Regista pressão, glicemia, saturação e temperatura com histórico gráfico.' },
  { icon: '⚠️', title: 'Registo de Incidentes', desc: 'Documenta quedas e eventos com mapa corporal interactivo.' },
  { icon: '📁', title: 'Documentos Clínicos', desc: 'Centraliza relatórios, receitas e exames num local seguro.' },
  { icon: '📝', title: 'Notas de Turno', desc: 'Comunicação fluida entre cuidadores por turno: manhã, tarde e noite.' },
  { icon: '🏥', title: 'Plano de Cuidados', desc: 'Define rotinas de higiene, nutrição, mobilidade e muito mais.' },
  { icon: '👨‍👩‍👧', title: 'Multi-familiar', desc: 'Gere vários familiares e convida a família a colaborar.' },
]

const STEPS = [
  { num: '1', title: 'Cria o perfil', desc: 'Adiciona os dados do teu familiar: histórico clínico, alergias, contactos de emergência.' },
  { num: '2', title: 'Regista o dia-a-dia', desc: 'Medicação, consultas, incidentes e sinais vitais — tudo num único lugar.' },
  { num: '3', title: 'A família fica a par', desc: 'Convida outros cuidadores ou familiares para colaborar em tempo real.' },
]

const PLANS = [
  {
    id: 'familia',
    name: 'Família',
    price: '35',
    desc: 'Para cuidar de um ente querido',
    features: ['1 perfil de familiar', 'Acesso familiar (até 3 utilizadores)', 'Medicação e agenda', 'Sinais vitais e incidentes', 'Documentos e notas de turno'],
    cta: 'Começar',
    highlight: false,
  },
  {
    id: 'familia_plus',
    name: 'Família+',
    price: '59',
    desc: 'Para famílias com mais necessidades',
    features: ['Até 3 perfis de familiar', 'Utilizadores ilimitados', 'Tudo do plano Família', 'Relatório médico completo', 'Dados clínicos avançados', 'Plano de cuidados personalizado'],
    cta: 'Começar',
    highlight: true,
  },
  {
    id: 'cuidador_pro',
    name: 'Cuidador Pro',
    price: '19',
    desc: 'Para profissionais de cuidados',
    features: ['Múltiplos utentes', 'Relatórios exportáveis', 'Planos de cuidados detalhados', 'Notas de turno estruturadas', 'Qualidade e indicadores'],
    cta: 'Para profissionais',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", color: '#1A2E25', background: '#fff', lineHeight: 1.6 }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #DDE8E2', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 20, color: '#2A6049' }}>
          🌿 <span>pieta.care</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/login" style={{ fontSize: 14, fontWeight: 600, color: '#4A6458', textDecoration: 'none', padding: '8px 16px' }}>
            Entrar
          </Link>
          <Link href="/register" style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: '#2A6049', textDecoration: 'none', padding: '9px 20px', borderRadius: 10 }}>
            Experimentar grátis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, #EAF4EE 0%, #F2F5F3 60%, #fff 100%)', padding: '80px 24px 100px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EAF4EE', border: '1px solid #C8D8D0', borderRadius: 99, padding: '6px 16px', fontSize: 13, fontWeight: 700, color: '#2A6049', marginBottom: 28 }}>
            🌿 Cuidar com confiança
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24, color: '#1A2E25' }}>
            O teu familiar merece<br />
            <span style={{ color: '#2A6049' }}>o melhor cuidado</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#4A6458', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Plataforma para gerir medicação, consultas, incidentes e bem-estar do teu familiar — e manter toda a família a par, sempre.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ fontSize: 16, fontWeight: 700, color: '#fff', background: '#2A6049', textDecoration: 'none', padding: '14px 32px', borderRadius: 12, boxShadow: '0 4px 16px rgba(42,96,73,0.3)' }}>
              Começar agora — é grátis
            </Link>
            <a href="#como-funciona" style={{ fontSize: 16, fontWeight: 600, color: '#2A6049', background: '#fff', textDecoration: 'none', padding: '14px 28px', borderRadius: 12, border: '2px solid #DDE8E2' }}>
              Ver como funciona
            </a>
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: '#7A9A8A' }}>Sem cartão de crédito · Configura em 2 minutos</p>
        </div>

        {/* App preview */}
        <div style={{ maxWidth: 900, margin: '64px auto 0', background: '#2A6049', borderRadius: 20, padding: '3px', boxShadow: '0 32px 80px rgba(42,96,73,0.2)' }}>
          <div style={{ background: '#1A2E25', borderRadius: '18px 18px 0 0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#C53030', opacity: 0.7 }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#D69E2E', opacity: 0.7 }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#276749', opacity: 0.7 }} />
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>pieta.care/dashboard</div>
          </div>
          <div style={{ background: '#F2F5F3', borderRadius: '0 0 17px 17px', padding: 24, display: 'flex', gap: 16, minHeight: 260 }}>
            <div style={{ width: 180, background: '#2A6049', borderRadius: 12, padding: 16, flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>🌿 pieta.care</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Cuidar com confiança</div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', marginBottom: 6, fontSize: 12, color: '#fff', fontWeight: 600 }}>🏠 Hoje</div>
              {['💊 Medicação', '📅 Agenda', '❤️ Saúde', '⚠️ Incidentes', '📁 Documentos'].map(l => (
                <div key={l} style={{ padding: '7px 10px', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{l}</div>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 11, color: '#7A9A8A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Medicação de hoje</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[['Metformina 500mg', '08:00', true], ['Ramipril 5mg', '12:00', true], ['Atorvastatina 20mg', '22:00', false]].map(([m, h, done]) => (
                    <div key={String(m)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, background: done ? '#2A6049' : '#DDE8E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700, flexShrink: 0 }}>{done ? '✓' : ''}</div>
                      <div style={{ flex: 1, fontSize: 13, color: done ? '#7A9A8A' : '#1A2E25', textDecoration: done ? 'line-through' : 'none' }}>{String(m)}</div>
                      <div style={{ fontSize: 11, color: '#7A9A8A' }}>{String(h)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 11, color: '#7A9A8A', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Tensão arterial</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#2A6049' }}>128<span style={{ fontSize: 13, fontWeight: 600 }}>/</span>82</div>
                  <div style={{ fontSize: 11, color: '#7A9A8A' }}>esta manhã</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 11, color: '#7A9A8A', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Bem-estar</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#2A6049' }}>😊 Bem</div>
                  <div style={{ fontSize: 11, color: '#7A9A8A' }}>humor: 4/5</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2A6049', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>O que inclui</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.02em', color: '#1A2E25' }}>Tudo para cuidar bem</h2>
            <p style={{ fontSize: 17, color: '#4A6458', marginTop: 12, maxWidth: 500, margin: '12px auto 0' }}>Ferramentas práticas para o cuidado diário, acessíveis a toda a família.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: '#F2F5F3', borderRadius: 16, padding: '24px 20px', border: '1px solid #DDE8E2' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1A2E25', marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#4A6458', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" style={{ padding: '100px 24px', background: 'linear-gradient(160deg, #EAF4EE, #F2F5F3)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2A6049', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Como funciona</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.02em' }}>Começa em minutos</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {STEPS.map(s => (
              <div key={s.num} style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#2A6049', color: '#fff', fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  {s.num}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#1A2E25', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: '#4A6458', lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>🌿</div>
          <blockquote style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 700, color: '#1A2E25', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 20 }}>
            "Finalmente consigo saber como a minha mãe está, mesmo a 300km de distância. O histórico de medicação e as notas da cuidadora dão-me uma paz de espírito que não tinha antes."
          </blockquote>
          <div style={{ fontSize: 14, color: '#7A9A8A', fontWeight: 600 }}>— Ana Rodrigues, filha cuidadora</div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" style={{ padding: '100px 24px', background: '#F2F5F3' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2A6049', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Preços</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.02em' }}>Simples e transparente</h2>
            <p style={{ fontSize: 16, color: '#4A6458', marginTop: 12 }}>Sem contratos. Cancela quando quiseres.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'start' }}>
            {PLANS.map(p => (
              <div key={p.id} style={{ background: p.highlight ? '#2A6049' : '#fff', borderRadius: 20, padding: 32, border: p.highlight ? 'none' : '1px solid #DDE8E2', boxShadow: p.highlight ? '0 16px 48px rgba(42,96,73,0.25)' : '0 2px 8px rgba(0,0,0,0.04)', transform: p.highlight ? 'scale(1.04)' : 'none', position: 'relative' }}>
                {p.highlight && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#E8944A', color: '#fff', fontSize: 12, fontWeight: 800, padding: '5px 16px', borderRadius: 99 }}>
                    Mais popular
                  </div>
                )}
                <div style={{ fontSize: 18, fontWeight: 800, color: p.highlight ? '#fff' : '#1A2E25', marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: p.highlight ? 'rgba(255,255,255,0.7)' : '#4A6458', marginBottom: 20 }}>{p.desc}</div>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 48, fontWeight: 900, color: p.highlight ? '#fff' : '#1A2E25', letterSpacing: '-0.03em' }}>€{p.price}</span>
                  <span style={{ fontSize: 16, color: p.highlight ? 'rgba(255,255,255,0.6)' : '#7A9A8A', fontWeight: 500 }}>/mês</span>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: p.highlight ? 'rgba(255,255,255,0.9)' : '#4A6458' }}>
                      <span style={{ color: p.highlight ? '#EAF4EE' : '#2A6049', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" style={{ display: 'block', textAlign: 'center', fontSize: 15, fontWeight: 700, padding: '13px 24px', borderRadius: 12, textDecoration: 'none', background: p.highlight ? '#fff' : '#2A6049', color: p.highlight ? '#2A6049' : '#fff' }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 24px', background: '#2A6049', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🌿</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>
            Começa a cuidar melhor hoje
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', marginBottom: 40, lineHeight: 1.7 }}>
            Junta-te a famílias que já cuidam dos seus com mais confiança e tranquilidade.
          </p>
          <Link href="/register" style={{ display: 'inline-block', fontSize: 17, fontWeight: 800, color: '#2A6049', background: '#fff', textDecoration: 'none', padding: '16px 40px', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
            Criar conta gratuita
          </Link>
          <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Sem cartão de crédito · Cancela quando quiseres</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1A2E25', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 800, fontSize: 18, color: '#fff', marginBottom: 8 }}>
          🌿 pieta.care
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Cuidar com confiança</p>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['Entrar', '/login'], ['Registar', '/register'], ['Privacidade', '#'], ['Termos', '#']].map(([label, href]) => (
            <Link key={label} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: 500 }}>{label}</Link>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 24 }}>© 2026 pieta.care · Todos os direitos reservados</p>
      </footer>
    </div>
  )
}
