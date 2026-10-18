import type { QuizQuestion } from '../../../engine/types'

/** Test antes y después de la misión 5 (Dirigido por datos). */
export const m04Quiz: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k4pre_outline',
      conceptId: 'outline',
      question: 'Un Scenario Outline con 6 filas en Examples, ¿cuántos escenarios ejecuta Karate?',
      options: ['1', '6', '7', 'Depende del Background'],
      correct: 1,
      explanation: 'Un escenario por fila de la tabla.',
    },
    {
      id: 'k4pre_bva',
      conceptId: 'boundaries',
      question: 'Regla: «hasta 1.000 € por transferencia». ¿Qué par de importes la prueba mejor?',
      options: ['500 y 5.000', '1.000 y 1.000,01', '0 y 10.000', '999 y 1.001'],
      correct: 1,
      explanation: 'Justo dentro y justo fuera del borde: es donde aparecen los > en vez de >=.',
    },
    {
      id: 'k4pre_text',
      conceptId: 'outline',
      question: 'En una tabla Examples, la celda | 500 | de la columna amount llega como…',
      options: ['El número 500', 'El texto "500"', 'null', 'Depende de la API'],
      correct: 1,
      explanation: 'Las celdas son texto salvo que la columna termine en ! (amount!).',
    },
    {
      id: 'k4pre_copy',
      conceptId: 'outline',
      question: 'Tienes 8 escenarios idénticos que solo cambian el importe. ¿Qué haces?',
      options: ['Nada, así se leen mejor', 'Un Scenario Outline con una tabla de 8 filas', 'Un bucle while en JavaScript', 'Borrar 7'],
      correct: 1,
      explanation: 'Los pasos una vez, los datos en la tabla.',
    },
  ],
  post: [
    {
      id: 'k4post_dynamic',
      conceptId: 'outline',
      question: "¿Qué hace «Examples: | read('data/casos.json') |»?",
      options: ['Lee el fichero como texto en una variable', 'Usa cada objeto del JSON como una fila del esquema', 'Valida el JSON', 'Nada: no es sintaxis válida'],
      correct: 1,
      explanation: 'Examples dinámicos: una fila por objeto, cada clave una variable con su tipo.',
    },
    {
      id: 'k4post_concept',
      conceptId: 'boundaries',
      question: 'El concepto admite hasta 140 caracteres. ¿Qué longitudes pruebas?',
      options: ['10 y 500', '140 y 141', '0 y 140', 'Solo 140'],
      correct: 1,
      explanation: 'El borde exacto (140, se acepta) y el primero de fuera (141, se rechaza).',
    },
    {
      id: 'k4post_random',
      conceptId: 'boundaries',
      question: '¿Por qué no generar importes aleatorios en cada ejecución?',
      options: ['Karate no puede', 'Si falla uno, cuesta reproducirlo, y puede que nunca salga el borde exacto', 'Es más lento siempre', 'Porque la API no acepta decimales'],
      correct: 1,
      explanation: 'Pocos datos deterministas y bien elegidos encuentran más y se reproducen siempre.',
    },
    {
      id: 'k4post_merge',
      conceptId: 'outline',
      question: '¿Para qué sirve karate.merge(body, patch) en una tabla de casos negativos?',
      options: ['Para borrar el body', 'Para cambiar solo los campos de cada caso sobre un cuerpo válido', 'Para comparar dos JSON', 'Para leer un fichero'],
      correct: 1,
      explanation: 'Cada fila cambia un campo; el resto del cuerpo es válido, así el error es el que buscas.',
    },
  ],
}
