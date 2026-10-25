# Misión 4: Cinco squads, cinco frameworks (Gestión de equipos QA · rol QA Architect)

> Contenido jugable: `frontend/src/features/academy/content/courses/gestion-equipos-qa/m04-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-rfc/` (pestaña «RFC»)
> Ruta: `/academy/gestion-equipos-qa/m04-estandar`
> Tests: `apps/kobalto-rfc/rfcLogic.test.ts`, `engine/c4m04.test.ts` y el recorrido completo de `engine/coursePlaythrough.test.ts`

## Premisa
Año 3. Kobalto tiene 16 squads y la jugadora es QA Architect de Plataforma. Cinco squads automatizan con cinco herramientas distintas y Raúl quiere un framework único y obligatorio el mes que viene. El matiz: **los squads no le reportan**; lo que decida solo funcionará si lo adoptan. Ficha del rol QA Architect y «RFC y ADR: cómo decidimos en Plataforma» en la wiki.

## App «RFC»
Tres pestañas:
- **Mapa de squads:** por qué Dirección quiere un estándar (datos no reutilizables, cinco formatos de informe, cambiar de squad obliga a aprender otra herramienta, cada uno ejecuta a su manera) y cómo trabaja cada squad.
- **Tu RFC:** una opción por sección; «Enviar el RFC a los squads» (20 min).
- **Comentarios:** tras enviar, tres squads comentan; «Cerrar el RFC y publicar el ADR» (15 min).

| Squad | Herramienta | Tests | Contexto |
|---|---|---|---|
| Tarjetas | Karate | 420 | Suite estable |
| Pagos | Postman + Newman | 1.200 | Release cada viernes |
| Cuentas | REST Assured | 310 | Equipo Java |
| Onboarding | Cypress (API y UI) | 260 | Mucha interfaz web |
| Notificaciones | pytest | 140 | Equipo Python |

| Sección | Buena opción | Malas opciones |
|---|---|---|
| Alcance | Estándar mínimo (informes, datos, pipeline) y herramienta recomendada para APIs nuevas | Una herramienta obligatoria para todo; nada |
| Elección | Matriz de criterios con los squads y piloto de 6 semanas | La que uso yo; votación |
| Migración | Lo nuevo con el estándar, lo existente al tocarlo, fecha solo para lo crítico | Todos este trimestre; sin plan |
| Excepciones | En el ADR y revisadas cada mes en la guild | Las apruebo yo; sin excepciones |

Al enviar: `rfc.sent`, `rfc.good` (las cuatro bien), `rfc.imposed` (herramienta única o migración de golpe), `governance.ok` y `migration.ok`.

| Comentario | Respuesta adecuada | Malas respuestas |
|---|---|---|
| Pagos: «1.200 tests y release cada viernes» | Informes y pipeline ya, migrar al tocar y ayuda con los 50 críticos | «No hay excepciones»; dejar Pagos fuera |
| Notificaciones: «¿otra herramienta para 140 tests?» | El mínimo les aplica; pytest como excepción documentada | «Igual para todos»; no responder |
| Onboarding: «¿y la UI?» | Fuera de alcance, escrito, con un RFC aparte | Usar la herramienta de APIs; no responder |

Al publicar: `adr.published`, `pagos.ok` (respuesta adecuada a Pagos y migración incremental), `ui.scoped` y `adoption.ok` (RFC y las tres respuestas adecuadas).

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correos de Raúl y Laura | Leer la ficha | — |
| 09:30 | Raúl: «obligatorio y en un mes» | Reconducir a su objetivo: RFC, mínimo común y piloto (`approach.rfc`) | Imponerlo; negar el problema |
| 10:30 | Héctor (chat): «¿nos obligáis a tirar 1.200 tests?» | Nada sin hablarlo; que Pagos comente el primero (`hector.heard`) | «Viene de arriba»; «no os afecta» |
| — | Laura / Diego reaccionan al RFC | `rfc.good` o `rfc.imposed` | — |
| — | Héctor y Laura reaccionan al ADR | `pagos.ok`, `adoption.ok` | — |
| 14:30 | Guild de QA | Decisión compartida, en el ADR y con revisión (requiere ADR; `guild.ok`) | «Obligatorio desde el lunes»; «aún no lo tengo» |
| 16:30 | Raúl: «¿cuándo está todo migrado?» | Visibilidad en un trimestre, lo crítico en dos, adopción mensual (requiere `migration.ok`; `expectations.ok`) | «El mes que viene» |
| 17:00 | Café con Laura | Cierre y `preventBugs` | «Falta autoridad» |

## Consecuencias (tres meses después)

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-PAPEL · el estándar solo se cumple en el papel | `adoption.ok` | alta |
| C-PAGOS · Pagos deja de probar mientras «migra» | `pagos.ok` | crítica |
| C-CUELLO · eres el cuello de botella de las excepciones | `governance.ok` | media |
| C-PROMESA · «todo en un mes» ante el comité | `expectations.ok` | media |
| C-UI · Onboarding monta su propio estándar de UI | `ui.scoped` | media |

## Conceptos
`role_qa_architect`, `influence`, `minimum_standard`, `rfc_adr`, `incremental_migration`, `governance_guild`. Seis microlecciones de Laura y test de 6 + 6 preguntas.

## Ecos en el curso
- **Misión 5:** la herramienta recomendada y el piloto vuelven al elegir plataforma de entornos (construir o comprar).
