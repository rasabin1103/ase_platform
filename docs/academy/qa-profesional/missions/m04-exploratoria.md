# Misión 4: Intuición experta (QA Profesional)

> Contenido jugable: `frontend/src/features/academy/content/courses/qa-profesional/m04-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-explore/` (pestaña «Exploración»)
> Ruta: `/academy/qa-profesional/m04-exploratoria`
> CTFL v4.0: 4.4 (predicción de errores, pruebas exploratorias, pruebas basadas en listas de comprobación)

## Premisa
Jueves. El panel «Tarjetas de equipo v2» llega a staging con solo las notas de versión. Novedades:
- congelar desde el panel;
- invitar empleados por email;
- exportar CSV.

Go/no-go con Raúl a las 13:00. Tomás dice que la checklist del equipo «ya está en verde».

## Mecánicas (app «Exploración»)
- **Charter:** hasta 2 áreas, un objetivo a elegir entre tres («pérdida de control sobre el dinero», «datos corruptos o duplicados» y «que la interfaz sea bonita») y un timebox de 30, 60 o 90 min. Empezar la sesión cuesta 5 min.
  - Flags: `charter.used`; `charter.risk`, si todas las áreas son nuevas; `charter.focus`, si el objetivo es el de dinero.
- **Matriz de ataques:** 5 áreas × 8 ataques de predicción de errores.
  - Dentro del charter y del tiempo de la sesión, cada ataque cuesta 10 min.
  - Fuera, cuesta 15 min y activa `explore.nocharter`.
  - Cada ataque deja una nota en el log; si encuentra un bug, el log sirve de evidencia para el Tablero.
- **Cerrar la sesión con informe:** 10 min, activa `session.report`.
- **Checklist del equipo:** 3 puntos que salen todos en verde (20 min). Después se puede mejorar con ataques: `checklist.improved` si al menos 2 de los añadidos encontraron bugs.

## Bugs (área × ataque)

| Bug | Área × ataque | Severidad |
|---|---|---|
| X-SESION · congelar muestra éxito sin congelar | Congelar × sesión caducada | crítica |
| X-DOBLE · doble clic crea dos tarjetas | Alta × doble clic | alta |
| X-NEG · límite negativo deja la tarjeta sin límite | Cambio de límite × valores límite | alta |
| X-INVITA · invitación duplicada | Invitar × duplicados | media |
| X-CSV · «;» descoloca el CSV | Exportar × caracteres especiales | media |
| X-TILDE · ñ y tildes corruptas | Alta × caracteres especiales | media |

Todos tienen corrección y se pueden verificar.

## Escenas
- **09:10 Laura:** el enfoque. Sesiones con charter, checklist a ciegas o ir clicando.
- **09:45 Tomás:** «la checklist ya está en verde».
- **Reacciones:**
  - exploración sin charter;
  - informe de sesión;
  - X-SESION encontrado;
  - checklist mejorada.
- **13:00 go/no-go:**
  - «No-go», solo si X-SESION está reportado;
  - «Go con la lista»;
  - «Go, la checklist está verde».
- **14:30 Laura:** propone mejorar la checklist.
- **17:00 cierre.**

## Debrief
- `Mission.prevention` como «Tu forma de explorar» (6 reglas).
- Lista de bugs reportados.
- Verificación de correcciones.

## Verificación
- `engine/c2m04.test.ts` (3 tests):
  - la checklist no encuentra nada;
  - un ataque fuera del charter cuesta más;
  - recorrido óptimo con los 6 bugs y veredicto «good».
- E2E Playwright:
  - 3 sesiones con informe;
  - 6/6 bugs reportados;
  - no-go;
  - checklist mejorada;
  - veredicto «Intuición con método»;
  - sin errores de consola.
