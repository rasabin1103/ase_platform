# Misión 3: Estados de un pago (Fundamentos de Testing)

> Contenido jugable: `frontend/src/features/academy/content/courses/testing-fundamentals/m03-*.ts`
> Ruta: `/academy/testing-fundamentals/m03-estados-pago` · De pago si el curso tiene precio

## Premisa
Es jueves en Kobalto. Kobalto Pay (cobros con tarjeta para comercios) estrena su **consola de operaciones** (KOB-170): autorizar, liquidar, anular, devolver y gestionar disputas. Diego ha probado el camino feliz. La consola muestra todas las acciones siempre: es la API la que debe rechazar con **409** las que no tocan. Finanzas ha publicado una **tabla de decisión** para la comisión por devolución. A las **16:00**, Carmen (Riesgos) y Marta deciden si se activan las devoluciones el lunes.

## Qué enseña
- **Transición de estados:** cada flecha válida es un caso y se comprueba el estado de llegada.
- **Transiciones inválidas:** la tabla estado × acción; priorizar las que mueven dinero y las que salen de estados finales.
- **Secuencias (1-switch):** devoluciones sucesivas que acumulan; disputa ganada que vuelve al estado anterior.
- **Tabla de decisión:** un caso por regla, combinaciones extra donde hay «–» y límites en las condiciones (día 30 / 31).
- **Datos de prueba:** generador de staging para crear cobros en cualquier estado.
- **Incidencias como fuente de casos:** la doble devolución por disputa que cuenta Carmen.

## Ciclo de vida (oráculo en la wiki)
| Estado | Acciones permitidas → estado de llegada |
|---|---|
| Pendiente | Autorizar → Autorizado · Rechazar → Rechazado · Anular → Anulado |
| Autorizado | Liquidar → Liquidado · Anular → Anulado |
| Liquidado | Devolver → Devuelto parcialmente / Devuelto · Abrir disputa → En disputa |
| Devuelto parcialmente | Devolver → Devuelto parcialmente / Devuelto · Abrir disputa → En disputa |
| En disputa | Disputa ganada → estado anterior · Disputa perdida → Devuelto |
| Rechazado, Anulado, Devuelto | Ninguna (estados finales) |

Cualquier otra acción: 409 y el cobro no cambia. Una devolución: > 0 €, máximo 2 decimales y no más de lo pendiente.

## Tabla de comisiones (Finanzas)
| | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| Plan Pro | Sí | No | No | No | No |
| Devolución total | – | Sí | Sí | No | No |
| ≤ 30 días (incluido) | – | Sí | No | Sí | No |
| **Comisión** | 0,00 € | 0,00 € | 1,50 € | 0,75 € | 1,50 € |

## Bugs (variantes por semilla en `PAY_BUG_SLOTS`, 7 por partida)
| Id | Bug | Severidad | Técnica |
|---|---|---|---|
| S1 / S1b | Devolver un cobro anulado / solo autorizado | Crítica | Transición inválida |
| S2 / S2b | Anular un liquidado / liquidar un anulado | Alta / crítica | Transición inválida, estado final |
| S3 | Devoluciones sucesivas superan el importe | Crítica | Secuencia en el límite (60 + 41) |
| S4 / S4b | Devolver en disputa / no se puede disputar un parcial | Crítica / media | Incidencia / transición válida |
| S5 / S5b | Devolver el total deja «Devuelto parcialmente» / autorizar un rechazado | Alta | Estado de llegada / estado final |
| F1 / F1b | Pro paga en parciales / total fuera de plazo gratis | Media | Tabla de decisión |
| F2 | El día 30 cuenta como fuera de plazo | Baja | Límite en una condición |
| S-R1 | Regresión del fix de S3: devolver lo pendiente exacto se rechaza | Alta | Regresión en el borde |

## Línea temporal
| Hora | Escena | Decisión clave |
|---|---|---|
| 09:00 | Correos de Laura y Marta | — |
| 09:30 | Daily: Diego probó el camino feliz | Modelar estados y probar inválidas / «la API ya valida» / las 64 celdas |
| 11:00 | Carmen: doble devolución por disputa en producción | Convertirla en caso / «era el sistema antiguo» |
| Al ver un bug de comisión | Marta: «Diego dice que es interpretación» | Citar la regla de la tabla / dejarlo |
| 14:00 | Pista de Laura si no hay reports | — |
| 16:00 | ¿Activamos las devoluciones el lunes? | Cobertura y recomendación / bugs sin cobertura / camino feliz |
| 17:00 | Charla con Laura | Lección de estados y tablas |

## Resto de piezas
- **Nueva app bajo prueba:** `apps/kobalto-payments` (lista de cobros, detalle con historial, todas las acciones, generador de datos de prueba). `paymentLogic` compara cada acción con la especificación para saber qué bug se manifiesta.
- **Diseño de pruebas** (33 particiones clave): transiciones válidas (11), inválidas (7), importe, devoluciones sucesivas y comisión. Cada caso se abre en staging con el generador ya relleno.
- **Matriz de riesgos** (7 zonas, 3 prioritarias), 7 microlecciones, test antes/después (6 + 6), veredicto propio.
- **Motor:** `DesignArea.expectedLabels` (textos del esperado) y `TestDesignModel.intro` (introducción propia del diseño).
