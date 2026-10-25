# Misión 9: Tu propia tabla (SQL desde cero)

> Contenido jugable: `frontend/src/features/academy/content/courses/sql-iniciacion/m09-*.ts`
> Ruta: `/academy/sql-iniciacion/m09-crear-tabla`
> Tests: `engine/c5m09.test.ts` (recorrido bueno y malo, formas equivalentes, sondas sin rastro y trampas típicas; cada prueba con su propia base de datos)

## Premisa
Viernes de la semana 2, último día del curso. Entorno de pruebas modificable. Wiki: «Chuleta: crear tablas con reglas».

## Cómo se comprueban los encargos
- **Esquema**: `information_schema.columns` (nombre, tipo y si admite NULL, en orden) y el `column_default`.
- **Sondas** `qa.probar(...)` (`sql/probe.ts`, esquema `qa`, oculto en el explorador): ejecutan INSERT dentro de una subtransacción que siempre se deshace y devuelven `ok` o el SQLSTATE (23514 CHECK, 23502 NOT NULL, 23505 UNIQUE/PK, 23503 clave foránea). No dejan rastro.
- El explorador de tablas se actualiza tras cada ejecución (CREATE/DROP TABLE).

## Encargos

| Encargo | Quién | Hora | Se cumple con (ejemplo) |
|---|---|---|---|
| Tabla etiquetas | Inés | 09:00 | `CREATE TABLE etiquetas (id integer PRIMARY KEY, nombre text NOT NULL)` |
| Tabla casos_prueba | Laura | 09:30 | `id integer PRIMARY KEY, titulo text NOT NULL, prioridad text NOT NULL, estado text NOT NULL DEFAULT 'pendiente'` |
| Solo alta, media o baja | Laura | 10:15 | `ALTER TABLE casos_prueba ADD CHECK (prioridad IN ('alta', 'media', 'baja'))` (o en el CREATE) |
| Tabla ejecuciones | Diego | 11:30 | `caso_id integer NOT NULL REFERENCES casos_prueba(id)`, `resultado … CHECK (resultado IN ('ok', 'fallo'))`, `ejecutada_en date NOT NULL` |
| Tabla lista_vigilancia | Carmen | 12:30 | `cliente_id integer NOT NULL UNIQUE REFERENCES clientes(id)` (vale también como restricción de tabla) |
| Los tres primeros casos | Laura | 13:30 | `INSERT INTO casos_prueba (id, titulo, prioridad) VALUES (1, …), (2, …), (3, …)` (estado por defecto) |
| Borrar la tabla de ensayo | Inés | 14:00 | `DROP TABLE etiquetas` (aparece tras crearla; `DELETE` no vale) |

Trampas que no cumplen: titulo sin NOT NULL, `varchar` en vez de `text`, sin clave primaria, CHECK con `lower()` (acepta «Alta»), ejecuciones sin clave foránea, lista sin UNIQUE, poblar con otro estado.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 11:00 | «Eso ya lo valida la app» | Las reglas en la base de datos protegen frente a scripts, migraciones y otras apps; la transferencia a la 999 entró por falta de clave foránea (`practice.constraints`) | «Sobra»; «hacen la base de datos lenta» |
| 15:00 | Guardar importes y fechas como text | numeric y date validan, ordenan y calculan (`practice.types`) | «Así no hay errores»; «ya se convertirán» |
| 17:00 | Cierre de las dos semanas | Cierre y `preventBugs` | «Reglas solo en la app» |

## Consecuencias
C-HOJA (`reto.casos_prueba`), C-PRIORIDADES (`reto.prioridad`), C-HUERFANAS (`reto.ejecuciones`, alta), C-VIGILANCIA (`reto.vigilancia`, alta), C-SIN-CASOS (`reto.poblar`, baja), C-SOLO-APP (`practice.constraints`, alta) y C-TEXTO (`practice.types`).

## Conceptos
`create_table`, `data_types`, `primary_key`, `not_null_default`, `check_constraint`, `foreign_key`, `unique`, `constraints_why` y `drop_alter`. Nueve microlecciones de Inés y un test de 6 + 6 preguntas.
