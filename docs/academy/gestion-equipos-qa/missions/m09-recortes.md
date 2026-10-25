# Misión 9: Recortes (Gestión de equipos QA · rol QA Manager)

> Contenido jugable: `frontend/src/features/academy/content/courses/gestion-equipos-qa/m09-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-capacity/` (pestaña «Capacidad»)
> Ruta: `/academy/gestion-equipos-qa/m09-recortes`
> Tests: `apps/kobalto-capacity/capacityLogic.test.ts`, `engine/c4m09.test.ts` y el recorrido completo de `engine/coursePlaythrough.test.ts`

## Premisa
Año 6, la jugadora sigue de QA Manager de Banca diaria. El comité recorta un 20 %: QA tiene 400 k€ menos sobre 2.000 k€. El rumor ya corre por el equipo, el CTO propone externalizar toda la regresión y Héctor (QA Lead) tiene otra oferta. Laura necesita el plan a las 15:00, y a las 16:00 se cuenta al equipo.

En la wiki: la ficha del rol QA Manager (compartida con la misión 8) y «Ajustes de presupuesto: cómo los gestionamos».

**Eco de la misión 8:** Javier, contratado para rendimiento, es una de las palancas tentadoras.

## App «Capacidad»
Situación del área, barra de ahorro frente a 400 k€ y nueve palancas.

| Palanca | Ahorro | Tipo |
|---|---|---|
| No reponer las dos bajas previstas | 120 k€ | buena |
| Externalizar la regresión del back-office (las 3 personas pasan a lo crítico) | 140 k€ | buena |
| Dejar de probar a mano las apps internas de bajo riesgo (negocio debe aceptarlo) | 90 k€ | buena |
| Una sola herramienta de gestión de pruebas | 60 k€ | buena |
| Automatizar la regresión de tarjetas | 60 k€ | buena |
| Externalizar también pagos | 220 k€ | riesgo crítico |
| Prescindir de los 3 senior más caros | 300 k€ | personas clave |
| Cerrar rendimiento (el puesto de Javier) | 130 k€ | personas clave |
| Eliminar formación y conferencias | 40 k€ | moral |

Las cinco buenas suman 470 k€; sin reducir alcance no se llega a 400 k€.

«Enviar el plan» (20 min, una vez) da:

- `plan.saved`;
- `plan.target` (≥ 400 k€);
- `plan.critical`, `plan.keypeople` y `plan.morale`;
- `plan.scope` (si se reduce alcance);
- `plan.ok` (objetivo y ninguna palanca mala).

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Laura: 400 k€ menos | Leer la ficha | — |
| 09:30 | Sergio: «corre el rumor, ¿qué les digo?» | La verdad, sin decisiones aún, y a las 16:00 se cuenta todo (`rumor.handled`) | Negarlo (`lied`); adelantar que se toca rendimiento |
| 10:00 | Raúl: «externalizad toda la regresión» | El back-office sí, pagos no, con el coste de un fallo (`cto.risk`) | «Vale»; «ni hablar» |
| — | Laura, si el plan es bueno | `plan.ok` | — |
| 13:00 | Marta: «¿qué pasa con mis releases?» | Lo crítico igual; qué se deja de probar y que lo acepte por escrito (`scope.agreed`) | «No vas a notar nada»; «pregunta a dirección» |
| 15:00 | Laura: el plan para el comité | Ahorro por riesgo, sin despidos, con su coste y revisión (requiere `plan.ok`; `plan.approved`) | Un 20 % a cada equipo; prescindir de los senior |
| 16:00 | Reunión con todo el equipo | Qué cambia, por qué, qué no (nadie pierde el empleo), preguntas y 1:1 (requiere `plan.approved`; `comm.ok`) | «Una gran oportunidad»; «vuestros leads os contarán» |
| 16:30 | Héctor: «me ha llamado otra empresa» | Liderar la automatización y revisar el salario en la próxima ventana, sin prometer dinero (`retention.ok`) | Igualar la oferta; «lo entenderé» |
| 17:00 | Café con Laura | Cierre y `preventBugs` | «Lo importante eran los números» |

## Consecuencias (seis meses después)

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-CRITICO · un fallo en pagos que la regresión externalizada no cubría | `plan.critical` | crítica |
| C-PERSONAS · se pierde a quien sostenía pagos o rendimiento | `plan.keypeople` | alta |
| C-FUGA · Héctor acepta la otra oferta | `retention.ok` | alta |
| C-RUMOR · el rumor corre más que la información | `rumor.handled` | media |
| C-ALCANCE · falla una app interna y negocio no lo sabía | `scope.agreed` | media |
| C-MORAL · el equipo se siente engañado | `comm.ok` | media |

## Conceptos
`risk_priority`, `capacity_plan`, `key_people`, `honest_comms` y `scope_acceptance` (más `role_qa_manager`). Seis microlecciones de Laura y un test de 6 + 6 preguntas.

## Ecos en el curso
- **Misión 10:** como Head of QA, el gran incidente pone a prueba lo que se dejó de probar y a quién se mantuvo.
