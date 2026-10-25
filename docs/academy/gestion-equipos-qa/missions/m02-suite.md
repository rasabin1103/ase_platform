# Misión 2: La suite que nadie mira (Gestión de equipos QA · rol QA Engineer)

> Contenido jugable: `frontend/src/features/academy/content/courses/gestion-equipos-qa/m02-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-suite/` (pestaña «Suite»)
> Ruta: `/academy/gestion-equipos-qa/m02-suite`
> Tests: `apps/kobalto-suite/suiteLogic.test.ts`, `engine/c4m02.test.ts` y el recorrido completo de `engine/coursePlaythrough.test.ts`

## Premisa
Año 2. La jugadora se ha pasado a la automatización y es QA Engineer del squad Tarjetas. La situación:
- el pipeline de regresión está en rojo el 40 % de las veces;
- los devs mergean sin mirarlo;
- Diego ha desactivado tres tests con «skip».

La ficha del rol QA Engineer está en `shared.ts` (`FICHA_QA_ENGINEER`, compartida con la misión 3).

## App «Suite»
1. **Tests inestables:** los 8 tests que causan el 90 % de los rojos, con squad, % en rojo, duración y bugs reales detectados en un año.
   - «Investigar» (10 min) revela la causa. Activa `suite.inv.<id>`, y `suite.analyzed` a partir de 6 investigados.
   - Después se elige una decisión: arreglar, cuarentena, borrar, reportar un bug o dejarlo.
   - «Aplicar» cuesta la suma de las decisiones (arreglar 20–45 min; cuarentena y bug 10; borrar 5) y activa `suite.applied`, `suite.ok` (las 8 adecuadas), `suite.bug_reported`, `suite.bug_hidden`, `suite.valuable_deleted` y `suite.quarantine_ok`.

   | Test | Causa | Decisión |
   |---|---|---|
   | T1 transferencia_e2e_checkout | Esperas fijas | Arreglar |
   | T2 tarjetas_limite_concurrente | **Bug real del producto**: dos pagos a la vez superan el límite | **Reportar un bug** |
   | T3 login_otp_sms | Sandbox del proveedor de SMS | Arreglar (simular el proveedor) |
   | T4 extractos_pdf | Datos compartidos con otro test | Arreglar |
   | T5 banner_promo_verano | Funcionalidad retirada | Borrar |
   | T6 tipos_cambio_diarios | Zona horaria | Arreglar |
   | T7 onboarding_kyc_completo | Servicio lento; arreglarlo lleva una semana; muy valioso | Cuarentena |
   | T8 notificaciones_push_todas | Duplicado, ningún bug en un año | Borrar |

2. **Informe para los squads:** «Publicar» (15 min, requiere los 8 investigados) activa `report.published`: causa, decisión y squad dueño de cada test.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Laura | Leer la ficha del rol | — |
| 09:20 | Diego: «puse skip a tres tests» | Cuarentena con ticket, dueño y fecha, sin bronca (`skip.handled`) | Darlo por bueno; regañarle sin alternativa |
| 10:40 | Sergio: «pon 3 reintentos a todo» | No: los reintentos esconden bugs (`retries.no`) | Copiarlo (`retries.yes`) |
| 12:30 | Marta y Raúl: ¿cuánto tiempo? | Datos, 20 % dos sprints y objetivo de más del 95 % (`capacity.agreed`; requiere `suite.analyzed`) | Reescribirlo todo; «en mis ratos libres» |
| — | Diego confirma el bug (si se reportó T2) | — | — |
| 15:30 | Sesión con los squads: ¿de quién son los tests? | Cada squad dueño, «quien lo rompe lo arregla» y patrones (`owners.ok`; requiere `report.published`) | «Yo me encargo de todos»; «entre todos» |
| 17:00 | Café con Laura | Cierre: `race.caught`, `pipeline.trusted` y `preventBugs` | «Lo importante es el verde» |

## Consecuencias (dos sprints después)

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-CARRERA · la carrera del límite llega a producción | `race.caught` = T2 reportado y sin reintentos | crítica |
| C-ROJO · el pipeline sigue sin ser fiable | `pipeline.trusted` = `suite.ok` y sin reintentos | alta |
| C-SKIP · tres tests muertos durante meses | `skip.handled` | alta |
| C-INVISIBLE · arreglar tests sin que nadie lo planifique | `capacity.agreed` | media |
| C-DUENOS · cada test roto vuelve a ti | `owners.ok` | media |

## Conceptos
`role_qa_engineer`, `flaky_triage`, `quarantine`, `retries_hide`, `negotiate_capacity`, `test_ownership`. Seis microlecciones de Laura y test de 6 + 6 preguntas.

## Ecos en el curso
- **Misión 1:** como QA manual hiciste visible el flujo; ahora haces visible la salud de la suite.
- **Misión 4 (QA Architect):** la regla «cada squad cuida sus tests» se convierte en un estándar para toda la organización.
