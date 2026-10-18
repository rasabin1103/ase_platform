import type { QuizQuestion } from '../../../engine/types'

/** Test antes y después de la misión 3 (Un test, tres entornos). */
export const m02Quiz: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k2pre_when',
      conceptId: 'config',
      question: '¿Cuándo ejecuta Karate la función de karate-config.js?',
      options: ['Una vez al arrancar Maven', 'Antes de cada escenario', 'Solo si falla un escenario', 'Cuando se llama con read()'],
      correct: 1,
      explanation: 'Se ejecuta antes de cada escenario y lo que devuelve son variables globales.',
    },
    {
      id: 'k2pre_env',
      conceptId: 'config',
      question: '¿Cómo se indica en qué entorno corre la suite?',
      options: ['Cambiando la URL en cada feature', 'Con -Dkarate.env=pre al ejecutar', 'Con un tag @pre en cada escenario', 'Creando otro karate-config.js'],
      correct: 1,
      explanation: 'karate.env llega como propiedad del sistema y la config decide qué cambia.',
    },
    {
      id: 'k2pre_secret',
      conceptId: 'secrets',
      question: '¿Dónde debe estar la clave de la API de preproducción?',
      options: ['En karate-config.js, para no olvidarla', 'En un comentario del feature', 'En el gestor de secretos del pipeline, que la pasa al ejecutar', 'En el README'],
      correct: 2,
      explanation: 'Los secretos no entran en el repositorio: se inyectan al ejecutar.',
    },
    {
      id: 'k2pre_headers',
      conceptId: 'headers',
      question: '¿Qué hace «configure headers»?',
      options: ['Añade cabeceras a todas las peticiones siguientes', 'Comprueba las cabeceras de la respuesta', 'Solo afecta a la siguiente petición', 'Borra todas las cabeceras'],
      correct: 0,
      explanation: 'header es para una petición; configure headers, para todas.',
    },
  ],
  post: [
    {
      id: 'k2post_data',
      conceptId: 'env_data',
      question: 'La suite pasa en sandbox y en pre falla con 404 en el detalle de ACC-1001. ¿Qué es lo más probable?',
      options: ['Un bug de pre', 'El id de la cuenta está fijo en el feature y en pre no existe', 'La clave es incorrecta', 'Karate no soporta pre'],
      correct: 1,
      explanation: 'Cada entorno tiene sus datos: el id debe venir de la config según el entorno.',
    },
    {
      id: 'k2post_leak',
      conceptId: 'secrets',
      question: 'Alguien sube la clave de pre al repositorio y al día siguiente la borra. ¿Qué hay que hacer?',
      options: ['Nada: ya no está', 'Rotar la clave: sigue en el historial de Git', 'Hacer el repositorio privado', 'Cambiarle el nombre a la variable'],
      correct: 1,
      explanation: 'Lo que entra en Git queda en el historial. Una clave expuesta se rota.',
    },
    {
      id: 'k2post_null',
      conceptId: 'headers',
      question: 'Las cabeceras están configuradas con x-api-key. ¿Cómo pruebas una petición sin clave?',
      options: ['Borrando la config', "header x-api-key = null en ese escenario", "header x-api-key = ''", 'No se puede'],
      correct: 1,
      explanation: 'Un valor null quita la cabecera solo en esa petición.',
    },
    {
      id: 'k2post_resp',
      conceptId: 'headers',
      question: '¿Cómo lees la cabecera x-correlation-id de la respuesta?',
      options: ["response['x-correlation-id']", "responseHeaders['x-correlation-id'][0]", "header x-correlation-id", "karate.env['x-correlation-id']"],
      correct: 1,
      explanation: 'responseHeaders guarda cada cabecera como lista: [0] es el primer valor.',
    },
  ],
}
