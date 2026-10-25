import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 5 · misión 8). */
export const m08Lessons: Lesson[] = [
  {
    id: 'insert',
    question: '¿Cómo añado una fila?',
    conceptId: 'insert',
    cost: 5,
    body: `Con \`INSERT INTO\`, la lista de columnas y los valores **en el mismo orden**:

\`\`\`
INSERT INTO clientes (id, nombre, apellidos, email, ciudad, fecha_alta, segmento)
VALUES (41, 'Prueba', 'QA Kobalto', 'qa.prueba@kobalto.test', 'Madrid', '2026-01-15', 'estandar');
\`\`\`

- Textos y fechas entre comillas simples; números sin comillas.
- Las columnas que no pongas toman su valor por defecto (\`moneda\` → 'EUR') o NULL.
- Una clave foránea tiene que apuntar a algo que exista: primero el cliente, luego su cuenta.`,
  },
  {
    id: 'update',
    question: '¿Cómo cambio datos?',
    conceptId: 'update',
    cost: 5,
    body: `\`\`\`
UPDATE tarjetas
SET estado = 'bloqueada'
WHERE estado = 'activa' AND caduca_en < '2026-01-01';
\`\`\`

- \`SET\` dice qué cambia (varias columnas separadas por comas; puedes usar la propia columna: \`limite_diario = limite_diario * 1.10\`).
- \`WHERE\` dice **a qué filas**. **Sin WHERE se cambian todas.**
- PostgreSQL responde con las filas afectadas: «UPDATE 2». Compruébalo.`,
  },
  {
    id: 'delete',
    question: '¿Cómo borro filas?',
    conceptId: 'delete',
    cost: 5,
    body: `\`DELETE FROM cuentas WHERE id = 53;\`

Igual que UPDATE: **sin WHERE se borra todo**. Y no hay papelera.`,
  },
  {
    id: 'select_first',
    question: '¿Qué hago antes de un UPDATE o un DELETE?',
    conceptId: 'where_first',
    cost: 5,
    body: `Escribe primero el **SELECT con el mismo WHERE**:

\`SELECT id, estado, caduca_en FROM tarjetas WHERE estado = 'activa' AND caduca_en < '2026-01-01';\`

¿Son las filas que esperas? ¿Cuántas? Solo entonces cambia \`SELECT … FROM\` por \`UPDATE … SET\` (o \`DELETE FROM\`) **sin tocar el WHERE**.`,
  },
  {
    id: 'transactions',
    question: '¿Qué es una transacción?',
    conceptId: 'transactions',
    cost: 5,
    body: `Un grupo de cambios que se confirman o se deshacen **juntos**:

\`\`\`
BEGIN;
UPDATE tarjetas SET limite_diario = limite_diario * 1.10 WHERE tipo = 'debito';
SELECT id, limite_diario FROM tarjetas WHERE tipo = 'debito';  -- ¿cuadra?
ROLLBACK;   -- lo deshace todo (o COMMIT para confirmarlo)
\`\`\`

Mientras no hagas \`COMMIT\`, los cambios no son definitivos. Si una sentencia falla dentro de la transacción, queda **abortada**: sal con \`ROLLBACK\`. La consola te avisa si dejas una transacción abierta.`,
  },
  {
    id: 'fk_order',
    question: '¿Por qué no me deja borrar el cliente?',
    conceptId: 'fk_order',
    cost: 5,
    body: `Porque tiene una cuenta que lo referencia (\`cuentas.cliente_id\`). La **clave foránea** impide dejar cuentas huérfanas.

Se borra en orden inverso al de creación: **primero lo que referencia** (la cuenta), **después lo referenciado** (el cliente):

\`\`\`
DELETE FROM cuentas WHERE id = 53;
DELETE FROM clientes WHERE id = 41;
\`\`\``,
  },
  {
    id: 'soft',
    question: '¿Siempre se borra lo que ya no se usa?',
    conceptId: 'soft_delete',
    cost: 5,
    body: `Casi nunca en sistemas reales. Los datos con **historia** (cuentas con movimientos, clientes con contratos) se **marcan**: un estado («cerrada»), una fecha de baja… Es el **borrado lógico**.

Así se conservan el historial, las auditorías y las referencias. El \`DELETE\` de verdad se reserva para datos de prueba o casos muy controlados.`,
  },
]
