import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html: str) -> bool:
    if settings.RESEND_API_KEY:
        return _send_resend(to, subject, html)
    if settings.SMTP_HOST and settings.SMTP_USER:
        return _send_smtp(to, subject, html)
    logger.warning("No email provider configured - recipient: %s", to)
    return False


def _send_resend(to: str, subject: str, html: str) -> bool:
    try:
        import resend
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info("Resend: email sent to %s", to)
        return True
    except Exception as exc:
        logger.error("Resend send failed to %s: %s", to, exc)
        return False


def _send_smtp(to: str, subject: str, html: str) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.sendmail(settings.EMAIL_FROM, [to], msg.as_string())
        logger.info("SMTP: email sent to %s", to)
        return True
    except Exception as exc:
        logger.error("SMTP send failed to %s: %s", to, exc)
        return False


def verification_email_html(name: str, verify_url: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f7f5;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2b22;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.09);">
      <tr>
        <td style="background:#2A6049;padding:32px 40px;text-align:center;">
          <div style="font-size:30px;margin-bottom:6px;">🌿</div>
          <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.4px;">pietas.care</div>
          <div style="color:#a8c9bc;font-size:13px;margin-top:4px;">Cuidar com confiança</div>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;">
          <p style="font-size:16px;margin:0 0 16px;line-height:1.7;">Olá, <strong>{name}</strong>,</p>
          <p style="font-size:16px;margin:0 0 16px;line-height:1.7;">
            Obrigado por se registar no <strong>pietas.care</strong>. Para activar a sua conta, confirme o seu endereço de email clicando no botão abaixo.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="{verify_url}"
               style="display:inline-block;background:#2A6049;color:#fff;font-size:16px;font-weight:700;
                      text-decoration:none;padding:16px 44px;border-radius:10px;">
              Confirmar email →
            </a>
          </div>
          <p style="font-size:13px;color:#94a89a;margin:0 0 8px;line-height:1.6;">
            Se não criou uma conta no pietas.care, pode ignorar este email com segurança.
          </p>
          <p style="font-size:13px;color:#94a89a;margin:0 0 24px;line-height:1.6;">
            Este link expira em 24 horas.
          </p>
          <p style="font-size:12px;color:#b0bbb6;word-break:break-all;">
            Ou copie este endereço para o seu browser: {verify_url}
          </p>
          <hr style="border:none;border-top:1px solid #e6eeea;margin:24px 0 16px;">
          <p style="font-size:12px;color:#b0c4b8;margin:0;text-align:center;">
            © pietas.care &nbsp;·&nbsp;
            <a href="https://pietas.care" style="color:#2A6049;text-decoration:none;">pietas.care</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""


def password_reset_html(name: str, reset_url: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f7f5;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2b22;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.09);">
      <tr>
        <td style="background:#2A6049;padding:32px 40px;text-align:center;">
          <div style="font-size:30px;margin-bottom:6px;">🌿</div>
          <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.4px;">pietas.care</div>
          <div style="color:#a8c9bc;font-size:13px;margin-top:4px;">Cuidar com confiança</div>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;">
          <p style="font-size:16px;margin:0 0 16px;line-height:1.7;">Olá, <strong>{name}</strong>,</p>
          <p style="font-size:16px;margin:0 0 16px;line-height:1.7;">
            Recebemos um pedido para repor a password da sua conta no <strong>pietas.care</strong>.
            Clique no botão abaixo para definir uma nova password.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="{reset_url}"
               style="display:inline-block;background:#2A6049;color:#fff;font-size:16px;font-weight:700;
                      text-decoration:none;padding:16px 44px;border-radius:10px;">
              Repor password →
            </a>
          </div>
          <p style="font-size:13px;color:#94a89a;margin:0 0 8px;line-height:1.6;">
            Se não fez este pedido, ignore este email - a sua password não será alterada.
          </p>
          <p style="font-size:13px;color:#94a89a;margin:0 0 24px;line-height:1.6;">
            Por segurança, este link expira em 1 hora.
          </p>
          <p style="font-size:12px;color:#b0bbb6;word-break:break-all;">
            Ou copie este endereço para o seu browser: {reset_url}
          </p>
          <hr style="border:none;border-top:1px solid #e6eeea;margin:24px 0 16px;">
          <p style="font-size:12px;color:#b0c4b8;margin:0;text-align:center;">
            © pietas.care &nbsp;·&nbsp;
            <a href="https://pietas.care" style="color:#2A6049;text-decoration:none;">pietas.care</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""


def deletion_confirmation_html(name: str, deletion_date: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f7f5;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2b22;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.09);">
      <tr>
        <td style="background:#2A6049;padding:32px 40px;text-align:center;">
          <div style="font-size:30px;margin-bottom:6px;">🌿</div>
          <div style="color:#fff;font-size:22px;font-weight:700;">pietas.care</div>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;">
          <p style="font-size:16px;margin:0 0 16px;line-height:1.7;">Olá, <strong>{name}</strong>,</p>
          <p style="font-size:16px;margin:0 0 16px;line-height:1.7;">
            Recebemos o seu pedido de eliminação de conta. Os seus dados estarão disponíveis para exportação até <strong>{deletion_date}</strong>, data em que serão eliminados definitivamente dos nossos sistemas.
          </p>
          <div style="background:#fff5f5;border:1px solid #fed7d7;border-radius:10px;padding:16px 20px;margin:24px 0;">
            <p style="font-size:14px;color:#744210;margin:0;line-height:1.6;">
              Se mudou de ideias ou eliminou a conta por engano, contacte-nos antes de <strong>{deletion_date}</strong> através de
              <a href="mailto:suporte@pietas.care" style="color:#2A6049;">suporte@pietas.care</a>.
            </p>
          </div>
          <p style="font-size:14px;color:#4a7060;margin:0 0 24px;line-height:1.7;">
            Obrigado por ter utilizado o pietas.care.
          </p>
          <hr style="border:none;border-top:1px solid #e6eeea;margin:0 0 16px;">
          <p style="font-size:12px;color:#b0c4b8;margin:0;text-align:center;">
            © pietas.care &nbsp;·&nbsp;
            <a href="https://pietas.care" style="color:#2A6049;text-decoration:none;">pietas.care</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""


def invite_email_html(elderly_name: str, inviter_name: str, invite_link: str, relation: str | None) -> str:
    rel = f" como {relation}" if relation else ""
    return f"""<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f7f5;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2b22;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.09);">
      <tr>
        <td style="background:#2A6049;padding:32px 40px;text-align:center;">
          <div style="font-size:30px;margin-bottom:6px;">🌿</div>
          <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.4px;">pietas.care</div>
          <div style="color:#a8c9bc;font-size:13px;margin-top:4px;">Cuidar com confiança</div>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;">
          <p style="font-size:16px;margin:0 0 18px;line-height:1.7;">Olá,</p>
          <p style="font-size:16px;margin:0 0 18px;line-height:1.7;">
            <strong>{inviter_name}</strong> convidou-o(a) para acompanhar os cuidados de
            <strong>{elderly_name}</strong>{rel} na <strong>pietas.care</strong>.
          </p>
          <p style="font-size:14px;margin:0 0 30px;line-height:1.7;color:#4a7060;">
            A pietas.care é uma plataforma segura de gestão de cuidados para idosos -
            medicação, agenda, saúde e bem-estar, tudo num só lugar.
          </p>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="{invite_link}"
               style="display:inline-block;background:#2A6049;color:#fff;font-size:16px;font-weight:700;
                      text-decoration:none;padding:16px 44px;border-radius:10px;letter-spacing:0.1px;">
              Aceitar convite →
            </a>
          </div>
          <p style="font-size:12px;color:#94a89a;margin:0 0 24px;line-height:1.6;">
            Se não reconhece este pedido, pode ignorar este email com segurança. O link expira em 7 dias.
          </p>
          <hr style="border:none;border-top:1px solid #e6eeea;margin:0 0 20px;">
          <p style="font-size:12px;color:#b0c4b8;margin:0;text-align:center;">
            © pietas.care &nbsp;·&nbsp;
            <a href="https://pietas.care" style="color:#2A6049;text-decoration:none;">pietas.care</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""


def _trial_email_shell(title: str, body_html: str, cta_label: str | None = None, cta_url: str | None = None) -> str:
    cta_block = ""
    if cta_label and cta_url:
        cta_block = f"""
        <div style="text-align:center;margin:32px 0;">
          <a href="{cta_url}"
             style="display:inline-block;background:#2A6049;color:#fff;font-size:16px;font-weight:700;
                    text-decoration:none;padding:15px 36px;border-radius:10px;">
            {cta_label}
          </a>
        </div>"""
    return f"""<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f7f5;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a2b22;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.09);">
      <tr>
        <td style="background:#2A6049;padding:30px 40px;text-align:center;">
          <div style="font-size:30px;margin-bottom:6px;">🌿</div>
          <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.4px;">pietas.care</div>
          <div style="color:#a8c9bc;font-size:13px;margin-top:4px;">Cuidar com confiança</div>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 40px;">
          <h1 style="font-size:21px;font-weight:800;margin:0 0 20px;letter-spacing:-0.4px;">{title}</h1>
          {body_html}
          {cta_block}
          <hr style="border:none;border-top:1px solid #e6eeea;margin:28px 0 14px;">
          <p style="font-size:12px;color:#b0c4b8;margin:0;text-align:center;line-height:1.6;">
            © pietas.care &nbsp;·&nbsp;
            <a href="https://pietas.care" style="color:#2A6049;text-decoration:none;">pietas.care</a>
            &nbsp;·&nbsp;
            <a href="https://pietas.care/conta" style="color:#2A6049;text-decoration:none;">A minha conta</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""


def trial_day2_html(name: str) -> str:
    body = f"""
    <p style="font-size:16px;margin:0 0 14px;line-height:1.7;">Olá <strong>{name}</strong>,</p>
    <p style="font-size:15px;margin:0 0 14px;line-height:1.7;">
      Está a usar o pietas.care há um par de dias - espero que esteja a correr tudo bem.
    </p>
    <p style="font-size:15px;margin:0 0 14px;line-height:1.7;">
      Está actualmente no plano <strong style="color:#2A6049;">Família AI</strong> (o mais completo,
      com assistente IA para informação clínica de medicação) durante os 14 dias de experimentação,
      sem custos.
    </p>
    <p style="font-size:15px;margin:0 0 14px;line-height:1.7;">
      <strong>Precisa de alguma ajuda?</strong> Pode abrir o chat dentro da aplicação e fazer-nos
      qualquer pergunta - respondemos rapidamente.
    </p>
    <p style="font-size:15px;margin:0 0 4px;line-height:1.7;color:#3D5249;">
      Estamos aqui para o ajudar a cuidar melhor de quem ama.
    </p>"""
    return _trial_email_shell(
        title="Tudo a correr bem? 🌿",
        body_html=body,
        cta_label="Abrir chat de suporte",
        cta_url="https://pietas.care/dashboard?support=open",
    )


def trial_day7_html(name: str) -> str:
    body = f"""
    <p style="font-size:16px;margin:0 0 14px;line-height:1.7;">Olá <strong>{name}</strong>,</p>
    <p style="font-size:15px;margin:0 0 14px;line-height:1.7;">
      Já passou uma semana desde que começou a experimentar o pietas.care no plano
      <strong style="color:#2A6049;">Família AI</strong>. Estamos curiosos -
      <strong>como tem sido a experiência?</strong>
    </p>
    <p style="font-size:15px;margin:0 0 14px;line-height:1.7;">
      Há funcionalidades que estão a fazer diferença? Algo que ache que está em falta?
      A sua opinião ajuda-nos a melhorar a aplicação para todas as famílias portuguesas.
    </p>
    <p style="font-size:15px;margin:0 0 14px;line-height:1.7;">
      Faltam ainda 7 dias do seu período gratuito - aproveite para explorar o que ainda
      não testou (relatório médico, dados clínicos, plano de cuidados…).
    </p>"""
    return _trial_email_shell(
        title="Como tem sido a experiência?",
        body_html=body,
        cta_label="Deixar avaliação",
        cta_url="https://pietas.care/avaliacao?source=trial_day7",
    )


def trial_day13_html(name: str) -> str:
    body = f"""
    <p style="font-size:16px;margin:0 0 14px;line-height:1.7;">Olá <strong>{name}</strong>,</p>
    <p style="font-size:15px;margin:0 0 14px;line-height:1.7;">
      <strong>Amanhã termina o seu período gratuito de 14 dias</strong> no pietas.care.
    </p>
    <p style="font-size:15px;margin:0 0 14px;line-height:1.7;">
      Para <strong>manter o acesso</strong> e <strong>preservar todos os dados</strong> que registou
      (medicação, sinais vitais, notas, documentos…), basta escolher um plano na sua área de cliente.
    </p>
    <div style="background:#F8FAF9;border:1px solid #E2EBE5;border-radius:12px;padding:18px 22px;margin:18px 0;">
      <p style="font-size:13px;font-weight:700;color:#3D5249;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.05em;">Os planos disponíveis</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;color:#3D5249;">
        <tr><td style="padding:5px 0;"><strong>Família</strong> - €35/mês + IVA</td><td align="right">1 perfil · 2 familiares</td></tr>
        <tr><td style="padding:5px 0;"><strong>Família+</strong> - €59/mês + IVA</td><td align="right">2 perfis · 5 familiares</td></tr>
        <tr><td style="padding:5px 0;"><strong>Família AI</strong> - €88/mês + IVA</td><td align="right">4 perfis · ilimitados · IA</td></tr>
      </table>
    </div>
    <p style="font-size:15px;margin:0 0 6px;line-height:1.7;">
      Se preferir não continuar, pode simplesmente não fazer nada - não cobramos nada e os
      seus dados ficam disponíveis para exportação durante 30 dias.
    </p>"""
    return _trial_email_shell(
        title="Faltam 24 horas no seu trial",
        body_html=body,
        cta_label="Subscrever na minha área",
        cta_url="https://pietas.care/conta",
    )
