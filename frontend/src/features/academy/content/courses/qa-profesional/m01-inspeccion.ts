import type { Mission } from '../../../engine/types'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m01Lessons } from './m01-lessons'
import { m01Quiz } from './m01-quiz'
import { m01Review } from './m01-review'

/**
 * Curso 2: QA Profesional · Misión 1 — La inspección (CTFL 3.1 y 3.2).
 * Guion legible: docs/academy/qa-profesional/missions/m01-inspeccion.md
 *
 * La especificación de Facturación recurrente pasa a desarrollo a las 16:00.
 * Carmen exige una revisión formal. El jugador planifica (tipo y roles),
 * prepara, celebra la reunión, gestiona a la autora y hace el seguimiento.
 * Lo que no se encuentre hoy aparece como bugs al pasar a desarrollo.
 */
export const m01Inspeccion: Mission = {
  id: 'm01-inspeccion',
  courseKey: 'qa-profesional',
  number: 1,
  title: 'La inspección',
  subtitle: 'Testing estático: tipos de revisión, roles, proceso y factores de éxito.',
  world: kobaltoWorld,
  playerRole: 'QA del squad Empresas',
  dayStart: 9 * 60,
  dayLabel: 'Lunes',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-inspection',
  appLabel: 'Sala',
  hideBugList: true,
  initialMetrics: {},
  requirementsReview: m01Review,
  lessons: m01Lessons,
  mentor: 'laura',
  quiz: m01Quiz,
  verdicts: {
    good: {
      title: 'Inspección de manual',
      body: 'Carmen archiva tu acta como ejemplo para auditoría y Tomás reconoce que la revisión le ha ahorrado una semana de rehacer código.',
    },
    ok: {
      title: 'Revisión hecha, con huecos',
      body: 'La especificación mejoró, pero algunos defectos pasaron a desarrollo. Revisa qué tipo, qué roles o qué paso del proceso faltó.',
    },
    bad: {
      title: 'Revisión de trámite',
      body: 'Sin el tipo adecuado, sin las personas adecuadas o sin seguimiento, la revisión se queda en un trámite. Repite la misión empezando por la planificación.',
    },
  },

  briefing: {
    title: 'Lunes: la inspección',
    paragraphs: [
      'Seis meses después de tu primer día, ya no eres junior: te han asignado el nuevo squad de Kobalto Empresas. Su primera gran funcionalidad, la facturación recurrente para autónomos y pymes, pasa a desarrollo hoy a las 16:00.',
      'La especificación la ha escrito Elena, la PO, y Carmen (Compliance) exige una revisión formal: la facturación está regulada y quiere evidencia de quién revisó qué.',
      'Te toca organizarla: elegir el tipo de revisión, quién participa y con qué rol, preparar, dirigir la reunión con tacto y comprobar que todo queda corregido. Lo que no se encuentre hoy se programará mal mañana.',
    ],
    goals: [
      'Planifica la revisión en la Sala: tipo según el objetivo y roles adecuados.',
      'Prepara tu revisión individual: marca los defectos de la especificación.',
      'Celebra la reunión y gestiona a la autora centrándote en el documento.',
      'Haz el seguimiento de las correcciones antes de las 16:00.',
      'Entrega a Raúl y Carmen un informe de la revisión con evidencia.',
    ],
  },

  tools: [
    { tool: 'mail' },
    { tool: 'chat' },
    { tool: 'wiki' },
    { tool: 'app' },
    {
      tool: 'review',
      enabledWhen: { kind: 'flag', key: 'review.convened' },
      lockedMessage: 'Primero planifica y convoca la revisión en la Sala.',
    },
    { tool: 'tickets' },
  ],

  scenes: [
    {
      id: 'mail_raul',
      channel: 'email',
      from: 'raul',
      at: 0,
      subject: 'Bienvenida al squad Empresas',
      body: '¡Hola!\n\nDesde hoy eres la persona de QA del squad **Kobalto Empresas**. Primera misión: la especificación de **Facturación recurrente (KOB-E-12)** pasa a desarrollo **hoy a las 16:00**.\n\nCarmen pide revisarla antes. Organízalo tú como veas: en la **Sala de revisión** puedes planificarla. A las 16:00 quiero saber si está lista.\n\nRaúl',
    },
    {
      id: 'mail_carmen',
      channel: 'email',
      from: 'carmen',
      at: 0,
      subject: 'KOB-E-12: necesito evidencia formal',
      body: 'Hola:\n\nLa facturación está **regulada** (numeración, rectificativas, registro de facturas). Antes de que se programe necesito una revisión con **evidencia**: quién revisó, qué defectos se encontraron y cómo se cerraron.\n\nSi me queréis en la revisión, contad conmigo; conozco la normativa.\n\nCarmen López · Riesgos y Compliance',
    },
    {
      id: 'mail_elena',
      channel: 'email',
      from: 'elena',
      at: 0,
      subject: 'Spec de facturación recurrente',
      body: 'Hola 👋\n\nTe paso la especificación de facturación recurrente. La escribí el viernes con prisa, pero creo que está bastante clara 😊\n\nCualquier cosa, me dices.\n\nElena · PO Empresas',
    },
    {
      id: 'daily',
      channel: 'meeting',
      from: 'raul',
      with: ['tomas', 'elena', 'laura'],
      at: 0,
      subject: 'Daily · Squad Empresas',
      body: '**Tomás:** ¿Una revisión formal de la spec? Me la leo yo en diez minutos y si veo algo se lo digo a Elena. Las reuniones largas son tiempo perdido.\n\n**Raúl:** ¿Tú qué propones?',
      choices: [
        {
          id: 'formal',
          text: 'Es facturación regulada: un defecto en la spec hoy es una frase; en producción, facturas mal emitidas. Propongo una revisión formal corta, con preparación previa, las personas adecuadas y acta para Carmen.',
          cost: 10,
          reply: 'Vale, convéncenos con el resultado.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'unlock', conceptId: 'static_testing' },
            { kind: 'note', tone: 'good', text: 'Defendiste el valor de revisar pronto un documento regulado, con un formato proporcionado.' },
          ],
        },
        {
          id: 'informal',
          text: 'Vale, que la lea Tomás y que se lo comente a Elena.',
          cost: 5,
          reply: '👍',
          replyFrom: 'tomas',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Aceptaste una lectura informal de un documento regulado.' },
          ],
        },
        {
          id: 'later',
          text: 'Mejor no perder tiempo con el documento: ya probaremos cuando esté programado.',
          cost: 5,
          reply: 'Hmm… Carmen no va a estar contenta.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'unlock', conceptId: 'static_testing' },
            { kind: 'note', tone: 'bad', text: 'Propusiste esperar al código en lugar de revisar la especificación (testing estático).' },
          ],
        },
      ],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 120,
      when: { kind: 'notFlag', key: 'review.convened' },
      body: '¿Has convocado ya la revisión? Ojo con el reloj: la preparación individual y la reunión llevan tiempo. Tienes la guía de revisiones en la wiki por si dudas del tipo o de los roles.',
      onDeliver: [{ kind: 'unlock', conceptId: 'review_types' }],
    },
    {
      id: 'carmen_type',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'all', of: [{ kind: 'flag', key: 'review.convened' }, { kind: 'notFlag', key: 'review.type.inspection' }] },
      body: 'He visto la convocatoria. Para cumplimiento necesito una **inspección**: preparación, registro de defectos y cierre verificado. Con otro formato no me sirve como evidencia ante auditoría.',
      onDeliver: [
        { kind: 'score', key: 'risk', add: -1 },
        { kind: 'unlock', conceptId: 'review_types' },
        { kind: 'note', tone: 'bad', text: 'El tipo de revisión no encajaba con el objetivo (evidencia regulatoria): hacía falta una inspección.' },
      ],
    },
    {
      id: 'laura_manager',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'role.manager.in' },
      body: 'Has invitado a Raúl a la reunión. Cuidado: con el jefe en la sala, la gente suele callarse lo que ve. A la dirección se la necesita para dar tiempo y recursos, no como revisora.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'review_roles' },
        { kind: 'note', tone: 'bad', text: 'Metiste a la dirección en la reunión de revisión: menos apertura para señalar defectos.' },
      ],
    },
    {
      id: 'laura_roles_ok',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'review.roles.ok' },
      body: 'Buena convocatoria 👌 Inspección, alguien que modera y no es la autora, escriba para el acta, Carmen con la normativa y Raúl fuera de la sala. Ahora, a preparar.',
      onDeliver: [
        { kind: 'score', key: 'rigor', add: 1 },
        { kind: 'unlock', conceptId: 'review_roles' },
        { kind: 'note', tone: 'good', text: 'Convocaste una inspección con los roles adecuados.' },
      ],
    },
    {
      id: 'laura_scribe',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'role.no_scribe' },
      body: '¿Quién va a tomar acta? Sin escriba, los defectos se quedan en el aire y Carmen no tendrá evidencia.',
      onDeliver: [{ kind: 'note', tone: 'bad', text: 'Nadie registraba los defectos de la reunión.' }],
    },
    {
      id: 'meeting_tension',
      channel: 'meeting',
      from: 'elena',
      with: ['tomas', 'carmen'],
      when: { kind: 'flag', key: 'review.submitted' },
      subject: 'Reunión de revisión · KOB-E-12',
      body: '**Elena:** Vale… son muchos defectos para una spec que escribí con prisa. ¿Tan mal está? Me siento un poco señalada.',
      choices: [
        {
          id: 'document',
          text: 'Estamos revisando el documento, no a ti. Cada defecto que encontramos hoy es un bug que no tendremos que arreglar en código. Y la mayoría son detalles que solo se ven al leer en grupo.',
          cost: 5,
          reply: 'Visto así… vale, me pongo con las correcciones.',
          replyFrom: 'elena',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'unlock', conceptId: 'review_success' },
            { kind: 'note', tone: 'good', text: 'Centraste la reunión en el producto, no en la autora.' },
          ],
        },
        {
          id: 'blunt',
          text: 'Pues la verdad es que tiene bastantes fallos.',
          cost: 5,
          reply: '…',
          replyFrom: 'elena',
          effects: [
            { kind: 'score', key: 'communication', add: -2 },
            { kind: 'unlock', conceptId: 'review_success' },
            { kind: 'note', tone: 'bad', text: 'Diste feedback sobre la persona y no sobre el documento.' },
          ],
        },
        {
          id: 'drop',
          text: 'Si te molesta, dejamos los menores fuera del acta.',
          cost: 5,
          reply: 'Bueno… si tú lo dices.',
          replyFrom: 'elena',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Ofreciste no registrar defectos para evitar el conflicto.' },
          ],
        },
      ],
    },
    {
      id: 'elena_fixed',
      channel: 'chat',
      from: 'elena',
      when: { kind: 'flag', key: 'review.submitted' },
      body: 'He subido la versión corregida de la spec (v2) con todo lo del acta. ¿Lo revisas antes de que pase a desarrollo?',
      onDeliver: [{ kind: 'unlock', conceptId: 'review_process' }],
    },
    {
      id: 'handoff',
      channel: 'meeting',
      from: 'raul',
      with: ['tomas', 'carmen', 'elena'],
      at: 420,
      subject: '16:00 · Paso a desarrollo de KOB-E-12',
      body: '**Raúl:** La spec pasa a desarrollo. ¿Cómo ha ido la revisión?',
      onDeliver: [
        { kind: 'if', when: { kind: 'notFlag', key: 'clarify.iva' }, then: [{ kind: 'flag', key: 'fu.safe' }] },
        { kind: 'preventBugs' },
      ],
      choices: [
        {
          id: 'report',
          text: 'Informe de la inspección: participantes y roles, defectos encontrados en la preparación y en la reunión, todos corregidos por Elena y verificados en el seguimiento. Carmen tiene el acta.',
          requires: { kind: 'all', of: [{ kind: 'flag', key: 'review.followup' }, { kind: 'flag', key: 'review.type.inspection' }] },
          cost: 15,
          reply: 'Esto es exactamente lo que necesito para auditoría. Gracias.',
          replyFrom: 'carmen',
          effects: [
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'note', tone: 'good', text: 'Cerraste la revisión con informe y evidencia: corrección verificada en el seguimiento.' },
          ],
        },
        {
          id: 'no_followup',
          text: 'Hemos revisado la spec y Elena ha corregido lo del acta.',
          requires: { kind: 'flag', key: 'review.submitted' },
          cost: 15,
          reply: '¿Y quién ha comprobado que las correcciones están bien?',
          replyFrom: 'carmen',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Cerraste la revisión sin comprobar las correcciones.' }],
        },
        {
          id: 'nothing',
          text: 'No ha dado tiempo a revisarla del todo; ya saldrá lo que sea en las pruebas.',
          cost: 15,
          reply: 'Entonces no puedo dar el visto bueno de cumplimiento.',
          replyFrom: 'carmen',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'note', tone: 'bad', text: 'La especificación pasó a desarrollo sin revisión completa.' },
          ],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Café con Laura',
      body: '**Laura:** ¿Qué tal tu primera revisión como responsable?',
      choices: [
        {
          id: 'lesson',
          text: 'Que una revisión no es leer un documento: es elegir el tipo según el objetivo, juntar a las personas adecuadas con el rol adecuado, prepararse, hablar del documento y no de la autora, y comprobar las correcciones.',
          requires: { kind: 'flag', key: 'review.submitted' },
          reply: 'Exacto. Y además ahora tienes las métricas para mejorar la siguiente.',
          effects: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'waste',
          text: 'Que las revisiones formales son demasiado lentas.',
          reply: 'Mira en el debrief cuántos bugs nacieron de lo que no se revisó.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con el coste de la revisión, no con su retorno.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_revisiones',
      title: 'Guía de revisiones del equipo',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'review_types' },
        { kind: 'unlock', conceptId: 'review_roles' },
        { kind: 'flag', key: 'guide.read' },
      ],
      body: `## Tipos de revisión
- **Informal**: sin proceso ni registro. Dudas rápidas.
- **Walkthrough**: la autora guía la lectura; los revisores no suelen prepararse. Formar y crear consenso.
- **Revisión técnica**: revisores técnicos con preparación. Consenso y decisiones técnicas.
- **Inspección**: preparación individual, moderación, escriba, registro de defectos y métricas. Máximo de defectos y **evidencia** (normativa, auditoría).

## Roles
- **Dirección**: decide qué se revisa y da tiempo y recursos. No participa en la reunión.
- **Autora**: escribe y corrige el documento.
- **Moderación**: dirige la reunión y cuida que sea un entorno seguro. Nunca la autora.
- **Escriba**: registra defectos y decisiones (el acta).
- **Revisores**: perspectivas distintas (negocio, desarrollo, normativa, pruebas).

## Proceso
1. Planificación · 2. Inicio · 3. Revisión individual (con checklist) · 4. Comunicación y análisis (reunión) · 5. Corrección e informe (seguimiento).

## Factores de éxito
Objetivo claro, tipo adecuado, preparación, feedback sobre el documento y no sobre la persona, sin presión jerárquica en la sala, y seguimiento de las correcciones.`,
    },
    {
      id: 'checklist',
      title: 'Checklist de especificaciones',
      updatedLabel: 'Equipo de QA',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'review_process' }],
      body: `## Antes de dar por buena una especificación
- ¿Hay frases que se contradicen entre secciones (fechas, importes, estados)?
- ¿Las **fechas y calendarios** están definidos para todos los casos (días que no existen, festivos)?
- ¿Los **importes** dicen sobre qué base se calculan, en qué orden y cómo se redondean?
- ¿Qué pasa cuando algo **falla** (reintentos, límites, estado final)?
- ¿Se cita la **normativa** concreta que aplica y sus requisitos?
- ¿Todos los requisitos son **verificables** (nada de «rápido», «fácil», «intuitivo»)?
- ¿Qué pasa con los **cambios** a mitad de un ciclo (planes, precios)?`,
    },
  ],

  tickets: [
    {
      id: 'KOB-E-12',
      title: 'Especificación funcional · Facturación recurrente para clientes de Kobalto Empresas',
      status: 'En revisión',
      type: 'story',
      description: 'Los clientes de Empresas configuran facturas recurrentes para sus propios clientes: emisión, numeración, importes, cobro y correcciones. Pasa a desarrollo hoy a las 16:00. El documento completo está en la herramienta «Revisión».',
      acceptanceCriteria: ['La especificación se revisa antes de pasar a desarrollo.', 'Los defectos encontrados quedan registrados, corregidos y verificados.', 'Compliance recibe evidencia de la revisión.'],
      comments: [
        { author: 'elena', body: 'Escrita con prisa el viernes, pero creo que está clara 😊' },
        { author: 'tomas', body: 'En cuanto pase a desarrollo me pongo, que vamos justos.' },
      ],
      actions: [],
    },
  ],

  bugs: [
    { id: 'E-FECHA', title: 'Las facturas se emiten unas el día 1 y otras en la fecha de alta', severity: 'medium', explanation: 'La spec decía las dos cosas; cada parte del código implementó una.', technique: 'Revisión: buscar contradicciones entre secciones.', preventedBy: 'clarify.fecha' },
    { id: 'E-NUM', title: 'La numeración de facturas tiene saltos al anular (incumple la normativa)', severity: 'critical', explanation: 'Nadie especificó la numeración correlativa sin saltos que exige la ley.', technique: 'Revisión con perspectiva normativa (Compliance como revisora).', preventedBy: 'clarify.numeracion' },
    { id: 'E-IVA', title: 'El IVA se calcula sobre el total y no cuadra con la suma de las líneas', severity: 'high', explanation: '«Sobre el importe» se interpretó como el total de la factura, sin descuentos por línea ni redondeo por línea.', technique: 'Revisión técnica: preguntar base, orden y redondeo de cada cálculo.', preventedBy: 'clarify.iva' },
    { id: 'E-PLAN', title: 'Al cambiar de plan se cobra el mes completo de los dos planes', severity: 'medium', explanation: 'La spec no decía qué pasaba con el mes en curso.', technique: 'Revisión: cambios a mitad de ciclo (checklist).', preventedBy: 'clarify.prorrateo' },
    { id: 'E-REINT', title: 'Los cobros fallidos se reintentan sin límite', severity: 'high', explanation: '«Se reintenta» sin número ni intervalo: el código reintenta cada hora indefinidamente.', technique: 'Revisión: qué pasa cuando algo falla y cuál es el estado final.', preventedBy: 'clarify.reintentos' },
    { id: 'E-BORRAR', title: 'Se pueden borrar facturas emitidas', severity: 'critical', explanation: 'La spec permitía borrar y reemitir; la normativa exige rectificativas.', technique: 'Revisión con perspectiva normativa.', preventedBy: 'clarify.rectificativa' },
    { id: 'E-RAPIDO', title: 'Nadie sabe qué tiempo de envío es aceptable', severity: 'low', explanation: '«Rápido» no se puede probar: no hay criterio para las pruebas de rendimiento.', technique: 'Revisión: requisitos no verificables.', preventedBy: 'clarify.rapido' },
    { id: 'E-NORMA', title: 'No se implementa el registro de facturas que exige la normativa', severity: 'high', explanation: '«Cumple la normativa vigente» no decía cuál ni qué requisitos tenía.', technique: 'Revisión con checklist: normativa concreta y verificable.', preventedBy: 'clarify.normativa' },
    { id: 'E-FU', title: 'La corrección del IVA quedó a medias: el ejemplo sigue calculando sobre el total', severity: 'high', explanation: 'Elena corrigió la regla pero no el ejemplo; sin seguimiento, desarrollo implementó el ejemplo.', technique: 'Corrección e informe: verificar cada corrección del acta (seguimiento).', preventedBy: 'fu.safe' },
  ],

  concepts: [
    { id: 'static_testing', title: 'Testing estático', summary: 'Examinar productos de trabajo sin ejecutarlos. Encuentra defectos (no fallos) muy pronto, cuando corregirlos es más barato. (CTFL 3.1)' },
    { id: 'review_types', title: 'Tipos de revisión', summary: 'Informal, walkthrough, técnica e inspección: se elige según el objetivo. La inspección es la más formal y deja evidencia. (CTFL 3.2.4)' },
    { id: 'review_roles', title: 'Roles de una revisión', summary: 'Dirección (fuera de la sala), autora, moderación (nunca la autora), escriba, revisores con perspectivas distintas y líder de la revisión. (CTFL 3.2.3)' },
    { id: 'review_process', title: 'Proceso de revisión', summary: 'Planificación, inicio, revisión individual (con checklist), comunicación y análisis, y corrección e informe con seguimiento. (CTFL 3.2.2)' },
    { id: 'review_success', title: 'Factores de éxito', summary: 'Objetivo y tipo adecuados, preparación, feedback sobre el producto y no la persona, sin presión jerárquica y con seguimiento. (CTFL 3.2.5)' },
  ],
  debriefConcepts: ['static_testing', 'review_types', 'review_roles', 'review_process', 'review_success'],
  seniorTips: [
    'Lee el correo de Carmen: «evidencia» para auditoría pide una inspección, no una lectura informal.',
    'Roles: Laura (o tú) modera, Sofía hace de escriba y revisa, Tomás y Carmen revisan, Raúl fuera de la sala, Elena es la autora.',
    'Reparte la checklist: Carmen detecta la normativa que no se nombra.',
    'Prepárate de verdad: la contradicción de fechas y el «rápido» no los va a encontrar nadie más.',
    'En la reunión, habla del documento, no de Elena.',
    'Haz el seguimiento antes de las 16:00: una corrección a medias es un bug igual.',
  ],
}
