import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


def build_reset_email_html(recipient_name: str, reset_url: str) -> str:
    """Build a beautifully styled HTML email following the CIT warm editorial design."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your CIT Account Password</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #F3ECE2;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1E1915;
    }}
    .container {{
      max-width: 580px;
      margin: 32px auto;
      background-color: #FBF8F3;
      border: 1px solid rgba(30, 25, 21, 0.12);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px -2px rgba(30, 25, 21, 0.08);
    }}
    .header {{
      background-color: #191513;
      padding: 24px 32px;
      text-align: center;
      border-bottom: 2px solid #A9502B;
    }}
    .header-title {{
      color: #F3ECE2;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin: 8px 0 0 0;
      text-transform: uppercase;
    }}
    .header-sub {{
      color: #A9502B;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin: 4px 0 0 0;
    }}
    .content {{
      padding: 32px;
      line-height: 1.6;
    }}
    .greeting {{
      font-size: 16px;
      font-weight: 600;
      color: #1E1915;
      margin-bottom: 16px;
    }}
    .text {{
      font-size: 14px;
      color: #5B5048;
      margin-bottom: 24px;
    }}
    .button-container {{
      text-align: center;
      margin: 32px 0;
    }}
    .button {{
      display: inline-block;
      padding: 14px 28px;
      background-color: #A9502B;
      color: #F3ECE2 !important;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      border-radius: 9999px;
      box-shadow: 0 2px 8px rgba(169, 80, 43, 0.35);
    }}
    .warning {{
      background-color: rgba(169, 80, 43, 0.08);
      border-left: 3px solid #A9502B;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 12px;
      color: #5B5048;
      margin-bottom: 24px;
    }}
    .footer {{
      padding: 20px 32px;
      background-color: #F3ECE2;
      border-top: 1px solid rgba(30, 25, 21, 0.08);
      font-size: 11px;
      color: #5B5048;
      text-align: center;
    }}
    .raw-link {{
      font-size: 11px;
      color: #A9502B;
      word-break: break-all;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-sub">Official Institutional Notice</div>
      <div class="header-title">Chilika Institute of Technology</div>
    </div>
    <div class="content">
      <div class="greeting">Hello {recipient_name},</div>
      <p class="text">
        We received a request to reset the password for your CIT Campus Scheduling & Venue Management account.
        Click the secure button below to choose a new password:
      </p>
      <div class="button-container">
        <a href="{reset_url}" class="button" target="_blank" rel="noopener noreferrer">Reset My Password</a>
      </div>
      <div class="warning">
        <strong>Security Notice:</strong> This single-use link is valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email — your account remains completely secure.
      </div>
      <p class="text" style="font-size: 12px; margin-bottom: 8px;">
        If the button above does not open, copy and paste this link into your browser:
      </p>
      <div class="raw-link">{reset_url}</div>
    </div>
    <div class="footer">
      Chilika Institute of Technology (CIT) &middot; Campus Scheduling and Venue Management System<br />
      Odisha, India &middot; Automated Security Dispatch &middot; Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>
"""


def build_reset_email_text(recipient_name: str, reset_url: str) -> str:
    """Plain-text alternative email for clients without HTML support."""
    return f"""Chilika Institute of Technology (CIT)
Campus Scheduling & Venue Management Platform

Hello {recipient_name},

We received a request to reset the password for your CIT account.
Please visit the link below within the next 15 minutes to set a new password:

{reset_url}

Security Notice:
- This link is single-use and will expire in 15 minutes.
- If you did not request a password reset, you can safely ignore this email.
- Never share this link with anyone.

Chilika Institute of Technology (CIT)
Automated Security Dispatch - Odisha, India
"""


def send_password_reset_email(
    to_email: str,
    recipient_name: str,
    reset_token: str
) -> Dict[str, Any]:
    """
    Dispatch a password reset email using configured SMTP service, or log
    the reset link safely for development environments if SMTP is unconfigured.
    """
    reset_url = f"{settings.FRONTEND_URL}/?page=reset-password&token={reset_token}"
    
    # 1. Check if SMTP is configured
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Password Reset Request - Chilika Institute of Technology"
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email

            part_text = MIMEText(build_reset_email_text(recipient_name, reset_url), "plain")
            part_html = MIMEText(build_reset_email_html(recipient_name, reset_url), "html")

            msg.attach(part_text)
            msg.attach(part_html)

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10.0) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())

            logger.info("Successfully dispatched password reset email to %s via SMTP (%s)", to_email, settings.SMTP_HOST)
            return {
                "sent": True,
                "method": "smtp",
                "message": "Reset email dispatched successfully."
            }
        except Exception as e:
            logger.error("Failed to deliver reset email via SMTP: %s", str(e))
            # Fall back to development logging if not in strict production
            if settings.APP_ENV != "production":
                logger.warning("[CIT AUTH - DEV FALLBACK] SMTP failed. Reset URL for %s: %s", to_email, reset_url)
            return {
                "sent": False,
                "method": "smtp_error",
                "message": f"SMTP delivery error: {str(e)}"
            }

    # 2. SMTP is not configured
    if settings.APP_ENV != "production":
        # In development mode, log clearly to console so local verification works seamlessly
        logger.info(
            "\n" + "=" * 70 + "\n"
            f"[CIT AUTH - DEV MODE] Password reset email not sent (SMTP not configured).\n"
            f"Recipient: {recipient_name} <{to_email}>\n"
            f"Reset Link: {reset_url}\n"
            f"Valid for: 15 minutes\n"
            + "=" * 70
        )
        return {
            "sent": False,
            "method": "dev_console",
            "message": "Development mode: reset link output to server log (SMTP unconfigured)."
        }
    else:
        # In production mode, do not leak the plain token to logs
        logger.warning(
            "Password reset requested for %s, but SMTP is not configured in production.",
            to_email
        )
        return {
            "sent": False,
            "method": "unconfigured_production",
            "message": "SMTP not configured in production."
        }
