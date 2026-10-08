import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 2 · misión 1). Temario CTFL 3.1 y 3.2. */
export const m01Lessons: Lesson[] = [
  {
    id: 'static',
    question: '¿Qué aporta revisar un documento si todavía no hay nada que ejecutar? (CTFL 3.1)',
    conceptId: 'static_testing',
    cost: 5,
    body: `El **testing estático** examina productos de trabajo (requisitos, diseños, código, planes) **sin ejecutarlos**. Encuentra **defectos** directamente; el testing dinámico encuentra **fallos** y luego hay que buscar el defecto que los causa.

- Detecta lo que el dinámico ve tarde o nunca: ambigüedades, contradicciones, requisitos que faltan, incumplimientos normativos.
- Cuanto antes se encuentra un defecto, **más barato** es corregirlo: en un documento es cambiar una frase; en producción, un incidente.
- Casi cualquier producto de trabajo legible se puede revisar.`,
  },
  {
    id: 'types',
    question: '¿Qué tipo de revisión elijo? (CTFL 3.2.4)',
    conceptId: 'review_types',
    cost: 5,
    body: `Depende del **objetivo** y del contexto (riesgo, normativa, tiempo):

- **Informal**: sin proceso ni registro. Rápida; para dudas tempranas.
- **Walkthrough (recorrido)**: la autora guía la lectura. Para formar, generar ideas y consenso.
- **Revisión técnica**: revisores técnicos preparados. Para consensuar y decidir sobre problemas técnicos.
- **Inspección**: la más formal. Preparación individual, roles definidos, registro de defectos y **métricas**. Para encontrar el máximo de defectos y dejar **evidencia** (normativa, auditoría).

En un mismo producto se pueden combinar varias a lo largo del tiempo.`,
  },
  {
    id: 'roles',
    question: '¿Quién hace qué en una revisión formal? (CTFL 3.2.3)',
    conceptId: 'review_roles',
    cost: 5,
    body: `- **Dirección (manager)**: decide qué se revisa y aporta recursos. Mejor **fuera de la reunión**: su presencia hace que la gente se calle defectos.
- **Autor/a**: crea y corrige el producto de trabajo.
- **Moderación (facilitador/a)**: dirige la reunión, mediadora, cuida que sea un entorno seguro. Nunca la autora.
- **Escriba (registrador)**: recoge los defectos y decisiones.
- **Revisores/as**: perspectivas distintas (negocio, desarrollo, normativa, pruebas).
- **Líder de la revisión**: responsable global de organizarla.`,
  },
  {
    id: 'process',
    question: '¿Cuáles son los pasos de una revisión? (CTFL 3.2.2)',
    conceptId: 'review_process',
    cost: 5,
    body: `1. **Planificación**: alcance, objetivo, tipo, roles, criterios de salida.
2. **Inicio**: asegurar que todos tienen el documento y saben qué revisar.
3. **Revisión individual**: cada revisor/a lo lee y anota defectos, a menudo con **checklist**.
4. **Comunicación y análisis**: reunión para entender los defectos, decidir su estado y responsable.
5. **Corrección e informe**: la autora corrige, se **comprueba** que cada defecto está cerrado y se informa (métricas, evidencia).

Saltarse la revisión individual o el seguimiento es la forma más habitual de que una revisión «se haga» sin servir de mucho.`,
  },
  {
    id: 'success',
    question: '¿Qué hace que una revisión funcione? (CTFL 3.2.5)',
    conceptId: 'review_success',
    cost: 5,
    body: `- Objetivos claros y **criterios de salida** medibles.
- El **tipo** adecuado al objetivo.
- Revisar en **trozos pequeños**, con tiempo para prepararse.
- Dar feedback sobre el **producto, no la persona**: la autora tiene que poder escucharlo.
- Apoyo de la dirección (tiempo y recursos) sin presión en la sala.
- Hacer de las revisiones una **costumbre** y formar a quien participa.`,
  },
  {
    id: 'checklist',
    question: '¿Para qué sirve una checklist en una revisión?',
    conceptId: 'review_process',
    cost: 5,
    body: `Dirige la atención a los defectos **típicos** de ese tipo de documento: fechas y calendarios, importes y redondeos, errores y reintentos, normativa citada, requisitos verificables…

- Hace que distintas personas revisen con un **criterio común**.
- No sustituye al pensamiento: lo nuevo no está en la checklist. Mejórala con lo que encuentres.`,
  },
]
