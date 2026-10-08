# Misión 5: El plan (QA Profesional)

> Contenido jugable: `frontend/src/features/academy/content/courses/qa-profesional/m05-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-plan/` (pestaña «Plan»)
> Ruta: `/academy/qa-profesional/m05-plan`
> CTFL v4.0: 5.1 (plan, criterios de entrada y salida, estimación, priorización, pirámide y cuadrantes) y 5.2 (riesgos de producto y de proyecto)

## Premisa
Viernes. Hay comité de dirección a las 15:00 para fijar la release 1.0 de Empresas (cuentas, tarjetas de equipo, facturas recurrentes). Raúl necesita el plan de pruebas y una estimación defendible. Elena avisa de que el proveedor de firma electrónica se retrasa dos semanas.

## Mecánicas (app «Plan», 5 pestañas)
- **Plan:** alcance, enfoque, criterios de entrada y criterios de salida. Cada sección se elige entre 3 redacciones, y solo una es concreta y medible.
- **Riesgos:** 6 riesgos que hay que clasificar como de producto o de proyecto (proveedor, vacaciones y staging compartido son de proyecto).
- **Estimación:**
  - por ratio: 50 persona-días × 0,4 = 20;
  - de tres puntos: a = 12, m = 18, b = 36, que da E = 20 y DE = 4.
- **Priorización:** 6 casos con riesgo y dependencias. La regla: se respetan las dependencias y, entre casos no relacionados, el de más riesgo va antes; un requisito de un caso de riesgo alto puede adelantarse.
- **Cuadrantes:** 8 pruebas que hay que colocar en Q1–Q4.
- **Laura (10 min):** revisa sin dar la solución.
- **Envío a Raúl (15 min):** activa los flags `plan.*`, `est.ratio`, `est.3p`, `est.ok`, `prio.ok` y `quad.ok`.

## Escenas
- **11:00 Wideband Delphi:** tras la primera ronda (10 / 26 / 19 / 20), las opciones son que los extremos expliquen y se repita la ronda (`delphi.ok`), hacer la media o quedarse con la estimación del senior.
- **15:00 comité:** «hacedlo en la mitad». Opciones:
  - negociar el alcance según el riesgo (`est.defended`; requiere el plan enviado y `est.ok`);
  - aceptar;
  - negarse sin alternativas.

  Todas las opciones ejecutan `preventBugs`, y el cierre de las 17:00 también, por si no se contestó.

## Problemas (`preventedBy`)

| Problema | Flag | Severidad |
|---|---|---|
| P-ALCANCE | `plan.scope` | media |
| P-ENFOQUE | `plan.approach` | media |
| P-ENTRADA | `plan.entry` | media |
| P-SALIDA | `plan.exit` | alta |
| P-RIESGO | `plan.risks` | alta |
| P-PRIO | `prio.ok` | alta |
| P-CUAD | `quad.ok` | media |
| P-ESTIM | `est.defended` | crítica |

El debrief usa `Mission.prevention` («Tu plan», 10 reglas, incluido `delphi.ok`).

## Pendiente (idea del PLAN)
La continuidad con la M6 (si no se defendió la estimación, el sprint se desborda) queda para cuando exista la M6.

## Verificación
- `engine/c2m05.test.ts` (3 tests):
  - reglas de priorización;
  - recorrido óptimo con 0 problemas y veredicto «good»;
  - sin plan y aceptando la mitad, aparecen los problemas.
- E2E Playwright:
  - 10/10;
  - veredicto «Un plan para decidir»;
  - sin errores de consola.
