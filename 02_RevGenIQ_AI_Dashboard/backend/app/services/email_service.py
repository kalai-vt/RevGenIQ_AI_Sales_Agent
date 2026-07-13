"""Minimal SMTP email sender, used for escalation notifications.

No-ops (returns False) when SMTP isn't configured — same graceful-degradation
pattern as other external integrations in this codebase (OpenAI, Qdrant),
rather than raising and breaking the caller.
"""
import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, body: str) -> bool:
    if not settings.SMTP_HOST or not to:
        logger.info("Email not sent (SMTP not configured or no recipient): %s", subject)
        return False

    def _send() -> None:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to
        msg.set_content(body)
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

    try:
        await asyncio.to_thread(_send)
        return True
    except Exception as exc:
        logger.warning("Failed to send email to %s: %s", to, exc)
        return False
