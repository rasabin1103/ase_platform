"""Comprueba el SMTP configurado en .env.

Uso (desde backend/, con el entorno virtual activo):
    python -m scripts.check_smtp                 # solo conecta y hace login
    python -m scripts.check_smtp tu@correo.com   # además envía un correo de prueba

No imprime contraseñas. El envío usa la misma función que el registro
(app.core.email.send_email), así que si llega, el flujo de verificación
también debería llegar.
"""

from __future__ import annotations

import smtplib
import sys

from app.core.config import settings
from app.core.email import _IPv4OnlySMTP, send_email


def check_login() -> bool:
    print(f"Servidor : {settings.SMTP_HOST}:{settings.SMTP_PORT}  (TLS={settings.SMTP_USE_TLS})")
    print(f"Usuario  : {settings.SMTP_USERNAME}")
    print(f"Remitente: {settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>")
    if not settings.SMTP_HOST:
        print("FALLO: SMTP_HOST no está configurado.")
        return False
    if settings.SMTP_USERNAME and settings.SMTP_FROM_EMAIL.lower() != settings.SMTP_USERNAME.lower():
        print("AVISO: el remitente (SMTP_FROM_EMAIL) no coincide con el usuario SMTP; algunos servidores lo rechazan.")
    try:
        with _IPv4OnlySMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        print("OK: conexión y login correctos.")
        return True
    except smtplib.SMTPAuthenticationError as exc:
        print(f"FALLO de autenticación: {exc.smtp_code} {exc.smtp_error!r}")
    except Exception as exc:  # noqa: BLE001
        print(f"FALLO de conexión: {type(exc).__name__}: {exc}")
    return False


def main() -> int:
    ok = check_login()
    if ok and len(sys.argv) > 1:
        to = sys.argv[1]
        sent = send_email(
            to_email=to,
            subject="Prueba SMTP — Arce Sabin Engineering",
            html_body="<p>Si lees esto, el SMTP de ASE funciona.</p>",
            text_body="Si lees esto, el SMTP de ASE funciona.",
        )
        print(f"Envío a {to}: {'aceptado por el servidor' if sent else 'FALLÓ (mira el log)'}")
        ok = ok and sent
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
