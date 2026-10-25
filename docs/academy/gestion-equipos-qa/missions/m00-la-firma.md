# Misión 0: La firma (Gestión de equipos QA · rol QA manual) · demo gratuita

> Contenido jugable: `frontend/src/features/academy/content/courses/gestion-equipos-qa/m00-*.ts`
> Mundo: `content/worlds/kobaltoTeams.ts` (Kobalto con los personajes nuevos del curso)
> Ruta: `/academy/gestion-equipos-qa/m00-la-firma`
> Tests: `engine/c4m00.test.ts` y el recorrido completo de `engine/coursePlaythrough.test.ts`

Es la primera misión del curso, así que es la demo gratuita cuando el curso tiene precio (`isFreeMission`). No necesita apps nuevas: correo, chat, reuniones, tickets con acciones y wiki.

## Premisa
Año 1. Jueves. La jugadora es la QA manual del squad Tarjetas y su responsable es Laura (QA Lead).
- Mañana a las 10:00 Marta (PO) enseña las tarjetas virtuales (KOB-412) a un banco socio.
- Queda casi todo por probar, hay un bug (KOB-415) que Diego no reproduce y a las 16:30 es el go/no-go.

## Responsabilidades del rol que se evalúan
La ficha del rol está en la wiki (`ficha_rol`). Resumen: el QA manual posee sus pruebas, sus bugs y su estado; decide cómo probar y cuándo pedir ayuda; **no decide si se asume un riesgo de negocio**, lo informa.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correos de Laura y Marta | Leer la ficha del rol (`role.read`) | — |
| 09:15 | Daily | Estado honesto: hecho, pendiente, bloqueos y riesgo (`status.honest`) | «Casi está»; culpar a Diego |
| 10:00 | Diego quiere cerrar KOB-415 | Evidencia adjunta y verlo juntos (`bug.accepted`); o «te la paso en un rato» y adjuntarla luego (`bug.pending` → `bug.accepted`) | Escalar a Laura sin intentarlo; dejar cerrarlo (`bug.closed`) |
| 11:00 | Sergio pide dos horas | Negociar qué, cuándo y quién decide (`prio.negotiated`) | Sí a todo (−90 min); «no» a secas |
| 12:30 | Marta pide la firma | No firmar, priorizar la demo, estado por escrito, decide negocio (`sign.honest`) | Firmar (`signed.untested`); bloquear el release (`sign.blocked`) |
| 13:30 | Imprevisto (50 %): staging caído media hora | — | — |
| 15:00 | Laura pregunta | Pedir ayuda con lo que falta y una propuesta (`help.asked`) | «Todo controlado» sin haber terminado (`help.hidden`) |
| 16:30 | Go/no-go | Estado claro, por escrito y con recomendación (`gonogo.clear`). Requiere el camino crítico probado y el estado escrito en el ticket; tres variantes según el estado del bug y si se probó todo | «Todo probado y bien» sin serlo (`gonogo.optimistic`); «no sé» |
| 17:00 | Café con Laura | Cierre y `preventBugs` | «QA es la última barrera» (se retoma en las misiones 6 y 10) |

Acciones en tickets:
- **KOB-412:**
  - camino crítico, 120 min (`tested.critical`);
  - el resto, 180 min (`tested.all`; solo aparece tras el crítico);
  - escribir el estado, 15 min (`status.written`; el comentario cambia según lo probado);
  - marcar como probado (`signed.untested` si no está todo probado).
- **KOB-415:** reproducir y adjuntar evidencia, 20 min (`bug.evidence`).

## Consecuencias (`preventedBy`, se evalúan al final del día)

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-DEMO · la demo falla en lo no probado | `gonogo.clear` | crítica |
| C-BUG · cobro doble en producción | `bug.accepted` | alta |
| C-CONFIANZA · dejan de fiarse de tus estados | `trust.ok` = estado honesto + ninguna firma sin probar + ningún «todo bien» falso | alta |
| C-SORPRESA · Laura se entera tarde | `help.ok` (= `help.asked`) | media |
| C-SOBRECARGA · acabas a las 22:00 y Sergio sin datos | `prio.negotiated` | media |

## Conceptos
`role_qa_manual`, `honest_status`, `evidence_based`, `risk_ownership`, `priority_negotiation`, `ask_help`. Seis microlecciones de Laura y test de 6 + 6 preguntas situacionales.

## Ecos en el curso
- **Misión 6 (QA Lead):** la misma presión, ahora desde arriba. Héctor no quiere firmar y Marta te pide que le pares los pies.
- **Misión 10 (Head of QA):** la idea «QA es la puerta» aparece como causa del gran incidente.
