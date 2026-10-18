import type { QuizQuestion } from '../../../engine/types'

/** Test antes y después de la misión 10 (Tu framework). */
export const m09Quiz: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k9pre_once',
      conceptId: 'callsingle',
      question: 'Seis features usan callonce para el login. ¿Cuántas veces se hace login en una ejecución?',
      options: ['1', '6', 'Una por escenario', 'Ninguna'],
      correct: 1,
      explanation: 'callonce es una vez por feature; para una vez por ejecución está karate.callSingle.',
    },
    {
      id: 'k9pre_print',
      conceptId: 'revision',
      question: 'Un escenario hace GET, comprueba status 200 y hace print response. ¿Qué detecta si la API devuelve datos erróneos?',
      options: ['Todo', 'Nada: solo falla si el status cambia', 'Lo que salga en el print', 'Los tipos de los campos'],
      correct: 1,
      explanation: 'print no comprueba nada: solo un match sobre el cuerpo detecta datos erróneos.',
    },
    {
      id: 'k9pre_schema',
      conceptId: 'estructura',
      question: 'El mismo esquema está copiado en cinco features. ¿Mejor opción?',
      options: ['Dejarlo así', 'Un fichero JSON leído con read() desde cada feature', 'Copiarlo en karate-config.js como texto', 'Quitar los esquemas'],
      correct: 1,
      explanation: 'Un solo fichero: si el contrato cambia, se cambia en un sitio.',
    },
    {
      id: 'k9pre_token',
      conceptId: 'revision',
      question: 'Un test lleva un token copiado de la consola. ¿Qué problema tiene?',
      options: ['Ninguno', 'Caduca y además es un secreto en el repositorio', 'Es más lento', 'No funciona en paralelo'],
      correct: 1,
      explanation: 'Funciona hoy en una máquina; mañana da 401. Y un secreto no va en el código.',
    },
  ],
  post: [
    {
      id: 'k9post_single',
      conceptId: 'callsingle',
      question: '¿Dónde se pone normalmente karate.callSingle para el login?',
      options: ['En cada Background', 'En karate-config.js, pasándole la configuración', 'En el runner Java', 'En el feature de login'],
      correct: 1,
      explanation: 'En karate-config.js corre antes de cada escenario y la caché hace que el login sea uno solo.',
    },
    {
      id: 'k9post_util',
      conceptId: 'estructura',
      question: '¿Qué hace que un feature sea una buena utilidad?',
      options: ['Que tenga muchos escenarios', 'Que tenga @ignore, haga una cosa y reciba argumentos', 'Que esté en la carpeta del runner', 'Que use print'],
      correct: 1,
      explanation: 'Una pieza pequeña, que no corre sola y que se parametriza.',
    },
    {
      id: 'k9post_review',
      conceptId: 'revision',
      question: 'Al revisar, ¿cuál es la pregunta más útil?',
      options: ['¿Pasa en tu máquina?', '¿Qué fallaría si la API se rompiera?', '¿Cuántos escenarios tiene?', '¿Usa la última versión de Karate?'],
      correct: 1,
      explanation: 'Un test que no puede fallar no protege nada.',
    },
    {
      id: 'k9post_conv',
      conceptId: 'convenciones',
      question: '¿Qué convención hace que los jobs del pipeline funcionen?',
      options: ['Nombres en inglés', 'Que todo escenario lleve @smoke o @regression', 'Un feature por persona', 'Comentarios en cada paso'],
      correct: 1,
      explanation: 'Los runners eligen escenarios por tags: un escenario sin tag puede quedarse fuera.',
    },
  ],
}
