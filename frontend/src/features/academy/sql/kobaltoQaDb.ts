/**
 * Kobalto QA para el curso «SQL para QA»: Kobalto ampliada (clientes, cuentas,
 * tarjetas, transferencias, incidencias, comercios, pagos con tarjeta), los
 * préstamos y cuotas, y lo que necesita un QA para probar con SQL:
 *
 * - m00 · `ejecuciones` (dos ejecuciones de pruebas de la app: R-0305 y
 *   R-0306), sus transferencias (991–993 y 1001–1007), `apuntes` (partida
 *   doble), `saldos_antes` (foto antes de R-0306) y `auditoria`. Defectos:
 *   1007 guardada con 300 € (la app pidió 30), 1003 sin el apunte de abono,
 *   1004 hecha aunque la app dio error, 1006 sin auditoría y la cuenta 9 con
 *   250 € de más.
 * - m01 · 32 pagos más en febrero de 2026 (401–432, dos el 28 por la tarde) y
 *   `altas_web` con emails repetidos que solo cambian en mayúsculas o espacios.
 * - m03 · transferencias a cuentas que no existen (2001, 2002), la incidencia 5
 *   cerrada antes de abrirse y la cuenta de ahorro 28 en negativo.
 * - m04 · `liquidaciones` del procesador de tarjetas para los pagos aceptados
 *   de febrero, con faltas, sobras, importes distintos, un duplicado y un pago
 *   devuelto liquidado.
 * - m05 · `ciudades`, `clientes_v2` y `cuentas_v2`: una migración con defectos.
 * - m06 · `comercio_categorias` y la vista con errores `informe_comercios_febrero`.
 * - m07 · `ordenes`, `ordenes_historial` y `transiciones_validas`: la 4 vuelve
 *   a pendiente, la 7 salta pendiente, la 10 la repite, la 11 no coincide con
 *   su historial, la 16 lleva días pendiente, la 20 no empieza en creada y la
 *   21 no tiene historial.
 * - m08 · `solicitudes` con reglas incompletas, y las funciones públicas de
 *   prueba `probar(…)` y `efecto(…)`.
 * - m09 · `log_consultas`, `planes_capturados` e `indices_esperados`.
 *
 * Todo determinista. Personas y datos ficticios. Ver docs/academy/sql-qa/PLAN.md.
 */
import { QA_SQL } from './kobaltoAvanzadaDb'
import { kobaltoPagosDbSql } from './kobaltoPagosDb'
import { PROBE_SQL } from './probe'
import { prestamosDbSql } from './prestamosDb'

/** «Hoy» en el curso: lunes 2 de marzo de 2026, a mediodía. */
export const QA_TODAY = '2026-03-02 12:00'

export const QA_SCHEMA_SQL = `
CREATE TABLE ejecuciones (
  id integer PRIMARY KEY,
  ejecucion text NOT NULL,
  caso text NOT NULL,
  accion text NOT NULL,
  referencia text NOT NULL,
  cuenta_origen_id integer,
  cuenta_destino_id integer,
  importe numeric(12,2),
  resultado_ui text NOT NULL,
  ejecutada_en timestamp NOT NULL
);
CREATE TABLE apuntes (
  id integer PRIMARY KEY,
  cuenta_id integer NOT NULL REFERENCES cuentas(id),
  transferencia_id integer NOT NULL,
  importe numeric(12,2) NOT NULL,
  creado_en timestamp NOT NULL
);
CREATE TABLE saldos_antes (
  cuenta_id integer PRIMARY KEY,
  saldo numeric(12,2) NOT NULL,
  tomado_en timestamp NOT NULL
);
CREATE TABLE auditoria (
  id integer PRIMARY KEY,
  tabla text NOT NULL,
  registro_id integer NOT NULL,
  accion text NOT NULL,
  usuario text NOT NULL,
  cuando timestamp NOT NULL
);
CREATE TABLE altas_web (
  id integer PRIMARY KEY,
  email text NOT NULL,
  creada_en timestamp NOT NULL
);
CREATE TABLE liquidaciones (
  id integer PRIMARY KEY,
  lote text NOT NULL,
  pago_id integer NOT NULL,
  fecha_operacion date NOT NULL,
  importe numeric(10,2) NOT NULL
);
CREATE TABLE ciudades (
  id integer PRIMARY KEY,
  nombre text NOT NULL
);
CREATE TABLE clientes_v2 (
  id integer PRIMARY KEY,
  nombre_completo text NOT NULL,
  email text,
  ciudad_id integer,
  segmento text NOT NULL,
  alta date NOT NULL
);
CREATE TABLE cuentas_v2 (
  id integer PRIMARY KEY,
  cliente_id integer NOT NULL,
  iban text NOT NULL,
  saldo_centimos bigint NOT NULL
);
CREATE TABLE comercio_categorias (
  comercio_id integer NOT NULL,
  categoria text NOT NULL
);
CREATE TABLE ordenes (
  id integer PRIMARY KEY,
  cliente_id integer NOT NULL,
  importe numeric(12,2) NOT NULL,
  estado text NOT NULL,
  creada_en timestamp NOT NULL
);
CREATE TABLE ordenes_historial (
  id integer PRIMARY KEY,
  orden_id integer NOT NULL,
  estado text NOT NULL,
  cambiado_en timestamp NOT NULL
);
CREATE TABLE transiciones_validas (
  desde text NOT NULL,
  hasta text NOT NULL,
  PRIMARY KEY (desde, hasta)
);
CREATE TABLE solicitudes (
  id serial PRIMARY KEY,
  cliente_id integer REFERENCES clientes(id),
  importe numeric(12,2) NOT NULL CHECK (importe > 1000 AND importe < 60000),
  plazo_meses integer CHECK (plazo_meses IN (12, 24, 36, 48, 60)),
  estado text NOT NULL CHECK (estado IN ('abierta', 'aprobada', 'rechazada', 'cancelada')),
  revisada_en timestamp
);
CREATE TABLE log_consultas (
  version text NOT NULL,
  consulta_id text NOT NULL,
  texto text NOT NULL,
  llamadas integer NOT NULL,
  tiempo_total_ms numeric(12,1) NOT NULL,
  peticiones integer NOT NULL,
  PRIMARY KEY (version, consulta_id)
);
CREATE TABLE planes_capturados (
  version text NOT NULL,
  consulta_id text NOT NULL,
  filas_estimadas integer NOT NULL,
  filas_reales integer NOT NULL,
  PRIMARY KEY (version, consulta_id)
);
CREATE TABLE indices_esperados (
  tabla text NOT NULL,
  indice text NOT NULL,
  PRIMARY KEY (tabla, indice)
);
`

/** m00 · Dos ejecuciones de pruebas de la app y lo que dejaron en la base de datos. */
const EJECUCIONES_SQL = `
INSERT INTO ejecuciones VALUES
(1, 'R-0305', 'T-01', 'transferencia', 'REF-0991', 3, 5, 20.00, 'ok', '2026-03-01 16:00:00'),
(2, 'R-0305', 'T-02', 'transferencia', 'REF-0992', 5, 3, 15.00, 'ok', '2026-03-01 16:02:00'),
(3, 'R-0305', 'T-03', 'transferencia', 'REF-0993', 7, 9, 10.00, 'ok', '2026-03-01 16:04:00'),
(4, 'R-0306', 'T-01', 'transferencia', 'REF-1001', 3, 5, 100.00, 'ok', '2026-03-02 10:00:00'),
(5, 'R-0306', 'T-02', 'transferencia', 'REF-1002', 7, 9, 250.00, 'ok', '2026-03-02 10:04:00'),
(6, 'R-0306', 'T-03', 'transferencia', 'REF-1003', 3, 12, 75.50, 'ok', '2026-03-02 10:08:00'),
(7, 'R-0306', 'T-04', 'transferencia', 'REF-1004', 5, 7, 40.00, 'error', '2026-03-02 10:12:00'),
(8, 'R-0306', 'T-05', 'transferencia', 'REF-1005', 9, 3, 500.00, 'error', '2026-03-02 10:16:00'),
(9, 'R-0306', 'T-06', 'transferencia', 'REF-1006', 12, 9, 60.00, 'ok', '2026-03-02 10:20:00'),
(10, 'R-0306', 'T-07', 'transferencia', 'REF-1007', 7, 5, 30.00, 'ok', '2026-03-02 10:24:00');

INSERT INTO transferencias (id, cuenta_origen_id, cuenta_destino_id, importe, concepto, estado, creada_en) VALUES
(991, 3, 5, 20.00, 'REF-0991', 'completada', '2026-03-01 16:00:03'),
(992, 5, 3, 15.00, 'REF-0992', 'completada', '2026-03-01 16:02:03'),
(993, 7, 9, 10.00, 'REF-0993', 'completada', '2026-03-01 16:04:03'),
(1001, 3, 5, 100.00, 'REF-1001', 'completada', '2026-03-02 10:00:02'),
(1002, 7, 9, 250.00, 'REF-1002', 'completada', '2026-03-02 10:04:02'),
(1003, 3, 12, 75.50, 'REF-1003', 'completada', '2026-03-02 10:08:02'),
(1004, 5, 7, 40.00, 'REF-1004', 'completada', '2026-03-02 10:12:31'),
(1006, 12, 9, 60.00, 'REF-1006', 'completada', '2026-03-02 10:20:02'),
(1007, 7, 5, 300.00, 'REF-1007', 'completada', '2026-03-02 10:24:02');

INSERT INTO apuntes VALUES
(9001, 3, 991, -20.00, '2026-03-01 16:00:03'), (9002, 5, 991, 20.00, '2026-03-01 16:00:03'),
(9003, 5, 992, -15.00, '2026-03-01 16:02:03'), (9004, 3, 992, 15.00, '2026-03-01 16:02:03'),
(9005, 7, 993, -10.00, '2026-03-01 16:04:03'), (9006, 9, 993, 10.00, '2026-03-01 16:04:03'),
(9101, 3, 1001, -100.00, '2026-03-02 10:00:02'), (9102, 5, 1001, 100.00, '2026-03-02 10:00:02'),
(9103, 7, 1002, -250.00, '2026-03-02 10:04:02'), (9104, 9, 1002, 250.00, '2026-03-02 10:04:02'),
(9105, 3, 1003, -75.50, '2026-03-02 10:08:02'),
(9106, 5, 1004, -40.00, '2026-03-02 10:12:31'), (9107, 7, 1004, 40.00, '2026-03-02 10:12:31'),
(9108, 12, 1006, -60.00, '2026-03-02 10:20:02'), (9109, 9, 1006, 60.00, '2026-03-02 10:20:02'),
(9110, 7, 1007, -300.00, '2026-03-02 10:24:02'), (9111, 5, 1007, 300.00, '2026-03-02 10:24:02');

-- R-0305 ya está en los saldos cuando se toma la foto de antes de R-0306.
UPDATE cuentas SET saldo = saldo - 5 WHERE id = 3;
UPDATE cuentas SET saldo = saldo + 5 WHERE id = 5;
UPDATE cuentas SET saldo = saldo - 10 WHERE id = 7;
UPDATE cuentas SET saldo = saldo + 10 WHERE id = 9;
INSERT INTO saldos_antes SELECT id, saldo, '2026-03-02 09:55:00' FROM cuentas;
-- R-0306 (la cuenta 9 recibe la 1002 dos veces).
UPDATE cuentas SET saldo = saldo - 175.50 WHERE id = 3;
UPDATE cuentas SET saldo = saldo + 360.00 WHERE id = 5;
UPDATE cuentas SET saldo = saldo - 510.00 WHERE id = 7;
UPDATE cuentas SET saldo = saldo + 560.00 WHERE id = 9;
UPDATE cuentas SET saldo = saldo - 60.00 WHERE id = 12;

INSERT INTO auditoria VALUES
(1, 'transferencias', 991, 'alta', 'app', '2026-03-01 16:00:03'),
(2, 'transferencias', 992, 'alta', 'app', '2026-03-01 16:02:03'),
(3, 'transferencias', 993, 'alta', 'app', '2026-03-01 16:04:03'),
(4, 'transferencias', 1001, 'alta', 'app', '2026-03-02 10:00:02'),
(5, 'transferencias', 1002, 'alta', 'app', '2026-03-02 10:04:02'),
(6, 'transferencias', 1003, 'alta', 'app', '2026-03-02 10:08:02'),
(7, 'transferencias', 1004, 'alta', 'app', '2026-03-02 10:12:31'),
(8, 'transferencias', 1007, 'alta', 'app', '2026-03-02 10:24:02');
`

/** m01 · Más pagos en febrero (dos el 28 por la tarde) y altas con emails repetidos. */
const BORDES_SQL = `
INSERT INTO pagos_tarjeta (id, tarjeta_id, comercio_id, importe, estado, pagado_en)
SELECT 400 + g,
       CASE WHEN 1 + (g * 7) % 31 = 12 THEN 30 ELSE 1 + (g * 7) % 31 END,
       1 + (g * 5) % 21,
       ROUND(12 + (g * 37) % 180 + g * 0.13, 2),
       CASE WHEN g % 10 = 3 THEN 'devuelto' WHEN g % 10 = 7 THEN 'rechazado' ELSE 'aceptado' END,
       TIMESTAMP '2026-02-01 09:00' + (g - 1) * INTERVAL '22 hours 17 minutes'
FROM generate_series(1, 30) AS g;
INSERT INTO pagos_tarjeta (id, tarjeta_id, comercio_id, importe, estado, pagado_en) VALUES
(431, 5, 14, 89.90, 'aceptado', '2026-02-28 18:20:00'),
(432, 9, 3, 6.45, 'aceptado', '2026-02-28 21:05:00');

-- Clientes con varias incidencias (un JOIN con incidencias repite sus pagos).
INSERT INTO incidencias (id, cliente_id, canal, motivo, abierta_en, cerrada_en) VALUES
(31, 3, 'chat', 'Comisión no reconocida', '2026-02-10 10:00', '2026-02-11 10:00'),
(32, 3, 'telefono', 'Tarjeta bloqueada', '2026-02-20 12:00', NULL),
(33, 7, 'email', 'Acceso a la app', '2026-02-22 09:00', '2026-02-22 15:00');
-- Una tarjeta nueva sin ningún pago.
INSERT INTO tarjetas (id, cuenta_id, tipo, limite_diario, estado, caduca_en) VALUES (33, 50, 'debito', 600.00, 'activa', '2028-06-30');

INSERT INTO altas_web VALUES
(1, 'ana.garcia@mail.com', '2026-02-03 10:00'),
(2, ' Ana.Garcia@mail.com', '2026-02-03 10:02'),
(3, 'ANA.GARCIA@MAIL.COM ', '2026-02-04 18:30'),
(4, 'pablo.ruiz@mail.com', '2026-02-05 09:10'),
(5, 'lucia.mora@mail.com', '2026-02-06 12:00'),
(6, 'Lucia.Mora@Mail.com', '2026-02-06 12:01'),
(7, 'hugo.paz@mail.com', '2026-02-10 08:45'),
(8, 'elena.vidal@mail.com', '2026-02-11 19:20'),
(9, 'elena.vidal@mail.com', '2026-02-11 19:20'),
(10, 'ivan.soto@mail.com', '2026-02-12 11:11');
`

/** m03 · Datos que una aserción tiene que encontrar. */
const ANOMALIAS_SQL = `
INSERT INTO transferencias (id, cuenta_origen_id, cuenta_destino_id, importe, concepto, estado, creada_en) VALUES
(2001, 3, 99, 120.00, 'Pago proveedor', 'completada', '2026-02-10 11:00'),
(2002, 5, 77, 45.90, 'Devolución', 'completada', '2026-02-12 17:30');
UPDATE incidencias SET cerrada_en = abierta_en - INTERVAL '2 hours' WHERE id = 5;
UPDATE cuentas SET saldo = -12.40 WHERE id = 28;
`

/** m04 · Lo que dice el procesador de tarjetas de los pagos aceptados de febrero. */
const LIQUIDACIONES_SQL = `
INSERT INTO liquidaciones (id, lote, pago_id, fecha_operacion, importe)
SELECT ROW_NUMBER() OVER (ORDER BY id), 'L-' || to_char(pagado_en, 'MMDD'), id, pagado_en::date, importe
FROM pagos_tarjeta
WHERE estado = 'aceptado' AND pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01' AND id NOT IN (406, 418);
-- Sobra: un pago que no existe, el mismo día y por el mismo importe que el 406 que falta.
INSERT INTO liquidaciones SELECT 101, 'L-' || to_char(pagado_en, 'MMDD'), 999, pagado_en::date, importe FROM pagos_tarjeta WHERE id = 406;
-- Duplicado, devuelto liquidado e importes distintos.
INSERT INTO liquidaciones SELECT 102, 'L-' || to_char(pagado_en, 'MMDD'), id, pagado_en::date, importe FROM pagos_tarjeta WHERE id = 420;
INSERT INTO liquidaciones SELECT 103, 'L-' || to_char(pagado_en, 'MMDD'), id, pagado_en::date, importe FROM pagos_tarjeta WHERE id = 413;
UPDATE liquidaciones SET importe = importe + 0.01 WHERE pago_id = 410;
UPDATE liquidaciones SET importe = importe + 10.00 WHERE pago_id = 415;
`

/** m05 · La migración de clientes y cuentas al nuevo esquema, con defectos. */
const MIGRACION_SQL = `
INSERT INTO ciudades VALUES (1, 'Madrid'), (2, 'Barcelona'), (3, 'Valencia'), (4, 'Sevilla'), (5, 'Bilbao'), (6, 'Zaragoza'), (7, 'Málaga');
INSERT INTO clientes_v2 (id, nombre_completo, email, ciudad_id, segmento, alta)
SELECT c.id, c.nombre || ' ' || c.apellidos, lower(trim(c.email)), ci.id, COALESCE(c.segmento, 'sin_segmento'), c.fecha_alta
FROM clientes c JOIN ciudades ci ON ci.nombre = c.ciudad
WHERE c.id <> 17;
INSERT INTO clientes_v2 VALUES (9999, 'Prueba Migración', 'prueba@kobalto.test', 1, 'estandar', '2026-03-01');
UPDATE clientes_v2 SET nombre_completo = (SELECT nombre FROM clientes WHERE id = 8) WHERE id = 8;
UPDATE clientes_v2 SET email = 'cliente22@kobalto.local' WHERE id = 22;
UPDATE clientes_v2 SET email = NULL WHERE id = 30;
UPDATE clientes_v2 SET segmento = 'estandar' WHERE id = (SELECT MIN(id) FROM clientes WHERE segmento IS NULL);
UPDATE clientes_v2 SET segmento = 'estandar' WHERE id = (SELECT MIN(id) FROM clientes WHERE segmento = 'premium');
UPDATE clientes_v2 SET ciudad_id = 7 WHERE id = (SELECT MIN(id) FROM clientes WHERE ciudad = 'Bilbao');

INSERT INTO cuentas_v2 (id, cliente_id, iban, saldo_centimos)
SELECT id, cliente_id, replace(iban, ' ', ''), ROUND(saldo * 100)::bigint FROM cuentas;
UPDATE cuentas_v2 SET saldo_centimos = (SELECT ROUND(saldo)::bigint FROM cuentas WHERE id = 21) WHERE id = 21;
UPDATE cuentas_v2 SET saldo_centimos = saldo_centimos - 1 WHERE id = 33;
UPDATE cuentas_v2 SET saldo_centimos = abs(saldo_centimos) WHERE id = 17;
`

/** m06 · El informe de comercios de febrero, con sus errores. */
const INFORME_SQL = `
INSERT INTO comercio_categorias SELECT id, categoria FROM comercios WHERE categoria IS NOT NULL;
INSERT INTO comercio_categorias VALUES (14, 'tecnologia');
CREATE VIEW informe_comercios_febrero AS
SELECT c.id AS comercio_id, c.nombre, COUNT(*) AS pagos, SUM(p.importe) AS total
FROM pagos_tarjeta p
JOIN comercios c ON c.id = p.comercio_id
JOIN comercio_categorias cc ON cc.comercio_id = c.id
WHERE p.estado <> 'rechazado'
  AND p.pagado_en BETWEEN '2026-02-01' AND '2026-02-28'
GROUP BY c.id, c.nombre;
`

/** m07 · Órdenes de pago y su historial de estados. */
const ESTADOS_SQL = `
INSERT INTO transiciones_validas VALUES
('creada', 'pendiente'), ('pendiente', 'completada'), ('pendiente', 'rechazada'), ('pendiente', 'cancelada');
INSERT INTO ordenes (id, cliente_id, importe, estado, creada_en)
SELECT o, 1 + (o * 3) % 37, ROUND(50 + o * 23.75, 2),
       CASE WHEN o % 6 = 0 THEN 'rechazada' ELSE 'completada' END,
       TIMESTAMP '2026-02-20 09:00' + o * INTERVAL '1 hour'
FROM generate_series(1, 20) AS o;
CREATE TEMP TABLE h_tmp (orden_id integer, paso integer, estado text, cambiado_en timestamp);
INSERT INTO h_tmp SELECT id, 1, 'creada', creada_en FROM ordenes;
INSERT INTO h_tmp SELECT id, 2, 'pendiente', creada_en + INTERVAL '2 minutes' FROM ordenes;
INSERT INTO h_tmp SELECT id, 3, estado, creada_en + ((id % 5) * 20 + 5) * INTERVAL '1 minute' FROM ordenes;
-- 4: vuelve a pendiente después de completada.
INSERT INTO h_tmp SELECT 4, 4, 'pendiente', creada_en + INTERVAL '1 day' FROM ordenes WHERE id = 4;
-- 7: de creada a completada sin pasar por pendiente.
DELETE FROM h_tmp WHERE orden_id = 7 AND paso = 2;
-- 10: pendiente dos veces seguidas.
UPDATE h_tmp SET paso = 4 WHERE orden_id = 10 AND paso = 3;
INSERT INTO h_tmp SELECT 10, 3, 'pendiente', creada_en + INTERVAL '4 minutes' FROM ordenes WHERE id = 10;
-- 16 y 19: siguen pendientes (la 16 desde el 25 de febrero; la 19, desde ayer por la noche).
UPDATE ordenes SET estado = 'pendiente', creada_en = '2026-02-25 10:00' WHERE id = 16;
UPDATE ordenes SET estado = 'pendiente', creada_en = '2026-03-01 20:00' WHERE id = 19;
DELETE FROM h_tmp WHERE orden_id IN (16, 19);
INSERT INTO h_tmp SELECT id, 1, 'creada', creada_en FROM ordenes WHERE id IN (16, 19);
INSERT INTO h_tmp SELECT id, 2, 'pendiente', creada_en + INTERVAL '2 minutes' FROM ordenes WHERE id IN (16, 19);
-- 20: empieza en pendiente.
DELETE FROM h_tmp WHERE orden_id = 20 AND paso = 1;
-- 11: la orden dice rechazada, el historial dice completada.
UPDATE ordenes SET estado = 'rechazada' WHERE id = 11;
INSERT INTO ordenes_historial (id, orden_id, estado, cambiado_en)
SELECT ROW_NUMBER() OVER (ORDER BY orden_id, paso), orden_id, estado, cambiado_en FROM h_tmp;
DROP TABLE h_tmp;
-- 21: completada, sin una sola fila de historial.
INSERT INTO ordenes VALUES (21, 12, 310.00, 'completada', '2026-02-28 15:00');
`

/** m08 · Solicitudes de préstamo con reglas (algunas mal hechas) y las funciones de prueba. */
const REGLAS_SQL = `
CREATE FUNCTION marcar_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.revisada_en := now();
  RETURN NEW;
END $$;
CREATE TRIGGER trg_revision BEFORE INSERT ON solicitudes FOR EACH ROW EXECUTE FUNCTION marcar_revision();
INSERT INTO solicitudes (cliente_id, importe, plazo_meses, estado) VALUES
(1, 5000, 24, 'abierta'), (2, 12000, 36, 'aprobada'), (3, 30000, 60, 'rechazada'), (4, 2500, 12, 'abierta'), (5, 8000, 48, 'cancelada');
UPDATE solicitudes SET revisada_en = ('2026-02-2' || id || ' 10:00')::timestamp;
-- Funciones de prueba para los alumnos: ejecutan, deshacen y dicen qué pasó.
CREATE FUNCTION probar(VARIADIC sentencias text[]) RETURNS text LANGUAGE sql AS $$ SELECT qa.probar(VARIADIC sentencias) $$;
CREATE FUNCTION efecto(sentencias text[], consulta text) RETURNS text LANGUAGE sql AS $$ SELECT qa.efecto(sentencias, consulta) $$;
`

/** m09 · Lo que dice el registro de consultas antes y después de la versión 1.9. */
const RENDIMIENTO_SQL = `
INSERT INTO log_consultas VALUES
('1.8', 'Q1', 'SELECT … FROM cuentas WHERE cliente_id = $1', 12000, 6000.0, 1400),
('1.8', 'Q2', 'SELECT … FROM transferencias WHERE cuenta_origen_id = $1 ORDER BY creada_en DESC LIMIT 20', 8000, 16000.0, 1400),
('1.8', 'Q3', 'SELECT … FROM tarjetas WHERE id = $1', 3000, 300.0, 1400),
('1.8', 'Q4', 'SELECT … FROM pagos_tarjeta WHERE tarjeta_id = $1 AND pagado_en >= $2', 5000, 7500.0, 1400),
('1.8', 'Q5', 'SELECT comercio_id, SUM(importe) FROM pagos_tarjeta GROUP BY comercio_id', 100, 2000.0, 1400),
('1.8', 'Q6', 'INSERT INTO auditoria …', 9000, 900.0, 1400),
('1.9', 'Q1', 'SELECT … FROM cuentas WHERE cliente_id = $1', 12500, 6250.0, 1500),
('1.9', 'Q2', 'SELECT … FROM transferencias WHERE cuenta_origen_id = $1 ORDER BY creada_en DESC LIMIT 20', 8200, 196800.0, 1500),
('1.9', 'Q3', 'SELECT … FROM tarjetas WHERE id = $1', 90000, 9000.0, 1500),
('1.9', 'Q4', 'SELECT … FROM pagos_tarjeta WHERE tarjeta_id = $1 AND pagado_en >= $2', 5100, 8160.0, 1500),
('1.9', 'Q5', 'SELECT comercio_id, SUM(importe) FROM pagos_tarjeta GROUP BY comercio_id', 100, 3200.0, 1500),
('1.9', 'Q6', 'INSERT INTO auditoria …', 9100, 910.0, 1500),
('1.9', 'Q7', 'SELECT … FROM clientes c JOIN cuentas a ON a.cliente_id = c.id WHERE c.ciudad = $1', 400, 1600.0, 1500),
('1.9', 'Q8', 'SELECT … FROM comercios WHERE id = $1', 30750, 1500.0, 1500);
INSERT INTO planes_capturados VALUES
('1.8', 'Q2', 20, 20), ('1.8', 'Q4', 30, 25), ('1.8', 'Q5', 22, 22),
('1.9', 'Q2', 250, 20), ('1.9', 'Q4', 3, 60), ('1.9', 'Q5', 22, 22), ('1.9', 'Q7', 1, 400);
CREATE INDEX pagos_tarjeta_tarjeta_idx ON pagos_tarjeta (tarjeta_id);
CREATE INDEX apuntes_transferencia_idx ON apuntes (transferencia_id);
INSERT INTO indices_esperados VALUES
('cuentas', 'cuentas_pkey'), ('cuentas', 'cuentas_iban_key'), ('cuentas', 'cuentas_cliente_idx'),
('transferencias', 'transferencias_pkey'), ('transferencias', 'transferencias_origen_idx'),
('pagos_tarjeta', 'pagos_tarjeta_pkey'), ('pagos_tarjeta', 'pagos_tarjeta_tarjeta_idx'),
('apuntes', 'apuntes_pkey'), ('apuntes', 'apuntes_transferencia_idx');
`

/** SQL completo de Kobalto QA. */
export function kobaltoQaDbSql(): string {
  return [
    kobaltoPagosDbSql(),
    prestamosDbSql(),
    PROBE_SQL,
    QA_SQL,
    QA_SCHEMA_SQL,
    EJECUCIONES_SQL,
    BORDES_SQL,
    ANOMALIAS_SQL,
    LIQUIDACIONES_SQL,
    MIGRACION_SQL,
    INFORME_SQL,
    ESTADOS_SQL,
    REGLAS_SQL,
    RENDIMIENTO_SQL,
    'ANALYZE;',
  ].join('\n')
}
