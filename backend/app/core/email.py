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
    logger.warning("No email provider configured — recipient: %s", to)
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
          <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.4px;">pieta.care</div>
          <div style="color:#a8c9bc;font-size:13px;margin-top:4px;">Cuidar com confiança</div>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;">
          <p style="font-size:16px;margin:0 0 18px;line-height:1.7;">Olá,</p>
          <p style="font-size:16px;margin:0 0 18px;line-height:1.7;">
            <strong>{inviter_name}</strong> convidou-te para acompanhar os cuidados de
            <strong>{elderly_name}</strong>{rel} na <strong>pieta.care</strong>.
          </p>
          <p style="font-size:14px;margin:0 0 30px;line-height:1.7;color:#4a7060;">
            A pieta.care é uma plataforma segura de gestão de cuidados para idosos —
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
            Se não reconheces este pedido, podes ignorar este email com segurança. O link expira em 7 dias.
          </p>
          <hr style="border:none;border-top:1px solid #e6eeea;margin:0 0 20px;">
          <p style="font-size:12px;color:#b0c4b8;margin:0;text-align:center;">
            © pieta.care &nbsp;·&nbsp;
            <a href="https://pieta.care" style="color:#2A6049;text-decoration:none;">pieta.care</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""
