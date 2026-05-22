from __future__ import annotations

from html import escape


def verification_email_subject() -> str:
    return "Verifica tu email en Arce Sabin Engineering"


def verification_email_html(*, verify_url: str, expire_minutes: int) -> str:
    safe_url = escape(verify_url)
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Verifica tu email</title>
</head>
<body style="margin:0;padding:0;background:#0b1220;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#e8eef7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1220;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:linear-gradient(145deg,#121c2e,#0f172a);border:1px solid rgba(148,163,184,0.2);border-radius:20px;padding:32px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#67e8f9;">Arce Sabin Engineering</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#f8fafc;">Verifica tu correo electrónico</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#cbd5e1;">
                Confirma que eres el titular de esta dirección para activar tu cuenta y recibir notificaciones de seguridad.
              </p>
              <p style="margin:0 0 28px;text-align:center;">
                <a href="{safe_url}" style="display:inline-block;padding:14px 28px;background:linear-gradient(90deg,#06b6d4,#8b5cf6);color:#0b1220;font-weight:600;text-decoration:none;border-radius:12px;">
                  Verificar email
                </a>
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#94a3b8;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 24px;font-size:12px;line-height:1.5;word-break:break-all;">
                <a href="{safe_url}" style="color:#67e8f9;">{safe_url}</a>
              </p>
              <p style="margin:0 0 8px;font-size:12px;color:#64748b;">
                El enlace caduca en {expire_minutes} minutos.
              </p>
              <p style="margin:0;font-size:12px;color:#64748b;">
                Si no solicitaste este correo, ignóralo. Tu contraseña no cambiará.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
