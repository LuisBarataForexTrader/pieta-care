import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade — pieta.care',
  description: 'Saiba como o pieta.care recolhe, utiliza e protege os seus dados pessoais e dados de saúde, em conformidade com o RGPD e a legislação portuguesa e espanhola.',
  alternates: { canonical: 'https://pieta.care/privacidade' },
  robots: { index: true, follow: false },
}

const LAST_UPDATED = '6 de maio de 2026'

export default function PrivacidadePage() {
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", background: '#fff', color: '#1A2E25', lineHeight: 1.6 }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #E8EFE9', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 900, fontSize: 18, color: '#2A6049', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          🌿 pieta.care
        </Link>
        <Link href="/" style={{ fontSize: 14, color: '#4A6458', textDecoration: 'none', fontWeight: 500 }}>← Voltar ao início</Link>
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(40px,6vw,80px) 24px' }}>

        <header style={{ marginBottom: 56 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#2A6049', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Documento legal</p>
          <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#1A2E25', marginBottom: 12, lineHeight: 1.1 }}>
            Política de Privacidade
          </h1>
          <p style={{ fontSize: 14, color: '#7A9A8A' }}>Última actualização: {LAST_UPDATED}</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

          {/* Intro */}
          <section>
            <p style={{ fontSize: 16, color: '#4A6458', lineHeight: 1.8, background: '#EAF4EE', border: '1px solid #C8D8D0', borderRadius: 12, padding: '20px 24px' }}>
              O <strong style={{ color: '#2A6049' }}>pieta.care</strong> trata dados pessoais, incluindo dados de saúde (categoria especial nos termos do artigo 9.º do RGPD), com o máximo rigor e em plena conformidade com o <strong>Regulamento (UE) 2016/679 (RGPD)</strong>, a <strong>Lei n.º 58/2019</strong> (lei de execução do RGPD em Portugal), a <strong>Lei Orgánica 3/2018 (LOPDGDD)</strong> (Espanha) e demais legislação aplicável. Esta política explica quem somos, que dados recolhemos, para que fins, e quais os seus direitos como titular dos dados.
            </p>
          </section>

          <Section title="1. Responsável pelo tratamento">
            <p>O responsável pelo tratamento dos seus dados pessoais é:</p>
            <div style={{ background: '#F8FAF9', border: '1px solid #E8EFE9', borderRadius: 10, padding: '20px 24px', margin: '16px 0', fontSize: 15 }}>
              <p><strong>FLOW 88 — Gestão de Ativos, Lda.</strong></p>
              <p style={{ marginTop: 8 }}>Email de contacto: <a href="mailto:privacidade@pieta.care" style={{ color: '#2A6049' }}>privacidade@pieta.care</a></p>
              <p>Website: <a href="https://pieta.care" style={{ color: '#2A6049' }}>https://pieta.care</a></p>
            </div>
            <p>Dado o volume e a natureza sensível dos dados tratados (dados de saúde), recomendamos que qualquer questão relacionada com privacidade seja dirigida ao endereço de email acima indicado.</p>
          </Section>

          <Section title="2. Dados pessoais recolhidos">
            <p>Consoante o uso que fizer da plataforma, poderemos recolher as seguintes categorias de dados:</p>

            <SubTitle>2.1 Dados de identificação e conta</SubTitle>
            <ul style={ulStyle}>
              <li>Nome completo, endereço de email e palavra-passe (cifrada)</li>
              <li>Dados de facturação para subscrição do serviço</li>
              <li>Endereço IP, tipo de dispositivo e browser (dados de acesso)</li>
            </ul>

            <SubTitle>2.2 Dados de saúde (categoria especial — artigo 9.º RGPD)</SubTitle>
            <p>Ao utilizar a plataforma para registar informações sobre um familiar ou utente, poderá introduzir dados de saúde, nomeadamente:</p>
            <ul style={ulStyle}>
              <li>Diagnósticos clínicos, alergias e condições médicas crónicas</li>
              <li>Registos de medicação, doses e horários</li>
              <li>Sinais vitais (tensão arterial, glicemia, temperatura, saturação, peso)</li>
              <li>Registos de incidentes (quedas, eventos adversos, zonas corporais afectadas)</li>
              <li>Vacinas, relatórios médicos e documentos clínicos carregados pelo utilizador</li>
              <li>Notas de turno e observações de bem-estar</li>
            </ul>
            <p style={noteStyle}>⚠️ <strong>Atenção:</strong> O titular destes dados de saúde é o familiar/utente inserido na plataforma. Ao introduzir estes dados, o utilizador declara ter autorização do titular (ou do seu representante legal) para o fazer.</p>

            <SubTitle>2.3 Dados gerados pelo uso da plataforma</SubTitle>
            <ul style={ulStyle}>
              <li>Registos de acesso (logs), datas e horas de actividade</li>
              <li>Preferências de configuração e notificações</li>
            </ul>
          </Section>

          <Section title="3. Finalidades e base jurídica">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F8FAF9', borderBottom: '2px solid #E8EFE9' }}>
                  <th style={thStyle}>Finalidade</th>
                  <th style={thStyle}>Base jurídica (RGPD)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Prestação do serviço pieta.care (gestão de cuidados)', 'Art. 6.º/1/b) — execução de contrato'],
                  ['Tratamento de dados de saúde para fins de cuidados pessoais', 'Art. 9.º/2/c) e /h) — interesses vitais e prestação de cuidados de saúde; consentimento explícito do utilizador'],
                  ['Envio de notificações e alertas configurados', 'Art. 6.º/1/b) — execução de contrato'],
                  ['Facturação e gestão de subscrições', 'Art. 6.º/1/b) e /c) — execução de contrato e obrigação legal'],
                  ['Cumprimento de obrigações legais (fiscais, contabilísticas)', 'Art. 6.º/1/c) — obrigação legal'],
                  ['Segurança e prevenção de fraude', 'Art. 6.º/1/f) — interesse legítimo'],
                  ['Melhoria do serviço (dados anonimizados/agregados)', 'Art. 6.º/1/f) — interesse legítimo'],
                  ['Envio de comunicações comerciais (apenas com consentimento)', 'Art. 6.º/1/a) — consentimento'],
                ].map(([f, b]) => (
                  <tr key={f} style={{ borderBottom: '1px solid #E8EFE9' }}>
                    <td style={tdStyle}>{f}</td>
                    <td style={{ ...tdStyle, color: '#4A6458', fontStyle: 'italic' }}>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="4. Conservação dos dados">
            <p>Os dados são conservados apenas pelo período necessário às finalidades para que foram recolhidos:</p>
            <ul style={ulStyle}>
              <li><strong>Dados de conta activa:</strong> durante toda a vigência da subscrição e por 30 dias após o cancelamento (período de recuperação).</li>
              <li><strong>Dados de saúde:</strong> durante a subscrição activa. Após cancelamento, o utilizador pode exportar os dados antes da eliminação definitiva ao fim de 30 dias.</li>
              <li><strong>Dados de facturação e fiscais:</strong> 10 anos, nos termos do Código Comercial português e da Ley del IVA espanhola.</li>
              <li><strong>Logs de acesso e segurança:</strong> 12 meses, nos termos da Lei n.º 41/2004 e da Ley 34/2002 (LSSI).</li>
              <li><strong>Dados para comunicações comerciais:</strong> até revogação do consentimento.</li>
            </ul>
          </Section>

          <Section title="5. Partilha de dados com terceiros">
            <p>O pieta.care <strong>não vende dados pessoais a terceiros</strong>. Os dados poderão ser partilhados nas seguintes circunstâncias:</p>

            <SubTitle>5.1 Subcontratantes (processadores)</SubTitle>
            <p>Para a prestação do serviço, recorremos a fornecedores que actuam como subcontratantes nos termos do artigo 28.º do RGPD, com garantias contratuais adequadas:</p>
            <ul style={ulStyle}>
              <li><strong>Vercel Inc.</strong> (alojamento do frontend) — Estados Unidos; coberto por Cláusulas Contratuais-Tipo CE</li>
              <li><strong>Hetzner Online GmbH</strong> (alojamento do servidor/API) — Alemanha, UE</li>
              <li><strong>Resend Inc.</strong> (envio de emails transaccionais) — Estados Unidos; coberto por Cláusulas Contratuais-Tipo CE</li>
              <li><strong>Stripe Inc.</strong> (processamento de pagamentos) — Estados Unidos; certificado PCI-DSS nível 1; coberto por Cláusulas Contratuais-Tipo CE</li>
            </ul>

            <SubTitle>5.2 Autoridades públicas</SubTitle>
            <p>Poderemos divulgar dados a autoridades públicas quando legalmente obrigados, nomeadamente mediante ordem judicial, intimação ou obrigação regulatória.</p>

            <SubTitle>5.3 Outros utilizadores da mesma conta</SubTitle>
            <p>Ao convidar outros membros da família ou cuidadores para a sua conta, esses utilizadores terão acesso aos dados do perfil partilhado. É da responsabilidade do titular da conta gerir as permissões de acesso.</p>
          </Section>

          <Section title="6. Transferências internacionais">
            <p>Alguns dos nossos subcontratantes estão localizados fora do Espaço Económico Europeu (EEE). Nestes casos, asseguramos a existência de garantias adequadas, nomeadamente:</p>
            <ul style={ulStyle}>
              <li>Cláusulas Contratuais-Tipo aprovadas pela Comissão Europeia (Decisão 2021/914/UE)</li>
              <li>Certificações reconhecidas pelo RGPD (ex.: EU-US Data Privacy Framework, onde aplicável)</li>
            </ul>
            <p>Pode solicitar informação sobre os mecanismos específicos através de <a href="mailto:privacidade@pieta.care" style={{ color: '#2A6049' }}>privacidade@pieta.care</a>.</p>
          </Section>

          <Section title="7. Direitos dos titulares">
            <p>Enquanto titular dos dados, assiste-lhe os seguintes direitos, exercíveis a qualquer momento:</p>
            <ul style={ulStyle}>
              <li><strong>Direito de acesso (art. 15.º RGPD):</strong> saber quais os dados que tratamos sobre si.</li>
              <li><strong>Direito de rectificação (art. 16.º RGPD):</strong> corrigir dados inexactos ou incompletos.</li>
              <li><strong>Direito ao apagamento (art. 17.º RGPD):</strong> solicitar a eliminação dos seus dados, salvo quando o tratamento seja necessário para cumprimento de obrigações legais.</li>
              <li><strong>Direito à portabilidade (art. 20.º RGPD):</strong> receber os seus dados num formato estruturado e de leitura automática.</li>
              <li><strong>Direito de limitação (art. 18.º RGPD):</strong> solicitar a suspensão temporária do tratamento.</li>
              <li><strong>Direito de oposição (art. 21.º RGPD):</strong> opor-se ao tratamento baseado em interesse legítimo ou para fins de marketing directo.</li>
              <li><strong>Direito de retirar o consentimento:</strong> sem prejuízo da licitude do tratamento anterior à retirada.</li>
              <li><strong>Direito de não sujeição a decisões automatizadas (art. 22.º RGPD).</strong></li>
            </ul>
            <p>Para exercer qualquer um destes direitos, envie um pedido para <a href="mailto:privacidade@pieta.care" style={{ color: '#2A6049' }}>privacidade@pieta.care</a>. Responderemos no prazo de 30 dias. Em caso de reclamação, pode contactar:</p>
            <ul style={ulStyle}>
              <li><strong>Portugal — CNPD:</strong> <a href="https://www.cnpd.pt" style={{ color: '#2A6049' }} target="_blank" rel="noopener noreferrer">www.cnpd.pt</a></li>
              <li><strong>Espanha — AEPD:</strong> <a href="https://www.aepd.es" style={{ color: '#2A6049' }} target="_blank" rel="noopener noreferrer">www.aepd.es</a></li>
            </ul>
          </Section>

          <Section title="8. Segurança dos dados">
            <p>Implementamos medidas técnicas e organizativas adequadas para proteger os dados pessoais contra acesso não autorizado, perda, destruição ou divulgação, incluindo:</p>
            <ul style={ulStyle}>
              <li>Comunicações cifradas com TLS 1.2/1.3 (HTTPS)</li>
              <li>Palavras-passe armazenadas com hashing seguro (bcrypt)</li>
              <li>Autenticação por token com expiração configurável</li>
              <li>Acesso aos dados restrito aos colaboradores com necessidade de conhecimento</li>
              <li>Backups regulares com retenção controlada</li>
            </ul>
            <p>Em caso de violação de dados pessoais que constitua risco para os titulares, notificaremos a autoridade supervisora competente no prazo de 72 horas (art. 33.º RGPD) e os titulares afectados sem demora injustificada.</p>
          </Section>

          <Section title="9. Cookies">
            <p>O pieta.care utiliza cookies estritamente necessários para o funcionamento da plataforma (autenticação via cookie seguro HttpOnly). Não utilizamos cookies de rastreamento ou publicitários de terceiros sem consentimento prévio.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginTop: 16 }}>
              <thead>
                <tr style={{ background: '#F8FAF9', borderBottom: '2px solid #E8EFE9' }}>
                  <th style={thStyle}>Cookie</th>
                  <th style={thStyle}>Finalidade</th>
                  <th style={thStyle}>Duração</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['token', 'Autenticação de sessão (HttpOnly, Secure)', 'Sessão / 7 dias'],
                  ['elderly_id', 'Perfil activo seleccionado (localStorage)', 'Persistente'],
                ].map(([c, f, d]) => (
                  <tr key={c} style={{ borderBottom: '1px solid #E8EFE9' }}>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 13 }}>{c}</td>
                    <td style={tdStyle}>{f}</td>
                    <td style={{ ...tdStyle, color: '#7A9A8A' }}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="10. Menores">
            <p>O pieta.care não é dirigido a menores de 16 anos. Não recolhemos conscientemente dados pessoais de menores de 16 anos sem o consentimento do titular da responsabilidade parental, nos termos do artigo 8.º do RGPD e do artigo 16.º da Lei n.º 58/2019.</p>
          </Section>

          <Section title="11. Alterações a esta política">
            <p>Esta política pode ser actualizada periodicamente para reflectir alterações legais, regulatórias ou de negócio. Em caso de alterações materiais, notificaremos os utilizadores por email com antecedência mínima de 15 dias. A versão actualizada ficará sempre disponível em <a href="https://pieta.care/privacidade" style={{ color: '#2A6049' }}>pieta.care/privacidade</a>.</p>
          </Section>

          <Section title="12. Contacto">
            <p>Para qualquer questão relacionada com esta política ou com o tratamento dos seus dados pessoais:</p>
            <div style={{ background: '#F8FAF9', border: '1px solid #E8EFE9', borderRadius: 10, padding: '20px 24px', marginTop: 12 }}>
              <p>📧 <a href="mailto:privacidade@pieta.care" style={{ color: '#2A6049', fontWeight: 600 }}>privacidade@pieta.care</a></p>
              <p style={{ marginTop: 6 }}>🌐 <a href="https://pieta.care" style={{ color: '#2A6049' }}>pieta.care</a></p>
            </div>
          </Section>

        </div>

        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid #E8EFE9', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/termos" style={{ fontSize: 14, color: '#2A6049', fontWeight: 600, textDecoration: 'none' }}>Termos de Uso →</Link>
          <Link href="/" style={{ fontSize: 14, color: '#7A9A8A', textDecoration: 'none' }}>← Página inicial</Link>
        </div>
      </main>

      <footer style={{ background: '#0D1A13', padding: '28px 32px', textAlign: 'center', marginTop: 0 }}>
        <Link href="/" style={{ fontWeight: 900, fontSize: 16, color: '#fff', textDecoration: 'none' }}>🌿 pieta.care</Link>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>© 2026 pieta.care · Todos os direitos reservados · Feito em Portugal 🇵🇹</p>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: '#1A2E25', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #EAF4EE' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 15, color: '#4A6458', lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A2E25', marginTop: 8 }}>{children}</h3>
}

const ulStyle: React.CSSProperties = { paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }
const noteStyle: React.CSSProperties = { background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#744210' }
const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 13, color: '#4A6458' }
const tdStyle: React.CSSProperties = { padding: '10px 14px', verticalAlign: 'top', fontSize: 14, color: '#1A2E25' }
