import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Termos de Uso — pieta.care',
  description: 'Termos e condições de utilização do pieta.care, plataforma de gestão de cuidados familiares. Rege-se pelo direito português e legislação europeia aplicável.',
  alternates: { canonical: 'https://pieta.care/termos' },
  robots: { index: true, follow: false },
}

const LAST_UPDATED = '6 de maio de 2026'

export default function TermosPage() {
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
            Termos de Uso
          </h1>
          <p style={{ fontSize: 14, color: '#7A9A8A' }}>Última actualização: {LAST_UPDATED}</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

          {/* Intro */}
          <section>
            <p style={{ fontSize: 16, color: '#4A6458', lineHeight: 1.8, background: '#EAF4EE', border: '1px solid #C8D8D0', borderRadius: 12, padding: '20px 24px' }}>
              Estes Termos de Uso regulam o acesso e a utilização da plataforma <strong style={{ color: '#2A6049' }}>pieta.care</strong>, disponível em <strong>pieta.care</strong> e aplicações associadas. Ao criar uma conta ou utilizar o serviço, o utilizador aceita integralmente estes termos. Caso não concorde, deverá abster-se de utilizar a plataforma. Estes termos são redigidos em conformidade com o <strong>Código Civil português</strong>, o <strong>Decreto-Lei n.º 7/2004</strong> (comércio electrónico), a <strong>Lei n.º 24/96</strong> (defesa do consumidor), a <strong>Ley 34/2002 LSSI</strong> (Espanha) e demais legislação aplicável.
            </p>
          </section>

          <Section title="1. Identificação do prestador de serviço">
            <div style={{ background: '#F8FAF9', border: '1px solid #E8EFE9', borderRadius: 10, padding: '20px 24px', fontSize: 15 }}>
              <p><strong>pieta.care, Lda.</strong> <em style={{ color: '#7A9A8A', fontSize: 13 }}>(denominação social a confirmar mediante registo comercial)</em></p>
              <p style={{ marginTop: 8 }}>Email: <a href="mailto:suporte@pieta.care" style={{ color: '#2A6049' }}>suporte@pieta.care</a></p>
              <p>Website: <a href="https://pieta.care" style={{ color: '#2A6049' }}>https://pieta.care</a></p>
            </div>
          </Section>

          <Section title="2. Descrição do serviço">
            <p>O pieta.care é uma plataforma de software como serviço (SaaS) que permite a famílias e cuidadores profissionais gerir informação clínica, medicação, agenda, sinais vitais, incidentes e documentos relacionados com o cuidado de pessoas idosas ou dependentes.</p>
            <p>O pieta.care é uma <strong>ferramenta de apoio à organização e comunicação</strong> entre cuidadores. <strong>Não constitui um serviço de saúde, não substitui aconselhamento médico, diagnóstico clínico ou tratamento profissional de saúde</strong>, não sendo regulado como dispositivo médico nos termos do Regulamento (UE) 2017/745.</p>
          </Section>

          <Section title="3. Registo e conta">
            <p>Para aceder ao serviço, é necessário criar uma conta com email e palavra-passe válidos. O utilizador compromete-se a:</p>
            <ul style={ulStyle}>
              <li>Fornecer informação verdadeira, actual e completa no momento do registo;</li>
              <li>Manter a confidencialidade das suas credenciais de acesso e não as partilhar com terceiros não autorizados;</li>
              <li>Notificar imediatamente o pieta.care em caso de acesso não autorizado à sua conta;</li>
              <li>Ser o único responsável por todas as acções realizadas através da sua conta.</li>
            </ul>
            <p>O pieta.care reserva-se o direito de recusar o registo ou encerrar contas que violem estes termos, sem necessidade de aviso prévio em casos de violação grave.</p>
          </Section>

          <Section title="4. Planos, subscrição e pagamentos">
            <SubTitle>4.1 Planos disponíveis</SubTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginTop: 8 }}>
              <thead>
                <tr style={{ background: '#F8FAF9', borderBottom: '2px solid #E8EFE9' }}>
                  <th style={thStyle}>Plano</th>
                  <th style={thStyle}>Preço</th>
                  <th style={thStyle}>Principais características</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Família', '€35/mês', '1 perfil de familiar, até 3 utilizadores'],
                  ['Família+', '€59/mês', 'Até 3 perfis, utilizadores ilimitados, funcionalidades avançadas'],
                  ['Cuidador Pro', '€19/mês', 'Para profissionais, múltiplos utentes, relatórios'],
                ].map(([p, v, d]) => (
                  <tr key={p} style={{ borderBottom: '1px solid #E8EFE9' }}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{p}</td>
                    <td style={{ ...tdStyle, color: '#2A6049', fontWeight: 700 }}>{v}</td>
                    <td style={{ ...tdStyle, color: '#4A6458' }}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>Os preços indicados incluem IVA à taxa aplicável. O pieta.care reserva-se o direito de alterar os preços com aviso prévio de 30 dias por email.</p>

            <SubTitle>4.2 Facturação e renovação</SubTitle>
            <p>As subscrições são de renovação automática mensal. O valor é cobrado no início de cada período de facturação através do método de pagamento registado. Ao subscrever, o utilizador autoriza o débito automático mensal.</p>

            <SubTitle>4.3 Cancelamento e reembolso</SubTitle>
            <p>O utilizador pode cancelar a subscrição a qualquer momento a partir da sua área de conta. O cancelamento produz efeitos no final do período de facturação em curso, sem direito a reembolso proporcional, salvo nos seguintes casos:</p>
            <ul style={ulStyle}>
              <li><strong>Direito de livre resolução:</strong> nos termos do artigo 10.º do Decreto-Lei n.º 24/2014 (Portugal) e do artigo 102.º da LGDCU (Espanha), o utilizador tem 14 dias após a subscrição inicial para resolver o contrato sem penalização, solicitando reembolso integral por email para <a href="mailto:suporte@pieta.care" style={{ color: '#2A6049' }}>suporte@pieta.care</a>. Este direito não se aplica após utilização efectiva do serviço, nos termos do art. 16.º/a) do DL 24/2014.</li>
              <li><strong>Falha técnica imputável ao pieta.care</strong> que torne o serviço inacessível por período superior a 72 horas consecutivas.</li>
            </ul>

            <SubTitle>4.4 Teste gratuito</SubTitle>
            <p>Quando disponível, o período de teste gratuito não requer dados de pagamento e termina automaticamente sem custos. O utilizador será notificado previamente ao início de qualquer cobrança.</p>
          </Section>

          <Section title="5. Uso aceitável">
            <p>O utilizador compromete-se a usar a plataforma exclusivamente para fins lícitos e em conformidade com estes termos. É expressamente <strong>proibido</strong>:</p>
            <ul style={ulStyle}>
              <li>Introduzir dados falsos, fraudulentos ou que induzam terceiros em erro;</li>
              <li>Utilizar a plataforma para fins comerciais não autorizados ou para revenda do serviço;</li>
              <li>Efectuar engenharia inversa, descompilar ou tentar extrair o código-fonte da plataforma;</li>
              <li>Realizar ataques informáticos, testes de penetração não autorizados ou qualquer acção que comprometa a segurança ou disponibilidade do serviço;</li>
              <li>Introduzir vírus, malware ou código malicioso;</li>
              <li>Contornar mecanismos de autenticação ou aceder a contas de terceiros sem autorização;</li>
              <li>Introduzir dados de saúde de terceiros sem o seu consentimento ou o do respectivo representante legal;</li>
              <li>Utilizar a plataforma para fins de vigilância ou controlo não consentido de terceiros.</li>
            </ul>
            <p>A violação destas proibições pode resultar na suspensão imediata da conta e, se aplicável, em responsabilidade civil e/ou criminal.</p>
          </Section>

          <Section title="6. Dados de saúde — responsabilidades do utilizador">
            <p style={{ background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 8, padding: '14px 18px', fontSize: 14, color: '#744210' }}>
              ⚠️ O pieta.care processa dados de saúde (categoria especial nos termos do RGPD) inseridos pelos próprios utilizadores. O pieta.care actua como <strong>subcontratante</strong> desses dados, sendo o utilizador o <strong>responsável pelo tratamento</strong> dos dados que introduz relativamente a terceiros.
            </p>
            <p>O utilizador declara e garante que:</p>
            <ul style={ulStyle}>
              <li>Obteve o consentimento explícito do titular dos dados de saúde (ou do seu representante legal) antes de os introduzir na plataforma;</li>
              <li>Age em conformidade com o RGPD e legislação nacional aplicável enquanto responsável pelo tratamento dos dados de terceiros inseridos;</li>
              <li>Os dados introduzidos são precisos e actualizados na medida do possível;</li>
              <li>Não utilizará a plataforma como único meio de acompanhamento clínico, reconhecendo que o pieta.care não substitui profissionais de saúde.</li>
            </ul>
          </Section>

          <Section title="7. Disponibilidade do serviço">
            <p>O pieta.care empenha-se em manter a plataforma disponível de forma contínua, visando um nível de disponibilidade de 99,5% mensais (excluindo manutenção programada). Não obstante, não garantimos disponibilidade ininterrupta e não nos responsabilizamos por:</p>
            <ul style={ulStyle}>
              <li>Interrupções resultantes de manutenção programada (comunicada com antecedência mínima de 24 horas);</li>
              <li>Falhas de terceiros fornecedores de infraestrutura (ex.: Hetzner, Vercel);</li>
              <li>Eventos de força maior, perturbações de rede ou actos de terceiros.</li>
            </ul>
          </Section>

          <Section title="8. Propriedade intelectual">
            <p>Todos os direitos de propriedade intelectual sobre a plataforma pieta.care — incluindo software, design, marca, logótipo, textos e conteúdos — são propriedade exclusiva do pieta.care e encontram-se protegidos pela legislação portuguesa e europeia de direitos de autor e propriedade industrial.</p>
            <p>A subscrição confere ao utilizador uma licença de uso pessoal, não exclusiva, intransmissível e revogável, para aceder e utilizar o serviço de acordo com estes termos. Nenhuma disposição destes termos transfere direitos de propriedade intelectual para o utilizador.</p>
            <p>Os dados introduzidos pelo utilizador na plataforma permanecem propriedade do utilizador. O pieta.care não reivindica qualquer direito de propriedade sobre os dados dos seus utilizadores.</p>
          </Section>

          <Section title="9. Limitação de responsabilidade">
            <p>Na máxima extensão permitida pela lei aplicável, o pieta.care não é responsável por:</p>
            <ul style={ulStyle}>
              <li>Danos indirectos, incidentais, especiais ou consequentes decorrentes do uso ou impossibilidade de uso do serviço;</li>
              <li>Erros médicos ou decisões clínicas tomadas com base em informação registada na plataforma, dado que o pieta.care não substitui aconselhamento médico profissional;</li>
              <li>Perda de dados resultante de acção ou omissão do utilizador;</li>
              <li>Acesso não autorizado por terceiros resultante de negligência do utilizador na guarda das suas credenciais.</li>
            </ul>
            <p>Em qualquer caso, a responsabilidade total do pieta.care perante o utilizador não excederá o valor pago nos 3 meses anteriores ao evento que originou o dano.</p>
            <p>Nada nestes termos exclui ou limita a responsabilidade do pieta.care por morte ou lesão corporal causada por negligência, fraude ou qualquer responsabilidade que não possa ser legalmente excluída.</p>
          </Section>

          <Section title="10. Suspensão e rescisão">
            <SubTitle>10.1 Rescisão pelo utilizador</SubTitle>
            <p>O utilizador pode encerrar a sua conta a qualquer momento através das definições da conta ou por email para <a href="mailto:suporte@pieta.care" style={{ color: '#2A6049' }}>suporte@pieta.care</a>. Após o encerramento, os dados ficam disponíveis para exportação durante 30 dias, após os quais são eliminados definitivamente.</p>

            <SubTitle>10.2 Suspensão ou rescisão pelo pieta.care</SubTitle>
            <p>O pieta.care pode suspender ou encerrar o acesso de um utilizador, com ou sem aviso prévio, nos seguintes casos:</p>
            <ul style={ulStyle}>
              <li>Violação destes termos de uso;</li>
              <li>Falta de pagamento após aviso;</li>
              <li>Actividade fraudulenta, ilegal ou que coloque em risco outros utilizadores ou a plataforma;</li>
              <li>Determinação por autoridade competente.</li>
            </ul>
            <p>Em caso de encerramento por incumprimento, o pieta.care não é obrigado a reembolsar valores pagos.</p>
          </Section>

          <Section title="11. Alterações ao serviço e aos termos">
            <p>O pieta.care pode modificar, suspender ou descontinuar funcionalidades do serviço a qualquer momento. Em caso de alterações materiais aos presentes Termos, o utilizador será notificado por email com antecedência mínima de 15 dias. A continuação do uso do serviço após essa data constitui aceitação dos novos termos. Caso não concorde com as alterações, poderá rescindir a subscrição sem penalização antes da data de entrada em vigor.</p>
          </Section>

          <Section title="12. Lei aplicável e resolução de litígios">
            <p>Estes termos são regidos pelo <strong>direito português</strong>, sem prejuízo das normas imperativas de defesa do consumidor do país de residência do utilizador.</p>

            <SubTitle>Resolução alternativa de litígios (RAL)</SubTitle>
            <p>Nos termos da Lei n.º 144/2015 e do Regulamento (UE) n.º 524/2013, o utilizador pode recorrer a:</p>
            <ul style={ulStyle}>
              <li><strong>CNIACC</strong> (Centro Nacional de Informação e Arbitragem de Conflitos de Consumo): <a href="https://www.arbitragemdeconsumo.org" style={{ color: '#2A6049' }} target="_blank" rel="noopener noreferrer">www.arbitragemdeconsumo.org</a></li>
              <li><strong>Plataforma ODR da UE:</strong> <a href="https://ec.europa.eu/consumers/odr" style={{ color: '#2A6049' }} target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a></li>
              <li><strong>AECOSAN</strong> (Espanha): <a href="https://www.consumo.gob.es" style={{ color: '#2A6049' }} target="_blank" rel="noopener noreferrer">www.consumo.gob.es</a></li>
            </ul>
            <p>Para litígios não resolvidos por via extrajudicial, é competente o tribunal da comarca de Lisboa, sem prejuízo do foro do domicílio do consumidor quando este for mais favorável ao mesmo.</p>
          </Section>

          <Section title="13. Disposições gerais">
            <ul style={ulStyle}>
              <li><strong>Integralidade:</strong> Estes termos, conjuntamente com a Política de Privacidade, constituem o acordo integral entre o utilizador e o pieta.care.</li>
              <li><strong>Invalidade parcial:</strong> Se qualquer disposição destes termos for considerada inválida ou inexequível, as restantes disposições manter-se-ão em vigor.</li>
              <li><strong>Não renúncia:</strong> O facto de o pieta.care não exigir o cumprimento de qualquer disposição não constitui renúncia ao direito de o fazer no futuro.</li>
              <li><strong>Cessão:</strong> O utilizador não pode ceder os seus direitos e obrigações decorrentes destes termos a terceiros sem consentimento prévio escrito do pieta.care. O pieta.care pode ceder os seus direitos a qualquer entidade que adquira o serviço, sem prejuízo dos direitos do utilizador.</li>
            </ul>
          </Section>

          <Section title="14. Contacto">
            <p>Para questões sobre estes Termos de Uso:</p>
            <div style={{ background: '#F8FAF9', border: '1px solid #E8EFE9', borderRadius: 10, padding: '20px 24px', marginTop: 12 }}>
              <p>📧 <a href="mailto:suporte@pieta.care" style={{ color: '#2A6049', fontWeight: 600 }}>suporte@pieta.care</a></p>
              <p style={{ marginTop: 6 }}>🌐 <a href="https://pieta.care" style={{ color: '#2A6049' }}>pieta.care</a></p>
            </div>
          </Section>

        </div>

        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid #E8EFE9', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/privacidade" style={{ fontSize: 14, color: '#2A6049', fontWeight: 600, textDecoration: 'none' }}>Política de Privacidade →</Link>
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
const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 13, color: '#4A6458' }
const tdStyle: React.CSSProperties = { padding: '10px 14px', verticalAlign: 'top', fontSize: 14, color: '#1A2E25' }
