# Misión 5 · Dirigido por datos (viernes)

Código: `frontend/src/features/academy/content/courses/karate-framework/m04-*.ts`

## Historia
El lunes Finvo empieza con transferencias. Compliance ha fijado límites para partners (mínimo 0,01 €, máximo 1.000 € por transferencia en cuentas personales) y hay que probar todas las validaciones de la especificación. Nico confiesa que los límites los puso «a ojo» entre `>` y `>=`.

## Novedades del motor
- **Examples dinámicos**: `Examples: | read('data/negativos.json') |` — cada objeto es una fila, con sus tipos.
- `karate.merge(a, b)` para cambiar solo algunos campos del cuerpo.
- Reglas de límites en la API (opción `limits`) y errores marcados con el bug que los causa.
- Mal olor «escenarios copiados»: tres o más escenarios iguales salvo en los datos (flag `smell.duplicated`).

## Guion (minuto desde las 09:00)
| Minuto | Escena | Qué pasa |
| --- | --- | --- |
| 0 | Correo de Alba, chat de Sergio | Reglas para partners; tests dirigidos por datos |
| 20 | Planificación | ¿Qué datos para los límites? (bordes / uno dentro y otro fuera / aleatorios) |
| — | Sergio | Si copias escenarios: Scenario Outline. A las 11:00, el truco de `amount!` |
| 180 | Chat de Carmen | Concepto de 140 caracteres (activa el reto «concepto») |
| 240 | Chat de Nico | Confiesa los `>`/`>=` a ojo |
| 450 | Decisión | ¿Finvo empieza el lunes? (la opción buena requiere haber reportado KA-LIMITE) |
| 480 | Cierre con Sergio | Qué te llevas |

## Retos
1. **outline** — Scenario Outline con al menos 3 filas de importes.
2. **limites** — 0,01, 1.000 y 1.000,01 como números (columna `amount!`).
3. **codigos** — `status <status>` desde la tabla, con filas de éxito y de error.
4. **negativos** — al menos 4 códigos de error distintos.
5. **json** — la matriz en `data/negativos.json` como Examples dinámicos.
6. **concepto** — 140 y 141 caracteres (`'x'.repeat(len)`).

## Bugs
- **KA-LIMITE** (alto): 1.000,00 € justos se rechazan (`>=` en lugar de `>`).
- **KA-CENT** (medio): importes menores de 1 € se rechazan (el mínimo es 0,01).
- **KA-CONCEPTO** (medio): 140 caracteres justos se rechazan.

## Solución de referencia
Ver `M04_SOLUTION_FEATURE` y `M04_SOLUTION_DATA` en `m04-lab.ts`.
