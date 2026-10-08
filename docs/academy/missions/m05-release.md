# Misión 5: Viernes de release (Fundamentos de Testing)

> Contenido jugable: `frontend/src/features/academy/content/courses/testing-fundamentals/m05-*.ts`
> Ruta: `/academy/testing-fundamentals/m05-release` · De pago si el curso tiene precio

## Premisa
Es viernes. La versión 5.1 de la app se despliega a las 19:00 si a las 16:00 hay GO. Trae:
- un motor de comisiones nuevo para las transferencias instantáneas (campaña con el banco partner el lunes);
- la librería de autenticación 7;
- el fix de congelar en Android (de la misión 4);
- un tramo de interés nuevo y una librería de fechas actualizada.

La regresión manual en **TestHub** son 22 casos (320 min) y no cabe en la jornada: cada caso consume su tiempo real. Raúl Ortega (Engineering Manager, personaje nuevo) quiere a las 16:00 una recomendación con datos.

## Qué enseña
- **Regresión basada en riesgos:** las notas de la versión marcan la probabilidad; el negocio, el impacto.
- **Qué regresión ejecutar:** lo cambiado, lo que rodea a un fix y lo que comparte dependencias (librería de fechas → programadas).
- **Encontrar los críticos pronto:** un fix tardío no deja tiempo para verificarlo antes del GO/NO-GO.
- **Tests inestables (flaky):** el test rojo de la integración continua se investiga (relanzar e histórico) antes de bloquear.
- **Criterios de salida y recomendación GO/NO-GO:** qué se probó, qué no, bugs con plan y riesgos residuales.
- **Comunicación:** las malas noticias, pronto (Raúl pregunta a mediodía).

## Mecánicas nuevas
- **TestHub** (`apps/kobalto-release`): casos de regresión por zona con su duración. Al ejecutarlos se ve el resultado esperado y el obtenido. Un resultado ejecutado en un build anterior aparece marcado como «build anterior». Hay un panel de integración continua con un test inestable.
- **Coste variable por acción** (`AppEvent.cost`): cada caso consume sus minutos.
- **Condición `bugVerified`:** el GO seguro solo está disponible si el crítico tiene el fix verificado.
- **Riesgos sin diseño:** la herramienta «Diseño» muestra solo la matriz de riesgos cuando la misión no tiene diseño de casos.

## Bugs (variantes por semilla en `RELEASE_BUG_SLOTS`, 5 por partida)
| Id | Bug | Severidad · prioridad | Caso que lo revela |
|---|---|---|---|
| R1 / R1b | Instantánea cobra el doble / > 1.000 € sale como ordinaria sin avisar | Alta · P1 | TC-05/06 / TC-07 |
| R-R1 | Regresión del fix: la ordinaria cobra 0,25 € | Media · P1 | TC-08 |
| R2 / R2b | Huella falla en Android 15 / la sesión no caduca | Crítica · P1 | TC-02 / TC-04 |
| R3 | El TIN de 5,75 % no se aplica a 10.000 € exactos | Media · P2 | TC-10, TC-11 |
| R4 | Tras el fix de congelar, descongelar en Android falla | Alta · P1 | TC-13 |
| R5 | Programadas del día 31 se saltan noviembre (librería de fechas) | Media · P2 | TC-15 |

Siempre hay un crítico en acceso y sesión.

## Línea temporal
| Hora | Escena | Decisión clave |
|---|---|---|
| 09:00 | Correos de Laura y Raúl | — |
| 09:30 | Daily: «tiene que salir sí o sí» | Por riesgo / en orden / GO ya por los unitarios |
| 09:50 | Iván: test rojo en la integración continua | Investigar / bloquear / ignorar |
| 12:30 | Raúl: ¿cómo vamos? | Estado con datos / «todo bien» (penaliza si ya había un crítico) |
| 13:30 | Pista de Laura si no hay reports | — |
| Al reportar un crítico | Laura: avisa ya y verifica el fix pronto | — |
| 16:00 | GO/NO-GO | GO con crítico verificado / NO-GO con alternativa / GO sin haber encontrado el crítico / «no dio tiempo» |
| 17:00 | Charla con Laura | Lección de la semana |

## Resto de piezas
- **Wiki:** notas de la versión 5.1 y criterios de salida de una release.
- **Riesgos:** matriz con 7 zonas, de las que 3 son prioritarias.
- **Aprendizaje:** 6 microlecciones, test antes/después (6 + 6) y veredicto propio.
- **Continuidad (pendiente):** el GO sin haber encontrado el crítico deja la marca `release.go_blind` para la misión 7, «Incidente en producción».
