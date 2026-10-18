import type { QuizQuestion } from '../../../engine/types'

/** Test antes y después de la misión 4 (POST y encadenar). */
export const m03Quiz: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k3pre_request',
      conceptId: 'payloads',
      question: 'En Karate, ¿con qué paso indicas el cuerpo JSON de un POST?',
      options: ['body', 'request', 'json', 'payload'],
      correct: 1,
      explanation: 'request fija el cuerpo de la siguiente petición; method post la envía.',
    },
    {
      id: 'k3pre_embedded',
      conceptId: 'payloads',
      question: 'En un JSON leído con read(), ¿qué hace "#(amount)"?',
      options: ['Comprueba que amount es un número', 'Lo sustituye por el valor de la variable amount', 'Es un comentario', 'Lo deja como texto literal'],
      correct: 1,
      explanation: 'Las expresiones embebidas se sustituyen por el valor de la variable al leer el fichero.',
    },
    {
      id: 'k3pre_chain',
      conceptId: 'chaining',
      question: 'Acabas de crear una transferencia. ¿Cómo la lees en el paso siguiente?',
      options: ["Copiando el id de la consola al feature", "* def transferId = response.id y path 'transfers', transferId", 'Con read() del id', 'No se puede en el mismo escenario'],
      correct: 1,
      explanation: 'Guarda el dato de la respuesta con def y úsalo en la siguiente petición.',
    },
    {
      id: 'k3pre_409',
      conceptId: 'http_codes',
      question: 'Confirmar una transferencia que ya está completada debería responder…',
      options: ['200, otra vez', '404', '409 Conflict', '500'],
      correct: 2,
      explanation: '409: la operación choca con el estado actual del recurso.',
    },
  ],
  post: [
    {
      id: 'k3post_get',
      conceptId: 'chaining',
      question: 'El POST devuelve 201 con amount 150.75. ¿Por qué hacer después un GET de la transferencia?',
      options: ['No hace falta', 'Para comprobar lo que se guardó de verdad, que puede no coincidir con la respuesta del POST', 'Para que el test tarde más', 'Porque Karate lo exige'],
      correct: 1,
      explanation: 'La respuesta del POST puede repetir lo que enviaste; el GET muestra lo que quedó guardado.',
    },
    {
      id: 'k3post_effect',
      conceptId: 'chaining',
      question: '¿Cuál es la mejor prueba de que confirmar una transferencia funciona?',
      options: ['Que responde 200', "Que el status pasa a 'COMPLETED'", 'Que el saldo de la cuenta baja exactamente el importe', 'Que la respuesta tarda menos de 1 s'],
      correct: 2,
      explanation: 'El efecto en el saldo es lo que le importa al cliente; los otros son necesarios pero no suficientes.',
    },
    {
      id: 'k3post_set',
      conceptId: 'payloads',
      question: 'Quieres probar «sin saldo» con el mismo JSON del caso feliz. ¿Qué haces?',
      options: ['Copiar el fichero y cambiar el importe', '* set body.amount = 999999 antes de request', 'Escribir otro feature', 'Cambiar el saldo de la cuenta'],
      correct: 1,
      explanation: 'set cambia un campo del cuerpo sin duplicar el fichero.',
    },
    {
      id: 'k3post_422',
      conceptId: 'http_codes',
      question: 'Una transferencia por encima del saldo, con un cuerpo bien formado, debería responder…',
      options: ['400 Bad Request', '422 Unprocessable Entity', '201 Created', '409 Conflict'],
      correct: 1,
      explanation: '422: la petición es válida pero la regla de negocio no la permite.',
    },
  ],
}
