import type { Mission } from '../../../engine/types'
import { kobaltoTeamsWorld } from '../../worlds/kobaltoTeams'
import { m03Lessons } from './m03-lessons'
import { m03Quiz } from './m03-quiz'
import { m03Scenes } from './m03-scenes'
import { FICHA_QA_ENGINEER } from './shared'

/**
 * Curso 4: Gestión de equipos QA · Misión 3 — El junior (rol: QA Engineer).
 * Guion legible: docs/academy/gestion-equipos-qa/missions/m03-junior.md
 *
 * Año 2. Llega Lucía, la primera QA junior, y la jugadora es su mentora (no
 * su jefa). Onboarding, revisión de su primer PR (app «Revisión»), un error
 * suyo en producción y Laura preguntando cómo la ve. Lucía reaparece en la
 * misión 7.
 */
export const m03Junior: Mission = {
  id: 'm03-junior',
  courseKey: 'gestion-equipos-qa',
  number: 3,
  title: 'El junior',
  subtitle: 'QA Engineer: mentorizar sin hacer su trabajo, revisar código con tacto, errores sin culpables y contar a su Lead lo que ves.',
  world: kobaltoTeamsWorld({ laura: 'QA Lead · tu responsable y la de Lucía', lucia: 'QA junior · recién llegada', diego: 'Backend developer · Tarjetas', ivan: 'Plataforma / DevOps' }),
  playerRole: 'QA Engineer · squad Tarjetas',
  dayStart: 9 * 60,
  dayLabel: 'Lunes · año 2',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'KOB',
  appId: 'kobalto-pr',
  appLabel: 'Revisión',
  hideBugList: true,
  wikiLabel: 'Wiki · Squad Tarjetas',
  initialMetrics: {},
  lessons: m03Lessons,
  mentor: 'laura',
  quiz: m03Quiz,
  verdicts: {
    good: {
      title: 'Una junior que se atreve',
      body: 'Lucía aprende el porqué de cada cambio, avisa de sus errores en minutos y el sistema ya no deja apuntar a producción por accidente. Y Laura sabe cómo ayudarla.',
    },
    ok: {
      title: 'Buena mentora, a medias',
      body: 'Lucía avanza, pero algo de hoy le costará: una revisión dura, un error mal llevado o una conversación que no tuviste. Mira el debrief.',
    },
    bad: {
      title: 'Una junior que no pregunta',
      body: 'Entre revisiones secas, culpas y atajos, Lucía aprende a no preguntar y a esconder los errores. Repite la misión leyendo antes la guía de mentoría.',
    },
  },

  briefing: {
    title: 'Año 2 · Mentora de Lucía',
    paragraphs: [
      'Sigues como QA Engineer en Tarjetas. Hoy llega Lucía, la primera QA junior de Kobalto, y Laura te pide que seas su mentora técnica.',
      'No eres su jefa: Laura lo es. Tu papel es que Lucía aprenda, se sitúe y se atreva a preguntar y a equivocarse.',
      'Hoy toca darle la bienvenida y revisar su primer pull request. Y algo saldrá mal.',
    ],
    goals: [
      'Lee la ficha del rol y la guía de mentoría.',
      'Dale a Lucía un plan concreto para su primera semana.',
      'Revisa su primer PR en la app «Revisión»: lo que deja pasar bugs, con el porqué; tus gustos, como opcionales; lo bien hecho, reconocido.',
      'Si se equivoca, gestiona el error sin culpables y corrige el sistema.',
      'Cuéntale a Laura lo que ves, sin hacer de jefa.',
    ],
  },

  tools: [
    { tool: 'mail' },
    { tool: 'chat' },
    { tool: 'app', enabledWhen: { kind: 'flag', key: 'pr.ready' }, lockedMessage: 'Lucía aún no ha subido su primer PR. Llegará a media mañana.' },
    { tool: 'wiki' },
  ],

  scenes: m03Scenes,
  endSceneId: 'closing',

  docs: [
    FICHA_QA_ENGINEER,
    {
      id: 'mentoria',
      title: 'Guía de mentoría técnica',
      updatedLabel: 'Laura Méndez · QA Lead',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'mentor_not_boss' }, { kind: 'flag', key: 'guide.read' }],
      body: `## Qué es mentorizar
- Acompañar a alguien a aprender el oficio: le enseñas, le revisas y le das confianza.
- **No** es ser su jefa (eso es su Lead) ni hacer su trabajo.

## Primera semana
- Entorno acompañada, una tarea pequeña y real, y una revisión con tiempo para explicar.
- Dejar claro que preguntar es lo normal.

## Revisar código de alguien que empieza
- Lo que deja pasar bugs: bloqueante, con el porqué y una sugerencia.
- Tus gustos: «nit (opcional)» o nada.
- Lo bien hecho: dilo.
- No arregles tú su rama: así no aprende.

## Cuando se equivoca
- Agradece que lo diga pronto.
- Pregunta qué falló en el sistema que lo permitió, no quién.

## Con su Lead
- Cuéntale lo que ves (hechos, fortalezas, necesidades). La evaluación es suya.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'C-EXTRACTO', title: 'Un extracto con importes mal calculados llega a producción: el test solo comprobaba el 200', severity: 'high', explanation: 'La revisión no detectó que el test de Lucía no comprobaba el contenido.', technique: 'En la revisión, lo que deja pasar bugs es bloqueante.', preventedBy: 'review.caught' },
    { id: 'C-REPITE', title: 'Un mes después, otro script vuelve a lanzar carga contra producción', severity: 'critical', explanation: 'Se trató el error como un despiste personal y no se corrigió el sistema que lo permitía.', technique: 'Postmortem sin culpables: qué permitió el error y qué cambiamos.', preventedBy: 'guardrail.ok' },
    { id: 'C-ESCONDE', title: 'La próxima vez que Lucía se equivoca, tarda dos días en decirlo', severity: 'high', explanation: 'Si equivocarse trae culpa (o alguien carga con ello por ti), se aprende a esconder los errores.', technique: 'Agradecer que se avise pronto y revisiones amables.', preventedBy: 'trust.lucia' },
    { id: 'C-LENTA', title: 'Lucía tarda tres meses en ser autónoma', severity: 'medium', explanation: 'Sin un plan concreto y una tarea real desde el principio, el onboarding se alarga.', technique: 'Onboarding con práctica acompañada y una tarea pequeña y real.', preventedBy: 'onboard.ok' },
    { id: 'C-A-CIEGAS', title: 'Laura evalúa a Lucía sin la información que tenías tú', severity: 'medium', explanation: 'La mentora ve el día a día; si no lo cuenta (o juzga en lugar de contar), su Lead decide a ciegas.', technique: 'Contar hechos, fortalezas y necesidades; la evaluación es del Lead.', preventedBy: 'lead.informed' },
  ],

  prevention: {
    title: 'Los primeros meses de Lucía',
    intro: 'Cómo la acompañaste hoy decide cómo crece.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'review.caught', label: 'El test débil, detectado en la revisión', explanation: 'Solo comprobar el 200 dejaba pasar un extracto vacío o mal calculado.' },
      { flag: 'guardrail.ok', label: 'Sistema corregido', explanation: 'Por defecto, staging; credenciales de producción solo con aprobación; aviso si se apunta a producción.' },
      { flag: 'trust.lucia', label: 'Lucía se atreve a equivocarse', explanation: 'Revisión amable y un error tratado sin culpas.' },
      { flag: 'onboard.ok', label: 'Onboarding con práctica', explanation: 'Entorno acompañada, tarea pequeña y real, y revisión.' },
      { flag: 'lead.informed', label: 'Su Lead tiene la información', explanation: 'Hechos, fortalezas, necesidades y una propuesta, sin juzgar.' },
    ],
  },

  concepts: [
    { id: 'role_qa_engineer', title: 'Responsabilidades del QA Engineer', summary: 'Posee la automatización del squad y ayuda a otros a escribir buenos tests. Mentorizar es parte del rol; evaluar a las personas, no.' },
    { id: 'onboarding', title: 'Un buen onboarding', summary: 'Entorno acompañado, una tarea pequeña y real desde el principio, una revisión con tiempo y permiso explícito para preguntar.' },
    { id: 'code_review_kind', title: 'Revisar código para enseñar', summary: 'Lo que deja pasar bugs es bloqueante, con el porqué y una sugerencia; los gustos, opcionales; lo bien hecho, reconocido. Sin arreglarlo por la otra persona.' },
    { id: 'blameless', title: 'Errores sin culpables', summary: 'Agradecer que se avise pronto, entender la secuencia y corregir lo que permitió el error. «Ten más cuidado» no cambia nada; cargar con la culpa por otra persona, tampoco.' },
    { id: 'mentor_not_boss', title: 'Mentora, no jefa', summary: 'La mentora acompaña y cuenta lo que ve; la evaluación y las decisiones sobre la persona son de su responsable.' },
  ],
  debriefConcepts: ['onboarding', 'code_review_kind', 'blameless', 'mentor_not_boss', 'role_qa_engineer'],
  seniorTips: [
    'Bienvenida: entorno contigo hoy, mañana los tests de extractos y revisión del PR. Preguntar es lo normal.',
    'PR: bloques 1, 2 y 3 bloqueantes con el porqué (solo el 200, cuenta compartida, espera fija); 4 y 5 como «nit» o nada; el 6, reconocerlo.',
    'Nunca «Esto está mal.» ni arreglar su rama tú.',
    'Error en producción: gracias por avisar, paráis el script y se revisa el sistema.',
    'Postmortem: que lo cuente ella, se corrige la configuración por defecto y las credenciales, y ella participa en la solución.',
    'A Laura: hechos, fortalezas, necesidades y una propuesta. Evaluar es cosa suya.',
  ],
}
