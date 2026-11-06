# Curso 8 · SQL para QA: probar con la base de datos

> Nivel: Avanzado · Simulador práctico · 10 misiones + evaluación final (examen práctico y test)
> Clave del curso: `sql-qa` · Mundo: Kobalto, cuarto mes, ahora en el equipo de QA
> Cuarto curso de la **ruta SQL** (serie): Iniciación → Intermedio → Avanzado → **SQL para QA**
> Español e inglés desde el principio (overlay `en/`, como los demás cursos).

Mismo formato que «SQL avanzado» (`docs/academy/sql-avanzado/PLAN.md`): PostgreSQL real en el navegador (consola SQL), encargos que se comprueban por su resultado o por el estado de la base de datos, dos reuniones con decisiones por misión, lecciones, test antes y después, consecuencias y debrief. Mentora: **Laura** (QA Lead). Piden cosas Marta (Producto), Carmen (Riesgos), Nuria (Atención), Diego (Backend) e Inés (Datos).

## 1. Acceso

De pago, como el resto de la ruta: la misión 0 es demo abierta; el resto se compra o viene en un plan. En el catálogo: serie «Ruta SQL», orden 4, con `academy_course_key = sql-qa`.

## 2. Posicionamiento

El alumno ya sabe SQL. Aquí aprende a **usarlo para probar**: comprobar lo que hizo la app, fabricar datos de prueba, escribir comprobaciones que deben dar cero, conciliar, validar migraciones, probar informes, estados, reglas y rendimiento.

## 3. Base de datos: Kobalto QA (`frontend/src/features/academy/sql/kobaltoQaDb.ts`)

Kobalto ampliada + préstamos + sondas `qa.probar` / `qa.efecto` + tablas por misión. Foto de datos: **2026-03-02 12:00** (`QA_TODAY`). Defectos sembrados:

| Misión | Tablas | Defectos |
|---|---|---|
| m00 | `ejecuciones`, `apuntes`, `saldos_antes`, `auditoria` | 1007 guardada con 300 (pidió 30), 1003 sin abono, 1004 hecha con error en pantalla, 1006 sin auditoría, cuenta 9 con +250 |
| m01 | pagos 401–432, `altas_web`, incidencias 31–33, tarjeta 33 | 28 de febrero por la tarde, NULL, JOIN que multiplica, emails con mayúsculas/espacios |
| m03 | transferencias 2001–2002, incidencia 5, cuenta 28 | destinos inexistentes, cierre antes de apertura, ahorro negativo |
| m04 | `liquidaciones` | faltan 406 y 418, sobra 999, 410 (+0,01), 415 (+10), 420 duplicada, 413 devuelta liquidada |
| m05 | `ciudades`, `clientes_v2`, `cuentas_v2` | falta 17, sobra 9999, nombres, emails, segmentos, ciudad, céntimos (17 sin signo) |
| m06 | `comercio_categorias`, vista `informe_comercios_febrero` | cuenta devueltos, BETWEEN corta el 28, comercio 14 con dos categorías, floristería ausente |
| m07 | `ordenes`, `ordenes_historial`, `transiciones_validas` | 4 vuelve a pendiente, 7 salta pendiente, 10 la repite, 11 no coincide, 16 atascada, 20 sin creada, 21 sin historial |
| m08 | `solicitudes` + trigger, `probar()` / `efecto()` | importe excluye 1000 y 60000, plazo y cliente admiten NULL, falta «en_estudio», sin «una abierta», trigger solo en INSERT |
| m09 | `log_consultas`, `planes_capturados`, `indices_esperados` | Q2 y Q5 más lentas, Q3 y Q8 N+1, Q7 y Q8 nuevas, faltan 2 índices, 3 estimaciones malas |

## 4. Misiones

| # | Misión | Reuniones (buena práctica) |
|---|---|---|
| m00 | Lo que hizo la app (demo) | comprobar valores, no solo existencia · aislar la ejecución |
| m01 | Los bordes | rangos semiabiertos · cardinalidad de los JOIN |
| m02 | Datos de prueba (modificable) | datos identificables · independencia de las pruebas |
| m03 | Consultas que deben dar cero | sin ruido · filas, no recuentos |
| m04 | Conciliar dos fuentes | fila a fila, no totales · los dos lados |
| m05 | Validar una migración | claves, no recuentos · IS DISTINCT FROM |
| m06 | Probar un informe | oráculo independiente · casos por clase |
| m07 | Estados y transiciones | LAG con PARTITION BY · fecha de referencia fija |
| m08 | Probar las reglas (modificable) | por los dos lados · pruebas que se deshacen |
| m09 | Regresiones de rendimiento | media por llamada · volumen de producción |
| m10 | Examen práctico | 10 encargos (uno por misión), 3 h, aprueba con 70/100 |

Cada misión: 6 encargos (5 con consecuencia + el primero de Laura), 7 conceptos, 7 lecciones, test 6 + 6, 7 consecuencias (5 encargos + 2 reuniones).

## 5. Evaluación final

- Examen práctico `m10-examen`: 8 consultas, 1 de datos de prueba (incidencias 9301–9330) y 1 con `probar` que no debe dejar rastro.
- Test teórico en el servidor: `backend/app/modules/academy/exam_bank/sql_qa.py` (+ `sql_qa_en.py`), 60 preguntas, bloques 61–65 (se muestran 1–5), 6 por sección; 30 por intento, 40 min (50 ampliado), aprueba con 21.
- Certificado `ASE-SQQ-…`, «no es una certificación oficial».

## 6. Pruebas

- `frontend/src/features/academy/engine/c8m00.test.ts` … `c8m10.test.ts` (día bueno, datos, trampas, día malo, conceptos) y `en/parity.test.ts`.
- Backend: `tests/test_academy_exam_bank.py`, `tests/test_academy_exam.py`.
- E2E: `e2e/academy.spec.ts -g sql-qa` (es y en).
