import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 2 · misión 0). Temario CTFL 1.4, 1.5 y 2.1. */
export const m00Lessons: Lesson[] = [
  {
    id: 'activities',
    question: '¿Qué actividades tiene un proceso de pruebas? (CTFL 1.4.1)',
    conceptId: 'test_activities',
    cost: 5,
    body: `1. **Planificación**: objetivos y enfoque.
2. **Seguimiento y control**: comparar con el plan y corregir (continuo).
3. **Análisis**: ¿**qué** probar? Condiciones de prueba priorizadas.
4. **Diseño**: ¿**cómo** probarlo? Casos de prueba y cobertura.
5. **Implementación**: procedimientos, datos, entorno y scripts.
6. **Ejecución**: ejecutar, comparar y registrar; informar defectos.
7. **Cierre**: al terminar un hito, archivar, evaluar y aprender.

Se pueden solapar, repetir en iteraciones o ser informales, pero existen siempre. El **contexto** (riesgos, plazos, ciclo de vida, equipo) decide cómo se hacen.`,
  },
  {
    id: 'testware',
    question: '¿Qué testware produce cada actividad? (CTFL 1.4.3)',
    conceptId: 'testware',
    cost: 5,
    body: `- Planificación → **plan de pruebas** (y calendario, registro de riesgos, criterios de entrada y salida).
- Seguimiento y control → **informes de avance**.
- Análisis → **condiciones de prueba** priorizadas (y a veces defectos en la base de prueba).
- Diseño → **casos de prueba** y elementos de cobertura.
- Implementación → **procedimientos**, **datos**, scripts automatizados y entorno.
- Ejecución → **registros** de ejecución e **informes de defectos**.
- Cierre → **informe de cierre** y lecciones aprendidas.`,
  },
  {
    id: 'roles',
    question: '¿Qué hace la gestión de pruebas y qué hace el tester? (CTFL 1.4.5)',
    conceptId: 'test_roles',
    cost: 5,
    body: `- **Gestión de pruebas**: responsable del proceso, del equipo y del liderazgo. Se centra en **planificación, seguimiento y control, y cierre**.
- **Tester**: responsable de la parte técnica. Se centra en **análisis, diseño, implementación y ejecución**.

Son **roles**, no puestos: en un equipo ágil, parte de la gestión la puede hacer el propio equipo, y una misma persona puede tener los dos roles.`,
  },
  {
    id: 'trace',
    question: '¿Para qué sirve la trazabilidad? (CTFL 1.4.4)',
    conceptId: 'traceability',
    cost: 5,
    body: `Enlazar base de prueba (historias, requisitos, riesgos) con condiciones, casos, resultados y defectos permite:

- medir la **cobertura** (qué requisitos están probados);
- saber qué requisitos tienen **defectos abiertos**;
- analizar el **impacto de un cambio** (qué pruebas repetir);
- dar **evidencia** en auditorías;
- informar del avance en términos que negocio entiende.`,
  },
  {
    id: 'team',
    question: '¿Equipo completo o probadores independientes? (CTFL 1.5.2 y 1.5.3)',
    conceptId: 'independence',
    cost: 5,
    body: `**Equipo completo** (*whole team*): cualquiera con las habilidades necesarias puede hacer cualquier tarea y la calidad es de todos. QA colabora con negocio (aceptación) y con desarrollo (estrategia y automatización).

**Independencia**: un probador independiente encuentra defectos distintos de los del autor, por sus sesgos diferentes. Niveles: el autor, un compañero del equipo, alguien de otra área, alguien externo.

No son contrarios: lo mejor suele ser **combinar** varios niveles (devs en componente, QA independiente en sistema). Riesgos de la independencia: aislamiento y que el autor deje de sentirse responsable de la calidad.`,
  },
  {
    id: 'sdlc',
    question: '¿Cuándo entra QA en el ciclo de vida? (CTFL 2.1.2 y 2.1.5)',
    conceptId: 'sdlc_testing',
    cost: 5,
    body: `Buenas prácticas en cualquier ciclo de vida:

- Cada actividad de desarrollo tiene su **actividad de pruebas** correspondiente.
- Cada nivel de prueba tiene **objetivos** propios.
- El **análisis y el diseño** de pruebas empiezan durante la fase de desarrollo correspondiente.
- Los testers participan en la **revisión de borradores** en cuanto existen.

Es **testing temprano** (*shift-left*): cuanto antes se encuentra un defecto, más barato es.`,
  },
]
