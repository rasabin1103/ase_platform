import type { QuizQuestion } from '../../../engine/types'

/** Test antes y después de la misión 8 (El tercero que no responde). */
export const m07Quiz: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k7pre_why',
      conceptId: 'dobles',
      question: 'El sandbox del procesador de tarjetas está caído y no deja provocar errores. ¿Qué te permite seguir probando?',
      options: ['Nada: hay que esperar', 'Un mock del procesador que responde lo que necesitas', 'Probar en producción', 'Quitar la llamada al procesador'],
      correct: 1,
      explanation: 'Un doble de prueba ocupa el lugar del tercero y responde a voluntad.',
    },
    {
      id: 'k7pre_order',
      conceptId: 'mock',
      question: 'En un mock de Karate, dos escenarios cumplen la condición. ¿Cuál responde?',
      options: ['El último', 'El primero del fichero', 'Los dos', 'Ninguno: da error'],
      correct: 1,
      explanation: 'Gana el primero que se cumple: lo concreto arriba y el catch-all al final.',
    },
    {
      id: 'k7pre_slow',
      conceptId: 'mock',
      question: '¿Cómo simula un mock de Karate que el tercero tarda 5 segundos?',
      options: ['* def responseDelay = 5000', '* sleep 5000', '* def responseStatus = 504', 'No se puede'],
      correct: 0,
      explanation: 'responseDelay retrasa la respuesta del mock (en ms).',
    },
    {
      id: 'k7pre_timeout',
      conceptId: 'dobles',
      question: 'El procesador no responde a tiempo. ¿Qué debería hacer un servicio de pagos?',
      options: ['Aprobar el pago para no molestar al cliente', 'Fallar el pago (p. ej. 504) sin aprobarlo', 'Reintentar indefinidamente', 'Devolver 200 vacío'],
      correct: 1,
      explanation: 'Sin autorización del procesador, el pago no puede darse por aprobado.',
    },
  ],
  post: [
    {
      id: 'k7post_bind',
      conceptId: 'mock',
      question: 'karate.start con port: 8090 en el Background: el segundo escenario falla con BindException. ¿Por qué?',
      options: ['El mock tiene un error', 'El Background se ejecuta en cada escenario e intenta ocupar el puerto otra vez', 'El puerto 8090 está prohibido', 'Falta @ignore'],
      correct: 1,
      explanation: 'Se arranca una vez por feature con callonce.',
    },
    {
      id: 'k7post_contract',
      conceptId: 'dobles',
      question: 'Tu mock aprueba todo lo que le llega y la suite está en verde. ¿Qué riesgo hay?',
      options: ['Ninguno', 'Que enviemos peticiones que el tercero real rechazaría y no lo veamos', 'Que el mock sea lento', 'Que falle el runner'],
      correct: 1,
      explanation: 'El mock debe validar la petición como lo haría el tercero (karate.match con un esquema).',
    },
    {
      id: 'k7post_match',
      conceptId: 'dobles',
      question: '¿Qué devuelve karate.match(request, esquema)?',
      options: ['true o false', 'Un objeto con pass y message', 'Lanza un error si no coincide', 'El esquema'],
      correct: 1,
      explanation: 'Devuelve { pass, message } sin hacer fallar el escenario: ideal para condiciones del mock.',
    },
    {
      id: 'k7post_real',
      conceptId: 'dobles',
      question: 'Con todos los casos cubiertos con mocks, ¿qué falta antes de lanzar?',
      options: ['Nada', 'Una prueba contra el servicio real que confirme que el mock dice la verdad', 'Más mocks', 'Borrar los mocks'],
      correct: 1,
      explanation: 'El mock representa lo que creemos del tercero; hay que contrastarlo con el real.',
    },
  ],
}
