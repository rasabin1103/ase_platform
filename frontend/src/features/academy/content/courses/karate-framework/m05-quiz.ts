import type { QuizQuestion } from '../../../engine/types'

/** Test antes y después de la misión 6 (Tokens y reutilización). */
export const m05Quiz: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k5pre_call',
      conceptId: 'call',
      question: "¿Qué devuelve «* def auth = call read('login.feature')»?",
      options: ['Solo el código de estado', 'Un objeto con las variables del feature llamado', 'El texto del feature', 'Nada: call no devuelve'],
      correct: 1,
      explanation: 'call devuelve todas las variables del llamado: auth.token, auth.response…',
    },
    {
      id: 'k5pre_once',
      conceptId: 'callonce',
      question: 'Un feature con 10 escenarios usa «callonce read(\'login.feature\')» en el Background. ¿Cuántas veces se ejecuta el login?',
      options: ['10', '1', '0', '11'],
      correct: 1,
      explanation: 'callonce ejecuta una vez por feature y reutiliza el resultado.',
    },
    {
      id: 'k5pre_ignore',
      conceptId: 'call',
      question: '¿Para qué se pone @ignore a un feature de login reutilizable?',
      options: ['Para que no se pueda llamar', 'Para que no se ejecute suelto como un test más', 'Para que vaya más rápido', 'Para ocultar el secreto'],
      correct: 1,
      explanation: '@ignore lo excluye de la ejecución normal; call lo sigue ejecutando.',
    },
    {
      id: 'k5pre_scope',
      conceptId: 'auth',
      question: 'Un token válido con scope accounts:read intenta crear una transferencia. ¿Qué debería responder la API?',
      options: ['201', '401', '403', '500'],
      correct: 2,
      explanation: '403: el token es válido (no es 401) pero no tiene permiso para eso.',
    },
  ],
  post: [
    {
      id: 'k5post_args',
      conceptId: 'call',
      question: "¿Cómo pides al login un token con un scope concreto?",
      options: ["* call read('login.feature') scope=accounts:read", "* def ro = call read('login.feature') { scope: 'accounts:read' }", "* def scope = call 'accounts:read'", 'No se puede: el login es fijo'],
      correct: 1,
      explanation: 'Los argumentos van en un objeto JSON tras la llamada.',
    },
    {
      id: 'k5post_429',
      conceptId: 'callonce',
      question: 'La suite falla con 429 TOO_MANY_REQUESTS en /auth/token. ¿Qué haces?',
      options: ['Reportar un bug crítico', 'Pedir menos tokens: callonce en el Background', 'Añadir esperas entre escenarios', 'Quitar los tests'],
      correct: 1,
      explanation: 'Es el límite documentado: la suite pide demasiados tokens.',
    },
    {
      id: 'k5post_revoke',
      conceptId: 'callonce',
      question: 'Para probar la revocación, ¿por qué no usar el token compartido de callonce?',
      options: ['Porque callonce no devuelve token', 'Porque al revocarlo se rompen los demás escenarios que lo usan', 'Porque es más lento', 'Da igual'],
      correct: 1,
      explanation: 'Un escenario que destruye un dato compartido rompe a los demás: pide un token propio con call.',
    },
    {
      id: 'k5post_500',
      conceptId: 'auth',
      question: 'Con un secreto incorrecto, la API responde 500 con «NullPointerException». ¿Es correcto?',
      options: ['Sí, es un error', 'No: debería ser 401 limpio, sin trazas internas', 'Sí, si el mensaje es claro', 'Depende del partner'],
      correct: 1,
      explanation: 'Credenciales malas son un 401 esperado; un 500 con trazas además filtra detalles internos.',
    },
  ],
}
