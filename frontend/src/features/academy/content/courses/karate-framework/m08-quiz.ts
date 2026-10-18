import type { QuizQuestion } from '../../../engine/types'

/** Test antes y después de la misión 9 (Verde en el pipeline). */
export const m08Quiz: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k8pre_green',
      conceptId: 'runner',
      question: 'El pipeline dice BUILD SUCCESS, pero el informe de Karate tiene escenarios en rojo. ¿Qué es lo más probable?',
      options: ['Que el informe esté mal', 'Que el runner no compruebe el número de fallos', 'Que Maven esté roto', 'Que sea normal en paralelo'],
      correct: 1,
      explanation: 'Runner…parallel() devuelve resultados; sin un assert sobre getFailCount(), el test JUnit pasa siempre.',
    },
    {
      id: 'k8pre_smoke',
      conceptId: 'runner',
      question: '¿Qué escenarios van en el smoke de cada pull request?',
      options: ['Todos', 'Los imprescindibles y rápidos', 'Los que fallan a menudo', 'Ninguno: el smoke es manual'],
      correct: 1,
      explanation: 'El smoke da una señal rápida; la regresión completa va en otro job.',
    },
    {
      id: 'k8pre_flaky',
      conceptId: 'flaky',
      question: 'Un test falla una de cada tres ejecuciones. ¿Qué haces primero?',
      options: ['Reintentarlo hasta que pase', 'Investigar qué cambia entre ejecuciones', 'Borrarlo', 'Marcarlo @ignore'],
      correct: 1,
      explanation: 'Un test inestable tiene una causa: del test (datos, esperas) o de la aplicación.',
    },
    {
      id: 'k8pre_shared',
      conceptId: 'paralelo',
      question: 'En paralelo, un test comprueba el saldo exacto de una cuenta que otros tests también usan. ¿Qué pasará?',
      options: ['Pasará siempre', 'Pasará o fallará según el orden', 'Fallará siempre', 'Karate lo bloquea'],
      correct: 1,
      explanation: 'Los demás escenarios cambian el saldo a la vez: depende de quién llegue antes.',
    },
  ],
  post: [
    {
      id: 'k8post_assert',
      conceptId: 'runner',
      question: '¿Qué línea hace que el job falle cuando falla un escenario?',
      options: ['System.out.println(results.getFailCount());', 'assertEquals(0, results.getFailCount(), results.getErrorMessages());', '.parallel(4);', '.tags("~@ignore");'],
      correct: 1,
      explanation: 'El assert convierte los fallos de Karate en un test JUnit fallido y en BUILD FAILURE.',
    },
    {
      id: 'k8post_tags',
      conceptId: 'runner',
      question: '¿Qué ejecuta .tags("@pagos", "~@lento")?',
      options: ['@pagos o los que no son @lento', 'Los @pagos que no son @lento', 'Solo los @lento', 'Nada: es un error'],
      correct: 1,
      explanation: 'Cada argumento se suma (Y); la coma dentro de un argumento es O.',
    },
    {
      id: 'k8post_data',
      conceptId: 'paralelo',
      question: '¿Cómo se arregla un test de saldo que falla en paralelo?',
      options: ['Ejecutándolo el último', 'Con una cuenta propia creada en el propio escenario', 'Con parallel(1) para siempre', 'Con un sleep'],
      correct: 1,
      explanation: 'Con datos propios, lo que hagan los demás escenarios no le afecta.',
    },
    {
      id: 'k8post_api',
      conceptId: 'flaky',
      question: 'Un escenario falla solo en paralelo y, ejecutado solo, pasa siempre. Sus datos son propios. ¿Qué sospechas?',
      options: ['Que el test está mal', 'Un problema de la API con peticiones simultáneas', 'Que el pipeline es lento', 'Nada: es normal'],
      correct: 1,
      explanation: 'Si el test está aislado, el comportamiento distinto con concurrencia apunta a la aplicación.',
    },
  ],
}
