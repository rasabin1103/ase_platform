import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 4 · misión 1 · rol QA manual). */
export const m01Lessons: Lesson[] = [
  {
    id: 'queue',
    question: 'No me da tiempo a probar todo. ¿Por dónde empiezo?',
    conceptId: 'risk_queue',
    cost: 5,
    body: `Por **riesgo**, que es impacto por probabilidad:
- **Impacto:** ¿qué pasa si falla en producción? Dinero de clientes y regulador arriba; un color o un alias, abajo.
- **Probabilidad:** ¿cuánto ha cambiado? Una integración nueva o una lógica concurrente falla más que un campo de texto.

Lo vistoso no es lo arriesgado. Y lo que no pruebes, dilo: «sin probar» es información útil para quien decide.`,
  },
  {
    id: 'flow',
    question: '¿Cómo demuestro que el problema no soy yo?',
    conceptId: 'flow_visibility',
    cost: 5,
    body: `No intentes demostrar que no eres tú: **enseña cómo fluye el trabajo**.
- ¿Qué día llegó cada historia a QA?
- ¿Cuántos días estuvo QA sin nada nuevo que probar?
- ¿De qué tamaño eran las historias?
- ¿Tenían los criterios revisados antes de desarrollar?

Si casi todo llega los últimos días, el cuello de botella es el flujo del equipo. Con otro QA, la cola estaría igual el día 9.`,
  },
  {
    id: 'agreements',
    question: '¿Qué propongo en la retro?',
    conceptId: 'team_agreements',
    cost: 5,
    body: `Dos o tres acuerdos que **ataquen la causa** y que **dependan del equipo**:
- QA revisa los criterios antes de que empiece el desarrollo (shift-left).
- Límite de trabajo en curso: si hay dos historias esperando a QA, nadie empieza otra y se ayuda a probar.
- Historias más pequeñas, que lleguen a lo largo del sprint.
- Los devs prueban su historia con los casos de QA antes de pasarla.

No sirven: más gente (no lo decide la retro), más días (mini-cascada), fines de semana o probar solo el camino feliz (esconden el problema).`,
  },
  {
    id: 'blame',
    question: 'Raúl me pregunta si QA es el cuello de botella. ¿Qué le digo?',
    conceptId: 'data_not_blame',
    cost: 5,
    body: `Ni «la culpa es de desarrollo» ni «sí, iré más rápido».

1. **Datos del flujo:** cuándo llega el trabajo y en qué estado.
2. **Conclusión sin culpables:** «el problema es cómo fluye el trabajo, no una persona».
3. **Siguiente paso:** «en la retro propongo cómo cambiarlo».

Pedir otro QA tampoco te toca: el headcount es decisión de otros, y sin cambiar el flujo no arregla nada.`,
  },
  {
    id: 'feedback',
    question: 'Me han criticado delante de todos. ¿Cómo respondo?',
    conceptId: 'receive_feedback',
    cost: 5,
    body: `1. **Agradece** que te lo digan a la cara: es mejor que oírlo por los pasillos.
2. **Pregunta** para entender: «¿qué historia notaste más parada?».
3. **Contrasta con hechos**, sin atacar: «los datos dicen que…».
4. **Propón** algo concreto.

Recibir bien el feedback no es darle la razón a todo ni defenderte de todo: es entender qué hay de verdad y actuar.`,
  },
  {
    id: 'pace',
    question: '¿No es mejor quedarme hasta tarde y sacarlo todo?',
    conceptId: 'sustainable_pace',
    cost: 5,
    body: `Una vez, puede. Como sistema, no:
- **Esconde el problema:** el sprint «cierra» y nadie cambia nada.
- **Lo hace crónico:** el siguiente sprint se planifica contando con tus noches.
- **Te desgasta:** el cansancio trae errores y bugs que se escapan.

Lo profesional es decir qué da tiempo a probar y que el equipo ajuste el compromiso.`,
  },
]
