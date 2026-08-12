from __future__ import annotations

_WRAPPER = """\
<div style="background:#020617;padding:40px 16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#0b1220;border:1px solid rgba(255,255,255,0.08);
              border-radius:20px;padding:32px;color:#e2e8f0;">
    <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">
      Arce Sabin Engineering
    </div>
    <h1 style="font-size:20px;margin:16px 0 8px;color:#f8fafc;">{title}</h1>
    <p style="font-size:14px;line-height:1.6;color:#cbd5e1;">{body}</p>
    <a href="{action_url}"
       style="display:inline-block;margin-top:20px;padding:12px 22px;background:#f8fafc;color:#020617;
              font-weight:600;font-size:14px;text-decoration:none;border-radius:10px;">
      {action_label}
    </a>
    <p style="font-size:12px;line-height:1.6;color:#64748b;margin-top:24px;">
      {footnote}
    </p>
  </div>
</div>
"""


def password_reset_email(reset_url: str, *, expires_in_minutes: int) -> tuple[str, str]:
    """Returns (html, text) for the "reset your password" email."""
    html = _WRAPPER.format(
        title="Restablece tu contraseña",
        body=(
            "Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Arce Sabin "
            f"Engineering. El enlace caduca en {expires_in_minutes} minutos."
        ),
        action_url=reset_url,
        action_label="Restablecer contraseña",
        footnote=(
            "Si no has solicitado esto, puedes ignorar este correo — tu contraseña actual seguirá "
            "funcionando con normalidad."
        ),
    )
    text = (
        "Restablece tu contraseña\n\n"
        "Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Arce Sabin "
        f"Engineering. El enlace caduca en {expires_in_minutes} minutos.\n\n"
        f"{reset_url}\n\n"
        "Si no has solicitado esto, puedes ignorar este correo."
    )
    return html, text


# The account-lifecycle emails below are triggered from a background sweep
# with no request/session context (so no Accept-Language header, and the
# platform has no per-user language preference stored server-side) — every
# one of them ships both Spanish and English so the recipient understands it
# either way, instead of guessing a single language.
_EN_PARAGRAPH = (
    '</p><p style="font-size:13px;line-height:1.6;color:#94a3b8;font-style:italic;margin-top:12px;">{en_body}'
)


def account_suspended_two_factor_email(login_url: str, *, grace_days: int) -> tuple[str, str]:
    """Returns (html, text) sent the moment an account is suspended for
    never activating 2FA within the grace period."""
    es_body = (
        f"Han pasado más de {grace_days} días desde que creaste tu cuenta en Arce Sabin Engineering sin "
        "activar la verificación en dos pasos (2FA), así que la hemos desactivado por seguridad. Inicia "
        "sesión con tu email y contraseña como siempre — te pediremos que actives 2FA en ese momento y "
        "recuperarás el acceso al instante."
    )
    en_body = (
        f"It has been more than {grace_days} days since you created your Arce Sabin Engineering account "
        "without activating two-factor authentication (2FA), so we've deactivated it for security. Log in "
        "with your email and password as usual — we'll ask you to activate 2FA at that point, and you'll "
        "regain access instantly."
    )
    html = _WRAPPER.format(
        title="Tu cuenta ha sido desactivada / Your account has been deactivated",
        body=es_body + _EN_PARAGRAPH.format(en_body=en_body),
        action_url=login_url,
        action_label="Iniciar sesión y activar 2FA / Log in and activate 2FA",
        footnote="Si crees que esto es un error, responde a este correo o contacta con nosotros. / "
        "If you believe this is a mistake, reply to this email or contact us.",
    )
    text = (
        "Tu cuenta ha sido desactivada / Your account has been deactivated\n\n"
        f"{es_body}\n\n"
        f"{en_body}\n\n"
        f"{login_url}\n\n"
        "Si crees que esto es un error, responde a este correo o contacta con nosotros.\n"
        "If you believe this is a mistake, reply to this email or contact us."
    )
    return html, text


def account_suspended_inactivity_email(login_url: str, *, inactivity_days: int) -> tuple[str, str]:
    """Returns (html, text) sent the moment an account is suspended after
    too long without a login."""
    es_body = (
        f"No hemos detectado accesos a tu cuenta en Arce Sabin Engineering en los últimos {inactivity_days} "
        "días, así que la hemos desactivado. Puedes recuperar el acceso en cualquier momento simplemente "
        "iniciando sesión de nuevo — se reactivará automáticamente."
    )
    en_body = (
        f"We haven't detected any access to your Arce Sabin Engineering account in the last {inactivity_days} "
        "days, so we've deactivated it. You can recover access at any time simply by logging in again — it "
        "will reactivate automatically."
    )
    html = _WRAPPER.format(
        title="Tu cuenta ha sido desactivada por inactividad / Your account has been deactivated due to inactivity",
        body=es_body + _EN_PARAGRAPH.format(en_body=en_body),
        action_url=login_url,
        action_label="Iniciar sesión y reactivar / Log in and reactivate",
        footnote="Si no reactivas la cuenta, se eliminará de forma permanente pasado un tiempo adicional. / "
        "If you don't reactivate the account, it will be permanently deleted after additional time.",
    )
    text = (
        "Tu cuenta ha sido desactivada por inactividad / Your account has been deactivated due to inactivity\n\n"
        f"{es_body}\n\n"
        f"{en_body}\n\n"
        f"{login_url}\n\n"
        "Si no reactivas la cuenta, se eliminará de forma permanente pasado un tiempo adicional.\n"
        "If you don't reactivate the account, it will be permanently deleted after additional time."
    )
    return html, text


def account_reactivated_email(login_url: str) -> tuple[str, str]:
    """Returns (html, text) sent when a suspended account becomes active
    again (2FA completed, or a fresh login after an inactivity suspension)."""
    es_body = "Ya tienes acceso completo de nuevo a tu cuenta en Arce Sabin Engineering. ¡Bienvenido de vuelta!"
    en_body = "You have full access to your Arce Sabin Engineering account again. Welcome back!"
    html = _WRAPPER.format(
        title="Tu cuenta ha sido reactivada / Your account has been reactivated",
        body=es_body + _EN_PARAGRAPH.format(en_body=en_body),
        action_url=login_url,
        action_label="Ir a mi cuenta / Go to my account",
        footnote="Si no reconoces esta actividad, contacta con nosotros de inmediato. / "
        "If you don't recognize this activity, contact us immediately.",
    )
    text = (
        "Tu cuenta ha sido reactivada / Your account has been reactivated\n\n"
        f"{es_body}\n\n"
        f"{en_body}\n\n"
        f"{login_url}\n\n"
        "Si no reconoces esta actividad, contacta con nosotros de inmediato.\n"
        "If you don't recognize this activity, contact us immediately."
    )
    return html, text


def account_deleted_inactivity_email(support_email: str, *, suspended_days: int) -> tuple[str, str]:
    """Returns (html, text) sent right before an account is anonymized —
    must be sent using the real (pre-anonymization) email address."""
    es_body = (
        f"Tu cuenta en Arce Sabin Engineering llevaba desactivada más de {suspended_days} días sin que la "
        "reactivaras, así que la hemos eliminado de forma permanente junto con tus datos personales, "
        "siguiendo nuestra política de retención de datos."
    )
    en_body = (
        f"Your Arce Sabin Engineering account had been deactivated for more than {suspended_days} days without "
        "being reactivated, so we've permanently deleted it along with your personal data, following our "
        "data retention policy."
    )
    html = _WRAPPER.format(
        title="Tu cuenta ha sido eliminada / Your account has been deleted",
        body=es_body + _EN_PARAGRAPH.format(en_body=en_body),
        action_url=f"mailto:{support_email}",
        action_label="Contactar con soporte / Contact support",
        footnote="Si crees que esto es un error, escríbenos y lo revisamos contigo. / "
        "If you believe this is a mistake, write to us and we'll look into it.",
    )
    text = (
        "Tu cuenta ha sido eliminada / Your account has been deleted\n\n"
        f"{es_body}\n\n"
        f"{en_body}\n\n"
        f"Si crees que esto es un error, escríbenos a {support_email}.\n"
        f"If you believe this is a mistake, write to us at {support_email}."
    )
    return html, text


def email_verification_email(verify_url: str, *, expires_in_minutes: int) -> tuple[str, str]:
    """Returns (html, text) for the "verify your email" email."""
    html = _WRAPPER.format(
        title="Confirma tu correo electrónico",
        body=(
            "Gracias por registrarte en Arce Sabin Engineering. Confirma tu correo para activar tu cuenta "
            f"por completo. El enlace caduca en {expires_in_minutes} minutos."
        ),
        action_url=verify_url,
        action_label="Confirmar correo",
        footnote="Si no has creado esta cuenta, puedes ignorar este correo.",
    )
    text = (
        "Confirma tu correo electrónico\n\n"
        "Gracias por registrarte en Arce Sabin Engineering. Confirma tu correo para activar tu cuenta "
        f"por completo. El enlace caduca en {expires_in_minutes} minutos.\n\n"
        f"{verify_url}\n\n"
        "Si no has creado esta cuenta, puedes ignorar este correo."
    )
    return html, text
