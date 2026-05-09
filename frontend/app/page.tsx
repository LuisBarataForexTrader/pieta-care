import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf, Pill, Calendar, HeartPulse, AlertTriangle, FileText, Users, Stethoscope, ClipboardList, MapPin, Check, Sparkles, MessageCircle } from 'lucide-react'
import ZoomImage from '@/components/ZoomImage'

export const metadata: Metadata = {
  title: { absolute: 'pietas.care · App para cuidar de pais idosos em Portugal' },
  description: 'App portuguesa para famílias que cuidam de pais idosos: medicação, consultas, sinais vitais e coordenação familiar. 14 dias grátis, sem cartão.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'pietas.care · App para cuidar de pais idosos em Portugal',
    description: 'Medicação, consultas, sinais vitais e coordenação familiar num só lugar. 14 dias grátis.',
    url: '/',
    type: 'website',
    siteName: 'pietas.care',
    locale: 'pt_PT',
    // Re-declare images explicitly: Next.js metadata doesn't deep-merge
    // openGraph between layout and child page — declaring openGraph here
    // would otherwise drop the layout's default image.
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'pietas.care — Cuidar dos pais idosos, com toda a família a par' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'pietas.care · App para cuidar de pais idosos',
    description: 'Medicação, consultas, sinais vitais e família a par — tudo num só lugar.',
    images: ['/og.png'],
  },
}

// Multiple JSON-LD blocks for richer SERP coverage:
// SoftwareApplication, Organization, FAQPage. Google picks the most
// relevant for each query — e.g. FAQ rich snippets in mobile.
const ldSoftwareApplication = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': 'https://pietas.care/#software',
  name: 'pietas.care',
  alternateName: 'pieta.care',
  applicationCategory: 'HealthApplication',
  applicationSubCategory: 'Eldercare',
  operatingSystem: 'Web, iOS (PWA), Android (PWA)',
  description: 'App portuguesa de coordenação de cuidados para famílias com pais idosos: medicação, agenda, sinais vitais, incidentes, vacinas e relatório médico, partilhados em tempo real.',
  url: 'https://pietas.care',
  inLanguage: 'pt-PT',
  publisher: { '@id': 'https://pietas.care/#org' },
  offers: [
    { '@type': 'Offer', name: 'Pack Família', price: '35', priceCurrency: 'EUR', priceSpecification: { '@type': 'UnitPriceSpecification', price: '35', priceCurrency: 'EUR', unitCode: 'MON' } },
    { '@type': 'Offer', name: 'Pack Família+', price: '59', priceCurrency: 'EUR', priceSpecification: { '@type': 'UnitPriceSpecification', price: '59', priceCurrency: 'EUR', unitCode: 'MON' } },
    { '@type': 'Offer', name: 'Pack Família Plus + IA', price: '88', priceCurrency: 'EUR', priceSpecification: { '@type': 'UnitPriceSpecification', price: '88', priceCurrency: 'EUR', unitCode: 'MON' } },
  ],
}

const ldOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://pietas.care/#org',
  name: 'pietas.care',
  legalName: 'Flow 88 — Gestão de Ativos Lda',
  url: 'https://pietas.care',
  logo: 'https://pietas.care/og.png',
  email: 'suporte@pietas.care',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Rua Quinta da Piedade 1, 7B',
    addressLocality: 'Póvoa de Santa Iria',
    postalCode: '2625-178',
    addressCountry: 'PT',
  },
  vatID: 'PT509294391',
  areaServed: 'PT',
}

const ldFAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Como funciona o pietas.care?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Crie um perfil do seu familiar idoso, registe medicação, consultas e sinais vitais. Toda a família autorizada vê o histórico em tempo real. Há lembretes automáticos de tomas e alertas para o que ficar por confirmar.',
      },
    },
    {
      '@type': 'Question',
      name: 'O pietas.care é para quem?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Para famílias portuguesas que cuidam de pais idosos ou dependentes em casa, sozinhos ou em equipa. Funciona com 1 ou vários familiares e pode incluir cuidadores formais.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quanto custa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A partir de €35/mês. Há 3 planos: Pack Família (€35), Pack Família+ (€59) e Pack Família Plus + IA (€88). Todos com 14 dias grátis sem cartão de crédito. Cancela quando quiser.',
      },
    },
    {
      '@type': 'Question',
      name: 'Os meus dados de saúde estão seguros?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. Dados encriptados em trânsito (TLS) e em repouso. Servidores na União Europeia (Hetzner Alemanha), conformes RGPD. Pode exportar ou apagar a sua conta a qualquer momento.',
      },
    },
    {
      '@type': 'Question',
      name: 'Funciona em telemóvel?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. Funciona em qualquer browser (telemóvel, tablet, computador). Pode instalar como app no telemóvel (PWA) — recebe notificações de medicação tal como uma app nativa.',
      },
    },
    {
      '@type': 'Question',
      name: 'Substitui o médico?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Não. O pietas.care organiza informação para a família e ajuda na coordenação. Não dá diagnósticos, não substitui consulta médica, e a assistente IA (no plano Pack Família Plus + IA) é informativa, nunca prescritiva.',
      },
    },
  ],
}

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldSoftwareApplication) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldOrganization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldFAQ) }} />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-nav { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.68); backdrop-filter: blur(24px) saturate(1.8); -webkit-backdrop-filter: blur(24px) saturate(1.8); border-bottom: 1px solid rgba(255,255,255,0.55); padding: 0 32px; display: flex; align-items: center; justify-content: space-between; height: 64px; gap: 16px; box-shadow: 0 1px 0 rgba(26,46,37,0.06), inset 0 1px 0 rgba(255,255,255,0.9); }
        .lp-nav-links { display: flex; align-items: center; gap: 4px; flex: 1; justify-content: center; }
        .lp-nav-link { font-size: 14px; font-weight: 600; color: #4B5563; text-decoration: none; padding: 7px 14px; border-radius: 8px; transition: background 0.15s; white-space: nowrap; }
        .lp-nav-link:hover { background: #FAF8F5; }
        .lp-nav-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .lp-btn-ghost { font-size: 14px; font-weight: 600; color: #4B5563; text-decoration: none; padding: 8px 16px; border-radius: 8px; }
        .lp-btn-primary { font-size: 14px; font-weight: 700; color: #fff; background: #166534; text-decoration: none; padding: 10px 22px; border-radius: 10px; white-space: nowrap; }
        .lp-hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; border: none; background: none; }
        .lp-hamburger span { display: block; width: 22px; height: 2px; background: #166534; border-radius: 2px; }
        .lp-mobile-menu { display: none; }

        .lp-mockup { display: block; }
        .lp-mockup--hero .zoom-image-frame { box-shadow: 0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05) !important; }

        .lp-pillars { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .lp-features { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .lp-steps { display: flex; flex-direction: column; gap: 0; }
        .lp-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: start; }
        .lp-footer-cols { display: flex; gap: 48px; flex-wrap: wrap; }
        .lp-footer-inner { max-width: 1000px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 32px; margin-bottom: 48px; }
        .lp-hero-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .lp-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 56px; }

        /* Liquid Glass system */
        .gl { backdrop-filter: blur(22px) saturate(1.8); -webkit-backdrop-filter: blur(22px) saturate(1.8); }
        .gl-light { background: rgba(255,255,255,0.72) !important; border: 1px solid rgba(255,255,255,0.68) !important; box-shadow: 0 4px 20px rgba(26,46,37,0.06), inset 0 1px 0 rgba(255,255,255,0.92) !important; }
        .gl-dark { background: rgba(255,255,255,0.06) !important; border: 1px solid rgba(255,255,255,0.11) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08) !important; }

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

      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", color: '#0A0A0C', background: '#fff', lineHeight: 1.6 }}>

        {/* NAV */}
        <nav role="navigation" aria-label="Navegação principal" className="lp-nav">
          <Link href="/" aria-label="pietas.care" style={{ fontWeight: 900, fontSize: 19, color: '#166534', textDecoration: 'none', letterSpacing: '-0.02em', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Leaf size={20} strokeWidth={2.25} /> pietas.care
          </Link>

          <div className="lp-nav-links">
            <a href="#funcionalidades" className="lp-nav-link">Funcionalidades</a>
            <a href="#como-funciona" className="lp-nav-link">Como funciona</a>
            <Link href="/planos" className="lp-nav-link">Planos</Link>
          </div>

          <div className="lp-nav-actions">
            <Link href="/login" className="lp-btn-ghost">Entrar</Link>
            <Link href="/register" className="lp-btn-primary">Começar grátis</Link>
          </div>
        </nav>

        {/* HERO */}
        <section aria-labelledby="hero-heading" style={{ background: '#0D2B1E', padding: 'clamp(72px,9vw,130px) 24px clamp(72px,9vw,130px)', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(74,222,128,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#4ADE80', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
              Cuidados familiares · Portugal
            </p>
            <h1 id="hero-heading" style={{ fontSize: 'clamp(34px,5.5vw,66px)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.04em', color: '#fff', marginBottom: 28 }}>
              A tranquilidade de saber<br />que está <em style={{ fontStyle: 'normal', color: '#4ADE80' }}>bem cuidado.</em>
            </h1>
            <p style={{ fontSize: 'clamp(16px,2vw,20px)', color: 'rgba(255,255,255,0.62)', maxWidth: 580, margin: '0 auto 44px', lineHeight: 1.75 }}>
              Quando não consegue estar sempre presente, o pietas.care garante que nada passa em branco. Medicação, consultas, incidentes e bem-estar, partilhados com toda a família.
            </p>
            <div className="lp-hero-btns">
              <Link href="/register" style={{ fontSize: 16, fontWeight: 800, color: '#0A0A0C', background: '#4ADE80', textDecoration: 'none', padding: '15px 34px', borderRadius: 12, letterSpacing: '-0.01em' }}>
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

          {/* Real app screenshot - hero showcase (clickable to zoom) */}
          <div className="lp-mockup lp-mockup--hero" style={{ maxWidth: 980, margin: '72px auto 0', position: 'relative' }}>
            <ZoomImage
              src="/showcase/dashboard-dark.webp"
              alt="Dashboard pietas.care: panorama do dia com adesão à medicação, tensão arterial, bem-estar e próxima consulta"
              width={2400}
              height={1500}
              priority
              sizes="(max-width: 1024px) 100vw, 980px"
              chrome
              chromeUrl="pietas.care/dashboard"
              caption="Hoje · Dashboard com adesão à medicação, tensão arterial, bem-estar e próxima consulta."
            />
          </div>
        </section>

        {/* EMOTIONAL HOOK */}
        <section style={{ background: '#fff', padding: 'clamp(64px,8vw,112px) 24px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, color: '#0A0A0C', marginBottom: 24 }}>
              Nenhuma família devia gerir tudo isto<br />
              <span style={{ color: '#9CA3AF', fontWeight: 400 }}>de memória e em papel.</span>
            </h2>
            <p style={{ fontSize: 'clamp(15px,1.5vw,18px)', color: '#4B5563', lineHeight: 1.8, maxWidth: 580, margin: '0 auto' }}>
              Medicações, consultas, receitas, historial de quedas, notas entre turnos. Quando o cuidado é partilhado entre filhos, cônjuges e profissionais, a informação perde-se. O pietas.care existe para que isso nunca aconteça.
            </p>
          </div>

          <div className="lp-pillars" style={{ maxWidth: 1000, margin: '64px auto 0' }}>
            {[
              { icon: <Pill size={28} strokeWidth={1.75} />, key: 'med', heading: 'Nunca mais se pergunta\nse tomou a medicação.', body: 'Registos detalhados de cada toma, horários configuráveis e histórico completo, acessíveis a todos os cuidadores em simultâneo.' },
              { icon: <Calendar size={28} strokeWidth={1.75} />, key: 'cal', heading: 'Consultas, exames e\nterapias num só lugar.', body: 'A agenda clínica centralizada evita sobreposições e garante que nenhum profissional trabalha com informação desactualizada.' },
              { icon: <AlertTriangle size={28} strokeWidth={1.75} />, key: 'inc', heading: 'Cada incidente fica\ndocumentado e acompanhado.', body: 'Quedas, alterações de comportamento e eventos clínicos registados com mapa corporal interactivo, gravidade e acções tomadas.' },
              { icon: <Users size={28} strokeWidth={1.75} />, key: 'fam', heading: 'A família inteira\nno mesmo ritmo.', body: 'Convide filhos, cônjuges e cuidadores profissionais. Todos vêem as mesmas actualizações, em tempo real, sem telefonemas de coordenação.' },
            ].map((f) => (
              <article key={f.key} style={{ padding: 'clamp(28px,4vw,48px) clamp(20px,3vw,40px)', borderRadius: 16, background: '#fff', border: '1px solid #E7E5E4', borderTop: '2px solid #166534', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(22,101,52,0.08)', color: '#166534', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>{f.icon}</div>
                <h3 style={{ fontSize: 'clamp(17px,1.8vw,20px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.3, color: '#0A0A0C', marginBottom: 12, whiteSpace: 'pre-line' }}>{f.heading}</h3>
                <p style={{ fontSize: 15, color: '#4B5563', lineHeight: 1.75 }}>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* SHOWCASE - real app screenshots */}
        <section aria-labelledby="showcase-heading" style={{ background: '#0D2B1E', padding: 'clamp(72px,9vw,128px) 24px', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(74,222,128,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' }}>
            <div style={{ textAlign: 'center', marginBottom: 56, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#4ADE80', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
                Veja por dentro
              </p>
              <h2 id="showcase-heading" style={{ fontSize: 'clamp(28px,4.5vw,48px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.12, marginBottom: 18 }}>
                Não é mais uma checklist.
                <br /><span style={{ color: '#4ADE80', fontStyle: 'italic', fontWeight: 800 }}>É um histórico clínico vivo.</span>
              </h2>
              <p style={{ fontSize: 'clamp(15px,1.6vw,17px)', color: 'rgba(255,255,255,0.62)', lineHeight: 1.7 }}>
                Tudo o que vê abaixo são ecrãs reais, povoados com dados típicos de um cuidado familiar - gráficos longitudinais, dossier para o médico, dados clínicos completos.
              </p>
            </div>

            <div className="lp-showcase-grid">
              {([
                {
                  src: '/showcase/saude-dark.webp',
                  alt: 'Saúde: tensão arterial, frequência cardíaca, saturação O₂, temperatura, peso e glicemia com tendências de 60 dias',
                  eyebrow: 'Saúde',
                  title: 'Tendências, não fotografias.',
                  body: 'Tensão arterial, frequência cardíaca, glicemia e peso ao longo de 60 dias - em vez de números soltos num caderno.',
                },
                {
                  src: '/showcase/relatorio.webp',
                  alt: 'Relatório clínico imprimível com identificação, condições médicas, alergias, medicação atual e adesão',
                  eyebrow: 'Relatório clínico',
                  title: 'O dossier que o médico\nrecebe em segundos.',
                  body: 'Um clique gera o resumo completo: identificação, alergias, medicação atual, adesão dos últimos 30 dias e contactos de emergência.',
                },
                {
                  src: '/showcase/clinico-dark.webp',
                  alt: 'Dados clínicos com diagnósticos crónicos, códigos ICD e historial de vacinas',
                  eyebrow: 'Dados clínicos',
                  title: 'Diagnósticos e vacinas\nsempre acessíveis.',
                  body: 'Histórico estruturado por código ICD, datas e fonte (SNS ou manual). Próximos reforços com lote e data calculados automaticamente.',
                },
                {
                  src: '/showcase/medicacao-dark.webp',
                  alt: 'Medicação diária com horários, tomas confirmadas e informação clínica de cada fármaco',
                  eyebrow: 'Medicação',
                  title: 'Cada toma confirmada.\nCada falha registada.',
                  body: 'Horários personalizáveis, percentagem de adesão, e descrição clínica de cada fármaco gerada por assistente IA - para qualquer familiar perceber.',
                },
              ] as const).map((s) => (
                <article key={s.src} className="lp-showcase-card">
                  <ZoomImage
                    src={s.src}
                    alt={s.alt}
                    width={2400}
                    height={1500}
                    sizes="(max-width: 900px) 100vw, 560px"
                    chrome
                    caption={s.alt}
                  />
                  <div className="lp-showcase-text">
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#4ADE80', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{s.eyebrow}</p>
                    <h3 style={{ fontSize: 'clamp(20px,2.4vw,26px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 12, whiteSpace: 'pre-line' }}>{s.title}</h3>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.62)', lineHeight: 1.7 }}>{s.body}</p>
                  </div>
                </article>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 56 }}>
              <Link href="/register" style={{ display: 'inline-block', fontSize: 16, fontWeight: 800, color: '#0A0A0C', background: '#4ADE80', textDecoration: 'none', padding: '14px 32px', borderRadius: 12, letterSpacing: '-0.01em' }}>
                Experimentar 14 dias grátis
              </Link>
              <p style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.32)' }}>
                Sem cartão de crédito · Cancele quando quiser
              </p>
            </div>
          </div>
          <style>{`
            .lp-showcase-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(28px, 4vw, 56px) clamp(24px, 3vw, 40px); }
            .lp-showcase-card { display: flex; flex-direction: column; gap: 22px; }
            .lp-showcase-frame { border-radius: 14px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.06); transform: translateZ(0); transition: transform 0.4s cubic-bezier(0.2,0.8,0.2,1); }
            .lp-showcase-card:hover .lp-showcase-frame { transform: translateY(-3px); }
            .lp-showcase-chrome { background: #050507; padding: 8px 12px; display: flex; gap: 6px; align-items: center; }
            .lp-showcase-dot { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,0.14); display: inline-block; }
            .lp-showcase-text { padding: 0 4px; }
            @media (max-width: 900px) {
              .lp-showcase-grid { grid-template-columns: 1fr; }
            }
          `}</style>
        </section>

        {/* AI SPOTLIGHT - Pack Família Plus + IA */}
        <section aria-labelledby="ai-spotlight-heading" style={{ background: '#fff', padding: 'clamp(72px,9vw,128px) 24px', borderTop: '1px solid #E7E5E4' }}>
          <div className="lp-ai-grid" style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div className="lp-ai-text">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', padding: '6px 14px', borderRadius: 99, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 22 }}>
                <Sparkles size={13} strokeWidth={2.5} />
                Exclusivo Pack Família Plus + IA
              </span>
              <h2 id="ai-spotlight-heading" style={{ fontSize: 'clamp(28px,4.2vw,46px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#0A0A0C', lineHeight: 1.1, marginBottom: 22 }}>
                Cinco segundos.<br />
                <span style={{ color: '#7C3AED' }}>Uma análise clínica completa.</span>
              </h2>
              <p style={{ fontSize: 'clamp(15px,1.6vw,17px)', color: '#4B5563', lineHeight: 1.75, marginBottom: 28 }}>
                Em vez de cruzar 30 dias de tomas, sinais vitais, incidentes e queixas à mão, a assistente IA do <strong style={{ color: '#0A0A0C' }}>Pack Família Plus + IA</strong> faz-lhe um resumo executivo - em português claro, com prioridades.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['Estado geral', 'Síntese do bem-estar e estabilidade clínica.'],
                  ['Pontos a vigiar', 'Variabilidade de glicemia, doses falhadas, novos sintomas.'],
                  ['Recomendações práticas', 'Ações concretas - alarmes, contactos, alternativas terapêuticas.'],
                  ['Sempre informativa', 'Nunca substitui o médico assistente. Apenas organiza o que existe.'],
                ].map(([t, b]) => (
                  <li key={t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <span style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(124,58,237,0.1)', color: '#7C3AED', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                    <div>
                      <strong style={{ fontSize: 15, color: '#0A0A0C', fontWeight: 800 }}>{t}.</strong>
                      <span style={{ fontSize: 15, color: '#4B5563', marginLeft: 6 }}>{b}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href="/register?plan=cuidador_pro" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', padding: '13px 26px', borderRadius: 12, textDecoration: 'none' }}>
                  <Sparkles size={15} strokeWidth={2.5} /> Experimentar Pack Família Plus + IA
                </Link>
                <Link href="/planos" style={{ fontSize: 14, fontWeight: 700, color: '#7C3AED', textDecoration: 'none', padding: '13px 18px' }}>
                  Comparar planos →
                </Link>
              </div>
            </div>
            <div className="lp-ai-frame">
              <div className="lp-ai-frame-glow" aria-hidden="true" />
              <ZoomImage
                src="/showcase/ai-insight-dark.webp"
                alt="Relatório de IA gerado pelo pietas.care: estado geral, pontos positivos, pontos a vigiar e recomendações práticas"
                width={2400}
                height={1500}
                sizes="(max-width: 900px) 100vw, 600px"
                chrome
                chromeUrl="Análise IA · 5s"
                caption="Análise IA · resumo executivo gerado em 5 segundos a partir de 7 dias de sinais vitais, medicação e bem-estar."
                wrapperClassName="lp-ai-zoom"
              />
            </div>
          </div>
          {/* Second exclusive - Chat interno (mirrored asymmetric row) */}
          <div className="lp-ai-grid lp-ai-grid--reverse" style={{ maxWidth: 1180, margin: 'clamp(80px, 10vw, 130px) auto 0' }}>
            <div className="lp-ai-frame">
              <div className="lp-ai-chat-glow" aria-hidden="true" />
              <ZoomImage
                src="/showcase/chat-dark.webp"
                alt="Chat interno entre familiares no pietas.care: histórico organizado por dia com bolhas verdes e respostas dos restantes membros"
                width={2400}
                height={1500}
                sizes="(max-width: 900px) 100vw, 600px"
                chrome
                chromeUrl="Chat familiar · privado"
                caption="Chat interno · histórico privado partilhado entre os membros da família autorizados pelo titular."
              />
            </div>
            <div className="lp-ai-text">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #166534, #22C55E)', padding: '6px 14px', borderRadius: 99, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 22 }}>
                <MessageCircle size={13} strokeWidth={2.5} />
                Exclusivo Pack Família Plus + IA
              </span>
              <h2 style={{ fontSize: 'clamp(28px,4.2vw,46px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#0A0A0C', lineHeight: 1.1, marginBottom: 22 }}>
                Chat interno -<br />
                <span style={{ color: '#166534' }}>menos telefonemas, mais coordenação.</span>
              </h2>
              <p style={{ fontSize: 'clamp(15px,1.6vw,17px)', color: '#4B5563', lineHeight: 1.75, marginBottom: 28 }}>
                Cada família tem o seu canal privado dentro da app - só os familiares autorizados pelo titular têm acesso. Sem grupos paralelos no WhatsApp, sem perder informação clínica entre conversas pessoais.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['Privado por defeito', 'Apenas familiares aceites pelo titular vêem as mensagens.'],
                  ['Notificações em tempo real', 'Som e vibração quando alguém escreve - não passa em branco.'],
                  ['Histórico permanente', 'Coordenação de tomas, consultas e visitas, sem se perder.'],
                  ['Presença online', 'Vê em qualquer página quem está na app neste momento.'],
                ].map(([t, b]) => (
                  <li key={t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <span style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(22,101,52,0.1)', color: '#166534', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                    <div>
                      <strong style={{ fontSize: 15, color: '#0A0A0C', fontWeight: 800 }}>{t}.</strong>
                      <span style={{ fontSize: 15, color: '#4B5563', marginLeft: 6 }}>{b}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href="/register?plan=cuidador_pro" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #166534, #22C55E)', padding: '13px 26px', borderRadius: 12, textDecoration: 'none' }}>
                  <Sparkles size={15} strokeWidth={2.5} /> Começar Pack Família Plus + IA
                </Link>
              </div>
            </div>
          </div>

          <style>{`
            .lp-ai-grid { display: grid; grid-template-columns: 1fr 1.05fr; gap: clamp(40px, 5vw, 72px); align-items: center; }
            .lp-ai-grid--reverse { grid-template-columns: 1.05fr 1fr; }
            .lp-ai-frame { position: relative; }
            .lp-ai-frame-glow { position: absolute; inset: -24px; background: radial-gradient(ellipse at center, rgba(124,58,237,0.22) 0%, transparent 65%); filter: blur(24px); pointer-events: none; }
            .lp-ai-chat-glow  { position: absolute; inset: -24px; background: radial-gradient(ellipse at center, rgba(34,197,94,0.18) 0%, transparent 65%); filter: blur(24px); pointer-events: none; }
            @media (max-width: 900px) {
              .lp-ai-grid, .lp-ai-grid--reverse { grid-template-columns: 1fr; }
              .lp-ai-grid--reverse > .lp-ai-frame { order: 2; }
              .lp-ai-grid--reverse > .lp-ai-text  { order: 1; }
            }
          `}</style>
        </section>

        {/* HOW IT WORKS */}
        <section id="como-funciona" aria-labelledby="como-funciona-heading" style={{ background: '#F5F2ED', padding: 'clamp(64px,8vw,112px) 24px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ marginBottom: 56 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Como funciona</p>
              <h2 id="como-funciona-heading" style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#1C1917', lineHeight: 1.15 }}>
                Pronto a usar em minutos.<br />
                <span style={{ color: '#78716C', fontWeight: 400 }}>Sem formação necessária.</span>
              </h2>
            </div>
            <ol className="lp-steps" style={{ listStyle: 'none' }}>
              {[
                { n: '01', title: 'Crie o perfil do familiar', body: 'Introduza os dados de saúde, alergias, médicos responsáveis e contactos de emergência. O pietas.care organiza tudo numa ficha clínica completa.' },
                { n: '02', title: 'Registe o dia-a-dia', body: 'Medicação, sinais vitais, consultas e notas de turno ficam registados ao longo do dia por quem estiver presente, profissional ou familiar.' },
                { n: '03', title: 'Toda a família a par', body: 'Qualquer pessoa autorizada vê o historial actualizado em tempo real. Nada se perde entre turnos, chamadas ou quilómetros de distância.' },
              ].map((s, idx) => (
                <li key={s.n} style={{ display: 'flex', gap: 'clamp(20px,3vw,32px)', padding: '36px 0', borderTop: '1px solid #E7E5E4', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#166534', letterSpacing: '0.05em', flexShrink: 0, paddingTop: 4, minWidth: 24 }}>{s.n}</span>
                  <div>
                    <h3 style={{ fontSize: 'clamp(17px,1.8vw,20px)', fontWeight: 800, color: '#1C1917', marginBottom: 10, letterSpacing: '-0.02em' }}>{s.title}</h3>
                    <p style={{ fontSize: 'clamp(14px,1.5vw,16px)', color: '#57534E', lineHeight: 1.75 }}>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section style={{ background: '#FAF8F5', padding: 'clamp(64px,8vw,112px) 24px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <svg aria-hidden="true" width="36" height="28" viewBox="0 0 40 32" fill="none" style={{ marginBottom: 24 }}>
              <path d="M0 32V19.2C0 8.533 5.333 2.4 16 0l2.4 3.6C12.533 5.2 9.6 8.667 9.6 14.4H16V32H0Zm24 0V19.2C24 8.533 29.333 2.4 40 0l2.4 3.6c-5.867 1.6-8.8 5.067-8.8 10.8H40V32H24Z" fill="#166534" fillOpacity="0.25" />
            </svg>
            <blockquote>
              <p style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, color: '#0A0A0C', lineHeight: 1.55, letterSpacing: '-0.02em', marginBottom: 24 }}>
                "A minha mãe vive a 400 km. Antes do pietas.care, passava os fins-de-semana ao telefone a tentar perceber como tinha corrido a semana. Agora abro a aplicação e sei exactamente como ela está, e a cuidadora sabe que não está sozinha."
              </p>
              <footer>
                <cite style={{ fontStyle: 'normal', fontSize: 15, color: '#4B5563', fontWeight: 600 }}>
                  Ana Rodrigues, 47 anos - filha cuidadora, Lisboa
                </cite>
              </footer>
            </blockquote>
          </div>
        </section>

        {/* FEATURES - each card with a real screenshot, clickable to zoom */}
        <section id="funcionalidades" aria-labelledby="funcionalidades-heading" style={{ background: '#F9FAFB', padding: 'clamp(64px,8vw,112px) 24px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Funcionalidades</p>
              <h2 id="funcionalidades-heading" style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#0A0A0C', marginBottom: 14 }}>
                Tudo o que o cuidado diário exige.
              </h2>
              <p style={{ fontSize: 'clamp(14px,1.4vw,16px)', color: '#6B7280', maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>
                Cada vista abaixo é um ecrã real da aplicação. <span style={{ color: '#166534', fontWeight: 700 }}>Clique para ampliar.</span>
              </p>
            </div>
            <div className="lp-features-photo">
              {([
                { src: '/showcase/saude-dark.webp', icon: <HeartPulse size={18} strokeWidth={2} key="hp" />, title: 'Sinais vitais', desc: 'Pressão, glicemia, saturação, temperatura e peso com histórico visual de 60 dias.' },
                { src: '/showcase/documentos-dark.webp', icon: <FileText size={18} strokeWidth={2} key="ft" />, title: 'Documentos', desc: 'Relatórios, receitas e exames digitalizados e organizados por categoria.' },
                { src: '/showcase/notas-dark.webp', icon: <ClipboardList size={18} strokeWidth={2} key="nt" />, title: 'Notas de turno', desc: 'Manhã, tarde e noite - comunicação contínua entre todos os cuidadores.' },
                { src: '/showcase/plano-dark.webp', icon: <Stethoscope size={18} strokeWidth={2} key="pl" />, title: 'Plano de cuidados', desc: 'Rotinas de higiene, nutrição, mobilidade e estimulação cognitiva.' },
                { src: '/showcase/clinico-dark.webp', icon: <ClipboardList size={18} strokeWidth={2} key="dc" />, title: 'Dados clínicos', desc: 'Diagnósticos com código ICD, vacinas e historial sempre acessíveis.' },
                { src: '/showcase/relatorio-dark.webp', icon: <FileText size={18} strokeWidth={2} key="rm" />, title: 'Relatório médico', desc: 'Resumos periódicos prontos a imprimir ou enviar por email ao especialista.' },
                { src: '/showcase/medicacao-dark.webp', icon: <Pill size={18} strokeWidth={2} key="al" />, title: 'Medicação & alertas', desc: 'Horários personalizáveis, percentagem de adesão e descrição clínica de cada fármaco.' },
                { src: '/showcase/incidentes-dark.webp', icon: <MapPin size={18} strokeWidth={2} key="mp" />, title: 'Mapa corporal', desc: 'Registo visual de incidentes - quedas, ferimentos - com zona afectada.' },
              ]).map((f) => (
                <article key={f.title} className="lp-feature-photo-card">
                  <ZoomImage
                    src={f.src}
                    alt={`${f.title}: ${f.desc}`}
                    width={2400}
                    height={1500}
                    sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 280px"
                    chrome
                    caption={f.desc}
                  />
                  <div className="lp-feature-photo-text">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(22,101,52,0.08)', color: '#166534', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.icon}</span>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0A0A0C', letterSpacing: '-0.01em' }}>{f.title}</h3>
                    </div>
                    <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65 }}>{f.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <style>{`
            .lp-features-photo { display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px 22px; }
            .lp-feature-photo-card { display: flex; flex-direction: column; gap: 14px; }
            .lp-feature-photo-text { padding: 0 2px; }
            @media (max-width: 1000px) { .lp-features-photo { grid-template-columns: repeat(2, 1fr); gap: 32px 22px; } }
            @media (max-width: 520px)  { .lp-features-photo { grid-template-columns: 1fr; gap: 28px; } }
          `}</style>
        </section>

        {/* PRICING */}
        <section id="precos" aria-labelledby="precos-heading" style={{ background: '#F5F2ED', padding: 'clamp(64px,8vw,112px) 24px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Planos</p>
              <h2 id="precos-heading" style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#1C1917', marginBottom: 10 }}>
                Transparente desde o início.
              </h2>
              <p style={{ fontSize: 16, color: '#78716C' }}>Sem contratos de longa duração. Cancele quando quiser.</p>
            </div>
            <div className="lp-plans" style={{ alignItems: 'center' }}>
              {[
                { id: 'familia', name: 'Pack Família', price: '35', sub: 'Para um familiar', features: ['1 perfil de familiar','Até 2 familiares','Medicação, agenda e sinais vitais','Incidentes e documentos','Notas de turno'], highlight: false, cta: 'Começar' },
                { id: 'familia_plus', name: 'Pack Família+', price: '59', sub: 'Para mais de um familiar', features: ['Até 2 perfis de familiar','Até 5 familiares','Tudo do Pack Família','Relatório médico completo','Dados clínicos avançados','Plano de cuidados detalhado'], highlight: true, cta: 'Começar' },
                { id: 'cuidador_pro', name: 'Pack Família Plus + IA', badge: 'IA', price: '88', sub: 'Múltiplos familiares + IA', features: ['Até 4 perfis de familiar','Familiares ilimitados','Tudo do Pack Família+','Assistente IA - análise clínica em 5 segundos','Chat interno entre familiares','Presença online em tempo real'], highlight: false, cta: 'Começar' },
              ].map(p => (
                <div key={p.id} style={{ position: 'relative' }}>
                  <div style={{
                    background: p.highlight ? '#0D2B1E' : '#fff',
                    borderRadius: 20,
                    padding: p.highlight ? 'clamp(28px,3.5vw,40px) clamp(20px,2.5vw,32px)' : 'clamp(24px,3vw,36px) clamp(20px,2.5vw,32px)',
                    border: p.highlight ? '1px solid rgba(74,222,128,0.2)' : '1px solid #E7E5E4',
                    boxShadow: p.highlight ? '0 0 0 1px rgba(74,222,128,0.15), 0 0 48px rgba(22,101,52,0.18), 0 20px 48px rgba(0,0,0,0.16)' : '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {p.highlight && (
                      <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#E8944A', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 18px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                        MAIS POPULAR
                      </div>
                    )}
                    <p style={{ fontSize: 12, fontWeight: 700, color: p.highlight ? 'rgba(255,255,255,0.45)' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{p.sub}</p>
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: p.highlight ? '#fff' : '#1C1917', marginBottom: 20, letterSpacing: '-0.02em' }}>{p.name}</h3>
                    <div style={{ marginBottom: 28 }}>
                      <span style={{ fontSize: 52, fontWeight: 900, color: p.highlight ? '#fff' : '#1C1917', letterSpacing: '-0.04em', lineHeight: 1 }}>€{p.price}</span>
                      <span style={{ fontSize: 15, color: p.highlight ? 'rgba(255,255,255,0.45)' : '#9CA3AF' }}>/mês</span>
                      <div style={{ fontSize: 11, color: p.highlight ? 'rgba(255,255,255,0.5)' : '#9CA3AF', marginTop: 4, fontWeight: 600, letterSpacing: '0.02em' }}>+ IVA · 14 dias grátis</div>
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                      {p.features.map(f => (
                        <li key={f} style={{ display: 'flex', gap: 10, fontSize: 14, color: p.highlight ? 'rgba(255,255,255,0.85)' : '#57534E', lineHeight: 1.5 }}>
                          <Check size={16} strokeWidth={2.5} style={{ color: p.highlight ? '#4ADE80' : '#166534', flexShrink: 0, marginTop: 3 }} />{f}
                        </li>
                      ))}
                    </ul>
                    <Link href={`/register?plan=${p.id}&pay=1`} style={{ display: 'block', textAlign: 'center', fontSize: 15, fontWeight: 800, padding: '14px', borderRadius: 12, textDecoration: 'none', background: p.highlight ? '#4ADE80' : '#166534', color: p.highlight ? '#0D2B1E' : '#fff' }}>
                      Subscrever — €{p.price}/mês →
                    </Link>
                    <Link href={`/register?plan=${p.id}`} style={{ display: 'block', textAlign: 'center', fontSize: 13, fontWeight: 700, padding: '10px 12px', marginTop: 8, borderRadius: 10, textDecoration: 'none', color: p.highlight ? 'rgba(255,255,255,0.85)' : '#166534', border: `1px solid ${p.highlight ? 'rgba(255,255,255,0.2)' : 'rgba(22,101,52,0.25)'}` }}>
                      Ou experimente 14 dias grátis
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: '#fff', padding: 'clamp(72px,9vw,130px) 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(28px,4.5vw,52px)', fontWeight: 900, color: '#0A0A0C', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
              O cuidado que o seu familiar merece,<br />
              <span style={{ color: '#9CA3AF', fontWeight: 400 }}>começa aqui.</span>
            </h2>
            <p style={{ fontSize: 'clamp(15px,1.8vw,18px)', color: '#4B5563', marginBottom: 40, lineHeight: 1.7 }}>
              Junte-se às famílias que já cuidam com mais confiança, menos ansiedade e total transparência.
            </p>
            <Link href="/register" style={{ display: 'inline-block', fontSize: 17, fontWeight: 800, color: '#fff', background: '#166534', textDecoration: 'none', padding: '17px 44px', borderRadius: 14 }}>
              Criar conta gratuitamente
            </Link>
            <p style={{ marginTop: 18, fontSize: 13, color: '#9CA3AF' }}>Sem cartão de crédito · Cancele quando quiser</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer role="contentinfo" style={{ background: '#1C1917', padding: 'clamp(36px,5vw,56px) clamp(20px,4vw,40px) clamp(24px,3vw,36px)' }}>
          <div className="lp-footer-inner">
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'center', gap: 7 }}><Leaf size={18} strokeWidth={2.25} /> pietas.care</div>
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
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 pietas.care · FLOW 88 - Gestão de Ativos, Lda.</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Feito em Portugal 🇵🇹</p>
          </div>
        </footer>

      </div>
    </>
  )
}
