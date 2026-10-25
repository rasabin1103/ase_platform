import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 4 · misión 7 · rol QA Lead). */
export const m07Lessons: Lesson[] = [
  {
    id: 'sbi',
    question: '¿Cómo doy feedback sobre algo que va mal?',
    conceptId: 'sbi_feedback',
    cost: 5,
    body: `Con el modelo **situación, comportamiento, impacto**:
- **Situación:** cuándo y dónde («en el sprint 14»).
- **Comportamiento:** lo que se vio, sin interpretar («tres historias llegaron sin probar al cierre»).
- **Impacto:** qué provocó («el release se movió dos días»).

Nada de juicios sobre la persona («eres lenta») ni de opiniones de otros («Nerea dice que…»). Y nada de sándwich: el mensaje se pierde entre los elogios.`,
  },
  {
    id: 'cause',
    question: '¿Por qué buscar la causa antes de proponer nada?',
    conceptId: 'root_cause',
    cost: 5,
    body: `El bajo rendimiento es un síntoma. Las causas habituales:
- no sabe qué se espera (expectativas poco claras);
- no sabe cómo hacerlo (formación, dominio nuevo);
- no puede (carga, herramientas, bloqueos);
- algo personal.

Solo la última es privada; las demás suelen ser **responsabilidad del Lead**. Pregunta en abierto y escucha: «¿Qué te está costando? ¿Qué necesitarías?».`,
  },
  {
    id: 'plan',
    question: '¿Cómo es un buen plan para mejorar?',
    conceptId: 'improvement_plan',
    cost: 5,
    body: `- **Objetivos medibles:** qué tiene que pasar, no «esfuérzate más».
- **Apoyo concreto:** formación, pareja, 1:1 semanal.
- **Plazo y fecha de revisión:** por ejemplo, seis semanas.
- **Por escrito y compartido:** un resumen el mismo día.

El **plan de mejora formal** con Personas llega después, si con feedback claro y apoyo no hay cambio. Abrirlo sin eso es injusto y no se sostiene.`,
  },
  {
    id: 'record',
    question: '¿Por qué documentar la conversación?',
    conceptId: 'documentation',
    cost: 5,
    body: `Porque en seis semanas nadie recuerda lo mismo. Un resumen **compartido con la persona**: hechos, acuerdos, objetivos y fecha de revisión.

Las notas solo tuyas no son un acuerdo. Y si un día hace falta un proceso formal, lo que cuenta es que hubo feedback claro y apoyo, por escrito.`,
  },
  {
    id: 'mediation',
    question: 'Dos personas del equipo chocan. ¿Qué hago?',
    conceptId: 'mediation',
    cost: 5,
    body: `- Escucha a cada una por separado y **hazte cargo**: no es «su problema».
- Juntas, habla de **cómo trabajan**, no de quién tiene razón.
- Busca un **acuerdo concreto** (por ejemplo, revisar antes en vez de rehacer después) y una fecha para revisarlo.

Nunca juzgues a una delante de la otra.`,
  },
  {
    id: 'confidential',
    question: 'El equipo pregunta por un compañero. ¿Qué digo?',
    conceptId: 'confidentiality',
    cost: 5,
    body: `Lo que le pasa a una persona del equipo **no se comenta con el resto**: ni el rendimiento, ni Personas, ni los planes.

Sin mentir: «No hablo de la situación de nadie del equipo, igual que no hablaría de la tuya». Negarlo todo («todo bien») te quita credibilidad; contarlo «entre nosotros» se sabe en una hora.`,
  },
]
