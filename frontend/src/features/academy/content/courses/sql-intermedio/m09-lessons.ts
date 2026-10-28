import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 6 · misión 9). */
export const m09Lessons: Lesson[] = [
  {
    id: 'create',
    question: '¿Qué es una vista?',
    conceptId: 'create_view',
    cost: 5,
    body: `Una **consulta guardada con nombre** en la base de datos. Se usa como una tabla, pero no guarda datos: cada vez que la consultas, ejecuta su consulta con los datos del momento.

\`\`\`
CREATE VIEW saldos_cliente AS
SELECT cliente_id, SUM(saldo) AS saldo_total
FROM cuentas
GROUP BY cliente_id;

SELECT * FROM saldos_cliente WHERE saldo_total > 20000;
\`\`\`

Los nombres de las columnas salen de la consulta: pon alias a todo lo calculado.`,
  },
  {
    id: 'on_view',
    question: '¿Puedo hacer una vista sobre otra?',
    conceptId: 'view_on_view',
    cost: 5,
    body: `Sí, y es lo normal: cada vista resuelve un paso, como los \`WITH\`, pero para todo el equipo.

\`\`\`
CREATE VIEW kpi_clientes AS
SELECT c.id, c.nombre, c.ciudad, COALESCE(s.saldo_total, 0) AS saldo_total
FROM clientes c
LEFT JOIN saldos_cliente s ON s.cliente_id = c.id;
\`\`\`

Si cambia la forma de calcular el saldo, se cambia solo \`saldos_cliente\`. Por eso PostgreSQL no deja borrar una vista de la que dependen otras (salvo con \`CASCADE\`, que se las lleva todas: cuidado).`,
  },
  {
    id: 'change',
    question: '¿Cómo cambio o borro una vista?',
    conceptId: 'create_view',
    cost: 5,
    body: `- \`CREATE OR REPLACE VIEW nombre AS …\`: cambia la consulta. Puede añadir columnas al final, pero no renombrar ni quitar las que había.
- \`DROP VIEW nombre;\`: la borra (los datos de las tablas no se tocan).
- Si hay que cambiar columnas: \`DROP VIEW\` y \`CREATE VIEW\` otra vez.

Evita \`SELECT *\` dentro de una vista: las columnas se fijan al crearla, y si la tabla cambia, la vista no se entera.`,
  },
  {
    id: 'vs_table',
    question: '¿Vista o tabla copiada?',
    conceptId: 'view_vs_table',
    cost: 5,
    body: `| | Vista | \`CREATE TABLE … AS SELECT\` | Vista materializada |
|---|---|---|---|
| Datos | Siempre al día | Foto del momento | Foto que se refresca a propósito |
| Velocidad | Lo que tarde la consulta | Rápida | Rápida |
| Riesgo | Ninguno | Se queda vieja sin avisar | Hay que acordarse de \`REFRESH\` |

Regla: vista por defecto. Materializada solo cuando una vista es lenta de verdad (medido) y se puede tolerar que los datos tengan unas horas.`,
  },
  {
    id: 'explain',
    question: '¿Qué me cuenta EXPLAIN?',
    conceptId: 'explain_basics',
    cost: 5,
    body: `\`EXPLAIN consulta\` muestra el **plan**: cómo piensa ejecutarla PostgreSQL, sin ejecutarla.

\`\`\`
EXPLAIN SELECT * FROM kpi_clientes WHERE id = 7;
\`\`\`

Qué mirar al principio:
- **Seq Scan on tabla**: la recorre entera (normal en tablas pequeñas).
- **Index Scan**: usa un índice para ir directo.
- **Hash Join / Nested Loop**: cómo une las tablas.
- \`cost\` y \`rows\`: estimaciones, no tiempos reales.

Con una vista, el plan muestra las tablas de debajo: la vista no guarda nada.`,
  },
  {
    id: 'analyze',
    question: '¿Y EXPLAIN ANALYZE?',
    conceptId: 'explain_analyze',
    cost: 5,
    body: `\`EXPLAIN ANALYZE\` **ejecuta la consulta** y muestra el plan con los tiempos y filas reales.

Con un \`SELECT\` no pasa nada. Con un \`INSERT\`, \`UPDATE\` o \`DELETE\`, **hace los cambios**. Si solo quieres medir:

\`\`\`
BEGIN;
EXPLAIN ANALYZE DELETE FROM pagos_tarjeta WHERE id IN (304, 305, 306);
ROLLBACK;
\`\`\``,
  },
]
