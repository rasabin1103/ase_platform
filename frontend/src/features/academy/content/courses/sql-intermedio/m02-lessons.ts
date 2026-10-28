import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 6 · misión 2). */
export const m02Lessons: Lesson[] = [
  {
    id: 'trunc',
    question: '¿Cómo agrupo por mes?',
    conceptId: 'date_trunc',
    cost: 5,
    body: `\`DATE_TRUNC\` corta la fecha a la unidad que digas y pone el resto a cero:

\`\`\`
SELECT DATE_TRUNC('month', pagado_en) AS mes,
       COUNT(*) AS pagos,
       SUM(importe) AS total
FROM pagos_tarjeta
WHERE estado = 'aceptado'
GROUP BY DATE_TRUNC('month', pagado_en)
ORDER BY mes;
\`\`\`

\`'2025-03-19 09:35:47'\` → \`'2025-03-01 00:00:00'\`. Unidades: \`'year'\`, \`'month'\`, \`'week'\`, \`'day'\`, \`'hour'\`. El resultado sigue siendo una fecha: se ordena bien.`,
  },
  {
    id: 'extract',
    question: '¿Cómo saco el día de la semana o la hora?',
    conceptId: 'date_extract',
    cost: 5,
    body: `\`EXTRACT(parte FROM fecha)\` devuelve un número:

- \`YEAR\`, \`MONTH\`, \`DAY\`, \`HOUR\`, \`MINUTE\`.
- \`ISODOW\`: día de la semana de 1 (lunes) a 7 (domingo). (\`DOW\` va de 0, domingo, a 6, sábado.)

\`\`\`
WHERE EXTRACT(ISODOW FROM pagado_en) IN (6, 7)   -- fin de semana
WHERE EXTRACT(HOUR FROM pagado_en) < 6           -- de 00:00 a 05:59
\`\`\``,
  },
  {
    id: 'intervals',
    question: '¿Cómo resto un año a una fecha?',
    conceptId: 'intervals',
    cost: 5,
    body: `Con un \`INTERVAL\`:

\`\`\`
WHERE fecha_alta <= DATE '2026-03-01' - INTERVAL '1 year'
\`\`\`

Otros: \`INTERVAL '30 days'\`, \`INTERVAL '2 hours'\`. Para la edad exacta entre dos fechas, \`AGE(fin, inicio)\` (por ejemplo \`2 years 3 mons 4 days\`), y \`EXTRACT(YEAR FROM AGE(…))\` da los años cumplidos.

En la réplica, «hoy» es el **1 de marzo de 2026**: no uses \`CURRENT_DATE\`, que cambia cada día y haría que el resultado también cambiase.`,
  },
  {
    id: 'ranges',
    question: '¿Cómo filtro un mes concreto?',
    conceptId: 'date_ranges',
    cost: 5,
    body: `Con un **rango**, desde el primer día incluido hasta el primer día del mes siguiente sin incluir:

\`\`\`
WHERE pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'
\`\`\`

Cuidado con \`EXTRACT(MONTH FROM pagado_en) = 2\`: coge **todos los febreros**, de cualquier año. Útil para «¿qué pasa en febrero en general?», no para «febrero de 2026».`,
  },
  {
    id: 'format',
    question: '¿Y para mostrar la fecha bonita?',
    conceptId: 'format_last',
    cost: 5,
    body: `\`TO_CHAR(fecha, formato)\` la convierte en **texto**: \`TO_CHAR(pagado_en, 'DD/MM/YYYY HH24:MI')\`.

Al ser texto, se ordena letra a letra: \`'01/2026'\` va antes que \`'02/2025'\`. Regla: **calcula, agrupa y ordena con la fecha**; usa \`TO_CHAR\` solo para mostrar, al final. Si tienes que ordenar texto, usa un formato que vaya de lo grande a lo pequeño: \`'YYYY-MM'\`.`,
  },
  {
    id: 'text',
    question: '¿Qué funciones de texto hay?',
    conceptId: 'text_functions',
    cost: 5,
    body: `Las más usadas:

- \`UPPER(t)\`, \`LOWER(t)\`: mayúsculas y minúsculas. \`INITCAP(t)\`: primera letra de cada palabra.
- \`LENGTH(t)\`: número de caracteres.
- \`t1 || ' ' || t2\`: concatenar (con NULL, todo NULL; usa \`CONCAT\` o \`COALESCE\`).
- \`SPLIT_PART(t, '@', 2)\`: el trozo 2 al partir por \`@\` (el dominio de un email).
- \`SUBSTRING(t FROM 1 FOR 3)\`, \`REPLACE(t, 'a', 'b')\`.

Para comparar sin mayúsculas: \`LOWER(email) = LOWER('Ana@Mail.com')\` o \`ILIKE\`.`,
  },
  {
    id: 'trim',
    question: '¿Cómo encuentro textos con espacios de más?',
    conceptId: 'trim_clean',
    cost: 5,
    body: `\`TRIM(t)\` quita los espacios del principio y del final (\`LTRIM\` y \`RTRIM\`, solo de un lado). Para encontrar los que los tienen:

\`\`\`
SELECT id, nombre, TRIM(nombre) AS limpio
FROM comercios
WHERE nombre <> TRIM(nombre);
\`\`\`

Los espacios no se ven en pantalla, pero hacen que \`nombre = 'Café Central'\` no encuentre nada. Un QA los busca antes de que los encuentre un cliente.`,
  },
]
