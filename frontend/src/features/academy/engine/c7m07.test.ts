// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m07Funciones as mission } from '../content/courses/sql-avanzado/m07-funciones'
import { runSql } from '../sql/engine'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)

const SQL = {
  saldo: 'CREATE OR REPLACE FUNCTION saldo_cliente(p_cliente integer) RETURNS numeric LANGUAGE sql AS $$ SELECT COALESCE(SUM(saldo), 0) FROM cuentas WHERE cliente_id = p_cliente $$;',
  pagos: 'CREATE FUNCTION pagos_de(p_tarjeta integer) RETURNS TABLE (id integer, importe numeric, pagado_en timestamp) LANGUAGE sql AS $$ SELECT p.id, p.importe, p.pagado_en FROM pagos_tarjeta p WHERE p.tarjeta_id = p_tarjeta ORDER BY p.pagado_en $$;',
  riesgo: "CREATE FUNCTION nivel_riesgo(p_cliente integer) RETURNS text LANGUAGE plpgsql AS $$ BEGIN RETURN CASE WHEN saldo_cliente(p_cliente) < 1000 THEN 'alto' WHEN saldo_cliente(p_cliente) < 10000 THEN 'medio' ELSE 'bajo' END; END $$;",
  auditoria: `CREATE TABLE auditoria_saldos (id serial PRIMARY KEY, cuenta_id integer NOT NULL, saldo_anterior numeric(12,2), saldo_nuevo numeric(12,2), cambiado_en timestamp NOT NULL DEFAULT now());
CREATE FUNCTION auditar_saldo() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO auditoria_saldos (cuenta_id, saldo_anterior, saldo_nuevo) VALUES (OLD.id, OLD.saldo, NEW.saldo); RETURN NEW; END $$;
CREATE TRIGGER trg_auditar_saldo AFTER UPDATE ON cuentas FOR EACH ROW WHEN (OLD.saldo IS DISTINCT FROM NEW.saldo) EXECUTE FUNCTION auditar_saldo();`,
  ahorro: `CREATE FUNCTION impedir_negativo() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.tipo = 'ahorro' AND NEW.saldo < 0 THEN RAISE EXCEPTION 'Saldo negativo en la cuenta de ahorro %', NEW.id; END IF; RETURN NEW; END $$;
CREATE TRIGGER trg_impedir_negativo BEFORE INSERT OR UPDATE ON cuentas FOR EACH ROW EXECUTE FUNCTION impedir_negativo();`,
  actualizado: `ALTER TABLE comercios ADD COLUMN actualizado_en timestamp;
CREATE FUNCTION marcar_actualizado() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.actualizado_en := now(); RETURN NEW; END $$;
CREATE TRIGGER trg_marcar_actualizado BEFORE UPDATE ON comercios FOR EACH ROW EXECUTE FUNCTION marcar_actualizado();`,
}

async function goodDay(db: PGlite, seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_funciones')
  s = await k.query(db, s, SQL.saldo)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.pagos)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.riesgo)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'ines_return', 'new')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.auditoria)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.ahorro)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.actualizado)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'ines_bucle', 'before')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 7 · misión 7 · Funciones y triggers', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(await k.open(), seed))
  }, 60_000)

  it('las pistas de cada encargo también lo cumplen, y las comprobaciones no cambian datos', async () => {
    const db = await k.open()
    const hint = (id: string) => k.reto(id).hint!.slice(1, -1)
    expect(await k.passes(db, 'saldo_cliente', hint('saldo_cliente'))).toBe(true)
    expect(await k.passes(db, 'pagos_de', hint('pagos_de'))).toBe(true)
    expect(await k.passes(db, 'nivel_riesgo', "CREATE FUNCTION nivel_riesgo(p_cliente integer) RETURNS text LANGUAGE plpgsql AS $$ DECLARE s numeric; BEGIN s := saldo_cliente(p_cliente); IF s < 1000 THEN RETURN 'alto'; ELSIF s < 10000 THEN RETURN 'medio'; ELSE RETURN 'bajo'; END IF; END $$")).toBe(true)
    await runSql(db, 'CREATE TABLE auditoria_saldos (id serial PRIMARY KEY, cuenta_id integer, saldo_anterior numeric(12,2), saldo_nuevo numeric(12,2), cambiado_en timestamp DEFAULT now())')
    expect(await k.passes(db, 'auditoria', 'CREATE FUNCTION auditar_saldo() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO auditoria_saldos (cuenta_id, saldo_anterior, saldo_nuevo) VALUES (OLD.id, OLD.saldo, NEW.saldo); RETURN NEW; END $$; CREATE TRIGGER trg_auditar_saldo AFTER UPDATE OF saldo ON cuentas FOR EACH ROW EXECUTE FUNCTION auditar_saldo();')).toBe(true)
    expect(await k.rows(db, 'SELECT COUNT(*) FROM auditoria_saldos')).toEqual([['0']])
    expect(await k.rows(db, 'SELECT saldo FROM cuentas WHERE id = 1')).toEqual([['2376.40']])
    expect(await k.rows(db, "SELECT nivel_riesgo(id), COUNT(*) FROM clientes GROUP BY 1 ORDER BY 1")).toEqual([['alto', '3'], ['bajo', '12'], ['medio', '25']])
  }, 60_000)

  it('las trampas típicas no cumplen el encargo', async () => {
    const db = await k.open()
    // Sin COALESCE, el cliente sin cuentas da NULL.
    expect(await k.passes(db, 'saldo_cliente', 'CREATE FUNCTION saldo_cliente(p_cliente integer) RETURNS numeric LANGUAGE sql AS $$ SELECT SUM(saldo) FROM cuentas WHERE cliente_id = p_cliente $$')).toBe(false)
    await runSql(db, SQL.saldo)
    // Con <= en vez de <, o los límites cambiados, el reparto no cuadra.
    expect(await k.passes(db, 'nivel_riesgo', "CREATE FUNCTION nivel_riesgo(p_cliente integer) RETURNS text LANGUAGE plpgsql AS $$ BEGIN IF saldo_cliente(p_cliente) < 10000 THEN RETURN 'alto'; ELSIF saldo_cliente(p_cliente) < 1000 THEN RETURN 'medio'; END IF; RETURN 'bajo'; END $$")).toBe(false)
    // Auditar cualquier UPDATE, también los que no cambian el saldo.
    await runSql(db, 'CREATE TABLE auditoria_saldos (id serial PRIMARY KEY, cuenta_id integer, saldo_anterior numeric(12,2), saldo_nuevo numeric(12,2), cambiado_en timestamp DEFAULT now())')
    expect(await k.passes(db, 'auditoria', 'CREATE FUNCTION auditar_saldo() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO auditoria_saldos (cuenta_id, saldo_anterior, saldo_nuevo) VALUES (OLD.id, OLD.saldo, NEW.saldo); RETURN NEW; END $$; CREATE TRIGGER trg_auditar_saldo AFTER UPDATE ON cuentas FOR EACH ROW EXECUTE FUNCTION auditar_saldo();')).toBe(false)
    await runSql(db, 'DROP TRIGGER trg_auditar_saldo ON cuentas')
    // Solo al cambiar, no al crear.
    expect(await k.passes(db, 'ahorro_positivo', "CREATE FUNCTION impedir_negativo() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.tipo = 'ahorro' AND NEW.saldo < 0 THEN RAISE EXCEPTION 'negativo'; END IF; RETURN NEW; END $$; CREATE TRIGGER trg_ahorro BEFORE UPDATE ON cuentas FOR EACH ROW EXECUTE FUNCTION impedir_negativo();")).toBe(false)
    await runSql(db, 'DROP TRIGGER trg_ahorro ON cuentas')
    // RETURN NULL: la fecha se pondría, pero el cambio no se guarda.
    await runSql(db, 'ALTER TABLE comercios ADD COLUMN actualizado_en timestamp')
    expect(await k.passes(db, 'actualizado_en', 'CREATE FUNCTION marcar() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.actualizado_en := now(); RETURN NULL; END $$; CREATE TRIGGER trg_marcar BEFORE UPDATE ON comercios FOR EACH ROW EXECUTE FUNCTION marcar();')).toBe(false)
  }, 60_000)

  it('las trampas de las reuniones fallan como cuenta la historia, sin romper la base de datos', async () => {
    const db = await k.open()
    await runSql(db, 'CREATE FUNCTION sin_return() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.ciudad := initcap(NEW.ciudad); END $$; CREATE TRIGGER t1 BEFORE UPDATE ON comercios FOR EACH ROW EXECUTE FUNCTION sin_return();')
    expect((await runSql(db, 'UPDATE comercios SET ciudad = ciudad WHERE id = 3')).error!.original).toMatch(/without RETURN/)
    await runSql(db, 'DROP TRIGGER t1 ON comercios')
    await runSql(db, 'ALTER TABLE cuentas ADD COLUMN ultimo_cambio timestamp; CREATE FUNCTION marcar_ultimo() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE cuentas SET ultimo_cambio = now() WHERE id = NEW.id; RETURN NEW; END $$; CREATE TRIGGER trg_ultimo AFTER UPDATE ON cuentas FOR EACH ROW EXECUTE FUNCTION marcar_ultimo();')
    const bucle = await runSql(db, 'UPDATE cuentas SET saldo = saldo WHERE id = 2')
    expect(bucle.ok).toBe(false)
    expect(bucle.error!.original).toMatch(/stack depth/)
    // La base de datos sigue viva después del bucle.
    expect(await k.rows(db, 'SELECT COUNT(*) FROM cuentas')).toEqual([['52']])
  }, 60_000)

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'ines_return', 'after')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'ines_bucle', 'stack')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'everything'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
