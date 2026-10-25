# Misión 6: Tu primer equipo (Gestión de equipos QA · rol QA Lead)

> Contenido jugable: `frontend/src/features/academy/content/courses/gestion-equipos-qa/m06-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-team/` (pestaña «Equipo»)
> Ruta: `/academy/gestion-equipos-qa/m06-primer-equipo`
> Tests: `apps/kobalto-team/teamLogic.test.ts`, `engine/c4m06.test.ts` y el recorrido completo de `engine/coursePlaythrough.test.ts`

## Premisa
Año 4, primer día como QA Lead de Pagos, con cinco personas a cargo:
- **Héctor**, experto en pagos y ex-compañero;
- **Sergio**, el mejor automatizador, ex-compañero, que optaba al puesto;
- **Lucía**, junior e insegura tras un error;
- **Nerea**, autónoma, quiere aprender rendimiento;
- **Pablo**, lleva tres squads y no llega.

Laura es ahora QA Manager y tu responsable. Marta, Head of Product, quiere sacar el jueves las transferencias instantáneas y te pide que «le pares los pies» a Héctor, que no quiere firmarlas.

**Eco de la misión 0:** la misma presión, ahora desde el otro lado.

Ficha del rol QA Lead en la wiki (`FICHA_QA_LEAD` en `shared.ts`, compartida con la misión 7).

## App «Equipo»
1. **Tu equipo:** fortalezas, hacia dónde quiere crecer y momento actual de cada persona.
2. **Reparto del sprint:** 5 tareas, cada una a una persona del equipo o a «Yo». «Confirmar» (15 min) activa:
   - `assign.submitted`;
   - `assign.ok`, si todo va a la persona adecuada (transferencias → Héctor, automatización → Sergio, pantalla de ahorro → Lucía, rendimiento → Nerea, criterios de Tarjetas → Pablo);
   - `assign.self` (alguna tarea para ti), `assign.junior_critical` (lo crítico a Lucía), `assign.pablo_more` (carga extra a Pablo);
   - `assign.hector`, `assign.sergio` y `assign.lucia`.
3. **1:1 con Sergio:** hasta 4 de 8 temas. «Guardar» (10 min) activa:
   - siempre `one2one.prepped`;
   - `one2one.ready` con 3 o más temas adecuados y ninguno a evitar. Los adecuados son: nombrar que optaba al puesto, sus objetivos, cómo prefiere el feedback y qué necesita de ti. Los que hay que evitar: imponer la jerarquía, opiniones sobre compañeros, repasar tareas, «no cambia nada».

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correos de Laura y Marta | Leer la ficha del rol | — |
| 09:30 | Primera reunión del equipo | Explicar qué cambia y anunciar los 1:1 (`kickoff.ok`) | «Soy una más»; «todo pasa por mí» (`micromanage`) |
| 10:30 | Pablo: «no llego» | Protegerle esta semana y escalar la capacidad (`pablo.ok`) | «Todos vamos a tope» |
| 11:30 | 1:1 con Sergio | La respuesta preparada (`sergio.ok`; requiere `one2one.ready` y `assign.sergio`) | Escuchar sin nada concreto (neutral); «ahora soy tu jefa» |
| 13:00 | Héctor no firma | Respaldarle e ir juntos a Marta con opciones (`hector.backed`) | Pedirle que firme (`hector.undermined`); hablar tú por él (`hector.sidelined`) |
| 15:00 | Marta: «párale los pies» | Héctor informa, no bloquea; él cuenta los datos y tú llevas opciones (`release.options`) | Ponerte del lado de Marta (`hector.undermined`); «si mi equipo dice que no, no sale» |
| 16:00 | Lucía, insegura (si tiene la pantalla de ahorro) | Delegar con apoyo (`lucia.supported`) | Hacerlo tú; solo dar ánimo |
| 17:00 | Café con Laura | Cierre: `hector.trust`, `team.grow` y `preventBugs` | «Iría más rápido haciéndolo yo» |

## Consecuencias (tus primeros meses como Lead)

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-ANTIFRAUDE · más de 10.000 € sin antifraude | `release.options` | crítica |
| C-SILENCIO · Héctor deja de avisar de riesgos | `hector.trust` = respaldado y no desautorizado | alta |
| C-SERGIO · pide cambiar de equipo | `sergio.ok` | alta |
| C-REPARTO · nadie crece, todo depende de ti | `team.grow` = `assign.ok` y sin `micromanage` | media |
| C-PABLO · se quema y se va | `pablo.ok` | media |
| C-LUCIA · deja de preguntar | `lucia.supported` | media |

## Conceptos
`role_qa_lead`, `delegate_grow`, `first_one_on_one`, `back_your_team`, `risk_ownership_lead`, `capacity`. Seis microlecciones de Laura y test de 6 + 6 preguntas.

## Ecos en el curso
- **Misión 0:** el QA manual que no firma eres tú años antes; ahora decides cómo respaldarle.
- **Misión 7:** Lucía vuelve, esta vez con un problema de rendimiento sostenido.
