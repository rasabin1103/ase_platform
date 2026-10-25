# Misión 3: El junior (Gestión de equipos QA · rol QA Engineer)

> Contenido jugable: `frontend/src/features/academy/content/courses/gestion-equipos-qa/m03-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-pr/` (pestaña «Revisión», bloqueada hasta que llega el PR)
> Ruta: `/academy/gestion-equipos-qa/m03-junior`
> Tests: `apps/kobalto-pr/prLogic.test.ts`, `engine/c4m03.test.ts` y el recorrido completo de `engine/coursePlaythrough.test.ts`

## Premisa
Año 2. La jugadora sigue de QA Engineer en Tarjetas. Llega Lucía, la primera QA junior de Kobalto. Laura es su responsable; la jugadora, su **mentora técnica**: no es su jefa ni hace su trabajo. Ficha del rol QA Engineer (compartida con la misión 2) y «Guía de mentoría técnica» en la wiki.

## App «Revisión»
Es el primer PR de Lucía, «Tests de extractos mensuales». Tiene 6 bloques y en cada uno se elige un comentario:
- sin comentario;
- bloqueante, con el porqué y una sugerencia (el texto cambia en cada bloque);
- «nit (opcional)»;
- reconocer lo bien hecho;
- «Esto está mal.»;
- lo arreglo yo en su rama.

| Bloque | Qué hay | Comentario adecuado |
|---|---|---|
| h1 | Solo comprueba el 200 | Bloqueante con el porqué |
| h2 | Cuenta de prueba compartida | Bloqueante con el porqué |
| h3 | Espera fija de 3 s | Bloqueante con el porqué |
| h4 | Variable «x» | Nit o nada |
| h5 | Mezcla de idiomas en los escenarios | Nit o nada |
| h6 | Buen caso negativo con código de error | Reconocerlo |

«Enviar la revisión» (20 min) activa estos flags:
- `review.submitted`;
- `review.caught`: h1 señalado de alguna forma;
- `review.kind`: ningún comentario seco ni ningún cambio hecho por ti;
- `review.harsh`, `review.took_over` y `review.nitpicky`: gustos tratados como bloqueantes;
- `review.ok`: todo lo adecuado.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Laura | Leer la ficha y la guía | — |
| 09:30 | Bienvenida a Lucía | Plan concreto: entorno acompañada, tarea real, revisión y permiso para preguntar (`onboard.ok`) | «Léete la wiki»; «mira cómo trabajo» |
| 11:00 | Lucía sube el PR (desbloquea la app: `pr.ready`) | Revisión adecuada (Lucía lo agradece y Laura la valora) | Revisión seca o haciéndolo tú (Lucía se encoge) |
| 13:30 | Iván: carga contra producción. Lucía: «he sido yo» | Agradecer que avise, contener y mirar el sistema (`blameless.ok`) | Culparla; cargar tú con la culpa (`covered`) |
| 15:00 | Postmortem | Que lo cuente ella; config por defecto a staging, credenciales con aprobación y un aviso; ella participa (`guardrail.ok`) | «Ya le he dicho que tenga cuidado»; mantener que fuiste tú |
| 16:00 | Laura: «¿cómo la ves?» | Hechos, fortalezas, necesidades y propuesta; evaluar es suyo (`lead.informed`) | «Yo la sacaría del squad»; «todo bien» |
| 17:00 | Café con Laura | Cierre: `trust.lucia` (revisión amable y error sin culpas) y `preventBugs` | «Iría más rápido haciéndolo yo» |

## Consecuencias (los primeros meses de Lucía)

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-EXTRACTO · importes mal calculados en producción | `review.caught` | alta |
| C-REPITE · otro script contra producción | `guardrail.ok` | crítica |
| C-ESCONDE · Lucía tarda dos días en decir su próximo error | `trust.lucia` | alta |
| C-LENTA · tres meses hasta ser autónoma | `onboard.ok` | media |
| C-A-CIEGAS · Laura evalúa sin tu información | `lead.informed` | media |

## Conceptos
`onboarding`, `code_review_kind`, `blameless`, `mentor_not_boss`, `role_qa_engineer`. Cinco microlecciones de Laura y test de 6 + 6 preguntas.

## Ecos en el curso
- **Misión 6:** Lucía está en tu equipo, insegura tras un error; delegas en ella con apoyo.
- **Misión 7:** Lucía tiene un bajo rendimiento sostenido y te toca la conversación difícil como su Lead.
