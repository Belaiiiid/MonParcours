"""Cloudflare Turnstile verification.

Validates a Turnstile token server-side by calling the Cloudflare
``siteverify`` endpoint.  If ``TURNSTILE_SECRET_KEY`` is not set (local
development), the check is silently skipped so the auth flow remains
functional without a Cloudflare account.

Proxy support
-------------
If outbound HTTPS is routed through a corporate proxy, set the standard
``HTTPS_PROXY`` (or ``https_proxy``) environment variable in ``backend/.env``::

    HTTPS_PROXY=http://proxy.company.com:8080

``httpx`` picks it up automatically — no code change needed.
"""

from __future__ import annotations

import os

import httpx

from app.core.config import settings
from app.core.exceptions import DomainError
from app.core.logger import logger


class CaptchaError(DomainError):
    """The Turnstile token was missing, invalid, or could not be verified."""

    status_code = 400
    code = "CAPTCHA_FAILED"


_SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

# Read proxy from the environment (standard HTTPS_PROXY / https_proxy).
# httpx also honours these automatically when using its default transport,
# but we read it explicitly so we can log a helpful hint if the call fails.
_PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")


def verify_turnstile(token: str) -> None:
    """Verify a Turnstile ``response`` token with Cloudflare.

    Raises :class:`CaptchaError` if the verification fails.  Does nothing
    when ``TURNSTILE_SECRET_KEY`` is unset — development without a
    Cloudflare account should not be blocked.
    """
    secret = settings.turnstile_secret_key
    if not secret:
        logger.info("turnstile verification skipped (TURNSTILE_SECRET_KEY not set)")
        return

    if not token or not token.strip():
        raise CaptchaError("Le jeton captcha est manquant.")

    proxy_kwargs: dict = {"proxy": _PROXY} if _PROXY else {}

    try:
        response = httpx.post(
            _SITEVERIFY_URL,
            data={"secret": secret, "response": token},
            timeout=10,
            **proxy_kwargs,
        )
        result = response.json()
    except Exception as exc:
        hint = (
            " — si vous êtes derrière un proxy, définissez HTTPS_PROXY dans backend/.env"
            if not _PROXY
            else ""
        )
        logger.error("turnstile siteverify call failed", {"error": str(exc), "hint": hint})
        raise CaptchaError(
            "La vérification captcha a échoué. Veuillez réessayer."
        ) from exc

    if not result.get("success"):
        error_codes = result.get("error-codes", [])
        logger.warn("turnstile verification failed", {"error_codes": error_codes})
        raise CaptchaError(
            "La vérification captcha a échoué. Veuillez réessayer."
        )
