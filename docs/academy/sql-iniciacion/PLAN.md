# Curso 5 · SQL desde cero: consulta los datos de verdad

> Nivel: Principiante · Simulador práctico · 10 misiones + evaluación final (examen práctico y test)
> Clave del curso: `sql-iniciacion` · Mundo: Kobalto, el neobanco de los cursos 1–3, visto desde sus datos
> Primer curso de la **ruta SQL** (ver §7): Iniciación → Intermedio → Avanzado → SQL para QA

Sin certificación externa: el curso termina con una **evaluación final propia de ASE** (§6) y el certificado de finalización de ASE Academy.

## 1. Posicionamiento

| | Cursos 1–4 | Curso 5 · SQL desde cero |
|---|---|---|
| Qué se aprende | Testing, automatización y gestión | Consultar y modificar datos con SQL real |
| Cómo | Decisiones en una jornada simulada | **Escribiendo SQL** contra una base de datos PostgreSQL de verdad, dentro del navegador |
| Peso de la práctica | Escenas y apps | La consola SQL es el centro: unas 4–6 consultas por misión; las escenas solo dan contexto y encargos |
| Para quién | QA y equipos | Cualquiera que empieza con SQL: QA, analistas, PO, soporte, desarrolladores junior |

Idea central: **aprender SQL respondiendo a preguntas reales del trabajo**. Cada encargo llega de una persona con una necesidad («¿cuántos clientes de Madrid tienen tarjeta?») y se cumple cuando tu consulta devuelve el resultado correcto. No hay preguntas tipo test durante las misiones: se aprende escribiendo, ejecutando y corrigiendo.

## 2. Historia y personajes

Primer mes de la jugadora como **QA junior en Kobalto**. Inés, la data engineer, le da acceso de lectura a la réplica de la base de datos. Desde ese día le llegan peticiones de todos lados, y a partir de la misión 8 también permiso para modificar datos en el entorno de pruebas.

| Personaje | Rol | Qué le pide al jugador |
|---|---|---|
| **Inés Moreno** (nueva) | Data Engineer · mentora del curso | Acceso, buenas prácticas, revisión de consultas |
| **Marta Sanz** | Product Owner · Pagos | Cifras para reuniones y decisiones de producto |
| **Nuria Vidal** | Atención al cliente | Datos de un cliente concreto, incidencias abiertas |
| **Diego Ruiz** | Backend developer | Verificar datos tras un despliegue o una migración |
| **Carmen López** | Riesgos y Compliance | Listados para auditoría (cuentas bloqueadas, importes altos) |
| **Laura Méndez** | QA Lead | Datos de prueba para sus tests |

## 3. La consola SQL (app `sql-console`)

- **PostgreSQL real** en el navegador con PGlite (`@electric-sql/pglite`, versión fijada). Se descarga solo al abrir una misión del curso (~3 MB comprimido) y arranca en unos segundos con la base de datos de la misión.
- **Explorador del esquema:** tablas, columnas y tipos; un clic inserta el nombre en el editor.
- **Editor** con resaltado de SQL y ejecución con Ctrl/Cmd+Enter. Cada ejecución consume minutos de la jornada.
- **Resultados:** tabla con las filas, número de filas y tiempo. Los errores de PostgreSQL se traducen al español (los más comunes) y señalan la posición.
- **Encargos (retos):** se comprueban solos en cada ejecución. Un encargo se cumple cuando el resultado coincide con el esperado: mismas filas (y mismo orden si el encargo lo pide), aunque la consulta sea distinta. Algunos piden algo más (un alias concreto, no usar `SELECT *`…).
- **Pista** desplegable por encargo y **«Restaurar la base de datos»** en las misiones que modifican datos.
- La partida guarda el resultado de cada ejecución (no hace falta volver a ejecutar SQL para reproducirla).

### Base de datos de Kobalto

Nombres de tablas y columnas en español y sin tildes, para que el alumno se concentre en SQL.

| Tabla | Columnas principales | Filas |
|---|---|---|
| `clientes` | id, nombre, apellidos, email, ciudad, fecha_alta, segmento | 40 |
| `cuentas` | id, cliente_id, iban, tipo, saldo, moneda, abierta_en, estado | 52 |
| `tarjetas` | id, cuenta_id, tipo, limite_diario, estado, caduca_en | 32 |
| `transferencias` | id, cuenta_origen_id, cuenta_destino_id, importe, concepto, estado, creada_en | 120 |
| `incidencias` | id, cliente_id, canal, motivo, abierta_en, cerrada_en | 30 |

Siete ciudades (Madrid, Barcelona, Valencia, Sevilla, Bilbao, Zaragoza y Málaga), sin homónimos exactos. Los datos son deterministas (mismo contenido en cada partida) y tienen **anomalías sembradas** que los encargos ayudan a descubrir: emails duplicados, cuentas con saldo negativo, tarjetas caducadas activas, transferencias sin cuenta de destino…

## 4. Misiones

| # | Misión | SQL que se practica | Encargos (ejemplos) |
|---|---|---|---|
| 0 | **Tu primera consulta** (gratis) | `SELECT`, columnas, `*`, alias `AS`, `LIMIT` | Ver los clientes, solo nombre y email, las cuentas para Marta, columnas con nombre claro para Nuria |
| 1 | **Solo lo que importa** | `WHERE`, `=`, `<>`, `<`, `>`, `AND`, `OR`, `IN`, `BETWEEN` | Clientes de Madrid, cuentas con más de 10.000 €, transferencias de una semana |
| 2 | **Ordenar y buscar** | `ORDER BY` (asc/desc, varias columnas), `LIKE`/`ILIKE`, `DISTINCT` | Las 10 transferencias más altas, clientes cuyo email es de un dominio, ciudades sin repetir |
| 3 | **Los huecos** | `NULL`, `IS NULL`, `COALESCE`, `CASE` | Incidencias sin cerrar, clientes sin segmento, etiquetar saldos |
| 4 | **Contar** | `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `ROUND` | Cuántos clientes, saldo total, transferencia media |
| 5 | **Agrupar** | `GROUP BY`, `HAVING` | Clientes por ciudad, importe por estado, ciudades con más de 3 clientes |
| 6 | **Unir tablas** | `INNER JOIN`, alias de tabla, `JOIN` de tres tablas | Cuentas con el nombre del titular, tarjetas de un cliente |
| 7 | **Lo que falta** | `LEFT JOIN`, anti-join (`WHERE ... IS NULL`), `EXISTS` sencillo | Clientes sin cuenta, cuentas sin movimientos, transferencias a cuentas inexistentes |
| 8 | **Cambiar datos con cuidado** | `INSERT`, `UPDATE`, `DELETE`, `BEGIN`/`ROLLBACK`, comprobar con `SELECT` antes | Dar de alta datos de prueba, bloquear tarjetas caducadas, borrar solo lo que toca |
| 9 | **Tu propia tabla** | `CREATE TABLE`, tipos, `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY` | Tabla de casos de prueba de Laura, restricciones que impiden datos malos |

Cada misión: briefing, encargos que llegan durante la jornada, una reunión con Inés sobre buenas prácticas (decisiones conceptuales: no tirar `SELECT *` sobre millones de filas, comprobar el `WHERE` antes de un `UPDATE`…), cierre y debrief. Test antes y después (6 + 6), microlecciones de Inés y consecuencias de los encargos no hechos («Marta presenta una cifra equivocada»).

## 5. Qué hay que construir

| Pieza | Estado | Notas |
|---|---|---|
| Motor SQL (PGlite) y comprobación de encargos | ✅ M0 | `features/academy/sql/`: arranque perezoso, ejecución, comparación de resultados, traducción de errores |
| App `sql-console` | ✅ M0 | Explorador, editor, resultados, encargos y pistas |
| Base de datos de Kobalto | ✅ M0 | `sql/kobaltoDb.ts`: esquema y datos deterministas con anomalías |
| Mundo | ✅ M0 | `worlds/kobaltoData.ts`: Kobalto + Inés |
| Restaurar la base de datos y encargos de estado | ✅ M8 | Encargos con consultas de verificación (`state`) y patrones obligatorios (`requires`); no cuentan con una transacción abierta |
| Examen práctico | ✅ | Misión `m10-examen` puntuada (`practicalExam` con retos de la consola SQL); datos en `sql/prestamosDb.ts` |
| Test final | ✅ | `exam_bank/sql.py`: 60 preguntas, 12 por bloque (31–35, se muestran 1–5), 6 por bloque en cada intento |

## 6. Evaluación final y certificado

- **Examen práctico** (misión `m10-examen`): una jornada de 3 horas sin pistas ni mentor, con 10 encargos que cubren las misiones 0–9 sobre tablas nuevas (préstamos y cuotas). Nota: 10 puntos por encargo; aprueba con 70.
- **Test** en servidor: 30 preguntas («¿qué devuelve esta consulta?», «¿qué falla en este `UPDATE`?»), 6 por bloque, 40 minutos (50 con tiempo ampliado), aprobado con 21 (70 %), con el mismo sistema de intentos que los demás cursos. Prefijo de certificado `SQL`. Bloques: 1 Consultar y filtrar (M0–M1) · 2 Ordenar y los huecos (M2–M3) · 3 Contar y agrupar (M4–M5) · 4 Unir tablas (M6–M7) · 5 Modificar y crear tablas (M8–M9).
- Informe por bloque y la misión que repasar.
- Certificado de finalización de ASE Academy al terminar las 10 misiones y aprobar el examen práctico y el test. No es una certificación oficial de ninguna entidad.

## 7. Ruta SQL: los tres niveles siguientes

| Curso | Nivel | Qué se aprende | Mecánica nueva |
|---|---|---|---|
| **SQL Intermedio** | Intermedio | Subconsultas, CTE (`WITH`), `UNION`, funciones de fecha y texto, funciones de ventana (`ROW_NUMBER`, `RANK`, `LAG`, totales acumulados), `JOIN` complejos | Informes de negocio de varios pasos; la consola guarda consultas y compara versiones |
| **SQL Avanzado** | Avanzado | Índices y `EXPLAIN ANALYZE`, transacciones y aislamiento, bloqueos, vistas, funciones y procedimientos, modelado y normalización | Base de datos grande con consultas lentas que hay que acelerar; plan de ejecución visual |
| **SQL para QA** | Avanzado (QA) | Datos de prueba (generar, anonimizar, limpiar), validar migraciones y ETL (conteos, diferencias entre esquemas, integridad), testing de bases de datos (constraints, triggers), SQL en tests automatizados | Escenario de migración con discrepancias que hay que encontrar y reportar con el flujo de bugs del simulador |

Cada nivel reutiliza la consola SQL y la base de datos de Kobalto, ampliada.

## 8. Orden de construcción

1. ~~Plan del curso y de la ruta~~ ✅ y ~~Misión 0 · Tu primera consulta~~ ✅ (2026-10-24). Curso registrado como pendiente de traducción; sin ficha en el catálogo.
2. Misiones 1–5 (una sola tabla y agregación): ~~M1 · Solo lo que importa~~ ✅ y ~~M2 · Ordenar y buscar~~ ✅ (2026-10-25), ~~M3 · Los huecos~~ ✅, ~~M4 · Contar~~ ✅ y ~~M5 · Agrupar~~ ✅ (2026-10-25).
3. Misiones 6–7 (JOIN): ~~M6 · Unir tablas~~ ✅ y ~~M7 · Lo que falta~~ ✅ (2026-10-25).
4. Misiones 8–9 (modificar datos y crear tablas): ~~M8 · Cambiar datos con cuidado~~ ✅ (2026-10-25), con restaurar la base de datos, aviso de transacción abierta y encargos de estado; ~~M9 · Tu propia tabla~~ ✅ (2026-10-25), con sondas `qa.probar` para comprobar las reglas.
5. ~~Evaluación final~~ ✅ (2026-10-25): examen práctico `m10-examen` (tablas de préstamos, 10 encargos, 70/100) y test en servidor (banco de 60 preguntas, bloques 31–35, `backend/app/modules/academy/exam_bank/sql.py`); certificado `SQL`. E2E del curso completo en verde.
6. Versión en inglés.
7. Ficha en el catálogo, tráiler y datos de YouTube.
