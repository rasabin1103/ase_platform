import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 4 · misión 3 · QA Engineer mentora). */
export const m03Lessons: Lesson[] = [
  {
    id: 'mentor',
    question: '¿En qué se diferencia ser mentora de ser su jefa?',
    conceptId: 'mentor_not_boss',
    cost: 5,
    body: `**Mentora:**
- enseñas el oficio;
- revisas su trabajo;
- das confianza;
- cuentas lo que ves.

**Su Lead (su jefa):**
- reparte el trabajo;
- evalúa;
- decide sobre su carrera.

Si juzgas («no está preparada») o decides por ella, te sales del papel. Y si haces su trabajo, tampoco la ayudas: no aprende.`,
  },
  {
    id: 'onboarding',
    question: '¿Cómo es una buena primera semana para una junior?',
    conceptId: 'onboarding',
    cost: 5,
    body: `1. **Día 1:** el entorno, contigo al lado.
2. **Día 2:** una tarea **pequeña pero real**, que llegue a producción.
3. **Una revisión con tiempo** para explicar el porqué.
4. **Permiso explícito para preguntar:** «aquí no hay preguntas tontas».

Leer la wiki entera sola o pasarse semanas mirando cómo trabajas no enseña tanto como hacer algo de verdad con apoyo.`,
  },
  {
    id: 'review',
    question: '¿Cómo reviso el código de alguien que empieza?',
    conceptId: 'code_review_kind',
    cost: 5,
    body: `Separa tres cosas:
- **Lo que deja pasar bugs o rompe otras cosas:** bloqueante, con **el porqué** y **una sugerencia**.
- **Tus gustos** (nombres, estilo): «nit (opcional)» o nada.
- **Lo que está bien:** dilo. Así sabe qué repetir.

Evita «Esto está mal.» sin explicación. Y no arregles tú su rama: le quitas justo lo que tenía que aprender.`,
  },
  {
    id: 'blameless',
    question: 'La junior ha lanzado algo contra producción por error. ¿Qué hago?',
    conceptId: 'blameless',
    cost: 5,
    body: `1. **Agradece que lo diga pronto:** es lo más valioso.
2. **Contén el problema:** parar, avisar a quien corresponda.
3. **Postmortem sin culpables.** La pregunta no es «quién», sino «qué permitió que pasara». Por ejemplo: una configuración por defecto peligrosa, o credenciales donde no debían estar.
4. **Que participe en la solución.**

«Ten más cuidado» no cambia nada. Y cargar tú con la culpa tampoco: nadie aprende y el sistema sigue igual.`,
  },
  {
    id: 'lead',
    question: 'Su Lead me pregunta qué tal la junior. ¿Qué le digo?',
    conceptId: 'mentor_not_boss',
    cost: 5,
    body: `Lo que ves, con hechos:
- **Fortalezas:** «aprende rápido, es meticulosa».
- **Dónde le cuesta:** «preguntar, configurar entornos».
- **Qué le ayudaría:** «tareas pequeñas y claras, más trabajo en pareja».

Ni «todo bien» para no complicarte, ni «yo la sacaría del squad». Lo primero deja a su Lead sin información; lo segundo es su decisión, no la tuya.`,
  },
]
