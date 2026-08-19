from __future__ import annotations

from datetime import datetime, timezone

from app.core.config import settings

# Hosted on the frontend's static assets (frontend/public/email-logo.png).
# Deliberately hardcoded to the production domain instead of
# settings.FRONTEND_URL: unlike the action links (verify/reset), which must
# point wherever the backend sending the email is actually configured for
# (localhost in dev, the real site in prod), the logo has no reason to ever
# be anything but the real public site — otherwise every email sent from a
# local/staging backend shows a broken image, since Gmail/Outlook fetch it
# from their own servers and can't reach localhost.
_WEBSITE_URL = "https://www.arcesabinengineering.com"
_LOGO_URL = f"{_WEBSITE_URL}/email-logo.png"
_WEBSITE_DISPLAY = "arcesabinengineering.com"
_CONTACT_EMAIL = settings.SMTP_FROM_EMAIL
_YEAR = datetime.now(timezone.utc).year

_FOOTER_COPY = {
    "es": {
        "help": "¿Tienes dudas? Escríbenos a",
        "visit": "Visita nuestra web:",
        "rights": "Todos los derechos reservados.",
    },
    "en": {
        "help": "Questions? Write to us at",
        "visit": "Visit our website:",
        "rights": "All rights reserved.",
    },
}


def _lang(language: str) -> str:
    """Normalizes to a supported language code, defaulting to Spanish for
    anything unrecognized (unset, legacy accounts, bad data)."""
    return "en" if language == "en" else "es"


def hours_label(hours: int, language: str = "es") -> str:
    """'2 horas' / '1 hora' / '2 hours' / '1 hour' — every expiring-link
    email states its lifetime in whole hours (never minutes), so this is
    the one place that pluralizes it correctly in either language."""
    lang = _lang(language)
    if lang == "en":
        return "1 hour" if hours == 1 else f"{hours} hours"
    return "1 hora" if hours == 1 else f"{hours} horas"


def _render(
    *,
    title: str,
    body: str,
    action_url: str,
    action_label: str,
    footnote: str,
    language: str = "es",
) -> str:
    """Renders the shared premium email shell around per-email content.
    Table-based layout on purpose — Outlook desktop renders email HTML with
    Word's engine, which handles divs/flexbox unreliably but tables
    predictably."""
    copy = _FOOTER_COPY[_lang(language)]
    return f"""\
<div style="background:#020617;padding:40px 16px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="background:#0B1220;border:1px solid rgba(255,255,255,0.08);border-radius:20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:32px 32px 20px;">
              <img src="{_LOGO_URL}" alt="Arce Sabin Engineering" height="34"
                   style="display:block;height:34px;width:auto;border:0;outline:none;
                          color:#F8FAFC;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:rgba(255,255,255,0.08);line-height:1px;font-size:0;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 4px;">
              <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:22px;
                         line-height:1.3;color:#F8FAFC;">{title}</h1>
              <p style="margin:0;font-size:14px;line-height:1.65;color:#CBD5E1;">{body}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="border-radius:999px;background:#38BDF8;">
                    <a href="{action_url}"
                       style="display:inline-block;padding:13px 28px;font-family:-apple-system,'Segoe UI',
                              Roboto,Helvetica,Arial,sans-serif;font-weight:700;font-size:14px;color:#020617;
                              text-decoration:none;border-radius:999px;">
                      {action_label}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#64748B;">
                {footnote}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0;">
              <div style="height:1px;background:rgba(255,255,255,0.08);line-height:1px;font-size:0;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0;font-size:12px;line-height:1.8;color:#94A3B8;">
                {copy['help']}
                <a href="mailto:{_CONTACT_EMAIL}" style="color:#38BDF8;text-decoration:none;">{_CONTACT_EMAIL}</a>
                <br />
                {copy['visit']}
                <a href="{_WEBSITE_URL}" style="color:#38BDF8;text-decoration:none;">{_WEBSITE_DISPLAY}</a>
              </p>
              <p style="margin:12px 0 0;font-size:11px;line-height:1.6;color:#475569;">
                &copy; {_YEAR} Arce Sabin Engineering. {copy['rights']}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>
"""


def password_reset_email(reset_url: str, *, expires_in_hours: int, language: str = "es") -> tuple[str, str]:
    """Returns (html, text) for the "reset your password" email."""
    lang = _lang(language)
    hours = hours_label(expires_in_hours, lang)
    if lang == "en":
        title = "Reset your password"
        body = (
            "We received a request to reset the password for your Arce Sabin Engineering account. "
            f"The link expires in {hours}."
        )
        action_label = "Reset password"
        footnote = (
            "If you didn't request this, you can safely ignore this email — your current password will "
            "keep working as normal."
        )
    else:
        title = "Restablece tu contraseña"
        body = (
            "Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Arce Sabin "
            f"Engineering. El enlace caduca en {hours}."
        )
        action_label = "Restablecer contraseña"
        footnote = (
            "Si no has solicitado esto, puedes ignorar este correo — tu contraseña actual seguirá "
            "funcionando con normalidad."
        )
    html = _render(title=title, body=body, action_url=reset_url, action_label=action_label, footnote=footnote, language=lang)
    text = f"{title}\n\n{body}\n\n{reset_url}\n\n{footnote}"
    return html, text


def email_verification_email(verify_url: str, *, expires_in_hours: int, language: str = "es") -> tuple[str, str]:
    """Returns (html, text) for the "verify your email" email."""
    lang = _lang(language)
    hours = hours_label(expires_in_hours, lang)
    if lang == "en":
        title = "Confirm your email address"
        body = (
            "Thanks for signing up with Arce Sabin Engineering. Confirm your email to fully activate your "
            f"account. The link expires in {hours}."
        )
        action_label = "Confirm email"
        footnote = "If you didn't create this account, you can safely ignore this email."
    else:
        title = "Confirma tu correo electrónico"
        body = (
            "Gracias por registrarte en Arce Sabin Engineering. Confirma tu correo para activar tu cuenta "
            f"por completo. El enlace caduca en {hours}."
        )
        action_label = "Confirmar correo"
        footnote = "Si no has creado esta cuenta, puedes ignorar este correo."
    html = _render(title=title, body=body, action_url=verify_url, action_label=action_label, footnote=footnote, language=lang)
    text = f"{title}\n\n{body}\n\n{verify_url}\n\n{footnote}"
    return html, text


def account_suspended_two_factor_email(login_url: str, *, grace_days: int, language: str = "es") -> tuple[str, str]:
    """Returns (html, text) sent the moment an account is suspended for
    never activating 2FA within the grace period."""
    lang = _lang(language)
    if lang == "en":
        title = "Your account has been deactivated"
        body = (
            f"It has been more than {grace_days} days since you created your Arce Sabin Engineering account "
            "without activating two-factor authentication (2FA), so we've deactivated it for security. Log in "
            "with your email and password as usual — we'll ask you to activate 2FA at that point, and you'll "
            "regain access instantly."
        )
        action_label = "Log in and activate 2FA"
        footnote = "If you believe this is a mistake, reply to this email or contact us."
    else:
        title = "Tu cuenta ha sido desactivada"
        body = (
            f"Han pasado más de {grace_days} días desde que creaste tu cuenta en Arce Sabin Engineering sin "
            "activar la verificación en dos pasos (2FA), así que la hemos desactivado por seguridad. Inicia "
            "sesión con tu email y contraseña como siempre — te pediremos que actives 2FA en ese momento y "
            "recuperarás el acceso al instante."
        )
        action_label = "Iniciar sesión y activar 2FA"
        footnote = "Si crees que esto es un error, responde a este correo o contacta con nosotros."
    html = _render(title=title, body=body, action_url=login_url, action_label=action_label, footnote=footnote, language=lang)
    text = f"{title}\n\n{body}\n\n{login_url}\n\n{footnote}"
    return html, text


def account_suspended_inactivity_email(login_url: str, *, inactivity_days: int, language: str = "es") -> tuple[str, str]:
    """Returns (html, text) sent the moment an account is suspended after
    too long without a login."""
    lang = _lang(language)
    if lang == "en":
        title = "Your account has been deactivated due to inactivity"
        body = (
            f"We haven't detected any access to your Arce Sabin Engineering account in the last {inactivity_days} "
            "days, so we've deactivated it. You can recover access at any time simply by logging in again — it "
            "will reactivate automatically."
        )
        action_label = "Log in and reactivate"
        footnote = "If you don't reactivate the account, it will be permanently deleted after additional time."
    else:
        title = "Tu cuenta ha sido desactivada por inactividad"
        body = (
            f"No hemos detectado accesos a tu cuenta en Arce Sabin Engineering en los últimos {inactivity_days} "
            "días, así que la hemos desactivado. Puedes recuperar el acceso en cualquier momento simplemente "
            "iniciando sesión de nuevo — se reactivará automáticamente."
        )
        action_label = "Iniciar sesión y reactivar"
        footnote = "Si no reactivas la cuenta, se eliminará de forma permanente pasado un tiempo adicional."
    html = _render(title=title, body=body, action_url=login_url, action_label=action_label, footnote=footnote, language=lang)
    text = f"{title}\n\n{body}\n\n{login_url}\n\n{footnote}"
    return html, text


def account_reactivated_email(login_url: str, *, language: str = "es") -> tuple[str, str]:
    """Returns (html, text) sent when a suspended account becomes active
    again (2FA completed, or a fresh login after an inactivity suspension)."""
    lang = _lang(language)
    if lang == "en":
        title = "Your account has been reactivated"
        body = "You have full access to your Arce Sabin Engineering account again. Welcome back!"
        action_label = "Go to my account"
        footnote = "If you don't recognize this activity, contact us immediately."
    else:
        title = "Tu cuenta ha sido reactivada"
        body = "Ya tienes acceso completo de nuevo a tu cuenta en Arce Sabin Engineering. ¡Bienvenido de vuelta!"
        action_label = "Ir a mi cuenta"
        footnote = "Si no reconoces esta actividad, contacta con nosotros de inmediato."
    html = _render(title=title, body=body, action_url=login_url, action_label=action_label, footnote=footnote, language=lang)
    text = f"{title}\n\n{body}\n\n{login_url}\n\n{footnote}"
    return html, text


def account_deleted_inactivity_email(support_email: str, *, suspended_days: int, language: str = "es") -> tuple[str, str]:
    """Returns (html, text) sent right before an account is anonymized —
    must be sent using the real (pre-anonymization) email address."""
    lang = _lang(language)
    if lang == "en":
        title = "Your account has been deleted"
        body = (
            f"Your Arce Sabin Engineering account had been deactivated for more than {suspended_days} days without "
            "being reactivated, so we've permanently deleted it along with your personal data, following our "
            "data retention policy."
        )
        action_label = "Contact support"
        footnote = "If you believe this is a mistake, write to us and we'll look into it."
    else:
        title = "Tu cuenta ha sido eliminada"
        body = (
            f"Tu cuenta en Arce Sabin Engineering llevaba desactivada más de {suspended_days} días sin que la "
            "reactivaras, así que la hemos eliminado de forma permanente junto con tus datos personales, "
            "siguiendo nuestra política de retención de datos."
        )
        action_label = "Contactar con soporte"
        footnote = "Si crees que esto es un error, escríbenos y lo revisamos contigo."
    html = _render(
        title=title, body=body, action_url=f"mailto:{support_email}", action_label=action_label,
        footnote=footnote, language=lang,
    )
    text = f"{title}\n\n{body}\n\nmailto:{support_email}\n\n{footnote}"
    return html, text


# --- Weekly newsletter ----------------------------------------------------
# The one email in this system that's a genuine recurring broadcast rather
# than a one-off transactional notice — see app/core/newsletter.py for the
# Friday-morning sweep that builds and sends it. Reuses the same premium
# shell as _render() but needs a richer body (stats + a content list) and a
# real unsubscribe link, so it gets its own renderer instead of reusing
# _render()'s single-paragraph-plus-button shape.


def _render_newsletter(
    *,
    title: str,
    body_html: str,
    action_url: str,
    action_label: str,
    unsubscribe_url: str,
    language: str = "es",
) -> str:
    lang = _lang(language)
    copy = _FOOTER_COPY[lang]
    unsub_label = "Darse de baja de la newsletter" if lang == "es" else "Unsubscribe from this newsletter"
    return f"""\
<div style="background:#020617;padding:40px 16px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="background:#0B1220;border:1px solid rgba(255,255,255,0.08);border-radius:20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:32px 32px 20px;">
              <img src="{_LOGO_URL}" alt="Arce Sabin Engineering" height="34"
                   style="display:block;height:34px;width:auto;border:0;outline:none;
                          color:#F8FAFC;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:rgba(255,255,255,0.08);line-height:1px;font-size:0;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 4px;">
              <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:22px;
                         line-height:1.3;color:#F8FAFC;">{title}</h1>
              {body_html}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="border-radius:999px;background:#38BDF8;">
                    <a href="{action_url}"
                       style="display:inline-block;padding:13px 28px;font-family:-apple-system,'Segoe UI',
                              Roboto,Helvetica,Arial,sans-serif;font-weight:700;font-size:14px;color:#020617;
                              text-decoration:none;border-radius:999px;">
                      {action_label}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0;">
              <div style="height:1px;background:rgba(255,255,255,0.08);line-height:1px;font-size:0;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0;font-size:12px;line-height:1.8;color:#94A3B8;">
                {copy['help']}
                <a href="mailto:{_CONTACT_EMAIL}" style="color:#38BDF8;text-decoration:none;">{_CONTACT_EMAIL}</a>
                <br />
                {copy['visit']}
                <a href="{_WEBSITE_URL}" style="color:#38BDF8;text-decoration:none;">{_WEBSITE_DISPLAY}</a>
              </p>
              <p style="margin:12px 0 0;font-size:11px;line-height:1.6;color:#475569;">
                &copy; {_YEAR} Arce Sabin Engineering. {copy['rights']}
                &nbsp;&middot;&nbsp;
                <a href="{unsubscribe_url}" style="color:#64748B;text-decoration:underline;">{unsub_label}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>
"""


def _kpi_grid(cells: list[tuple[str, str, str, str, str]]) -> str:
    """Renders a 2-column grid of KPI tiles. `cells` is a list of
    (big_number_html, label, text_color_hex, bg_rgba, border_rgba) — table-based
    (not flexbox/grid) so it survives Outlook desktop's Word rendering
    engine, with explicit rgba() strings (matching the rest of this file's
    convention) rather than hex+alpha shorthand, since 8-digit hex colors
    aren't reliably supported across email clients."""
    rows = []
    for i in range(0, len(cells), 2):
        pair = cells[i : i + 2]
        tds = []
        for number_html, label, text_color, bg, border in pair:
            tds.append(f"""\
            <td width="50%" style="padding:4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="background:{bg};border:1px solid {border};border-radius:12px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;
                                color:{text_color};line-height:1.2;">{number_html}</div>
                    <div style="margin-top:4px;font-size:11px;line-height:1.4;color:#94A3B8;">{label}</div>
                  </td>
                </tr>
              </table>
            </td>""")
        if len(pair) == 1:
            tds.append('<td width="50%" style="padding:4px;">&nbsp;</td>')
        rows.append(f'<tr>{"".join(tds)}</tr>')
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">'
        f'{"".join(rows)}'
        "</table>"
    )


def _content_bar_chart(rows: list[tuple[str, int]], *, heading: str) -> str:
    """Renders one horizontal CSS/table 'bar' per content type — a classic
    email-safe bar chart: an outer 100%-width table with a colored inner
    <td> sized by percentage width, no images or SVG required."""
    if not rows:
        return ""
    max_count = max(count for _label, count in rows)
    bars = []
    for label, count in rows:
        pct = max(round((count / max_count) * 100), 8) if max_count else 8
        bars.append(f"""\
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
          <tr>
            <td style="width:70px;padding-right:10px;font-size:10px;font-weight:700;letter-spacing:0.04em;
                       color:#94A3B8;white-space:nowrap;">{label}</td>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="background:rgba(255,255,255,0.06);border-radius:6px;">
                <tr>
                  <td style="width:{pct}%;background:#38BDF8;border-radius:6px;height:10px;line-height:10px;
                             font-size:0;">&nbsp;</td>
                  <td style="line-height:10px;font-size:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
            <td style="width:22px;padding-left:10px;text-align:right;font-size:11px;color:#CBD5E1;">{count}</td>
          </tr>
        </table>
""")
    return (
        f'<p style="margin:22px 0 10px;font-size:12px;font-weight:700;letter-spacing:0.08em;'
        f'text-transform:uppercase;color:#94A3B8;">{heading}</p>'
        f'{"".join(bars)}'
    )


def newsletter_email(
    *,
    new_users_count: int,
    previous_new_users_count: int,
    total_active_members: int,
    new_content: list[tuple[str, str]],
    content_by_type: list[tuple[str, int]],
    top_item: tuple[str, str, int] | None,
    explore_url: str,
    unsubscribe_url: str,
    language: str = "es",
) -> tuple[str, str]:
    """Returns (html, text) for the Friday-morning weekly digest. `new_content`
    and `content_by_type` use (type_label, ...) pairs already localized and
    ordered by the caller (app/core/newsletter.py); this function only
    renders whatever it's given."""
    lang = _lang(language)
    if lang == "en":
        title = "Your weekly digest"
        intro = "Here's what happened at Arce Sabin Engineering this week:"
        new_users_kpi_label = "new person joined" if new_users_count == 1 else "new people joined"
        members_kpi_label = "active members in the community"
        bar_heading = "New content by type"
        content_heading = "New this week"
        empty_content_note = "No new catalog items or articles this week — check back soon."
        top_item_heading = "Most popular this week"
        top_item_meta = lambda count: f"{count} purchase{'s' if count != 1 else ''} this week"  # noqa: E731
        thanks = (
            "Thank you for being part of this community — every person who joins, learns, or shares here is "
            "what keeps this project growing. We're glad you're here."
        )
        cta_label = "Explore the platform"
        unsub_label = "Unsubscribe"
        vs_last_week = "vs. last week"
        new_word = "new"
    else:
        title = "Tu resumen semanal"
        intro = "Esto es lo que ha pasado esta semana en Arce Sabin Engineering:"
        new_users_kpi_label = "personas nuevas esta semana" if new_users_count != 1 else "persona nueva esta semana"
        members_kpi_label = "miembros activos en la comunidad"
        bar_heading = "Contenido nuevo por tipo"
        content_heading = "Novedades de esta semana"
        empty_content_note = "No se ha añadido contenido nuevo esta semana — vuelve pronto."
        top_item_heading = "Lo más popular esta semana"
        top_item_meta = lambda count: f"{count} compra{'s' if count != 1 else ''} esta semana"  # noqa: E731
        thanks = (
            "Gracias por formar parte de esta comunidad — cada persona que se une, aprende o comparte aquí es "
            "lo que hace que este proyecto siga creciendo. Nos alegra tenerte con nosotros."
        )
        cta_label = "Explorar la plataforma"
        unsub_label = "Darse de baja"
        vs_last_week = "vs. semana anterior"
        new_word = "nuevo"

    # Growth pill next to the "new users" KPI — omitted (not zero, just
    # absent) when there's no prior-week baseline to compare against, so we
    # never show a misleading "+∞%".
    if previous_new_users_count > 0:
        pct = round((new_users_count - previous_new_users_count) / previous_new_users_count * 100)
        arrow = "▲" if pct >= 0 else "▼"
        color = "#34D399" if pct >= 0 else "#F87171"
        growth_html = f'<span style="color:{color};font-weight:700;font-size:11px;"> {arrow} {abs(pct)}% {vs_last_week}</span>'
    elif new_users_count > 0:
        growth_html = f'<span style="color:#34D399;font-weight:700;font-size:11px;"> · {new_word}</span>'
    else:
        growth_html = ""

    kpi_html = _kpi_grid(
        [
            (
                f"{new_users_count}{growth_html}",
                new_users_kpi_label,
                "#38BDF8",
                "rgba(56,189,248,0.08)",
                "rgba(56,189,248,0.18)",
            ),
            (
                str(total_active_members),
                members_kpi_label,
                "#A78BFA",
                "rgba(167,139,250,0.08)",
                "rgba(167,139,250,0.18)",
            ),
        ]
    )

    bar_html = _content_bar_chart(content_by_type, heading=bar_heading)

    if new_content:
        items_html = "".join(
            f'<li style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#CBD5E1;">'
            f'<span style="display:inline-block;min-width:78px;font-size:10px;font-weight:700;'
            f'letter-spacing:0.06em;text-transform:uppercase;color:#38BDF8;">{type_label}</span> {item_title}</li>'
            for type_label, item_title in new_content
        )
        content_html = (
            f'<p style="margin:20px 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;'
            f'text-transform:uppercase;color:#94A3B8;">{content_heading}</p>'
            f'<ul style="margin:0;padding:0;list-style:none;">{items_html}</ul>'
        )
        text_items = "\n".join(f"- [{t}] {n}" for t, n in new_content)
    else:
        content_html = f'<p style="margin:20px 0 0;font-size:13px;color:#64748B;">{empty_content_note}</p>'
        text_items = empty_content_note

    if top_item:
        top_title, top_type_label, top_count = top_item
        top_item_html = f"""\
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
        <tr>
          <td style="padding:14px 16px;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.20);
                     border-radius:12px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
                        color:#34D399;">{top_item_heading}</div>
            <div style="margin-top:6px;font-size:13px;font-weight:600;color:#F8FAFC;">{top_title}</div>
            <div style="margin-top:2px;font-size:11px;color:#94A3B8;">{top_type_label} &middot; {top_item_meta(top_count)}</div>
          </td>
        </tr>
      </table>
"""
        text_top_item = f"\n{top_item_heading}: {top_title} ({top_type_label}, {top_item_meta(top_count)})\n"
    else:
        top_item_html = ""
        text_top_item = ""

    body_html = (
        f'<p style="margin:0;font-size:14px;line-height:1.65;color:#CBD5E1;">{intro}</p>'
        f"{kpi_html}{bar_html}{content_html}{top_item_html}"
        f'<p style="margin:24px 0 0;font-size:14px;line-height:1.65;color:#CBD5E1;">{thanks}</p>'
    )

    html = _render_newsletter(
        title=title, body_html=body_html, action_url=explore_url, action_label=cta_label,
        unsubscribe_url=unsubscribe_url, language=lang,
    )
    bar_text = "\n".join(f"- {label}: {count}" for label, count in content_by_type) if content_by_type else ""
    text = (
        f"{title}\n\n{intro}\n\n"
        f"{new_users_count} {new_users_kpi_label}\n"
        f"{total_active_members} {members_kpi_label}\n\n"
        f"{bar_heading}\n{bar_text}\n\n"
        f"{content_heading}\n{text_items}\n"
        f"{text_top_item}\n{thanks}\n\n"
        f"{explore_url}\n\n{unsub_label}: {unsubscribe_url}"
    )
    return html, text
