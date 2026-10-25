import type { Mission } from '../../../engine/types'
import { kobaltoTeamsWorld } from '../../worlds/kobaltoTeams'
import { m00Lessons } from './m00-lessons'
import { m00Quiz } from './m00-quiz'
import { m00Scenes } from './m00-scenes'
import { FICHA_QA_MANUAL } from './shared'

/**
 * Curso 4: Gestión de equipos QA · Misión 0 — La firma (rol: QA manual).
 * Guion legible: docs/academy/gestion-equipos-qa/missions/m00-la-firma.md
 *
 * Víspera de la demo de tarjetas virtuales. Marta quiere la firma de QA sin
 * que esté probado, Diego rechaza un bug, Sergio pide ayuda y a las 16:30 hay
 * go/no-go. Se juzga contra la ficha del rol: el QA manual informa del
 * riesgo con evidencia; decidir si se asume es de otros.
 */
export const m00LaFirma: Mission = {
  id: 'm00-la-firma',
  courseKey: 'gestion-equipos-qa',
  number: 0,
  title: 'La firma',
  subtitle: 'QA manual: estado honesto, bugs con evidencia, prioridades y quién decide el riesgo.',
  world: kobaltoTeamsWorld({ laura: 'QA Lead · tu responsable', sergio: 'QA Automation · Tarjetas', marta: 'Product Owner · Pagos' }),
  playerRole: 'QA manual · squad Tarjetas',
  dayStart: 9 * 60,
  dayLabel: 'Jueves · año 1',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'KOB',
  hideBugList: true,
  wikiLabel: 'Wiki · Squad Tarjetas',
  initialMetrics: {},
  lessons: m00Lessons,
  mentor: 'laura',
  quiz: m00Quiz,
  verdicts: {
    good: {
      title: 'Tu firma vale algo',
      body: 'La demo sale bien, Diego arregla el bug a tiempo y Laura y Marta saben que cuando dices «probado» es que está probado.',
    },
    ok: {
      title: 'Release salvado, con costuras',
      body: 'El release sale, pero alguna decisión te pasa factura la semana siguiente. Mira en el debrief qué responsabilidad del rol se quedó coja.',
    },
    bad: {
      title: 'La firma sin valor',
      body: 'Sorpresas en la demo, un bug en producción y menos confianza en tus estados. Repite la misión leyendo antes la ficha del rol.',
    },
  },

  briefing: {
    title: 'Año 1 · QA manual en el squad Tarjetas',
    paragraphs: [
      'Kobalto tiene seis squads y tú eres la QA manual de Tarjetas. Tu responsable es Laura, la QA Lead.',
      'Mañana a las 10:00 Marta enseña las tarjetas virtuales (KOB-412) a un banco socio. Te queda probar casi todo, hay un bug abierto que desarrollo no reproduce y a las 16:30 es el go/no-go.',
      'Este curso va de responsabilidades: qué te toca en cada rol y qué decide otra persona. Empiezas por el primero.',
    ],
    goals: [
      'Lee la ficha de tu rol en la wiki: qué posees, qué decides y qué escalas.',
      'Da en la daily un estado honesto: hecho, pendiente, bloqueos y riesgo.',
      'Consigue que el bug KOB-415 se acepte con evidencia, no con insistencia.',
      'Prioriza: el camino crítico de la demo primero, y negocia lo que no te da tiempo.',
      'No firmes lo que no has probado, pero da alternativas.',
      'Llega al go/no-go con el estado por escrito y una recomendación.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'tickets' }, { tool: 'wiki' }],

  scenes: m00Scenes,
  endSceneId: 'closing',

  docs: [
    FICHA_QA_MANUAL,
    {
      id: 'gonogo',
      title: 'Go/no-go en Kobalto: quién decide qué',
      updatedLabel: 'Raúl Ortega · Engineering Manager',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'risk_ownership' }, { kind: 'flag', key: 'policy.read' }],
      body: `## Antes de la reunión
- QA deja en el ticket el estado de pruebas: probado, sin probar, defectos abiertos y riesgo.

## En la reunión
- **QA** informa y recomienda.
- **Desarrollo** cuenta el estado de los arreglos.
- **Producto** (PO) y el **Engineering Manager** deciden: salir, salir con alcance reducido o retrasar.

## Regla de oro
Nadie firma como probado lo que no está probado. Salir con un riesgo conocido es una decisión legítima del negocio; salir con un riesgo escondido no lo es.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-412',
      title: 'Tarjetas virtuales: alta, pago y bloqueo',
      status: 'En pruebas',
      type: 'story',
      description:
        'Como cliente quiero crear una tarjeta virtual al instante y usarla para pagar online. Alcance: alta de la tarjeta, pago en euros, bloqueo y desbloqueo, pago en dólares y límites diarios de gasto. Mañana se enseña en la demo con el banco socio (alta, pago en euros y bloqueo).',
      acceptanceCriteria: [
        'La tarjeta se crea en menos de 5 segundos y aparece en la app.',
        'Un pago en euros se cobra una sola vez.',
        'Una tarjeta bloqueada rechaza los pagos y se puede desbloquear.',
        'Un pago en dólares se convierte al cambio del día.',
        'No se puede superar el límite diario configurado.',
      ],
      comments: [
        { author: 'marta', body: 'Para la demo de mañana importan el alta, el pago en euros y el bloqueo.' },
        { author: 'laura', body: 'Antes del go/no-go deja aquí el estado de pruebas, aunque esté incompleto.' },
        {
          author: 'yo',
          body: 'Estado de QA: probado y OK el alta, el pago en euros y el bloqueo. Defecto abierto: KOB-415. Sin probar: pago en dólares y límites diarios. Recomendación: demo en euros y desactivar dólares hasta probarlo.',
          visibleWhen: { kind: 'all', of: [{ kind: 'flag', key: 'status.written' }, { kind: 'flag', key: 'tested.critical' }, { kind: 'notFlag', key: 'tested.all' }] },
        },
        {
          author: 'yo',
          body: 'Estado de QA: probada el alta. Sin probar todavía: pago en euros, bloqueo, pago en dólares y límites diarios. Defecto abierto: KOB-415. Riesgo alto para la demo.',
          visibleWhen: { kind: 'all', of: [{ kind: 'flag', key: 'status.written' }, { kind: 'notFlag', key: 'tested.critical' }] },
        },
        {
          author: 'yo',
          body: 'Estado de QA: probado todo el alcance (alta, pagos en euros y dólares, bloqueo y límites diarios). Defecto KOB-415 aceptado por desarrollo y en arreglo.',
          visibleWhen: { kind: 'all', of: [{ kind: 'flag', key: 'status.written' }, { kind: 'flag', key: 'tested.all' }, { kind: 'flag', key: 'bug.accepted' }] },
        },
        {
          author: 'yo',
          body: 'Estado de QA: probado todo el alcance (alta, pagos en euros y dólares, bloqueo y límites diarios). Riesgo abierto: KOB-415, cobro doble con red lenta, sin reproducir aún por desarrollo.',
          visibleWhen: { kind: 'all', of: [{ kind: 'flag', key: 'status.written' }, { kind: 'flag', key: 'tested.all' }, { kind: 'notFlag', key: 'bug.accepted' }] },
        },
      ],
      actions: [
        {
          id: 'critical',
          label: 'Probar el camino crítico de la demo (alta, pago en euros y bloqueo)',
          cost: 120,
          effects: [
            { kind: 'flag', key: 'tested.critical' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'efficiency', add: 1 },
            { kind: 'note', tone: 'good', text: 'Probaste primero el camino crítico de la demo: lo que más riesgo tenía.' },
          ],
        },
        {
          id: 'rest',
          label: 'Probar el resto (pago en dólares y límites diarios)',
          cost: 180,
          hiddenWhen: { kind: 'notFlag', key: 'tested.critical' },
          effects: [
            { kind: 'flag', key: 'tested.all' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Te dio tiempo a probar todo el alcance.' },
          ],
        },
        {
          id: 'status',
          label: 'Escribir en el ticket el estado de pruebas (probado, sin probar, defectos, riesgo)',
          cost: 15,
          effects: [
            { kind: 'flag', key: 'status.written' },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'honest_status' },
            { kind: 'note', tone: 'good', text: 'Dejaste el estado de pruebas por escrito antes del go/no-go.' },
          ],
        },
        {
          id: 'sign',
          label: 'Marcar como «Probado por QA»',
          cost: 5,
          effects: [
            {
              kind: 'if',
              when: { kind: 'flag', key: 'tested.all' },
              then: [{ kind: 'note', tone: 'good', text: 'Firmaste KOB-412 después de probar todo su alcance.' }],
              else: [
                { kind: 'flag', key: 'signed.untested' },
                { kind: 'score', key: 'risk', add: -2 },
                { kind: 'note', tone: 'bad', text: 'Marcaste KOB-412 como probada sin haber probado todo su alcance.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'KOB-415',
      title: 'Cobro doble al pulsar «Pagar» dos veces',
      status: 'En revisión por desarrollo',
      type: 'bug',
      description: 'Al pulsar dos veces seguidas «Pagar» con la tarjeta virtual se crean dos cargos. Visto una vez en el móvil de pruebas.',
      acceptanceCriteria: [],
      comments: [
        { author: 'diego', body: 'No lo reproduzco en local. ¿Pasos?' },
        { author: 'diego', body: 'Reproducido con red lenta: el botón no se desactiva hasta que responde el servidor. Lo arreglo hoy.', visibleWhen: { kind: 'flag', key: 'bug.accepted' } },
      ],
      actions: [
        {
          id: 'evidence',
          label: 'Reproducirlo y adjuntar evidencia (pasos, usuario de prueba, red lenta, vídeo y hora del log)',
          cost: 20,
          hiddenWhen: { kind: 'flag', key: 'bug.closed' },
          effects: [
            { kind: 'flag', key: 'bug.evidence' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'evidence_based' },
            { kind: 'note', tone: 'good', text: 'Reprodujiste KOB-415 y adjuntaste evidencia: con red lenta el botón no se desactiva a tiempo.' },
          ],
        },
      ],
    },
  ],

  bugs: [
    { id: 'C-DEMO', title: 'La demo con el banco socio falla en el pago en dólares, que nadie había probado', severity: 'critical', explanation: 'Sin un estado claro en el go/no-go, nadie decidió desactivar lo que no estaba probado.', technique: 'QA informa del riesgo con una recomendación; negocio decide con información.', preventedBy: 'gonogo.clear' },
    { id: 'C-BUG', title: 'KOB-415 llega a producción: cobros dobles y quejas en Atención al cliente', severity: 'high', explanation: 'El bug se cerró o se quedó en discusión porque no tenía evidencia reproducible.', technique: 'Bug reports con evidencia y conversación con desarrollo antes de escalar.', preventedBy: 'bug.accepted' },
    { id: 'C-CONFIANZA', title: 'Laura y Marta dejan de fiarse de tus estados de pruebas', severity: 'high', explanation: 'Un «casi está», una firma sin probar o un «todo bien» falso hacen que tu palabra deje de servir para decidir.', technique: 'Estado honesto y firma solo de lo probado.', preventedBy: 'trust.ok' },
    { id: 'C-SORPRESA', title: 'Laura se entera de que no llegas en el mismo go/no-go y ya no puede ayudarte', severity: 'medium', explanation: 'Pedir ayuda tarde equivale a no pedirla.', technique: 'Escalar pronto, con lo que falta y una propuesta.', preventedBy: 'help.ok' },
    { id: 'C-SOBRECARGA', title: 'Acabas a las diez de la noche y Sergio sigue sin saber cuándo tendrá sus datos', severity: 'medium', explanation: 'Decir que sí a todo, o que no sin alternativa, no es priorizar.', technique: 'Negociar: qué puedes, cuándo, y quién decide si hay conflicto.', preventedBy: 'prio.negotiated' },
  ],

  prevention: {
    title: 'La semana siguiente',
    intro: 'Cada responsabilidad del rol que cubriste evitó un problema concreto en los días después del release.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'gonogo.clear', label: 'Estado claro en el go/no-go', explanation: 'Probado, sin probar, defectos abiertos y recomendación, por escrito. Decide quien tiene que decidir.' },
      { flag: 'bug.accepted', label: 'Bug aceptado con evidencia', explanation: 'Pasos, datos, condiciones (red lenta) y vídeo: el bug deja de ser una opinión.' },
      { flag: 'trust.ok', label: 'Tu palabra vale', explanation: 'Estado honesto en la daily, ninguna firma sin probar y ningún «todo bien» falso.' },
      { flag: 'help.ok', label: 'Ayuda pedida a tiempo', explanation: 'A las 15:00, con lo que faltaba y una propuesta, no a las 16:29.' },
      { flag: 'prio.negotiated', label: 'Prioridades negociadas', explanation: 'Ni sí a todo ni no a secas: qué, cuándo y quién decide.' },
    ],
  },

  concepts: [
    { id: 'role_qa_manual', title: 'Responsabilidades del QA manual', summary: 'Posee sus pruebas, sus bug reports y su estado. Decide cómo probar y cuándo pedir ayuda. No decide si se asume un riesgo de negocio: lo informa.' },
    { id: 'honest_status', title: 'Estado de pruebas honesto', summary: 'Hecho, pendiente, bloqueos y riesgo, con hechos y no con sensaciones. Un estado optimista quita a los demás la opción de reaccionar.' },
    { id: 'evidence_based', title: 'Bugs con evidencia', summary: 'Pasos, datos, entorno, condiciones y evidencia (vídeo, log). Separar el problema de la persona y ofrecer verlo juntos antes de escalar.' },
    { id: 'risk_ownership', title: 'Quién decide el riesgo', summary: 'QA informa y recomienda; el dueño del negocio decide salir, recortar alcance o retrasar. Nunca se firma como probado lo que no lo está.' },
    { id: 'priority_negotiation', title: 'Negociar prioridades', summary: 'Ante varias peticiones: qué puedes hacer, cuándo, qué dejas de hacer y quién decide si chocan (tu Lead).' },
    { id: 'ask_help', title: 'Pedir ayuda a tiempo', summary: 'En cuanto ves que no llegas, con lo que falta y una propuesta concreta. Pedirla tarde es casi como no pedirla.' },
  ],
  debriefConcepts: ['role_qa_manual', 'honest_status', 'evidence_based', 'risk_ownership', 'priority_negotiation', 'ask_help'],
  seniorTips: [
    'Primero la ficha del rol: te dice qué es tuyo y qué decide otra persona.',
    'En la daily: hecho, pendiente, bloqueos y riesgo. «Casi está» no es un estado.',
    'Antes de discutir con Diego, reproduce KOB-415 y adjunta la evidencia; luego, ofrécele verlo juntos.',
    'A Sergio: hoy no, mañana una hora, y si es más urgente que el release, que decida Laura.',
    'A Marta: no firmas lo no probado, pero priorizas su demo y le das el estado por escrito para que decida.',
    'Camino crítico de la demo primero; escribe el estado en el ticket antes de las 16:30.',
    'A las 15:00, si no llegas, díselo a Laura con una propuesta.',
  ],
}
