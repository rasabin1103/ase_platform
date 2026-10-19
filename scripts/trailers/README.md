# Tráilers épicos de ASE Academy

Formato aprobado (oct. 2026) para los vídeos promocionales de los cursos: tráiler de cine de 35–45 s, en **16:9** (web/YouTube) y **9:16** (Reels/Shorts/TikTok), con banda sonora original generada por código.

## Reglas del formato

1. **Nunca mostrar respuestas**: ni preguntas de examen o del diagnóstico, ni soluciones de retos, ni la causa de un incidente, ni títulos o detalle de bugs. Solo planteamiento y tensión.
2. **Estructura** (ver `TL` en `build.py`):
   - Gancho: frases cortas a pantalla completa (2 líneas, la segunda en azul o rojo).
   - Planos de la simulación con recorte cerrado y zoom lento (Ken Burns); los detalles pequeños (reloj, banner de incidente) van como «tira» ampliada sobre fondo oscuro.
   - Escalada: frase en rojo («Y producción no perdona.», «El reloj no espera.»).
   - Montaje rápido (6 planos × 0,42 s) con subida de sonido.
   - «Cada decisión cuenta.» → medio segundo de negro y silencio.
   - Clímax: certificado con destello blanco + golpe grave.
   - Tarjeta de título del curso + CTA «Aprende trabajando. · La primera misión es gratis · arcesabinengineering.com/academy».
3. **Estética**: fondo #04060b, Inter Display Black en mayúsculas, acento #38bdf8 (azul) / #f43f5e (rojo), viñeta, grano ligero, contraste +7 %.
4. **Sonido** (`synth.py`): drone grave + pulso de bajo a 120 BPM, golpe en cada tarjeta, *whoosh* previo, tic-tac en los planos del reloj, *riser* en el montaje, silencio antes del clímax, acorde final. Normalizado a −14 LUFS.
5. Alumna ficticia («Lucía Prueba»); la URL de verificación del certificado se muestra con el dominio de producción.

## Cómo regenerarlos

Requisitos: backend y frontend en local, **base de datos local** (nunca producción), Python con `playwright`, `psycopg`, `numpy`, `scipy`; `ffmpeg`; fuente Inter instalada.

```bash
export TRAILER_EMAIL=...        # usuario de pruebas local con los cursos accesibles
export TRAILER_PASSWORD=...
export TRAILER_DB=postgresql://ase:ase@localhost:5432/ase_mig
python record.py                 # graba los planos a 2x (o: python record.py tf_loans cert_tf)
python build.py testing-fundamentals      # h y v → work/testing-fundamentals-epico-16x9.mp4 / -9x16.mp4
python build.py qa-profesional
python build.py karate-framework
```

- `record.py` necesita que el usuario tenga certificado en cada curso (los planos `cert_*`). Al terminar, reinserta las misiones como terminadas.
- `build.py` cachea cada plano en `work/cache/`; cambiar textos o música es rápido. `--recards` fuerza a regenerar las tarjetas.
- Para web, recomprimir: `ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 21 -maxrate 9M -bufsize 18M -c:a copy -movflags +faststart out.mp4` (~18–21 MB).

## Vídeo de presentación de la plataforma

`python rec_plat.py` graba la web pública sin sesión (portada, /platform, /academy) y `python build.py plataforma` monta el vídeo (~80 s): gancho → logo → seis pilares (Academy, catálogo, empleo con IA, consultoría, equipos y empresas, fidelidad), cada uno con su cabecera numerada y planos o *motion graphics* (`scenes.py`) → montaje → «Para profesionales / equipos / empresas» → «Una sola plataforma» → cierre con CTA. Reutiliza los planos de Academy de `record.py`.

- Las escenas animadas (logo, catálogo, encaje de CV, cifras, fidelidad, rejilla final, cierre) son HTML + CSS en `scenes.py`; el logo sale de `frontend/src/assets/ase-logo.png`.
- El análisis de encaje es un **ejemplo ilustrativo** (lo indica la propia escena); solo sectores, nunca nombres de clientes.
- Para entregar por debajo de 30 MB: `-crf 23 -maxrate 6M -bufsize 12M`.

## Curso nuevo

1. En `record.py`, añade sus planos (misión → app → acciones vistosas que no revelen nada) a `SEGS`.
2. En `build.py`, añade su entrada en `TL` siguiendo la estructura de arriba. Los rectángulos son coordenadas CSS de un viewport 1440×810.
3. Revisa una hoja de contactos: `ffmpeg -i out.mp4 -vf "fps=1.5,scale=384:-1,tile=8x8" -frames:v 1 hoja.png`.
