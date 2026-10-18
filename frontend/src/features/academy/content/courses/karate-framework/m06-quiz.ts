import type { QuizQuestion } from '../../../engine/types'

/** Test antes y después de la misión 7 (Cuando todo falla). */
export const m06Quiz: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k6pre_code',
      conceptId: 'negativos',
      question: 'En un caso negativo, ¿qué conviene comprobar además del status?',
      options: ['Nada más', 'El code del error (dos errores distintos pueden compartir status)', 'Solo el tiempo de respuesta', 'Que el cuerpo esté vacío'],
      correct: 1,
      explanation: 'ACCOUNT_NOT_FOUND y TRANSFER_NOT_FOUND son ambos 404: el code distingue cuál es.',
    },
    {
      id: 'k6pre_opt',
      conceptId: 'errores',
      question: "¿Qué significa «field: '##string'» en un esquema?",
      options: ['Que field es obligatorio', 'Que field es opcional; si viene, es un string', 'Que field es null', 'Que field es un número'],
      correct: 1,
      explanation: 'Con ## el campo puede faltar o ser null.',
    },
    {
      id: 'k6pre_async',
      conceptId: 'retry',
      question: 'Una API responde 202 y procesa la operación después. ¿Cómo lo prueba bien Karate?',
      options: ['Con un sleep de 30 s', 'Consultando con retry until hasta el estado final', 'Comprobando solo el 202', 'No se puede probar'],
      correct: 1,
      explanation: 'retry until consulta con intervalo hasta que se cumple la condición, con un máximo de intentos.',
    },
    {
      id: 'k6pre_500',
      conceptId: 'negativos',
      question: 'Un importe enviado como texto devuelve 500. ¿Qué debería devolver?',
      options: ['500 está bien: es un error', '400 de validación, indicando el campo', '200 ignorando el importe', '404'],
      correct: 1,
      explanation: 'Una entrada incorrecta del cliente es un 4xx; un 5xx indica un fallo del servidor.',
    },
  ],
  post: [
    {
      id: 'k6post_default',
      conceptId: 'retry',
      question: 'Sin configurar nada, ¿cuánto espera retry until como mucho?',
      options: ['Para siempre', '3 intentos cada 3 s (unos 6 s)', '10 intentos cada segundo', '1 intento'],
      correct: 1,
      explanation: 'Por defecto count 3 e interval 3000; se cambia con configure retry.',
    },
    {
      id: 'k6post_too_many',
      conceptId: 'retry',
      question: '«too many retry attempts: 10» en una transferencia a otro banco, y con una interna pasa. ¿Qué haces?',
      options: ['Subir el count a 100', 'Mirar la última respuesta: si sigue PROCESSING más allá de lo que dice el contrato, es un bug', 'Poner un sleep', 'Quitar la prueba'],
      correct: 1,
      explanation: 'Si con el tiempo del contrato no termina, el problema está en la API, no en la espera.',
    },
    {
      id: 'k6post_schema',
      conceptId: 'errores',
      question: 'Un 404 llega como { timestamp, status, error, path } sin code ni traceId. ¿Es un bug?',
      options: ['No: el status es 404, que es lo esperado', 'Sí: rompe el formato común de errores del contrato', 'Solo si el mensaje está en inglés', 'Depende del partner'],
      correct: 1,
      explanation: 'Los partners leen code y traceId: un formato distinto es un incumplimiento del contrato.',
    },
    {
      id: 'k6post_header',
      conceptId: 'errores',
      question: '¿Cómo compruebas que un 503 trae Retry-After?',
      options: ["match response.Retry-After == '#present'", "match responseHeaders['Retry-After'][0] == '#regex [0-9]+'", 'status 503 basta', "header Retry-After = '#number'"],
      correct: 1,
      explanation: 'Las cabeceras de la respuesta están en responseHeaders, cada una como lista.',
    },
  ],
}
