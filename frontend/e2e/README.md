# Tests E2E (Playwright)

## `academy.spec.ts`: cada curso de principio a fin

Un test por curso e idioma (3 cursos × es/en = 6). Cada uno, en el navegador y como un alumno:

1. inicia sesión con su alumno E2E;
2. juega **todas** las misiones del curso hasta el debrief (diagnóstico, jornada, reuniones, comprobación final) y comprueba que la partida terminada se guarda en el servidor;
3. en Karate, resuelve el examen práctico en el IDE con la solución de referencia (8 retos, pipeline nocturno); en SQL, en la consola con PostgreSQL real (10 encargos, `M10_SQL_ANSWERS`);
4. aprueba la evaluación final (las respuestas correctas las da `backend/scripts/e2e_academy.py`, que lee el intento abierto);
5. abre el certificado verificable y descarga su PDF (200, `application/pdf`).

Complementa a `src/features/academy/engine/coursePlaythrough.test.ts` (Vitest), que juega cada misión con el motor sin navegador.

## Cómo ejecutarlo

Requisitos: el backend en marcha (`uvicorn app.main:app --port 8000`) contra una **base de datos local** con migraciones y `scripts/seed_initial_data.py` aplicados.

```bash
cd frontend
export DATABASE_URL=postgresql+psycopg://ase:ase@localhost:5432/ase   # LOCAL
export E2E_PYTHON=../backend/.venv/bin/python                         # Python con las dependencias del backend
npx playwright install chromium        # una vez (o CHROMIUM_PATH=/ruta/a/chromium)
npm run e2e:academy                    # build de producción + vite preview + 6 tests (~4 min con 3 workers)
```

- `scripts/e2e_academy.py seed` (lo lanza `global-setup.ts`) crea o reinicia los alumnos `e2e.<curso>.<idioma>@arcesabinengineering.com`, les da acceso al curso y borra sus partidas, intentos y certificados anteriores. **Se niega a ejecutarse si `DATABASE_URL` no es local.**
- Variables opcionales: `E2E_BASE_URL` (usar una web ya arrancada en vez de `vite preview`), `E2E_WORKERS` (por defecto 3), `E2E_PASSWORD`, `CHROMIUM_PATH`.
- Un solo curso: `npx playwright test e2e/academy.spec.ts -g "karate-framework \(en\)"`.
- Fallos: traza, vídeo y captura en `e2e-results/`; informe HTML en `e2e-report/` (`npx playwright show-report e2e-report`).
- Se ejecuta contra el build de producción porque el servidor de desarrollo de Vite es demasiado lento con varios navegadores a la vez (las misiones se quedan cargando).
