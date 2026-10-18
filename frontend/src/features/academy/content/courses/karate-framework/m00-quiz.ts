import type { QuizQuestion } from '../../../engine/types'

/** Test antes y después de la misión 1 (Hola, Karate). */
export const m00Quiz: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k0pre_method',
      conceptId: 'feature_anatomy',
      question: 'En un escenario de Karate, ¿qué paso envía de verdad la petición HTTP?',
      options: ['path', 'url', 'method', 'request'],
      correct: 2,
      explanation: 'url, path, param y request solo preparan la petición; method la lanza.',
    },
    {
      id: 'k0pre_status',
      conceptId: 'assertions',
      question: 'Un escenario termina en «Then status 200» y nada más. ¿Qué garantiza?',
      options: ['Que la respuesta es correcta', 'Solo que el código HTTP es 200', 'Que el JSON cumple el contrato', 'Nada: status no comprueba'],
      correct: 1,
      explanation: 'status solo mira el código. Un 200 con datos erróneos también pasaría: falta un match.',
    },
    {
      id: 'k0pre_bg',
      conceptId: 'background',
      question: '¿Cuándo se ejecutan los pasos del Background?',
      options: ['Una vez al principio del fichero', 'Antes de cada escenario', 'Después de cada escenario', 'Solo si un escenario falla'],
      correct: 1,
      explanation: 'El Background se repite antes de cada escenario, que así es independiente.',
    },
    {
      id: 'k0pre_gwt',
      conceptId: 'feature_anatomy',
      question: "Cambiar «Given path 'health'» por «* path 'health'»…",
      options: ['rompe el test', 'cambia el orden de ejecución', 'no cambia nada: las palabras clave de Gherkin son para leer', 'convierte el paso en un comentario'],
      correct: 2,
      explanation: 'Given, When, Then, And, But y * son equivalentes en Karate.',
    },
  ],
  post: [
    {
      id: 'k0post_response',
      conceptId: 'feature_anatomy',
      question: 'Tras «When method get», ¿dónde está el cuerpo de la respuesta?',
      options: ['En la variable request', 'En la variable response', 'Hay que leerlo con print', 'En responseStatus'],
      correct: 1,
      explanation: 'response tiene el cuerpo (JSON ya parseado) y responseStatus el código.',
    },
    {
      id: 'k0post_red',
      conceptId: 'red_test',
      question: 'La wiki dice que ACC-1003 está BLOCKED. Tu test espera BLOCKED y la API devuelve ACTIVE. ¿Qué haces?',
      options: ['Cambio el test a ACTIVE para que pase', 'Borro el escenario', 'Reporto un bug con el escenario como evidencia y dejo el test como está', 'Lo marco con @ignore hasta el jueves'],
      correct: 2,
      explanation: 'El test pide lo que dice la especificación: el fallo es de la API. El test se queda en rojo hasta el fix.',
    },
    {
      id: 'k0post_baseurl',
      conceptId: 'background',
      question: '¿Por qué «url baseUrl» y no la URL completa en cada escenario?',
      options: ['Porque Karate no admite URLs completas', 'Para poder ejecutar la misma suite en otro entorno sin tocar los tests', 'Porque es más rápido', 'Porque baseUrl valida el certificado'],
      correct: 1,
      explanation: 'baseUrl sale de karate-config.js y cambia por entorno; los tests no.',
    },
    {
      id: 'k0post_path',
      conceptId: 'feature_anatomy',
      question: "Con «url baseUrl» (https://api.kobalto.test/v1), ¿a qué URL llama «path 'accounts', 'ACC-1001'»?",
      options: ['https://api.kobalto.test/accounts/ACC-1001', 'https://api.kobalto.test/v1/accounts,ACC-1001', 'https://api.kobalto.test/v1/accounts/ACC-1001', 'https://api.kobalto.test/v1?accounts=ACC-1001'],
      correct: 2,
      explanation: 'Cada argumento de path es un segmento que se añade a la url con «/».',
    },
  ],
}
