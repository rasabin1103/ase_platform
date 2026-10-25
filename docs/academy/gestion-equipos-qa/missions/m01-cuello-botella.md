# Misión 1: El cuello de botella (Gestión de equipos QA · rol QA manual)

> Contenido jugable: `frontend/src/features/academy/content/courses/gestion-equipos-qa/m01-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-sprint/` (pestaña «Sprint»)
> Ruta: `/academy/gestion-equipos-qa/m01-cuello-botella`
> Tests: `apps/kobalto-sprint/sprintLogic.test.ts`, `engine/c4m01.test.ts` y el recorrido completo de `engine/coursePlaythrough.test.ts`

## Premisa
Año 1, unos meses después de la misión 0. Es el día 9 de 10 del sprint 14 del squad Tarjetas:
- 6 historias esperan en «Listo para QA» y hoy solo da tiempo a probar 3;
- es el tercer sprint seguido así;
- Raúl pregunta si QA es el cuello de botella;
- a las 16:00 es la retro.

La ficha del rol (QA manual) es la misma de la misión 0 (`shared.ts`).

## App «Sprint»
1. **Tablero:**
   - Hecho: 2 historias.
   - Listo para QA: 6 historias. Cada una muestra el día en que llegó, sus puntos, si QA revisó sus criterios antes de desarrollar, qué pasa si falla y qué cambia.
   - Se eligen hasta 3 para probar hoy (180 min). Las de más riesgo son KOB-431 (pagos), KOB-433 (límite diario con pagos simultáneos) y KOB-435 (notificación obligatoria por normativa).
   - Flags que activa la prueba: `test.done`, `test.risk` (si son esas 3), `test.limits`, `test.notif` y `test.color`.
2. **Flujo del sprint:** «Analizar el flujo» (20 min, `flow.analyzed`) muestra un gráfico de llegadas por día y cinco datos:
   - 6 de 8 historias llegaron los días 8 y 9;
   - en 5 de 9 días no llegó nada;
   - solo 3 de 8 tenían los criterios revisados;
   - 4 de 8 son de 5 puntos o más;
   - hay 6 historias en la cola.
3. **Propuestas para la retro:** de 8 acuerdos se eligen hasta 3 (15 min, `retro.proposal`).
   - Atacan la causa y dependen del equipo:
     - criterios revisados antes de desarrollar;
     - límite de WIP;
     - partir historias;
     - devs que prueban con los casos de QA.
   - No sirven: pedir otro QA, solo camino feliz, alargar el sprint, trabajar el fin de semana.
   - `retro.good` si los tres atacan la causa; `retro.bad` si alguno no.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correos de Raúl y Laura | Leer la ficha del rol | — |
| 09:15 | Daily: Diego pasó tres historias más | Hacer visible la cola, priorizar por riesgo y pedir al equipo que pruebe (`daily.team`) | Horas extra (`overtime`); culpar a desarrollo |
| 10:30 | Marta pide probar primero el color | Explicar el riesgo y darle una alternativa (`prio.explained`) | Aceptar lo vistoso primero (`prio.po_first`) |
| 13:00 | Raúl: «¿QA es el cuello de botella?» | Responder con los datos del flujo (`raul.data`; requiere `flow.analyzed`) | Pedir otro QA (`ask.headcount`); asumir la culpa |
| 14:30 | Laura recuerda los datos (si no se analizó el flujo) | — | — |
| 16:00 | Retro: feedback duro de Diego | Agradecer, preguntar, enseñar datos y proponer. Con `retro.good` activa `retro.agreed`; da `feedback.ok` | Defenderse culpando; darle la razón sin contrastar |
| 17:00 | Café con Laura | Cierre: `pace.ok` si no hubo horas extra; `preventBugs` | «Faltan QA» (se retoma en la misión 8) |

## Consecuencias (el sprint 15)

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-LIMITE · límite diario superado en producción | `test.limits` | crítica |
| C-NORMATIVA · pagos en dólares sin notificación | `test.notif` | alta |
| C-COLA · el sprint 15 vuelve a cerrar con 6 en cola | `retro.agreed` | alta |
| C-CULPA · «QA es lento» y se pide otro QA | `raul.data` | media |
| C-RITMO · dos noches hasta las once | `pace.ok` | media |
| C-RELACION · se enfría la relación con Diego | `feedback.ok` | media |

## Conceptos
`risk_queue`, `flow_visibility`, `team_agreements`, `data_not_blame`, `receive_feedback`, `sustainable_pace` (más `role_qa_manual` y `risk_ownership` de la ficha). Seis microlecciones de Laura y test de 6 + 6 preguntas.

## Ecos en el curso
- **Misión 6 (QA Lead):** ahora es tu equipo el que tiene la cola, y tú quien defiende ante Raúl que el problema es el flujo.
- **Misión 8 (QA Manager):** la petición de «otro QA» llega a tu mesa y tienes que decidir con datos.
