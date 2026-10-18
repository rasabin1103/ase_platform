import type { QuizQuestion } from '../../../engine/types'

/** Test antes y después de la misión 2 (Match, tu superpoder). */
export const m01Quiz: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k1pre_marker',
      conceptId: 'fuzzy',
      question: "¿Qué comprueba match response.balance == '#number'?",
      options: ['Que balance vale el texto «#number»', 'Que balance es un número, sea cual sea', 'Que balance es mayor que cero', 'Nada: es un comentario'],
      correct: 1,
      explanation: 'Los marcadores difusos comprueban el tipo o el formato, no un valor concreto.',
    },
    {
      id: 'k1pre_eq',
      conceptId: 'fuzzy',
      question: "La respuesta es { id: 'A', extra: 1 }. ¿Qué pasa con match response == { id: '#string' }?",
      options: ['Pasa: id es un string', 'Falla: con == sobra la clave extra', 'Falla: id no es un número', 'Pasa: == ignora las claves de más'],
      correct: 1,
      explanation: '== exige exactamente las mismas claves. Para ignorar las demás, contains.',
    },
    {
      id: 'k1pre_each',
      conceptId: 'each',
      question: '¿Cómo compruebas que todas las cuentas de response.items están activas?',
      options: ["match response.items == { status: 'ACTIVE' }", "match each response.items contains { status: 'ACTIVE' }", "match response.items[0].status == 'ACTIVE'", "assert response.items == 'ACTIVE'"],
      correct: 1,
      explanation: 'match each aplica la comparación a cada elemento; contains mira solo status.',
    },
    {
      id: 'k1pre_compat',
      conceptId: 'compat',
      question: '¿Cuál de estos cambios en una API es compatible con los clientes existentes?',
      options: ['Renombrar holder a holderName', 'Cambiar balance de número a texto', 'Añadir un campo nuevo opcional', 'Quitar el campo createdAt'],
      correct: 2,
      explanation: 'Añadir algo opcional no rompe a nadie; quitar, renombrar o cambiar el tipo sí.',
    },
  ],
  post: [
    {
      id: 'k1post_optional',
      conceptId: 'fuzzy',
      question: "¿Qué valores acepta el marcador '##string'?",
      options: ['Solo strings', 'Strings, null o que la clave no esté', 'Cualquier cosa', 'Solo null'],
      correct: 1,
      explanation: 'La doble almohadilla hace el marcador opcional: ausente o null también valen.',
    },
    {
      id: 'k1post_message',
      conceptId: 'each',
      question: 'Un match each falla con «$[1].balance | not a number». ¿Qué significa?',
      options: ['El primer elemento no tiene balance', 'El segundo elemento tiene un balance que no es número', 'Hay un elemento de más', 'El esquema está mal escrito'],
      correct: 1,
      explanation: 'Los índices empiezan en 0: $[1] es el segundo elemento.',
    },
    {
      id: 'k1post_snapshot',
      conceptId: 'contract',
      question: '¿Por qué no comparar con la respuesta exacta guardada en un fichero?',
      options: ['Porque Karate no puede leer ficheros', 'Porque los datos (saldos, fechas) cambian y el test fallaría sin que el contrato haya cambiado', 'Porque es más lento', 'Porque == no funciona con objetos'],
      correct: 1,
      explanation: 'Un contrato comprueba forma, no datos: los marcadores difusos lo hacen robusto.',
    },
    {
      id: 'k1post_v15',
      conceptId: 'compat',
      question: 'Tras un despliegue, tu contrato estricto falla porque aparece el campo alias, documentado como nuevo y opcional. ¿Qué haces?',
      options: ['Reporto un bug crítico', "Añado alias: '##string' al esquema: es un cambio compatible", 'Cambio == por contains en todos los tests', 'Borro el test de contrato'],
      correct: 1,
      explanation: 'Un campo nuevo, opcional y documentado es compatible: se actualiza el esquema.',
    },
  ],
}
