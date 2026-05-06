import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos de Uso - pieta.care',
  description: 'Termos e condições de utilização do pieta.care, plataforma de gestão de cuidados familiares. Rege-se pelo direito português e legislação europeia aplicável.',
  alternates: { canonical: 'https://pieta.care/termos' },
  robots: { index: true, follow: false },
}

const SECTIONS = [
  { id: 's1', label: '1. Identificação do prestador' },
  { id: 's2', label: '2. Descrição do serviço' },
  { id: 's3', label: '3. Registo e conta' },
  { id: 's4', label: '4. Planos e pagamentos' },
  { id: 's5', label: '5. Uso aceitável' },
  { id: 's6', label: '6. Dados de saúde' },
  { id: 's7', label: '7. Disponibilidade' },
  { id: 's8', label: '8. Propriedade intelectual' },
  { id: 's9', label: '9. Limitação de responsabilidade' },
  { id: 's10', label: '10. Suspensão e rescisão' },
  { id: 's11', label: '11. Alterações' },
  { id: 's12', label: '12. Lei aplicável e litígios' },
  { id: 's13', label: '13. Disposições gerais' },
  { id: 's14', label: '14. Contacto' },
]

export default function TermosPage() {
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", background: '#fff', color: '#1A2E25', lineHeight: 1.6 }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .legal-wrap { display: grid; grid-template-columns: 240px 1fr; gap: 48px; max-width: 1080px; margin: 0 auto; padding: clamp(32px,5vw,64px) 24px; align-items: start; }
        .legal-toc { position: sticky; top: 80px; }
        .legal-toc-inner { background: #F8FAF9; border: 1px solid #E8EFE9; border-radius: 14px; padding: 20px; }
        .legal-toc-title { font-size: 11px; font-weight: 700; color: #7A9A8A; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 14px; }
        .legal-toc a { display: block; font-size: 13px; color: #4A6458; text-decoration: none; padding: 6px 10px; border-radius: 7px; margin-bottom: 2px; line-height: 1.4; transition: background 0.12s, color 0.12s; }
        .legal-toc a:hover { background: #EAF4EE; color: #2A6049; }
        .legal-content { min-width: 0; }
        .legal-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .legal-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .legal-table th { padding: 10px 14px; text-align: left; font-weight: 700; font-size: 13px; color: #4A6458; background: #F8FAF9; border-bottom: 2px solid #E8EFE9; }
        .legal-table td { padding: 10px 14px; vertical-align: top; font-size: 14px; color: #1A2E25; border-bottom: 1px solid #E8EFE9; }
        .legal-mobile-toc { display: none; margin-bottom: 32px; }
        .legal-mobile-toc details { border: 1px solid #E8EFE9; border-radius: 12px; overflow: hidden; }
        .legal-mobile-toc summary { padding: 14px 18px; font-size: 14px; font-weight: 700; color: #2A6049; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; background: #F8FAF9; }
        .legal-mobile-toc summary::-webkit-details-marker { display: none; }
        .legal-mobile-toc a { display: block; font-size: 13px; color: #4A6458; text-decoration: none; padding: 10px 18px; border-top: 1px solid #E8EFE9; }
        @media (max-width: 768px) {
          .legal-wrap { grid-template-columns: 1fr; gap: 0; padding: 24px 16px; }
          .legal-toc { display: none; }
          .legal-mobile-toc { display: block; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #E8EFE9', padding: '0 clamp(16px,3vw,32px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 40 }}>
        <Link href="/" style={{ fontWeight: 900, fontSize: 18, color: '#2A6049', textDecoration: 'none', letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Leaf size={18} strokeWidth={2.25} /> pieta.care
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/privacidade" style={{ fontSize: 13, color: '#7A9A8A', textDecoration: 'none', fontWeight: 500 }}>Privacidade</Link>
          <Link href="/" style={{ fontSize: 13, color: '#4A6458', textDecoration: 'none', fontWeight: 600 }}>← Início</Link>
        </div>
      </nav>

      <main>
        <div className="legal-wrap">

          {/* Sidebar TOC - desktop */}
          <aside className="legal-toc" aria-label="Índice do documento">
            <div className="legal-toc-inner">
              <p className="legal-toc-title">Neste documento</p>
              {SECTIONS.map(s => (
                <a key={s.id} href={`#${s.id}`}>{s.label}</a>
              ))}
            </div>
          </aside>

          <div className="legal-content">

            {/* Mobile TOC */}
            <nav className="legal-mobile-toc" aria-label="Índice do documento">
              <details>
                <summary>Neste documento <span>↓</span></summary>
                {SECTIONS.map(s => (
                  <a key={s.id} href={`#${s.id}`}>{s.label}</a>
                ))}
              </details>
            </nav>

            {/* Header */}
            <header style={{ marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#2A6049', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Documento legal</p>
              <h1 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#1A2E25', marginBottom: 10, lineHeight: 1.1 }}>
                Termos de Uso
              </h1>
              <p style={{ fontSize: 14, color: '#7A9A8A' }}>Última actualização: 6 de maio de 2026</p>
            </header>

            <div style={{ fontSize: 15, color: '#4A6458', lineHeight: 1.8, background: '#EAF4EE', border: '1px solid #C8D8D0', borderRadius: 12, padding: '18px 22px', marginBottom: 40 }}>
              Estes Termos de Uso regulam o acesso e a utilização da plataforma <strong style={{ color: '#2A6049' }}>pieta.care</strong>. Ao criar uma conta ou utilizar o serviço, o utilizador aceita integralmente estes termos. Redigidos em conformidade com o <strong>Código Civil português</strong>, o <strong>Decreto-Lei n.º 7/2004</strong> (comércio electrónico), a <strong>Lei n.º 24/96</strong> (defesa do consumidor), a <strong>Ley 34/2002 LSSI</strong> (Espanha) e demais legislação aplicável.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>

              <Section id="s1" title="1. Identificação do prestador de serviço">
                <div style={{ background: '#F8FAF9', border: '1px solid #E8EFE9', borderRadius: 10, padding: '18px 22px', fontSize: 15 }}>
                  <p><strong>FLOW 88 - Gestão de Ativos, Lda.</strong></p>
                  <p style={{ marginTop: 8 }}>Email: <a href="mailto:suporte@pieta.care" style={{ color: '#2A6049' }}>suporte@pieta.care</a></p>
                  <p>Website: <a href="https://pieta.care" style={{ color: '#2A6049' }}>pieta.care</a></p>
                </div>
              </Section>

              <Section id="s2" title="2. Descrição do serviço">
                <p>O pieta.care é uma plataforma de software como serviço (SaaS) que permite a famílias e cuidadores profissionais gerir informação clínica, medicação, agenda, sinais vitais, incidentes e documentos relacionados com o cuidado de pessoas idosas ou dependentes.</p>
                <p style={{ ...note, display: 'flex', alignItems: 'flex-start', gap: 10 }}><AlertTriangle size={18} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2, color: '#C05621' }} /><span>O pieta.care é uma ferramenta de apoio à organização e comunicação entre cuidadores. <strong>Não constitui um serviço de saúde, não substitui aconselhamento médico, diagnóstico clínico ou tratamento profissional de saúde</strong>, não sendo regulado como dispositivo médico nos termos do Regulamento (UE) 2017/745.</span></p>
              </Section>

              <Section id="s3" title="3. Registo e conta">
                <p>Para aceder ao serviço, é necessário criar uma conta. O utilizador compromete-se a:</p>
                <ul style={ul}>
                  <li>Fornecer informação verdadeira, actual e completa no momento do registo</li>
                  <li>Manter a confidencialidade das suas credenciais de acesso e não as partilhar com terceiros não autorizados</li>
                  <li>Notificar imediatamente o pieta.care em caso de acesso não autorizado à sua conta</li>
                  <li>Ser o único responsável por todas as acções realizadas através da sua conta</li>
                </ul>
                <p>O pieta.care reserva-se o direito de recusar o registo ou encerrar contas que violem estes termos.</p>
              </Section>

              <Section id="s4" title="4. Planos, subscrição e pagamentos">
                <h3 style={subH}>4.1 Planos disponíveis</h3>
                <div className="legal-table-wrap" style={{ marginTop: 10 }}>
                  <table className="legal-table">
                    <thead>
                      <tr><th>Plano</th><th>Preço</th><th>Características principais</th></tr>
                    </thead>
                    <tbody>
                      {[
                        ['Família', '€35/mês', '1 perfil de familiar, até 3 utilizadores'],
                        ['Família+', '€59/mês', 'Até 3 perfis, utilizadores ilimitados, funcionalidades avançadas'],
                        ['Cuidador Pro', '€19/mês', 'Para profissionais, múltiplos utentes, relatórios'],
                      ].map(([p, v, d]) => (
                        <tr key={p}><td style={{ fontWeight: 700 }}>{p}</td><td style={{ color: '#2A6049', fontWeight: 700 }}>{v}</td><td style={{ color: '#4A6458' }}>{d}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>Os preços indicados incluem IVA à taxa aplicável. O pieta.care reserva-se o direito de alterar os preços com aviso prévio de 30 dias por email.</p>

                <h3 style={subH}>4.2 Facturação e renovação</h3>
                <p>As subscrições são de renovação automática mensal. O valor é cobrado no início de cada período de facturação através do método de pagamento registado.</p>

                <h3 style={subH}>4.3 Cancelamento e reembolso</h3>
                <p>O utilizador pode cancelar a subscrição a qualquer momento. O cancelamento produz efeitos no final do período de facturação em curso, sem direito a reembolso proporcional, salvo nos seguintes casos:</p>
                <ul style={ul}>
                  <li><strong>Direito de livre resolução:</strong> nos termos do artigo 10.º do Decreto-Lei n.º 24/2014 (Portugal) e do artigo 102.º da LGDCU (Espanha), o utilizador tem 14 dias após a subscrição inicial para resolver o contrato sem penalização. Este direito não se aplica após utilização efectiva do serviço, nos termos do art. 16.º/a) do DL 24/2014.</li>
                  <li><strong>Falha técnica imputável ao pieta.care</strong> que torne o serviço inacessível por período superior a 72 horas consecutivas.</li>
                </ul>
              </Section>

              <Section id="s5" title="5. Uso aceitável">
                <p>É expressamente <strong>proibido</strong>:</p>
                <ul style={ul}>
                  <li>Introduzir dados falsos, fraudulentos ou que induzam terceiros em erro</li>
                  <li>Utilizar a plataforma para fins comerciais não autorizados ou revenda do serviço</li>
                  <li>Efectuar engenharia inversa, descompilar ou tentar extrair o código-fonte da plataforma</li>
                  <li>Realizar ataques informáticos ou qualquer acção que comprometa a segurança do serviço</li>
                  <li>Introduzir vírus, malware ou código malicioso</li>
                  <li>Contornar mecanismos de autenticação ou aceder a contas de terceiros sem autorização</li>
                  <li>Introduzir dados de saúde de terceiros sem o seu consentimento ou o do respectivo representante legal</li>
                  <li>Utilizar a plataforma para fins de vigilância ou controlo não consentido de terceiros</li>
                </ul>
                <p>A violação pode resultar na suspensão imediata da conta e, se aplicável, em responsabilidade civil e/ou criminal.</p>
              </Section>

              <Section id="s6" title="6. Dados de saúde - responsabilidades do utilizador">
                <p style={{ ...note, display: 'flex', alignItems: 'flex-start', gap: 10 }}><AlertTriangle size={18} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2, color: '#C05621' }} /><span>O pieta.care processa dados de saúde inseridos pelos utilizadores, actuando como <strong>subcontratante</strong>. O utilizador é o <strong>responsável pelo tratamento</strong> dos dados que introduz relativamente a terceiros, nos termos do RGPD.</span></p>
                <p>O utilizador declara e garante que:</p>
                <ul style={ul}>
                  <li>Obteve o consentimento explícito do titular dos dados de saúde (ou do seu representante legal) antes de os introduzir na plataforma</li>
                  <li>Age em conformidade com o RGPD e legislação nacional aplicável enquanto responsável pelo tratamento</li>
                  <li>Os dados introduzidos são precisos e actualizados na medida do possível</li>
                  <li>Não utilizará a plataforma como único meio de acompanhamento clínico</li>
                </ul>
              </Section>

              <Section id="s7" title="7. Disponibilidade do serviço">
                <p>O pieta.care visa um nível de disponibilidade de 99,5% mensais (excluindo manutenção programada). Não nos responsabilizamos por interrupções resultantes de manutenção programada, falhas de terceiros fornecedores de infraestrutura, ou eventos de força maior.</p>
              </Section>

              <Section id="s8" title="8. Propriedade intelectual">
                <p>Todos os direitos de propriedade intelectual sobre a plataforma pieta.care são propriedade exclusiva da FLOW 88 - Gestão de Ativos, Lda., protegidos pela legislação portuguesa e europeia de direitos de autor e propriedade industrial.</p>
                <p>A subscrição confere ao utilizador uma licença de uso pessoal, não exclusiva, intransmissível e revogável. Os dados introduzidos pelo utilizador permanecem propriedade do utilizador.</p>
              </Section>

              <Section id="s9" title="9. Limitação de responsabilidade">
                <p>Na máxima extensão permitida pela lei aplicável, o pieta.care não é responsável por:</p>
                <ul style={ul}>
                  <li>Danos indirectos, incidentais, especiais ou consequentes decorrentes do uso do serviço</li>
                  <li>Erros médicos ou decisões clínicas tomadas com base em informação registada na plataforma</li>
                  <li>Perda de dados resultante de acção ou omissão do utilizador</li>
                  <li>Acesso não autorizado por terceiros resultante de negligência do utilizador na guarda das suas credenciais</li>
                </ul>
                <p>Em qualquer caso, a responsabilidade total do pieta.care não excederá o valor pago nos 3 meses anteriores ao evento que originou o dano. Nada nestes termos exclui responsabilidade por morte ou lesão corporal causada por negligência, fraude ou qualquer responsabilidade que não possa ser legalmente excluída.</p>
              </Section>

              <Section id="s10" title="10. Suspensão e rescisão">
                <h3 style={subH}>10.1 Rescisão pelo utilizador</h3>
                <p>O utilizador pode encerrar a sua conta a qualquer momento através das definições da conta ou por email para <a href="mailto:suporte@pieta.care" style={{ color: '#2A6049' }}>suporte@pieta.care</a>. Após o encerramento, os dados ficam disponíveis para exportação durante 30 dias, após os quais são eliminados definitivamente.</p>
                <h3 style={subH}>10.2 Suspensão ou rescisão pelo pieta.care</h3>
                <p>O pieta.care pode suspender ou encerrar o acesso nos seguintes casos: violação destes termos, falta de pagamento após aviso, actividade fraudulenta ou ilegal, ou determinação por autoridade competente.</p>
              </Section>

              <Section id="s11" title="11. Alterações ao serviço e aos termos">
                <p>Em caso de alterações materiais a estes Termos, o utilizador será notificado por email com antecedência mínima de 15 dias. A continuação do uso do serviço após essa data constitui aceitação dos novos termos.</p>
              </Section>

              <Section id="s12" title="12. Lei aplicável e resolução de litígios">
                <p>Estes termos são regidos pelo <strong>direito português</strong>, sem prejuízo das normas imperativas de defesa do consumidor do país de residência do utilizador.</p>
                <h3 style={subH}>Resolução alternativa de litígios (RAL)</h3>
                <ul style={ul}>
                  <li><strong>CNIACC</strong> (Portugal): <a href="https://www.arbitragemdeconsumo.org" style={{ color: '#2A6049' }} target="_blank" rel="noopener noreferrer">www.arbitragemdeconsumo.org</a></li>
                  <li><strong>Plataforma ODR da UE:</strong> <a href="https://ec.europa.eu/consumers/odr" style={{ color: '#2A6049' }} target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a></li>
                  <li><strong>AECOSAN</strong> (Espanha): <a href="https://www.consumo.gob.es" style={{ color: '#2A6049' }} target="_blank" rel="noopener noreferrer">www.consumo.gob.es</a></li>
                </ul>
                <p>Para litígios não resolvidos por via extrajudicial, é competente o tribunal da comarca de Lisboa, sem prejuízo do foro do domicílio do consumidor quando mais favorável ao mesmo.</p>
              </Section>

              <Section id="s13" title="13. Disposições gerais">
                <ul style={ul}>
                  <li><strong>Integralidade:</strong> Estes termos, conjuntamente com a Política de Privacidade, constituem o acordo integral entre o utilizador e o pieta.care.</li>
                  <li><strong>Invalidade parcial:</strong> Se qualquer disposição for considerada inválida, as restantes manter-se-ão em vigor.</li>
                  <li><strong>Não renúncia:</strong> O facto de o pieta.care não exigir o cumprimento de qualquer disposição não constitui renúncia ao direito de o fazer no futuro.</li>
                  <li><strong>Cessão:</strong> O utilizador não pode ceder os seus direitos e obrigações a terceiros sem consentimento prévio escrito do pieta.care.</li>
                </ul>
              </Section>

              <Section id="s14" title="14. Contacto">
                <div style={{ background: '#F8FAF9', border: '1px solid #E8EFE9', borderRadius: 10, padding: '18px 22px' }}>
                  <p>📧 <a href="mailto:suporte@pieta.care" style={{ color: '#2A6049', fontWeight: 600 }}>suporte@pieta.care</a></p>
                  <p style={{ marginTop: 6 }}>🌐 <a href="https://pieta.care" style={{ color: '#2A6049' }}>pieta.care</a></p>
                </div>
              </Section>

            </div>

            <div style={{ marginTop: 56, paddingTop: 28, borderTop: '1px solid #E8EFE9', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <Link href="/privacidade" style={{ fontSize: 14, color: '#2A6049', fontWeight: 600, textDecoration: 'none' }}>Política de Privacidade →</Link>
              <Link href="/" style={{ fontSize: 14, color: '#7A9A8A', textDecoration: 'none' }}>← Página inicial</Link>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ background: '#0D1A13', padding: '28px 32px', textAlign: 'center' }}>
        <Link href="/" style={{ fontWeight: 900, fontSize: 16, color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Leaf size={16} strokeWidth={2.25} /> pieta.care</Link>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>© 2026 FLOW 88 - Gestão de Ativos, Lda. · Feito em Portugal 🇵🇹</p>
      </footer>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ scrollMarginTop: 80 }}>
      <h2 style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.02em', color: '#1A2E25', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #EAF4EE' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 15, color: '#4A6458', lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  )
}

const ul: React.CSSProperties = { paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }
const subH: React.CSSProperties = { fontSize: 14, fontWeight: 800, color: '#1A2E25', marginTop: 6 }
const note: React.CSSProperties = { background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#744210' }
