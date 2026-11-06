/**
 * Núcleo para ejecutar y corregir Python con Pyodide, común al navegador (Web
 * Worker) y a los tests (Node). Ejecuta el código del alumno en un espacio de
 * nombres limpio, con input() simulado, captura la salida y ejecuta después
 * las aserciones de los tests en ese mismo espacio.
 */

/** Versión fija de Pyodide (la misma en el navegador y en los tests). */
export const PYODIDE_VERSION = '0.29.4'
/** Pyodide se sirve desde nuestro dominio (lo copia vite.config.ts del paquete `pyodide`). */
export const PYODIDE_BASE = `/pyodide/v${PYODIDE_VERSION}/`

/** Lo mínimo de Pyodide que usamos. */
export interface PyodideLike {
  runPython(code: string): unknown
  globals: { get(name: string): unknown }
}

export interface PyError {
  type: string
  message: string
  /** Línea del código del alumno (1-based), si se sabe. */
  line: number | null
}

export interface PyAssertResult {
  ok: boolean
  /** Mensaje de la aserción (si lo tiene). */
  message?: string
  error?: PyError
}

export interface PyRunResult {
  ok: boolean
  stdout: string
  error: PyError | null
  asserts: PyAssertResult[]
}

export interface PyRunRequest {
  code: string
  inputs?: string[]
  asserts?: string[]
}

const HARNESS = `
import io as _io, json as _json, traceback as _tb, contextlib as _cl, os as _os, sys as _sys, importlib as _il

def _ase_forget_user_modules():
    # Los módulos que escribe el alumno (ficheros .py en la carpeta de trabajo)
    # se vuelven a cargar en cada ejecución, por si los ha cambiado.
    cwd = _os.getcwd()
    for name, mod in list(_sys.modules.items()):
        f = getattr(mod, '__file__', None) or ''
        if f.startswith(cwd + '/'):
            del _sys.modules[name]
    _il.invalidate_caches()

def _ase_err(e, fname):
    line = None
    if isinstance(e, SyntaxError) and getattr(e, 'filename', None) == fname:
        line = e.lineno
        msg = e.msg
    else:
        for fr in _tb.extract_tb(e.__traceback__):
            if fr.filename == fname:
                line = fr.lineno
        msg = str(e)
    return {'type': type(e).__name__, 'message': msg, 'line': line}

def _ase_run(src, inputs, asserts):
    out = _io.StringIO()
    feed = list(inputs)
    def _input(prompt=''):
        out.write(str(prompt))
        if not feed:
            raise EOFError('__ASE_NO_INPUT__')
        v = str(feed.pop(0))
        out.write(v + '\\n')
        return v
    ns = {'__name__': '__main__', 'input': _input}
    res = {'ok': True, 'stdout': '', 'error': None, 'asserts': []}
    _ase_forget_user_modules()
    try:
        code = compile(src, '<main>', 'exec')
        with _cl.redirect_stdout(out):
            exec(code, ns)
    except BaseException as e:
        res['ok'] = False
        res['error'] = _ase_err(e, '<main>')
    res['stdout'] = out.getvalue()
    for a in asserts:
        if not res['ok']:
            res['asserts'].append({'ok': False})
            continue
        try:
            with _cl.redirect_stdout(_io.StringIO()):
                exec(compile(a, '<test>', 'exec'), ns)
            res['asserts'].append({'ok': True})
        except AssertionError as e:
            res['asserts'].append({'ok': False, 'message': str(e)})
        except BaseException as e:
            res['asserts'].append({'ok': False, 'error': _ase_err(e, '<main>')})
    return _json.dumps(res)
`

const installed = new WeakSet<object>()

/** Ejecuta una petición en una instancia de Pyodide ya cargada. */
export function runWith(py: PyodideLike, req: PyRunRequest): PyRunResult {
  if (!installed.has(py)) {
    py.runPython(HARNESS)
    installed.add(py)
  }
  const fn = py.globals.get('_ase_run') as (src: string, inputs: unknown, asserts: unknown) => string
  // Pyodide convierte los arrays de JS en listas de Python al pasarlos como argumentos.
  const json = fn(req.code, req.inputs ?? [], req.asserts ?? [])
  return JSON.parse(json) as PyRunResult
}

/** Lo que necesita el corrector: algo que ejecuta Python (worker, Node…). */
export interface PyRunner {
  run(req: PyRunRequest): Promise<PyRunResult>
}
