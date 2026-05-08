import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidade - pieta.care',
  description: 'Saiba como o pieta.care recolhe, utiliza e protege os seus dados pessoais e dados de saúde, em conformidade com o RGPD e a legislação portuguesa e espanhola.',
  alternates: { canonical: 'https://pieta.care/privacidade' },
  robots: { index: true, follow: false },
}

const SECTIONS = [
  { id: 's1', label: '1. Responsável pelo tratamento' },
  { id: 's2', label: '2. Dados recolhidos' },
  { id: 's3', label: '3. Finalidades e base jurídica' },
  { id: 's4', label: '4. Conservação dos dados' },
  { id: 's5', label: '5. Partilha com terceiros' },
  { id: 's6', label: '6. Transferências internacionais' },
  { id: 's7', label: '7. Direitos dos titulares' },
  { id: 's8', label: '8. Segurança' },
  { id: 's9', label: '9. Cookies' },
  { id: 's10', label: '10. Menores' },
  { id: 's11', label: '11. Alterações' },
  { id: 's12', label: '12. Contacto' },
]

export default function PrivacidadePage() {
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
        <Link href="/" style={{ fontWeight: 900, fontSize: 18, color: '#2A6049', textDecoration: 'none', letterSpacing: '-0.02em' }}>
<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Leaf size={18} strokeWidth={2.25} /> pieta.care</span>
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/termos" style={{ fontSize: 13, color: '#7A9A8A', textDecoration: 'none', fontWeight: 500 }}>Termos</Link>
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
                Política de Privacidade
              </h1>
              <p style={{ fontSize: 14, color: '#7A9A8A' }}>Última actualização: 6 de maio de 2026</p>
            </header>

            <div style={{ fontSize: 15, color: '#4A6458', lineHeight: 1.8, background: '#EAF4EE', border: '1px solid #C8D8D0', borderRadius: 12, padding: '18px 22px', marginBottom: 40 }}>
              O <strong style={{ color: '#2A6049' }}>pieta.care</strong> trata dados pessoais, incluindo dados de saúde (categoria especial nos termos do artigo 9.º do RGPD), com o máximo rigor e em plena conformidade com o <strong>Regulamento (UE) 2016/679 (RGPD)</strong>, a <strong>Lei n.º 58/2019</strong> (lei de execução do RGPD em Portugal), a <strong>Lei Orgánica 3/2018 (LOPDGDD)</strong> (Espanha) e demais legislação aplicável.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>

              <Section id="s1" title="1. Responsável pelo tratamento">
                <div style={{ background: '#F8FAF9', border: '1px solid #E8EFE9', borderRadius: 10, padding: '18px 22px', fontSize: 15 }}>
                  <p><strong>FLOW 88 - Gestão de Ativos, Lda.</strong></p>
                  <p style={{ marginTop: 8 }}>Email: <a href="mailto:privacidade@pieta.care" style={{ color: '#2A6049' }}>privacidade@pieta.care</a></p>
                  <p>Website: <a href="https://pieta.care" style={{ color: '#2A6049' }}>pieta.care</a></p>
                </div>
              </Section>

              <Section id="s2" title="2. Dados pessoais recolhidos">
                <h3 style={subH}>2.1 Dados de identificação e conta</h3>
                <ul style={ul}>
                  <li>Nome completo, endereço de email e palavra-passe (cifrada)</li>
                  <li>Dados de facturação para subscrição do serviço</li>
                  <li>Endereço IP, tipo de dispositivo e browser (dados de acesso)</li>
                </ul>
                <h3 style={subH}>2.2 Dados de saúde (categoria especial - artigo 9.º RGPD)</h3>
                <p>Ao utilizar a plataforma, poderá introduzir dados de saúde, nomeadamente:</p>
                <ul style={ul}>
                  <li>Diagnósticos clínicos, alergias e condições médicas crónicas</li>
                  <li>Registos de medicação, doses e horários</li>
                  <li>Sinais vitais (tensão arterial, glicemia, temperatura, saturação, peso)</li>
                  <li>Registos de incidentes (quedas, eventos adversos, zonas corporais afectadas)</li>
                  <li>Vacinas, relatórios médicos e documentos clínicos carregados pelo utilizador</li>
                  <li>Notas de turno e observações de bem-estar</li>
                </ul>
                <p style={{ ...note, display: 'flex', alignItems: 'flex-start', gap: 10 }}><AlertTriangle size={18} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2, color: '#C05621' }} /><span><strong>Atenção:</strong> Ao introduzir dados de saúde de terceiros, o utilizador declara ter autorização do titular ou do seu representante legal para o fazer.</span></p>
                <h3 style={subH}>2.3 Dados gerados pelo uso da plataforma</h3>
                <ul style={ul}>
                  <li>Registos de acesso (logs), datas e horas de actividade</li>
                  <li>Preferências de configuração e notificações</li>
                </ul>
              </Section>

              <Section id="s3" title="3. Finalidades e base jurídica">
                <div className="legal-table-wrap">
                  <table className="legal-table">
                    <thead>
                      <tr><th>Finalidade</th><th>Base jurídica (RGPD)</th></tr>
                    </thead>
                    <tbody>
                      {[
                        ['Prestação do serviço pieta.care', 'Art. 6.º/1/b) - execução de contrato'],
                        ['Tratamento de dados de saúde para fins de cuidados', 'Art. 9.º/2/c) e /h) - interesses vitais e prestação de cuidados; consentimento explícito'],
                        ['Envio de notificações e alertas configurados', 'Art. 6.º/1/b) - execução de contrato'],
                        ['Facturação e gestão de subscrições', 'Art. 6.º/1/b) e /c) - execução de contrato e obrigação legal'],
                        ['Cumprimento de obrigações legais (fiscais, contabilísticas)', 'Art. 6.º/1/c) - obrigação legal'],
                        ['Segurança e prevenção de fraude', 'Art. 6.º/1/f) - interesse legítimo'],
                        ['Melhoria do serviço (dados anonimizados)', 'Art. 6.º/1/f) - interesse legítimo'],
                        ['Comunicações comerciais', 'Art. 6.º/1/a) - consentimento'],
                      ].map(([f, b]) => (
                        <tr key={f}><td>{f}</td><td style={{ color: '#4A6458', fontStyle: 'italic' }}>{b}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section id="s4" title="4. Conservação dos dados">
                <ul style={ul}>
                  <li><strong>Dados de conta activa:</strong> durante toda a vigência da subscrição e por 30 dias após o cancelamento.</li>
                  <li><strong>Dados de saúde:</strong> durante a subscrição activa. Após cancelamento, podem ser exportados antes da eliminação definitiva ao fim de 30 dias.</li>
                  <li><strong>Dados de facturação e fiscais:</strong> 10 anos, nos termos do Código Comercial português e da Ley del IVA espanhola.</li>
                  <li><strong>Logs de acesso e segurança:</strong> 12 meses, nos termos da Lei n.º 41/2004 e da Ley 34/2002 (LSSI).</li>
                  <li><strong>Dados para comunicações comerciais:</strong> até revogação do consentimento.</li>
                </ul>
              </Section>

              <Section id="s5" title="5. Partilha de dados com terceiros">
                <p>O pieta.care <strong>não vende dados pessoais a terceiros</strong>. Os dados podem ser partilhados nas seguintes circunstâncias:</p>
                <h3 style={subH}>5.1 Subcontratantes (processadores)</h3>
                <ul style={ul}>
                  <li><strong>Vercel Inc.</strong> (alojamento do frontend) - Estados Unidos; coberto por Cláusulas Contratuais-Tipo CE</li>
                  <li><strong>Hetzner Online GmbH</strong> (alojamento do servidor/API) - Alemanha, UE</li>
                  <li><strong>Resend Inc.</strong> (envio de emails transaccionais) - Estados Unidos; coberto por Cláusulas Contratuais-Tipo CE</li>
                  <li><strong>Stripe Inc.</strong> (processamento de pagamentos) - Estados Unidos; certificado PCI-DSS nível 1; coberto por Cláusulas Contratuais-Tipo CE</li>
                </ul>
                <h3 style={subH}>5.2 Autoridades públicas</h3>
                <p>Poderemos divulgar dados a autoridades públicas quando legalmente obrigados, mediante ordem judicial ou obrigação regulatória.</p>
                <h3 style={subH}>5.3 Outros utilizadores da mesma conta</h3>
                <p>Ao convidar membros da família ou cuidadores, esses utilizadores terão acesso aos dados do perfil partilhado. É da responsabilidade do titular da conta gerir as permissões de acesso.</p>
              </Section>

              <Section id="s6" title="6. Transferências internacionais">
                <p>Alguns subcontratantes estão localizados fora do Espaço Económico Europeu (EEE). Nestes casos, asseguramos garantias adequadas, nomeadamente:</p>
                <ul style={ul}>
                  <li>Cláusulas Contratuais-Tipo aprovadas pela Comissão Europeia (Decisão 2021/914/UE)</li>
                  <li>Certificações reconhecidas pelo RGPD (ex.: EU-US Data Privacy Framework, onde aplicável)</li>
                </ul>
                <p>Pode solicitar informação sobre os mecanismos específicos através de <a href="mailto:privacidade@pieta.care" style={{ color: '#2A6049' }}>privacidade@pieta.care</a>.</p>
              </Section>

              <Section id="s7" title="7. Direitos dos titulares">
                <ul style={ul}>
                  <li><strong>Direito de acesso (art. 15.º RGPD):</strong> saber quais os dados que tratamos sobre si.</li>
                  <li><strong>Direito de rectificação (art. 16.º RGPD):</strong> corrigir dados inexactos ou incompletos.</li>
                  <li><strong>Direito ao apagamento (art. 17.º RGPD):</strong> solicitar a eliminação dos seus dados, salvo quando necessário para cumprimento de obrigações legais.</li>
                  <li><strong>Direito à portabilidade (art. 20.º RGPD):</strong> receber os seus dados num formato estruturado e de leitura automática.</li>
                  <li><strong>Direito de limitação (art. 18.º RGPD):</strong> solicitar a suspensão temporária do tratamento.</li>
                  <li><strong>Direito de oposição (art. 21.º RGPD):</strong> opor-se ao tratamento baseado em interesse legítimo ou para fins de marketing directo.</li>
                  <li><strong>Direito de retirar o consentimento:</strong> sem prejuízo da licitude do tratamento anterior à retirada.</li>
                  <li><strong>Direito de não sujeição a decisões automatizadas (art. 22.º RGPD).</strong></li>
                </ul>
                <p>Para exercer qualquer um destes direitos, envie um pedido para <a href="mailto:privacidade@pieta.care" style={{ color: '#2A6049' }}>privacidade@pieta.care</a>. Responderemos no prazo de 30 dias. Em caso de reclamação, pode contactar:</p>
                <ul style={ul}>
                  <li><strong>Portugal - CNPD:</strong> <a href="https://www.cnpd.pt" style={{ color: '#2A6049' }} target="_blank" rel="noopener noreferrer">www.cnpd.pt</a></li>
                  <li><strong>Espanha - AEPD:</strong> <a href="https://www.aepd.es" style={{ color: '#2A6049' }} target="_blank" rel="noopener noreferrer">www.aepd.es</a></li>
                </ul>
              </Section>

              <Section id="s8" title="8. Segurança dos dados">
                <p>Implementamos medidas técnicas e organizativas adequadas para proteger os dados pessoais, incluindo:</p>
                <ul style={ul}>
                  <li>Comunicações cifradas com TLS 1.2/1.3 (HTTPS)</li>
                  <li>Palavras-passe armazenadas com hashing seguro (bcrypt)</li>
                  <li>Autenticação por token com expiração configurável</li>
                  <li>Acesso aos dados restrito aos colaboradores com necessidade de conhecimento</li>
                  <li>Backups regulares com retenção controlada</li>
                </ul>
                <p>Em caso de violação de dados que constitua risco para os titulares, notificaremos a autoridade supervisora competente no prazo de 72 horas (art. 33.º RGPD) e os titulares afectados sem demora injustificada.</p>
              </Section>

              <Section id="s9" title="9. Cookies">
                <p>O pieta.care utiliza apenas cookies estritamente necessários para o funcionamento da plataforma. Não utilizamos cookies de rastreamento ou publicitários de terceiros sem consentimento prévio.</p>
                <div className="legal-table-wrap" style={{ marginTop: 14 }}>
                  <table className="legal-table">
                    <thead>
                      <tr><th>Cookie</th><th>Finalidade</th><th>Duração</th></tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ fontFamily: 'monospace' }}>token</td><td>Autenticação de sessão (HttpOnly, Secure)</td><td style={{ color: '#7A9A8A' }}>Sessão / 7 dias</td></tr>
                      <tr><td style={{ fontFamily: 'monospace' }}>elderly_id</td><td>Perfil activo seleccionado (localStorage)</td><td style={{ color: '#7A9A8A' }}>Persistente</td></tr>
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section id="s10" title="10. Menores">
                <p>O pieta.care não é dirigido a menores de 16 anos. Não recolhemos conscientemente dados pessoais de menores de 16 anos sem o consentimento do titular da responsabilidade parental, nos termos do artigo 8.º do RGPD e do artigo 16.º da Lei n.º 58/2019.</p>
              </Section>

              <Section id="s11" title="11. Alterações a esta política">
                <p>Esta política pode ser actualizada periodicamente para reflectir alterações legais, regulatórias ou de negócio. Em caso de alterações materiais, notificaremos os utilizadores por email com antecedência mínima de 15 dias. A versão actualizada ficará sempre disponível em <a href="https://pieta.care/privacidade" style={{ color: '#2A6049' }}>pieta.care/privacidade</a>.</p>
              </Section>

              <Section id="s12" title="12. Contacto">
                <div style={{ background: '#F8FAF9', border: '1px solid #E8EFE9', borderRadius: 10, padding: '18px 22px' }}>
                  <p>📧 <a href="mailto:privacidade@pieta.care" style={{ color: '#2A6049', fontWeight: 600 }}>privacidade@pieta.care</a></p>
                  <p style={{ marginTop: 6 }}>🌐 <a href="https://pieta.care" style={{ color: '#2A6049' }}>pieta.care</a></p>
                </div>
              </Section>

            </div>

            <div style={{ marginTop: 56, paddingTop: 28, borderTop: '1px solid #E8EFE9', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <Link href="/termos" style={{ fontSize: 14, color: '#2A6049', fontWeight: 600, textDecoration: 'none' }}>Termos de Uso →</Link>
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
const note: React.CSSProperties = { background: 'var(--danger-light)', border: '1px solid #FED7D7', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#744210' }
