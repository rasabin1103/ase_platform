# Misión 0: Tu primera consulta (SQL desde cero · gratis)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-iniciacion/m00-*.ts`
> App: `frontend/src/features/academy/apps/sql-console/` (pestaña «Consola SQL») · Motor: `frontend/src/features/academy/sql/`
> Ruta: `/academy/sql-iniciacion/m00-primera-consulta`
> Tests: `sql/sql.test.ts` (motor, base de datos y encargos contra PostgreSQL real), `engine/c5m00.test.ts` y el recorrido completo de `engine/coursePlaythrough.test.ts`

## Premisa
Lunes, primera semana como QA junior en Kobalto. Inés (Data Engineer) le da acceso de **solo lectura** a la réplica de la base de datos. A lo largo del día llegan peticiones de Marta (PO), Nuria (atención al cliente) y Diego (backend). Wiki: «Cómo es la base de datos de Kobalto».

## Consola SQL
PostgreSQL real (PGlite) con la base de datos de Kobalto: explorador de tablas, editor con resaltado (Ctrl/Cmd+Enter) y resultados; errores traducidos al español; réplica de solo lectura (un `DELETE` da «La réplica es de solo lectura»). Cada ejecución cuesta 2 minutos.

| Encargo | Quién | Cuándo aparece | Se cumple con (ejemplo) |
|---|---|---|---|
| Tu primera consulta | Inés | Al empezar | `SELECT * FROM clientes` |
| Solo lo que necesitas | Inés | Al empezar | `SELECT nombre, apellidos, email FROM clientes` |
| Las cuentas para la reunión | Marta | 09:30 | `SELECT iban, tipo, saldo FROM cuentas` |
| Columnas con nombre claro | Nuria | 11:30 | `SELECT nombre AS cliente, ciudad, fecha_alta AS alta FROM clientes` (columnas exactas) |
| Un vistazo a las transferencias | Diego | 13:00 | `SELECT * FROM transferencias LIMIT 5` (5 filas, todas las columnas) |

Se compara el **resultado**, no el texto: cualquier consulta que devuelva las mismas filas y columnas vale. Un encargo solo cuenta si ya ha llegado.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Inés: acceso y dos encargos | Leer la wiki | — |
| — | Inés, Marta, Nuria y Diego agradecen cada encargo cumplido | `reto.*` | — |
| 11:00 | Café con Inés: «la tabla tiene 40 millones de filas, ¿cómo la exploras?» | LIMIT y solo las columnas necesarias (`practice.limit`) | `SELECT *` entero; pedir un Excel |
| 15:00 | Inés: `SELECT nombre email FROM clientes` devuelve nombres en «email» | Falta la coma: «email» es un alias (`practice.comma`) | «No existe la columna»; «un bug de la base de datos» |
| 17:00 | Cierre con Inés | Cierre y `preventBugs` | «Exportarlo todo a Excel» |

## Consecuencias

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-MARTA · Marta va a la reunión sin las cifras | `reto.cuentas` | alta |
| C-NURIA · el informe sale con columnas ilegibles | `reto.alias` | media |
| C-DIEGO · Diego programa sin ver los datos | `reto.vistazo` | media |
| C-REPLICA · un `SELECT *` de 40 millones de filas satura la réplica | `practice.limit` | alta |
| C-COMA · un informe con nombres en la columna «email» | `practice.comma` | media |

## Conceptos
`select_from`, `select_columns`, `column_alias`, `limit_rows`, `sql_errors` y `readonly_replica`. Seis microlecciones de Inés y un test de 6 + 6 preguntas.
