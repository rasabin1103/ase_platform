import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 4 · misión 4 · rol QA Architect). */
export const m04Lessons: Lesson[] = [
  {
    id: 'role',
    question: '¿Qué hace un QA Architect que no hace un QA Engineer?',
    conceptId: 'role_qa_architect',
    cost: 5,
    body: `El QA Engineer cuida la automatización **de su squad**. El QA Architect decide lo que es **común a todos**: estándares, herramientas, arquitectura de pruebas.

El cambio grande: **no tienes autoridad sobre los squads**. No son tu equipo. Tu éxito se mide por si adoptan lo que propones, no por el documento que publicas.`,
  },
  {
    id: 'influence',
    question: 'Me piden imponer algo a equipos que no dependen de mí. ¿Qué hago?',
    conceptId: 'influence',
    cost: 5,
    body: `1. **Busca el objetivo real** de quien lo pide. Raúl no quiere «una herramienta»: quiere saber qué está probado.
2. **Escucha a los afectados antes de decidir.**
3. **Decide con criterios y datos**, mejor con un piloto.
4. **No prometas lo que no depende de ti:** ni «en un mes todos», ni «a vosotros no os afecta».

Lo que se impone se cumple en el papel. Lo que se construye con los equipos, se usa.`,
  },
  {
    id: 'minimum',
    question: '¿Una herramienta para todo o cada uno la suya?',
    conceptId: 'minimum_standard',
    cost: 5,
    body: `Ninguna de las dos. Pregúntate **qué problema hay que resolver**:
- ¿Informes que no se pueden comparar? → formato común.
- ¿Datos que no se reutilizan? → convenciones de datos de prueba.
- ¿Ejecución caótica? → cómo se ejecuta en el pipeline.

Eso es el **estándar mínimo**. Para lo nuevo, una herramienta **recomendada**. Lo demás, que lo decida cada contexto: no es lo mismo probar una UI que una API, ni un equipo de Python que uno de Java.`,
  },
  {
    id: 'rfc',
    question: '¿Qué es un RFC y para qué sirve un ADR?',
    conceptId: 'rfc_adr',
    cost: 5,
    body: `**RFC:** tu propuesta por escrito (problema, opciones, propuesta y qué queda fuera) compartida **antes de decidir**. Cada comentario se responde: incorporándolo, explicando por qué no o dejándolo fuera de alcance.

**ADR:** la decisión final, con contexto, consecuencias y excepciones. Queda en el repositorio. Dentro de un año alguien sabrá por qué se decidió así.`,
  },
  {
    id: 'migration',
    question: '¿Cómo migro 2.000 tests sin parar a nadie?',
    conceptId: 'incremental_migration',
    cost: 5,
    body: `**Migración incremental:**
- lo **nuevo**, ya con el estándar;
- lo **existente**, cuando se toca;
- **fecha límite solo para lo crítico**, con ayuda.

Un «todos migran este trimestre» obliga al equipo con más volumen a elegir entre probar y cumplir. Y siempre gana cumplir en el papel.`,
  },
  {
    id: 'governance',
    question: '¿Cómo gestiono las excepciones al estándar?',
    conceptId: 'governance_guild',
    cost: 5,
    body: `- **Sin excepciones:** el estándar se rompe en el primer caso que no encaja.
- **Las apruebas tú una a una:** te conviertes en el cuello de botella.
- **Lo que funciona:** excepciones documentadas en el ADR, con su motivo, y revisadas cada mes en la guild de QA. Así son visibles, se decide con criterio compartido y no dependen de una persona.`,
  },
]
