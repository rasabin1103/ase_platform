# Misión 8: Contratar (Gestión de equipos QA · rol QA Manager)

> Contenido jugable: `frontend/src/features/academy/content/courses/gestion-equipos-qa/m08-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-hiring/` (pestaña «Contratación»)
> Ruta: `/academy/gestion-equipos-qa/m08-contratar`
> Tests: `apps/kobalto-hiring/hiringLogic.test.ts`, `engine/c4m08.test.ts` y el recorrido completo de `engine/coursePlaythrough.test.ts`

## Premisa
Año 5. La jugadora es QA Manager de Banca diaria, con tres equipos y sus leads; Sergio y Héctor son ahora QA Leads a su cargo. Tiene tres vacantes aprobadas. El proceso actual tarda siete semanas y el mes pasado se perdieron dos candidatos. Raúl (CTO) manda el CV de Marcos, un antiguo compañero suyo, para «ahorrarse el proceso».

En la wiki: la ficha del rol QA Manager (`FICHA_QA_MANAGER` en `shared.ts`, compartida con la misión 9) y «Cómo contratamos en Kobalto».

## App «Contratación»

**Perfil y proceso.** Lo que le falta al área y ocho requisitos posibles:

- Buenos: API en el pipeline, rendimiento, explicar riesgos y acompañar a junior.
- Trampas: título de Ingeniería, diez años, «conoce nuestra herramienta» y «que encaje».
- Formato de entrevista: estructurada (bien), conversación libre o acertijos.
- Proceso: dos entrevistas en una semana con respuesta en 48 h (bien), cinco rondas, o esperar a veinte candidatos.

«Publicar» (10 min) da `profile.saved`, `profile.ok`, `interview.structured` y `process.ready` (todo bien).

**Candidatos.** Cinco finalistas. Con entrevista estructurada se ven las puntuaciones del panel por criterio y las evidencias; sin ella, solo «notas sueltas».

| Candidato | Lo que se comenta | Tarjeta (API · rend. · riesgos · junior) | Decisión |
|---|---|---|---|
| Marcos (recomendado del CTO) | Gran conversación | 1 · 1 · 4 · 2 | No |
| Ana | Algo seca | 4 · 2 · 3 · 4 | Contratar |
| Javier | Le cuesta hablar en público | 3 · 4 · 2 · 3 | Contratar |
| Rocío (sin título, viene de atención al cliente) | «No es el perfil de siempre» | 3 · 1 · 4 · 3 | Contratar |
| Luis (12 años, ingeniero) | Cumple el anuncio antiguo | 2 · 2 · 1 · 1 | No |

«Enviar la decisión» (15 min, como mucho 3 contrataciones) da:

- `hiring.decided`;
- `hiring.ok` (las cinco bien);
- `hire.<id>` o `reject.<id>`.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correos de Laura (VP) y Raúl (CTO) | Leer la ficha | — |
| 09:20 | Andrea: «¿le salto el proceso a Marcos?» | Mismo proceso y tarjeta (`process.fair`) | Saltarlo (`marcos.skipped`); descartarlo sin evaluar |
| 10:00 | Sergio: «Ana es amiga mía, ¿la entrevisto?» | La entrevista Héctor y queda registrado (`coi.ok`) | «Sin problema»; ocultarlo |
| — | Laura, si el perfil y el proceso están bien | `process.ready` | — |
| 12:00 | Debate: «Rocío no tiene título, no sé si encaja» | Volver a la tarjeta: «¿qué evidencia tenemos?» (requiere `interview.structured`; `bias.checked`) | Darle la razón; votar |
| — | Laura, si la decisión es la correcta | `hiring.ok` | — |
| 14:00 | Raúl: «¿Qué tal Marcos?» | No, con los datos de la misma tarjeta, y una salida para Marcos (requiere `reject.marcos`; `cto.handled`) | Contratarlo también (quita `hiring.ok`); «no encajaba» |
| 15:00 | Andrea: «tienen otras ofertas» | Oferta hoy, buddy, plan de 30-60-90 y primer 1:1 (requiere `hiring.decided`; `offer.fast`) | La semana que viene; esperar a alguien mejor |
| 17:00 | Café con Laura | Cierre y `preventBugs` | «Se nota enseguida quién vale» |

## Consecuencias (tres meses después)

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-RUIDO · cada entrevistador mide otra cosa y el proceso vuelve a tardar | `process.ready` | alta |
| C-SESGO · se descarta a la mejor candidata por el «perfil de siempre» | `bias.checked` | alta |
| C-ENCAJE · las contrataciones no cubren lo que falta | `hiring.ok` | alta |
| C-INTERES · «Ana entró por ser amiga de Sergio» | `coi.ok` | media |
| C-CTO · Raúl siente que se le despachó sin explicación | `cto.handled` | media |
| C-LENTO · Ana acepta otra oferta | `offer.fast` | alta |

## Conceptos
`hiring_profile`, `structured_interview`, `interview_bias`, `fair_process`, `say_no_with_data` y `onboarding_plan` (más `role_qa_manager`). Seis microlecciones de Laura y un test de 6 + 6 preguntas.

## Ecos en el curso
- **Misión 9:** las mismas personas y el mismo presupuesto, ahora con un recorte del 20 %.
