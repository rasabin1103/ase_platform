# Misión 7: La conversación difícil (Gestión de equipos QA · rol QA Lead)

> Contenido jugable: `frontend/src/features/academy/content/courses/gestion-equipos-qa/m07-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-oneonone/` (pestaña «1:1»)
> Ruta: `/academy/gestion-equipos-qa/m07-conversacion`
> Tests: `apps/kobalto-oneonone/oneOnOneLogic.test.ts`, `engine/c4m07.test.ts` y el recorrido completo de `engine/coursePlaythrough.test.ts`

## Premisa
Año 4, tres meses después de la misión 6. La jugadora pasó a Lucía a Tarjetas para descargar a Pablo y desde entonces Lucía rinde por debajo de lo esperado. Nerea se queja de que rehace sus pruebas, en el equipo se empieza a comentar y Andrea (Personas) pregunta si abre un plan de mejora formal. A las 12:00 hay 1:1 con Lucía. Ficha del rol QA Lead (compartida con la misión 6) y «Feedback difícil y planes de mejora» en la wiki.

**Eco de la misión 3 y la 6:** Lucía, a la que mentorizaste de junior y a la que diste trabajo de riesgo controlado, ahora tiene un problema sostenido, y la causa es en parte una decisión tuya.

## App «1:1»
- **Lucía:** lo que se espera de su puesto y lo que sabes.
- **Ejemplos:** elegir 3 de 6:
  - hechos con su impacto: sprint 14, plan de límites tarde, dailies sin pedir ayuda;
  - frente a la opinión de Nerea, un juicio («es lenta») y algo sin comprobar.
- **Guion:** cuatro pasos.

| Paso | Buena opción | Malas opciones |
|---|---|---|
| Apertura | Directa, con hechos, y abrir espacio a su punto de vista | Sándwich; empezar por el plan de Personas; «nada grave» |
| Causa | Preguntas abiertas y escuchar | Suponer falta de interés; no entrar en causas |
| Plan | Objetivos medibles a 6 semanas, pareja con Pablo, 1:1 semanal y revisión | «Esfuérzate más»; plan formal desde hoy |
| Registro | Resumen escrito el mismo día, compartido con ella | Notas solo tuyas; nada |

«Guardar la preparación» (20 min, se puede rehacer) da `prep.saved`, `prep.examples` (3 hechos), `prep.plan`, `prep.record` y `prep.ready` (todo bien).

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correos de Andrea y Laura | Leer la ficha | — |
| 09:30 | Nerea (chat): «otra vez rehago sus pruebas» | Hacerte cargo sin contar detalles y proponer verlo juntas (`nerea.ok`) | «Ya veremos qué dice Personas» (`gossip`); «no es tu problema» |
| 10:30 | Héctor (chat): «¿la vais a echar?» | «No hablo de la situación de nadie» (`confidential.ok` si no hubo `gossip`) | «Entre nosotros…» (`gossip`); «todo bien» |
| — | Laura, si la preparación está lista | `prep.ready` | — |
| 12:00 | 1:1 con Lucía | Con los tres hechos y una pregunta abierta (requiere `prep.ready`; `feedback.ok`) → Lucía cuenta la causa | «Te veo floja» → Lucía a la defensiva; «Personas va a abrir un plan» → se cierra |
| — | Lucía a la defensiva | Reconocerlo y volver a los hechos (requiere `prep.examples`; `feedback.ok`) → causa | «Ya sabes a qué me refiero» |
| — | Lucía: «nadie me explicó Tarjetas y me da vergüenza preguntar» | Pareja con Pablo, objetivos a 6 semanas, 1:1 semanal y resumen (requiere `prep.plan`; `talk.plan`, `cause.found` y `documented` si `prep.record`) | Plan formal igualmente; «ya mejorará» |
| 14:00 | Andrea: «¿abro el plan?» | Todavía no: feedback, causa y plan con apoyo; el formal si no mejora (requiere `talk.plan`; `pip.right`) | «Ábrelo ya»; «no hace falta nada» |
| 15:00 | Nerea y Lucía | Cómo trabajáis, no quién tiene razón; revisar antes en vez de rehacer (`conflict.ok`) | Dar la razón a Nerea delante de Lucía; separarlas |
| 17:00 | Café con Laura | Cierre y `preventBugs` | «Mejor evitarlas» |

## Consecuencias (seis semanas después)

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-INJUSTO · plan formal sin feedback previo | `pip.right` | alta |
| C-CAUSA · Lucía sigue atascada en Tarjetas | `cause.found` | alta |
| C-VAGO · no sabe qué tiene que cambiar | `feedback.ok` | media |
| C-RUMOR · todo el equipo comenta su situación | `confidential.ok` | alta |
| C-CONFLICTO · Nerea y Lucía dejan de hablarse | `conflict.ok` | media |
| C-PAPEL · nadie recuerda lo acordado | `documented` | media |

## Conceptos
`sbi_feedback`, `root_cause`, `improvement_plan`, `documentation`, `mediation` y `confidentiality` (más `role_qa_lead`). Seis microlecciones de Laura y un test de 6 + 6 preguntas.
