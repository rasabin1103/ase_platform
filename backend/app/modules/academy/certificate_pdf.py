"""PDF del certificado de finalización de ASE Academy (A4 apaisado).

Se genera en el servidor con fpdf2 y fuentes DejaVu incluidas en
app/assets/fonts (cubren cualquier nombre con tildes u otros alfabetos
latinos). Mismo contenido que la página pública /academy/certificado/:code.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from fpdf import FPDF

from app.modules.academy.exam_schemas import CertificateRead

_FONTS = Path(__file__).resolve().parents[2] / "assets" / "fonts"

_MONTHS = {
    "es": ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    "en": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
}

_COPY = {
    "es": {
        "kicker": "CERTIFICADO DE FINALIZACIÓN",
        "certifies": "Se certifica que",
        "body": "ha completado todas las misiones del curso «{course}» y ha aprobado su examen final con {score} de {total} respuestas correctas.",
        "issued": "Emitido el {date}",
        "code": "Código {code}",
        "verify": "Verificable en {url}",
        "disclaimer": "Certificado de ASE Academy. No es una certificación oficial de ISTQB®; ISTQB® es una marca registrada del International Software Testing Qualifications Board.",
    },
    "en": {
        "kicker": "CERTIFICATE OF COMPLETION",
        "certifies": "This certifies that",
        "body": "has completed every mission of the course “{course}” and passed its final exam with {score} out of {total} correct answers.",
        "issued": "Issued on {date}",
        "code": "Code {code}",
        "verify": "Verifiable at {url}",
        "disclaimer": "ASE Academy certificate. This is not an official ISTQB® certification; ISTQB® is a registered trademark of the International Software Testing Qualifications Board.",
    },
}

# Cursos que no preparan ningún examen de ISTQB®: su propio aviso en el certificado.
_NOT_OFFICIAL = {
    "es": "Certificado de finalización de ASE Academy. No es una certificación oficial de ninguna entidad.",
    "en": "ASE Academy certificate of completion. It is not an official certification from any body.",
}
_DISCLAIMERS = {
    "gestion-equipos-qa": _NOT_OFFICIAL,
    "sql-iniciacion": _NOT_OFFICIAL,
    "sql-intermedio": _NOT_OFFICIAL,
}

_INK = (15, 23, 42)
_MUTED = (100, 116, 139)
_BRAND = (76, 125, 255)


def _date(value: datetime, lang: str) -> str:
    month = _MONTHS[lang][value.month - 1]
    return f"{value.day} de {month} de {value.year}" if lang == "es" else f"{month} {value.day}, {value.year}"


def verify_url(base_url: str, code: str) -> str:
    return f"{base_url.rstrip('/')}/academy/certificado/{code}"


def render_certificate_pdf(cert: CertificateRead, *, lang: str, base_url: str) -> bytes:
    lang = "en" if lang == "en" else "es"
    t = _COPY[lang]
    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.set_auto_page_break(False)
    pdf.set_title(f"{t['kicker'].title()} · {cert.holderName}")
    pdf.set_author("ASE Academy · Arce Sabín Ingeniería")
    pdf.add_font("Sans", "", str(_FONTS / "DejaVuSans.ttf"))
    pdf.add_font("Sans", "B", str(_FONTS / "DejaVuSans-Bold.ttf"))
    pdf.add_font("Serif", "B", str(_FONTS / "DejaVuSerif-Bold.ttf"))
    pdf.add_page()
    w, h = pdf.w, pdf.h  # 297 × 210

    # Marco y franja de marca.
    pdf.set_fill_color(*_BRAND)
    pdf.rect(0, 0, w, 4, style="F")
    pdf.set_draw_color(*_INK)
    pdf.set_line_width(0.6)
    pdf.rect(14, 14, w - 28, h - 28)
    pdf.set_line_width(0.2)
    pdf.rect(16.5, 16.5, w - 33, h - 33)

    # Cabecera.
    pdf.set_text_color(*_MUTED)
    pdf.set_font("Sans", "B", 8)
    pdf.set_char_spacing(2)
    pdf.set_xy(30, 28)
    pdf.cell(0, 5, "ARCE SABÍN INGENIERÍA")
    pdf.set_char_spacing(0)
    pdf.set_text_color(*_INK)
    pdf.set_font("Serif", "B", 15)
    pdf.set_xy(30, 33)
    pdf.cell(0, 8, "ASE Academy")
    # Sello.
    pdf.set_draw_color(*_BRAND)
    pdf.set_line_width(0.8)
    pdf.circle(x=w - 42, y=37, radius=7)
    pdf.set_text_color(*_BRAND)
    pdf.set_font("Sans", "B", 9)
    pdf.set_xy(w - 49, 34.5)
    pdf.cell(14, 5, "ASE", align="C")

    # Cuerpo centrado.
    pdf.set_text_color(*_MUTED)
    pdf.set_font("Sans", "B", 9)
    pdf.set_char_spacing(2.5)
    pdf.set_xy(20, 70)
    pdf.cell(w - 40, 6, t["kicker"], align="C")
    pdf.set_char_spacing(0)
    pdf.set_font("Sans", "", 11)
    pdf.set_xy(20, 82)
    pdf.cell(w - 40, 6, t["certifies"], align="C")

    pdf.set_text_color(*_INK)
    size = 30 if len(cert.holderName) <= 32 else 22
    pdf.set_font("Serif", "B", size)
    pdf.set_xy(20, 92)
    pdf.cell(w - 40, 16, cert.holderName, align="C")

    pdf.set_draw_color(*_BRAND)
    pdf.set_line_width(0.5)
    pdf.line(w / 2 - 30, 113, w / 2 + 30, 113)

    pdf.set_text_color(51, 65, 85)
    pdf.set_font("Sans", "", 11.5)
    pdf.set_xy(45, 120)
    pdf.multi_cell(
        w - 90,
        6.5,
        t["body"].format(course=cert.courseTitle, score=cert.score, total=cert.total),
        align="C",
    )

    # Pie.
    pdf.set_text_color(*_MUTED)
    pdf.set_font("Sans", "", 8.5)
    pdf.set_xy(30, h - 42)
    pdf.cell(110, 5, t["issued"].format(date=_date(cert.issuedAt, lang)))
    pdf.set_xy(30, h - 37)
    pdf.set_text_color(*_INK)
    pdf.set_font("Sans", "B", 9)
    pdf.cell(110, 5, t["code"].format(code=cert.code))

    pdf.set_text_color(*_MUTED)
    pdf.set_font("Sans", "", 8)
    pdf.set_xy(w - 160, h - 44)
    pdf.multi_cell(130, 4.5, t["verify"].format(url=verify_url(base_url, cert.code)), align="R")
    pdf.set_font("Sans", "", 6.5)
    pdf.set_xy(w - 160, h - 34)
    pdf.multi_cell(130, 3.4, _DISCLAIMERS.get(cert.courseKey, {}).get(lang, t["disclaimer"]), align="R")

    return bytes(pdf.output())
