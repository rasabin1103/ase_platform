import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 4 · misión 6 · rol QA Lead). */
export const m06Lessons: Lesson[] = [
  {
    id: 'role',
    question: '¿Qué cambia de verdad al pasar de QA a QA Lead?',
    conceptId: 'role_qa_lead',
    cost: 5,
    body: `**Antes** se te medía por lo que probabas tú. **Ahora**, por lo que consigue tu equipo y por cómo crecen las personas.

Es tuyo:
- el reparto del trabajo;
- los 1:1 y el feedback;
- quitar bloqueos;
- respaldar a tu equipo.

Ya no es tuyo:
- coger lo difícil «porque lo hago más rápido»;
- decidir si el negocio asume un riesgo;
- la plantilla: eso lo decide tu QA Manager.

Las dos trampas del primer mes: hacer como si nada hubiera cambiado («soy uno más») o controlarlo todo («todo pasa por mí»).`,
  },
  {
    id: 'delegate',
    question: '¿Cómo reparto el trabajo del equipo?',
    conceptId: 'delegate_grow',
    cost: 5,
    body: `Mira tres cosas de cada persona:
1. **Fortalezas:** lo crítico, a quien más sabe.
2. **Crecimiento:** lo que alguien quiere aprender, si el riesgo lo permite.
3. **Carga y momento:** nada nuevo a quien no llega; riesgo controlado a quien está inseguro.

Y delega **con apoyo**: con quién empezar, cuándo revisarlo y permiso para equivocarse. Delegar no es soltar ni quitarte la tarea de encima.`,
  },
  {
    id: 'one2one',
    question: '¿Cómo es un buen primer 1:1?',
    conceptId: 'first_one_on_one',
    cost: 5,
    body: `Es **su** media hora, no tu reunión de seguimiento:
- ¿Qué te motiva? ¿Hacia dónde quieres crecer?
- ¿Cómo prefieres que te dé feedback?
- ¿Qué necesitas de mí?

Si hay algo incómodo (alguien optaba a tu puesto, un conflicto reciente), **nómbralo tú**. Fingir que no pasa nada o tirar de jerarquía solo lo empeora.`,
  },
  {
    id: 'peers',
    question: 'Dos de mi equipo eran mis compañeros. ¿Cómo lo llevo?',
    conceptId: 'first_one_on_one',
    cost: 5,
    body: `- **No finjas que nada cambia:** sí cambia, y los dos lo sabéis.
- **No impongas la jerarquía:** la confianza que teníais es tu mejor activo.
- **Habla de expectativas:** qué esperas tú, qué espera cada uno de ti, y cómo os daréis feedback.
- Si alguno optaba al puesto, ofrécele un reto visible a su medida. No es un premio de consolación: es aprovechar su talento.`,
  },
  {
    id: 'back',
    question: 'Mi QA no quiere firmar y producto me pide que «le pare los pies».',
    conceptId: 'back_your_team',
    cost: 5,
    body: `Es la misma escena que viviste como QA manual, ahora desde arriba.
1. **Agradece** que avise a tiempo: es lo que quieres de tu equipo.
2. **Revisa** con tu QA los datos y el riesgo.
3. **Ve con tu QA**: que cuente los datos y tú le respaldas.
4. **Lleva opciones y una recomendación**: recortar alcance, desactivar o retrasar.
5. **Decide el negocio.**

Si le pides que firme, o le desautorizas delante de producto, tu equipo aprende a callar los riesgos.`,
  },
  {
    id: 'capacity',
    question: 'Alguien de mi equipo me dice que no llega. ¿Qué hago?',
    conceptId: 'capacity',
    cost: 5,
    body: `1. **Agradece** que te lo diga: es la información que más necesitas.
2. **Protege a corto plazo:** nada nuevo esta semana y quita lo que puedas.
3. **Escala con datos** a tu QA Manager: carga, squads, lo que se está quedando sin probar.

«Todos vamos a tope» es la forma más rápida de perder a alguien bueno.`,
  },
]
