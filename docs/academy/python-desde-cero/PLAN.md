# Curso 9 · Python desde cero

> Nivel: Principiante · Formato **instructivo** (no simulación) · 8 módulos + proyecto final
> Clave del curso: `python-desde-cero` · Gratis con registro (el módulo 1 está abierto sin cuenta)
> Primer curso de la **ruta Python**. Tiene un gemelo para testers: «Python desde cero para QA» (`python-qa-desde-cero`, mismo temario y otro proyecto).
> Español e inglés desde el principio.

## 1. Qué cambia frente a los cursos de simulación

| | Cursos de simulación (SQL, QA) | Cursos instructivos (Python) |
|---|---|---|
| Hilo conductor | Una jornada en Kobalto | Un proyecto que crece módulo a módulo |
| Unidad | Misión (un día de trabajo) | Módulo (3–4 lecciones cortas) |
| Aprendizaje | Decisiones y consecuencias | Explicación → ejemplo ejecutable → «¿qué imprime?» → ejercicio con tests |
| Resultado | Debrief y nota | Código propio que funciona |

Sin personajes, sin reloj y sin consecuencias: el alumno va a su ritmo.

## 2. Formato de una lección

Bloques, en este orden habitual:

1. **Texto** (3–5 min de lectura): un concepto, con ejemplos cortos.
2. **Ejemplo ejecutable**: Python real en el navegador (Pyodide). Se puede editar, ejecutar y restaurar.
3. **¿Qué imprime?**: leer código antes de escribirlo. Cuatro opciones, explicación al acertar o fallar.
4. **Ejercicio**: enunciado, editor con código de partida, tests ocultos que dicen qué falla, pistas por niveles y la solución tras tres intentos.
5. **Tu proyecto** (al final del módulo): un ejercicio que añade una pieza al proyecto del curso.

Un módulo está completo cuando todos sus «¿qué imprime?» y ejercicios están resueltos.

Los errores de Python se muestran con la línea, el tipo y una explicación en lenguaje sencillo (`NameError`, `SyntaxError`, `TypeError`…).

## 3. Proyecto del curso: «Mi gestor de gastos»

| Módulo | Pieza del proyecto |
|---|---|
| 1 · Tu primer programa | Pide concepto e importe, calcula el IVA y muestra un resumen |
| 2 · Decidir | Clasifica el gasto por categoría con reglas |
| 3 · Repetir | Pide gastos hasta «fin» y saca el total |
| 4 · Colecciones | Lista de diccionarios y totales por categoría |
| 5 · Funciones | La lógica separada en funciones reutilizables |
| 6 · Textos y errores | Valida lo que escribe el usuario sin romperse |
| 7 · Ficheros | Guarda y carga los gastos en CSV |
| 8 · Ordenar tu código | Resumen mensual en JSON con fechas, en módulos |
| ★ · Proyecto final | Examen práctico (ejercicios con tests, 70/100) y test teórico |

## 4. Temario

| # | Módulo | Lecciones |
|---|---|---|
| 1 | Tu primer programa | print · variables · tipos y operaciones · input y f-strings · proyecto |
| 2 | Decidir | comparaciones · if/elif/else · and/or/not · proyecto |
| 3 | Repetir | for y range · while · break/continue · proyecto |
| 4 | Colecciones | listas · tuplas y sets · diccionarios · proyecto |
| 5 | Funciones | definir y llamar · parámetros y return · valores por defecto y ámbito · proyecto |
| 6 | Textos y errores | métodos de str · leer un traceback · try/except · proyecto |
| 7 | Ficheros | leer y escribir texto · CSV · with · proyecto |
| 8 | Ordenar tu código | módulos e import · datetime, random, json · proyecto |
| 9 | Proyecto final | examen práctico + test teórico + certificado |

Duración estimada: 8–10 h.

## 5. Técnica

- **Motor de lecciones** en `frontend/src/features/academy/learn/`: tipos, reproductor de módulos (`ModulePlayer`), editor de Python, y el núcleo que ejecuta y corrige (`python/core.ts`).
- **Python en el navegador**: Pyodide (versión fija, `PYODIDE_VERSION`) servido desde nuestro dominio (`/pyodide/v<versión>/`, copiado del paquete `pyodide` por `vite.config.ts`) en un Web Worker. Si un programa no termina en 8 s, se para el worker y se crea otro (bucles infinitos).
- **Corrección**: el código del alumno se ejecuta en un espacio limpio con `input()` simulado; los tests son de salida (`output`), de aserción en Python (`assert`) o de forma del código (`source`).
- **Progreso**: el mismo almacenamiento que las misiones (`academy_runs` y copia local), con las acciones `{type: 'pass', id}`; `finished` cuando el módulo está completo. Así funcionan el progreso del curso, el acceso y el certificado sin cambios en el backend.
- **Cursos**: `CourseDef.format = 'lessons'`; el reproductor de misiones lo detecta y abre el de lecciones. La ficha muestra «Módulo N».
- **Tests**: `learn/*.test.ts` ejecutan Pyodide en Node (dependencia de desarrollo `pyodide`) y comprueban que la solución de cada ejercicio pasa sus tests y el código de partida no.

## 6. Evaluación final

- **Examen práctico** (`m09-proyecto-final`, «Proyecto final» en la ficha): 10 ejercicios sin pistas ni solución, 10 puntos cada uno; el módulo solo cuenta como terminado con 70/100 (`LessonModule.exam`).
- **Test teórico** en el servidor: `backend/app/modules/academy/exam_bank/python_desde_cero.py` (+ `_en.py`), 40 preguntas en los bloques 71–74 (se muestran 1–4), 5 por sección (una sección por módulo). Cada intento: 20 preguntas (5 por bloque), 30 min (40 ampliado), aprueba con 14.
- **Certificado** `ASE-PYB-…`, «no es una certificación oficial». Exige los 9 módulos terminados (incluido el examen práctico) y el test aprobado.

## 7. Estado

- Hecho (2026-11-06): motor de lecciones, los 8 módulos y el examen práctico en español e inglés, test final, certificado y E2E (es/en).
- Pendiente: ficha en el catálogo (`academy_course_key = python-desde-cero`, precio 0, serie «Ruta Python», orden 1), portada y tráiler; el gemelo para QA (`python-qa-desde-cero`).
- Código: `learn/` (tipos, `registry.ts`, `useModuleRun.ts`, `ui/ModulePlayer.tsx`, `ui/blocks.tsx`, `python/`), contenido en `content/courses/python-desde-cero/` (`en/` para inglés). `learn/content.test.ts` ejecuta con Pyodide cada ejemplo, cada «¿qué imprime?», cada solución (pasa) y cada código de partida (no pasa), y comprueba la paridad es/en.
