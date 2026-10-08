# Misión 4: Reportar como un profesional (Fundamentos de Testing)

> Contenido jugable: `frontend/src/features/academy/content/courses/testing-fundamentals/m04-*.ts`
> Ruta: `/academy/testing-fundamentals/m04-reportar` · De pago si el curso tiene precio

## Premisa
Es lunes de la segunda semana. La sección «Tarjetas» de la app 5.0 (KOB-180) ha estado el fin de semana en beta cerrada con 200 clientes. Nuria, de Atención al cliente (personaje nuevo), trae cinco quejas vagas: mezclan condiciones y una ni siquiera es un bug. El jugador las reproduce en un **laboratorio de dispositivos** (móvil, idioma y cuenta de pruebas), aísla la condición y escribe reports que Diego reproduzca a la primera. A las 12:00 hay **triaje** con Marta.

## Qué enseña
- **Bug report reproducible:** título con la condición, entorno, pasos mínimos, esperado con su fuente, evidencia justa.
- **Aislar la condición:** cambiar una sola cosa cada vez (Android frente a segunda congelación; inglés frente a cuenta Joven).
- **Entorno:** la mayoría de los «no lo reproduzco» son diferencias de entorno o de datos.
- **Severidad frente a prioridad:** errata del anuncio = baja/P1; error 500 de empresa = alta/P3.
- **Triaje:** ordenar por daño, alcance, alternativa y fechas de negocio.
- **No todo es un bug:** el «doble cobro» de Mercadona es una retención liberada.

## Mecánicas nuevas del motor
- **Prioridad en el report** (`Mission.reportPriority`, `BugDef.priority` y `priorityWhy`): P1 Urgente, P2 Alta, P3 Media, P4 Baja. Acertar suma calidad; si no, el equipo explica la prioridad del triaje.
- **Condiciones de reproducción** (`BugDef.repro`): el título, los pasos o el resultado deben nombrar la condición (sin tildes ni mayúsculas). Si falta, Diego lo devuelve como «Necesita info» con una pregunta concreta.
- **Completar y reenviar** (acción `amendReport`): el report devuelto se completa desde el propio report, cuesta la mitad y cuenta las idas y vueltas.
- **Debrief «Calidad de tus reports»**: reports aceptados a la primera, idas y vueltas, severidad y prioridad frente a las del equipo.

## Bugs (variantes por semilla en `CARD_BUG_SLOTS`, 5 por partida)
| Id | Bug | Severidad · prioridad | Condición |
|---|---|---|---|
| C1 / C1b | Congelar no bloquea las compras | Crítica · P1 | Android / segunda congelación |
| C2 / C2b | Límite mensual mal guardado | Alta · P2 | Inglés con «1,000» / cuenta Joven > 500 € |
| C3 | El CSV no incluye el último día | Media · P3 | Movimiento en la fecha final |
| C4 | Errata «Conjelar tarjeta» | Baja · P1 | Español; evidencia: captura |
| C5 | Exportar más de un año da error 500 | Alta · P3 | Cuenta Empresa |
| C-R1 | Regresión: en Android no se descongela | Alta · P1 | Tras el fix de C1/C1b |

## Línea temporal
| Hora | Escena | Decisión clave |
|---|---|---|
| 09:00 | Correos de Laura y de Nuria (5 quejas) | — |
| 09:30 | Daily: Diego perdió el viernes con reports irreproducibles | Reports completos / «reporto rápido y completo luego» / culpar al dev |
| Al capturar la errata | Marta: mañana se graba el anuncio | Baja y P1 / inflarla a crítica / al backlog |
| 12:00 | Triaje | Daño + fechas / solo severidad / orden de llegada |
| 14:00 | Pista de Laura si hay menos de 2 reports | — |
| 15:30 | Nuria: ¿qué le digo al cliente de Mercadona? | Explicar la retención y proponer mejora / abrir bug / no lo sé |
| 17:00 | Charla con Laura | Lección de reports |

## Resto de piezas
- **Nueva app bajo prueba:** `apps/kobalto-cards` (laboratorio de dispositivos, captura de pantalla como evidencia, comercio de pruebas, límite mensual, movimientos y exportación CSV).
- **Wiki:** guía de bug reports del equipo (con escalas de severidad y prioridad) y funcionamiento de Tarjetas (el oráculo).
- 6 microlecciones, test antes/después (6 + 6), veredicto propio. Sin diseño ni matriz de riesgos: la misión se centra en reportar.
