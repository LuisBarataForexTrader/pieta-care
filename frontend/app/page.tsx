import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf, Pill, Calendar, HeartPulse, AlertTriangle, FileText, Home, Droplet, Smile, Users, Stethoscope, ClipboardList, MapPin, Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'pieta.care - A tranquilidade de saber que está bem cuidado',
  description: 'Plataforma portuguesa para famílias que cuidam de um familiar idoso ou dependente. Medicação, consultas, sinais vitais e coordenação familiar, tudo num só lugar.',
  keywords: ['cuidar de idosos', 'app cuidadores', 'gestão medicação idosos', 'plataforma cuidados familiares', 'cuidar familiar à distância', 'pieta care'],
  openGraph: {
    title: 'pieta.care - A tranquilidade de saber que está bem cuidado',
    description: 'Quando não consegue estar sempre presente, o pieta.care garante que nada passa em branco.',
    url: 'https://pieta.care',
    siteName: 'pieta.care',
    locale: 'pt_PT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'pieta.care - Cuidar de quem ama, mesmo à distância',
    description: 'Medicação, consultas, sinais vitais e coordenação familiar num só lugar.',
  },
  alternates: { canonical: 'https://pieta.care' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'pieta.care',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  description: 'Plataforma portuguesa de gestão de cuidados para famílias de idosos e pessoas dependentes.',
  url: 'https://pieta.care',
  inLanguage: 'pt-PT',
  offers: [
    { '@type': 'Offer', name: 'Família', price: '35', priceCurrency: 'EUR', billingDuration: 'P1M' },
    { '@type': 'Offer', name: 'Família+', price: '59', priceCurrency: 'EUR', billingDuration: 'P1M' },
    { '@type': 'Offer', name: 'Cuidador Pro', price: '19', priceCurrency: 'EUR', billingDuration: 'P1M' },
  ],
}

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-nav { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.94); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid #E8EFE9; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; height: 64px; gap: 16px; }
        .lp-nav-links { display: flex; align-items: center; gap: 4px; flex: 1; justify-content: center; }
        .lp-nav-link { font-size: 14px; font-weight: 600; color: #4A6458; text-decoration: none; padding: 7px 14px; border-radius: 8px; transition: background 0.15s; white-space: nowrap; }
        .lp-nav-link:hover { background: #EAF4EE; }
        .lp-nav-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .lp-btn-ghost { font-size: 14px; font-weight: 600; color: #4A6458; text-decoration: none; padding: 8px 16px; border-radius: 8px; }
        .lp-btn-primary { font-size: 14px; font-weight: 700; color: #fff; background: #2A6049; text-decoration: none; padding: 10px 22px; border-radius: 10px; white-space: nowrap; }
        .lp-hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; border: none; background: none; }
        .lp-hamburger span { display: block; width: 22px; height: 2px; background: #2A6049; border-radius: 2px; }
        .lp-mobile-menu { display: none; }

        .lp-mockup { display: block; }
        .lp-mockup-inner { display: flex; min-height: 280px; }

        .lp-pillars { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; }
        .lp-features { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .lp-steps { display: flex; flex-direction: column; gap: 0; }
        .lp-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: start; }
        .lp-footer-cols { display: flex; gap: 48px; flex-wrap: wrap; }
        .lp-footer-inner { max-width: 1000px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 32px; margin-bottom: 48px; }
        .lp-hero-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .lp-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 56px; }

        @media (max-width: 900px) {
          .lp-plans { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
          .lp-pillars { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .lp-nav { padding: 0 20px; }
          .lp-nav-links { display: none; }
          .lp-hamburger { display: flex; }
          .lp-btn-ghost { display: none; }
          .lp-btn-primary { font-size: 13px; padding: 9px 16px; }
          .lp-mockup { display: none; }
          .lp-features { grid-template-columns: repeat(2, 1fr); }
          .lp-footer-inner { flex-direction: column; }
          .lp-footer-cols { gap: 28px; }
          .lp-metrics { grid-template-columns: 1fr; gap: 16px; }
        }
        @media (max-width: 480px) {
          .lp-features { grid-template-columns: 1fr; }
          .lp-hero-btns { flex-direction: column; align-items: center; }
          .lp-hero-btns a { width: 100%; text-align: center; }
        }
      `}</style>

      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", color: '#1A2E25', background: '#fff', lineHeight: 1.6 }}>

        {/* NAV */}
        <nav role="navigation" aria-label="Navegação principal" className="lp-nav">
          <Link href="/" aria-label="pieta.care" style={{ fontWeight: 900, fontSize: 19, color: '#2A6049', textDecoration: 'none', letterSpacing: '-0.02em', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Leaf size={20} strokeWidth={2.25} /> pieta.care
          </Link>

          <div className="lp-nav-links">
            <a href="#funcionalidades" className="lp-nav-link">Funcionalidades</a>
            <a href="#como-funciona" className="lp-nav-link">Como funciona</a>
            <a href="#precos" className="lp-nav-link">Preços</a>
          </div>

          <div className="lp-nav-actions">
            <Link href="/login" className="lp-btn-ghost">Entrar</Link>
            <Link href="/register" className="lp-btn-primary">Começar grátis</Link>
          </div>
        </nav>

        {/* HERO */}
        <section aria-labelledby="hero-heading" style={{ background: '#1A2E25', padding: 'clamp(72px,9vw,130px) 24px clamp(72px,9vw,130px)', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(106,183,113,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#6ABB71', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
              Cuidados familiares · Portugal
            </p>
            <h1 id="hero-heading" style={{ fontSize: 'clamp(34px,5.5vw,66px)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.04em', color: '#fff', marginBottom: 28 }}>
              A tranquilidade de saber<br />que está <em style={{ fontStyle: 'normal', color: '#6ABB71' }}>bem cuidado.</em>
            </h1>
            <p style={{ fontSize: 'clamp(16px,2vw,20px)', color: 'rgba(255,255,255,0.62)', maxWidth: 580, margin: '0 auto 44px', lineHeight: 1.75 }}>
              Quando não consegue estar sempre presente, o pieta.care garante que nada passa em branco. Medicação, consultas, incidentes e bem-estar, partilhados com toda a família.
            </p>
            <div className="lp-hero-btns">
              <Link href="/register" style={{ fontSize: 16, fontWeight: 800, color: '#1A2E25', background: '#6ABB71', textDecoration: 'none', padding: '15px 34px', borderRadius: 12, letterSpacing: '-0.01em' }}>
                Começar gratuitamente
              </Link>
              <a href="#como-funciona" style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', padding: '15px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)' }}>
                Saber mais
              </a>
            </div>
            <p style={{ marginTop: 22, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              Sem cartão de crédito · Configuração em 3 minutos
            </p>
          </div>

          {/* App mockup - hidden on mobile */}
          <div className="lp-mockup" style={{ maxWidth: 860, margin: '72px auto 0', borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ background: '#0D1A13', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 7 }}>
              {['','',''].map((_, i) => <span key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />)}
              <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>pieta.care/dashboard</span>
            </div>
            <div className="lp-mockup-inner" style={{ background: '#F2F5F3' }}>
              <div style={{ width: 190, background: '#2A6049', padding: '20px 14px', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 2, letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Leaf size={13} strokeWidth={2.25} /> pieta.care</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Cuidar com confiança</div>
                {([
                  [<Home size={12} strokeWidth={2} key="h" />,'Hoje',true],
                  [<Pill size={12} strokeWidth={2} key="p" />,'Medicação',false],
                  [<Calendar size={12} strokeWidth={2} key="c" />,'Agenda',false],
                  [<HeartPulse size={12} strokeWidth={2} key="hp" />,'Saúde',false],
                  [<AlertTriangle size={12} strokeWidth={2} key="a" />,'Incidentes',false],
                  [<FileText size={12} strokeWidth={2} key="f" />,'Documentos',false],
                ] as const).map(([icon,label,active]) => (
                  <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, marginBottom: 2, background: active ? 'rgba(255,255,255,0.15)' : 'transparent', fontSize: 12, color: active ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: active ? 700 : 400 }}>
                    {icon}<span>{String(label)}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 10, color: '#7A9A8A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Medicação de hoje</div>
                  {[['Metformina 500mg','08:00',true],['Ramipril 5mg','13:00',true],['Atorvastatina 20mg','22:00',false]].map(([m,h,done]) => (
                    <div key={String(m)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                      <div style={{ width: 17, height: 17, borderRadius: 5, background: done ? '#2A6049' : '#E8EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 900, flexShrink: 0 }}>{done ? '✓' : ''}</div>
                      <div style={{ flex: 1, fontSize: 13, color: done ? '#9AB5A5' : '#1A2E25', textDecoration: done ? 'line-through' : 'none' }}>{String(m)}</div>
                      <div style={{ fontSize: 11, color: '#9AB5A5' }}>{String(h)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {([
                    [<HeartPulse size={14} strokeWidth={2} key="t" style={{ color: '#E53E3E' }} />,'Tensão','128/82','mmHg'],
                    [<Droplet size={14} strokeWidth={2} key="g" style={{ color: '#C53030' }} />,'Glicemia','98','mg/dL'],
                    [<Smile size={14} strokeWidth={2} key="h" style={{ color: '#2A6049' }} />,'Humor','4/5','hoje'],
                  ] as const).map(([icon,label,val,unit]) => (
                    <div key={String(label)} style={{ background: '#fff', borderRadius: 10, padding: '11px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontSize: 10, color: '#7A9A8A', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{String(label)}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#2A6049' }}>{String(val)}</div>
                      <div style={{ fontSize: 10, color: '#9AB5A5' }}>{String(unit)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EMOTIONAL HOOK */}
        <section style={{ background: '#fff', padding: 'clamp(64px,8vw,112px) 24px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, color: '#1A2E25', marginBottom: 24 }}>
              Nenhuma família devia gerir tudo isto<br />
              <span style={{ color: '#7A9A8A', fontWeight: 400 }}>de memória e em papel.</span>
            </h2>
            <p style={{ fontSize: 'clamp(15px,1.5vw,18px)', color: '#4A6458', lineHeight: 1.8, maxWidth: 580, margin: '0 auto' }}>
              Medicações, consultas, receitas, historial de quedas, notas entre turnos. Quando o cuidado é partilhado entre filhos, cônjuges e profissionais, a informação perde-se. O pieta.care existe para que isso nunca aconteça.
            </p>
          </div>

          <div className="lp-pillars" style={{ maxWidth: 1000, margin: '64px auto 0' }}>
            {[
              { icon: <Pill size={28} strokeWidth={1.75} />, key: 'med', heading: 'Nunca mais se pergunta\nse tomou a medicação.', body: 'Registos detalhados de cada toma, horários configuráveis e histórico completo, acessíveis a todos os cuidadores em simultâneo.' },
              { icon: <Calendar size={28} strokeWidth={1.75} />, key: 'cal', heading: 'Consultas, exames e\nterapias num só lugar.', body: 'A agenda clínica centralizada evita sobreposições e garante que nenhum profissional trabalha com informação desactualizada.' },
              { icon: <AlertTriangle size={28} strokeWidth={1.75} />, key: 'inc', heading: 'Cada incidente fica\ndocumentado e acompanhado.', body: 'Quedas, alterações de comportamento e eventos clínicos registados com mapa corporal interactivo, gravidade e acções tomadas.' },
              { icon: <Users size={28} strokeWidth={1.75} />, key: 'fam', heading: 'A família inteira\nno mesmo ritmo.', body: 'Convide filhos, cônjuges e cuidadores profissionais. Todos vêem as mesmas actualizações, em tempo real, sem telefonemas de coordenação.' },
            ].map((f, i) => (
              <article key={f.key} style={{ background: i % 2 === 0 ? '#F8FAF9' : '#fff', padding: 'clamp(28px,4vw,48px) clamp(20px,3vw,40px)', border: '1px solid #EAF0EC' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EAF4EE', color: '#2A6049', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>{f.icon}</div>
                <h3 style={{ fontSize: 'clamp(17px,1.8vw,20px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.3, color: '#1A2E25', marginBottom: 12, whiteSpace: 'pre-line' }}>{f.heading}</h3>
                <p style={{ fontSize: 15, color: '#4A6458', lineHeight: 1.75 }}>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="como-funciona" aria-labelledby="como-funciona-heading" style={{ background: '#1A2E25', padding: 'clamp(64px,8vw,112px) 24px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ marginBottom: 56 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#6ABB71', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Como funciona</p>
              <h2 id="como-funciona-heading" style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.15 }}>
                Pronto a usar em minutos.<br />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>Sem formação necessária.</span>
              </h2>
            </div>
            <ol className="lp-steps" style={{ listStyle: 'none' }}>
              {[
                { n: '01', title: 'Crie o perfil do familiar', body: 'Introduza os dados de saúde, alergias, médicos responsáveis e contactos de emergência. O pieta.care organiza tudo numa ficha clínica completa.' },
                { n: '02', title: 'Registe o dia-a-dia', body: 'Medicação, sinais vitais, consultas e notas de turno ficam registados ao longo do dia por quem estiver presente, profissional ou familiar.' },
                { n: '03', title: 'Toda a família a par', body: 'Qualquer pessoa autorizada vê o historial actualizado em tempo real. Nada se perde entre turnos, chamadas ou quilómetros de distância.' },
              ].map((s, idx) => (
                <li key={s.n} style={{ display: 'flex', gap: 'clamp(20px,3vw,32px)', padding: '36px 0', borderTop: '1px solid rgba(255,255,255,0.08)', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#6ABB71', letterSpacing: '0.05em', flexShrink: 0, paddingTop: 4, minWidth: 24 }}>{s.n}</span>
                  <div>
                    <h3 style={{ fontSize: 'clamp(17px,1.8vw,20px)', fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>{s.title}</h3>
                    <p style={{ fontSize: 'clamp(14px,1.5vw,16px)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75 }}>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section style={{ background: '#EAF4EE', padding: 'clamp(64px,8vw,112px) 24px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <svg aria-hidden="true" width="36" height="28" viewBox="0 0 40 32" fill="none" style={{ marginBottom: 24 }}>
              <path d="M0 32V19.2C0 8.533 5.333 2.4 16 0l2.4 3.6C12.533 5.2 9.6 8.667 9.6 14.4H16V32H0Zm24 0V19.2C24 8.533 29.333 2.4 40 0l2.4 3.6c-5.867 1.6-8.8 5.067-8.8 10.8H40V32H24Z" fill="#2A6049" fillOpacity="0.25" />
            </svg>
            <blockquote>
              <p style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, color: '#1A2E25', lineHeight: 1.55, letterSpacing: '-0.02em', marginBottom: 24 }}>
                "A minha mãe vive a 400 km. Antes do pieta.care, passava os fins-de-semana ao telefone a tentar perceber como tinha corrido a semana. Agora abro a aplicação e sei exactamente como ela está, e a cuidadora sabe que não está sozinha."
              </p>
              <footer>
                <cite style={{ fontStyle: 'normal', fontSize: 15, color: '#4A6458', fontWeight: 600 }}>
                  Ana Rodrigues, 47 anos - filha cuidadora, Lisboa
                </cite>
              </footer>
            </blockquote>
          </div>
        </section>

        {/* FEATURES */}
        <section id="funcionalidades" aria-labelledby="funcionalidades-heading" style={{ background: '#fff', padding: 'clamp(64px,8vw,112px) 24px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2A6049', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Funcionalidades</p>
              <h2 id="funcionalidades-heading" style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#1A2E25' }}>
                Tudo o que o cuidado diário exige.
              </h2>
            </div>
            <div className="lp-features">
              {([
                [<HeartPulse size={22} strokeWidth={1.75} key="hp" />,'Sinais vitais','Pressão, glicemia, saturação, temperatura e peso com histórico visual.'],
                [<FileText size={22} strokeWidth={1.75} key="ft" />,'Documentos','Relatórios, receitas e exames digitalizados e organizados.'],
                [<ClipboardList size={22} strokeWidth={1.75} key="nt" />,'Notas de turno','Comunicação entre cuidadores por turno: manhã, tarde, noite.'],
                [<Stethoscope size={22} strokeWidth={1.75} key="pl" />,'Plano de cuidados','Rotinas de higiene, nutrição, mobilidade e estimulação cognitiva.'],
                [<ClipboardList size={22} strokeWidth={1.75} key="dc" />,'Dados clínicos','Diagnósticos, vacinas e historial clínico sempre disponíveis.'],
                [<FileText size={22} strokeWidth={1.75} key="rm" />,'Relatório médico','Resumos periódicos para partilhar com médicos e especialistas.'],
                [<AlertTriangle size={22} strokeWidth={1.75} key="al" />,'Alertas','Notificações configuráveis para medicação e acompanhamento.'],
                [<MapPin size={22} strokeWidth={1.75} key="mp" />,'Mapa corporal','Registo visual de incidentes e zonas afectadas.'],
              ] as const).map(([icon, title, desc]) => (
                <article key={String(title)} style={{ padding: '22px 18px', border: '1px solid #E8EFE9', borderRadius: 14, background: '#FAFCFB' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: '#fff', color: '#2A6049', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: 'inset 0 0 0 1px #E2EBE5' }}>{icon}</div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1A2E25', marginBottom: 6 }}>{String(title)}</h3>
                  <p style={{ fontSize: 13, color: '#4A6458', lineHeight: 1.65 }}>{String(desc)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="precos" aria-labelledby="precos-heading" style={{ background: '#F8FAF9', padding: 'clamp(64px,8vw,112px) 24px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2A6049', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Planos</p>
              <h2 id="precos-heading" style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#1A2E25', marginBottom: 10 }}>
                Transparente desde o início.
              </h2>
              <p style={{ fontSize: 16, color: '#4A6458' }}>Sem contratos de longa duração. Cancele quando quiser.</p>
            </div>
            <div className="lp-plans">
              {[
                { id: 'familia', name: 'Família', price: '35', sub: 'Para um familiar', features: ['1 perfil de familiar','Acesso para até 3 utilizadores','Medicação, agenda e sinais vitais','Incidentes e documentos','Notas de turno'], highlight: false, cta: 'Começar' },
                { id: 'familia_plus', name: 'Família+', price: '59', sub: 'Para mais de um familiar', features: ['Até 3 perfis de familiar','Utilizadores ilimitados','Tudo do plano Família','Relatório médico completo','Dados clínicos avançados','Plano de cuidados detalhado'], highlight: true, cta: 'Começar' },
                { id: 'cuidador_pro', name: 'Cuidador Pro', price: '19', sub: 'Para profissionais', features: ['Múltiplos utentes','Relatórios exportáveis','Plano de cuidados estruturado','Notas de turno e qualidade','Indicadores de desempenho'], highlight: false, cta: 'Para profissionais' },
              ].map(p => (
                <div key={p.id} style={{ background: p.highlight ? '#1A2E25' : '#fff', borderRadius: 20, padding: 'clamp(24px,3vw,36px) clamp(20px,2.5vw,32px)', border: p.highlight ? 'none' : '1px solid #DDE8E2', boxShadow: p.highlight ? '0 20px 60px rgba(26,46,37,0.25)' : 'none', position: 'relative' }}>
                  {p.highlight && (
                    <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#E8944A', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 18px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                      MAIS POPULAR
                    </div>
                  )}
                  <p style={{ fontSize: 12, fontWeight: 700, color: p.highlight ? 'rgba(255,255,255,0.4)' : '#7A9A8A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{p.sub}</p>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: p.highlight ? '#fff' : '#1A2E25', marginBottom: 20, letterSpacing: '-0.02em' }}>{p.name}</h3>
                  <div style={{ marginBottom: 28 }}>
                    <span style={{ fontSize: 52, fontWeight: 900, color: p.highlight ? '#fff' : '#1A2E25', letterSpacing: '-0.04em', lineHeight: 1 }}>€{p.price}</span>
                    <span style={{ fontSize: 15, color: p.highlight ? 'rgba(255,255,255,0.45)' : '#7A9A8A' }}>/mês</span>
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                    {p.features.map(f => (
                      <li key={f} style={{ display: 'flex', gap: 10, fontSize: 14, color: p.highlight ? 'rgba(255,255,255,0.8)' : '#4A6458', lineHeight: 1.5 }}>
                        <Check size={16} strokeWidth={2.5} style={{ color: p.highlight ? '#6ABB71' : '#2A6049', flexShrink: 0, marginTop: 3 }} />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" style={{ display: 'block', textAlign: 'center', fontSize: 15, fontWeight: 800, padding: '14px', borderRadius: 12, textDecoration: 'none', background: p.highlight ? '#6ABB71' : '#1A2E25', color: p.highlight ? '#1A2E25' : '#fff' }}>
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: '#2A6049', padding: 'clamp(72px,9vw,130px) 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(28px,4.5vw,52px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
              O cuidado que o seu familiar merece,<br />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>começa aqui.</span>
            </h2>
            <p style={{ fontSize: 'clamp(15px,1.8vw,18px)', color: 'rgba(255,255,255,0.6)', marginBottom: 40, lineHeight: 1.7 }}>
              Junte-se às famílias que já cuidam com mais confiança, menos ansiedade e total transparência.
            </p>
            <Link href="/register" style={{ display: 'inline-block', fontSize: 17, fontWeight: 800, color: '#1A2E25', background: '#6ABB71', textDecoration: 'none', padding: '17px 44px', borderRadius: 14 }}>
              Criar conta gratuitamente
            </Link>
            <p style={{ marginTop: 18, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Sem cartão de crédito · Cancele quando quiser</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer role="contentinfo" style={{ background: '#0D1A13', padding: 'clamp(36px,5vw,56px) clamp(20px,4vw,40px) clamp(24px,3vw,36px)' }}>
          <div className="lp-footer-inner">
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'center', gap: 7 }}><Leaf size={18} strokeWidth={2.25} /> pieta.care</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', maxWidth: 240, lineHeight: 1.7 }}>
                Plataforma portuguesa de gestão de cuidados familiares.
              </p>
            </div>
            <nav aria-label="Links do rodapé" className="lp-footer-cols">
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 14 }}>Produto</p>
                {[['Funcionalidades','#funcionalidades'],['Preços','#precos'],['Como funciona','#como-funciona']].map(([l,h]) => (
                  <a key={String(l)} href={String(h)} style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 9, fontWeight: 500 }}>{String(l)}</a>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 14 }}>Conta</p>
                <Link href="/login" style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 9, fontWeight: 500 }}>Entrar</Link>
                <Link href="/register" style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 9, fontWeight: 500 }}>Registar</Link>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 14 }}>Legal</p>
                <Link href="/privacidade" style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 9, fontWeight: 500 }}>Privacidade</Link>
                <Link href="/termos" style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 9, fontWeight: 500 }}>Termos de uso</Link>
              </div>
            </nav>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 pieta.care · FLOW 88 - Gestão de Ativos, Lda.</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Feito em Portugal 🇵🇹</p>
          </div>
        </footer>

      </div>
    </>
  )
}
