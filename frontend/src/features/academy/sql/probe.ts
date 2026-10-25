/**
 * Sondas para comprobar reglas de una tabla (curso «SQL desde cero», misión 9
 * y examen práctico): `qa.probar(VARIADIC sentencias)` ejecuta las sentencias
 * dentro de una subtransacción que siempre se deshace y devuelve 'ok' si todas
 * se aceptan o el SQLSTATE del primer error ('23514' CHECK, '23502' NOT NULL,
 * '23505' UNIQUE/PRIMARY KEY, '23503' clave foránea, '42P01' tabla inexistente…).
 *
 * Vive en el esquema «qa», que el explorador de la consola no muestra.
 * Se usa en las consultas de verificación (`state`) de los encargos.
 */
export const PROBE_SQL = `
CREATE SCHEMA qa;
CREATE FUNCTION qa.probar(VARIADIC sentencias text[]) RETURNS text LANGUAGE plpgsql AS $probe$
DECLARE s text;
BEGIN
  BEGIN
    FOREACH s IN ARRAY sentencias LOOP
      EXECUTE s;
    END LOOP;
    RAISE EXCEPTION USING ERRCODE = 'QA000', MESSAGE = 'deshacer';
  EXCEPTION
    WHEN SQLSTATE 'QA000' THEN RETURN 'ok';
    WHEN OTHERS THEN RETURN SQLSTATE;
  END;
END
$probe$;
`

/** Literal SQL de texto (comillas simples duplicadas) para pasar sentencias a qa.probar. */
export const lit = (s: string) => `'${s.replace(/'/g, "''")}'`

/** Consulta de verificación: el resultado de probar estas sentencias. */
export const probe = (...sentencias: string[]) => `SELECT qa.probar(${sentencias.map(lit).join(', ')})`
