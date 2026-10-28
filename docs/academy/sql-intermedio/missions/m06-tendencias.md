# Misión 6: Tendencias (SQL intermedio)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-intermedio/m06-*.ts`
> Base de datos: Kobalto ampliada (`sql/kobaltoPagosDb.ts`)
> Ruta: `/academy/sql-intermedio/m06-tendencias`
> Tests: `engine/c6m06.test.ts`

## Premisa
Martes de la semana 2 del mes 2. Ventanas que suman y comparan: acumulados, medias móviles, el mes anterior y porcentajes sobre el total. Casi todos los encargos parten del total aceptado por mes (paso `mensual`). Todos exigen una ventana. Wiki: «Chuleta: tendencias con ventanas».

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) | Resultado |
|---|---|---|---|---|
| Acumulado mensual | Inés | 09:00 | `SUM(total) OVER (ORDER BY mes)` | 14 meses; último 33.021,22 |
| Variación respecto al mes anterior | Marta | 09:30 | `LAG(total) OVER (ORDER BY mes)` | feb-2026: +3.824,88 |
| Media móvil de 3 meses | Carmen | 10:15 | `AVG … ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` | feb-2026: 2.998,44 |
| Acumulado de cada año | Nuria | 11:30 | `PARTITION BY DATE_TRUNC('year', mes)` | 2026: 1.384,41 → 6.593,70 |
| Días entre pagos de la tarjeta 5 | Diego | 12:30 | `pagado_en::date - LAG(pagado_en::date) OVER (…)` | 12 pagos; máximo 130 días |
| Peso de cada categoría | Laura | 13:30 | `SUM(SUM(importe)) OVER ()` | 9; viajes 34,9 %, compras 32,1 % |

Trampas comprobadas en los tests: `OVER ()` sin ORDER BY, acumulado sin reiniciar por año, LEAD en vez de LAG, media acumulada en vez de móvil y diferencia con el primer pago.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: ventanas que miran atrás | Leer la chuleta | — |
| 11:00 | `SUM(total) OVER ()` da 33.021,22 en todas las filas | ORDER BY dentro del OVER (`practice.window_order`) | ORDER BY al final; GROUP BY |
| 15:00 | Servicios no tiene junio: LAG compara julio con mayo | LAG es la fila anterior: comprobar o rellenar calendario (`practice.lag_gaps`) | `LAG(total, 2)`; «da igual» |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «En la hoja de cálculo» |

## Consecuencias
C-MARTA, C-CARMEN, C-NURIA, C-DIEGO y C-LAURA (encargos), C-OVER (`practice.window_order`) y C-HUECOS (`practice.lag_gaps`).

## Lecciones, test y conceptos
6 lecciones y test 6 + 6 sobre `running_total`, `lag_lead`, `window_frame`, `share_of_total` y `lag_gaps`.
