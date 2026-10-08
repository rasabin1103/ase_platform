import type { Mission } from '../../../engine/types'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m00Design } from './m00-design'
import { m00Lessons } from './m00-lessons'
import { m00Risk } from './m00-risk'
import { m00Quiz } from './m00-quiz'
import { BUG_SLOTS } from '../../../apps/kobalto/transferLogic'

/**
 * Curso: Fundamentos de Testing · Misión 0 — Primer día.
 * Guion legible: docs/academy/missions/m00-primer-dia.md
 *
 * Reloj: minuto 0 = 09:00, minuto 480 = 17:00 (fin de jornada).
 */
export const m00PrimerDia: Mission = {
  id: 'm00-primer-dia',
  courseKey: 'testing-fundamentals',
  number: 0,
  title: 'Primer día',
  subtitle: 'Recién graduado/a, primer puesto como QA Junior en un neobanco.',
  world: kobaltoWorld,
  playerRole: 'QA Junior',
  dayStart: 9 * 60,
  dayLabel: 'Lunes',
  duration: 480,
  appActionCost: 4,
  reportCost: 12,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  testDesign: m00Design,
  verdicts: {
    good: { title: 'Primer día superado con nota', body: 'Laura sale de la reunión convencida de que ha acertado contigo. El equipo ya sabe que puede contar con tu criterio.' },
    ok: { title: 'Primer día superado', body: 'Buen arranque, con cosas que pulir. Revisa el debrief: casi todo lo que se escapó tiene una técnica concreta detrás.' },
    bad: { title: 'Primer día complicado', body: 'Nadie nace sabiendo. Repite la misión probando otras decisiones: verás cómo cambia el día.' },
  },
  lessons: m00Lessons,
  riskModel: m00Risk,
  quiz: m00Quiz,
  mentor: 'laura',
  bugSlots: BUG_SLOTS,

  briefing: {
    title: 'Primer día en Kobalto',
    paragraphs: [
      'Acabas de terminar el grado y hoy empiezas tu primer trabajo: QA Junior en Kobalto, un neobanco madrileño de 80 personas. El equipo de Pagos prepara la gran demo para inversores del viernes, y la estrella es la nueva función de Transferencias.',
      'Tu jornada va de 09:00 a 17:00. Todo consume tiempo: leer, preguntar, probar, reportar. No te dará tiempo a todo, así que elige bien.',
      'Lo que decidas tendrá consecuencias. A las 17:00, Laura, tu mentora, te pedirá un estado de la situación.',
    ],
    goals: [
      'Consigue tus accesos y preséntate al equipo.',
      'Diseña tus casos de prueba para KOB-142 y pide a Laura que los revise.',
      'Ejecuta los casos en staging (Transferencias).',
      'Registra los bugs que encuentres, con evidencia.',
      'A las 17:00, da a Laura un estado claro y una recomendación.',
    ],
  },

  tools: [
    { tool: 'mail' },
    { tool: 'chat' },
    { tool: 'tickets' },
    { tool: 'design' },
    { tool: 'wiki' },
    {
      tool: 'app',
      enabledWhen: { kind: 'flag', key: 'access.staging' },
      lockedMessage: 'No tienes acceso a staging. Los accesos los gestiona Óscar, de IT.',
      unlockAction: {
        label: 'Pedir acceso a Óscar y esperar a que lo tramite (40 min)',
        cost: 40,
        effects: [
          { kind: 'flag', key: 'access.staging' },
          { kind: 'score', key: 'efficiency', add: -1 },
          { kind: 'note', tone: 'bad', text: 'No pediste acceso a staging al llegar: perdiste 40 minutos esperando.' },
        ],
      },
    },
    {
      tool: 'logs',
      enabledWhen: { kind: 'flag', key: 'access.logs' },
      lockedMessage: 'Los logs de staging requieren un permiso específico.',
      unlockAction: {
        label: 'Pedir acceso a los logs (30 min)',
        cost: 30,
        effects: [{ kind: 'flag', key: 'access.logs' }],
      },
    },
  ],

  scenes: [
    // ---------------------------------------------------------- 09:00
    {
      id: 'mail_bienvenida',
      channel: 'email',
      from: 'personas',
      at: 0,
      subject: '¡Te damos la bienvenida a Kobalto! 🎉',
      body: 'Hola:\n\n¡Qué alegría tenerte con nosotros! Hoy empiezas en el equipo de Pagos como QA Junior. Tu mentora será Laura Méndez, QA Lead.\n\nHorario: de 09:00 a 17:00. Óscar, de IT, te escribirá para darte los accesos.\n\nUn abrazo,\nEquipo de Personas',
    },
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Tu primer día 🚀',
      body: '¡Hola y bienvenida/o!\n\nHoy te propongo esto:\n- Pide a Óscar los accesos que necesites.\n- A las 09:30 tenemos la daily del equipo.\n- En la wiki tienes la Guía de QA y los datos de prueba.\n- Tu tarea principal: probar la historia KOB-142 (Transferencias) en staging.\n- Antes de tocar la app, en **Diseño** prioriza por riesgo (pestaña Riesgos) y diseña tus casos; pídeme que los revise. Luego ejecútalos y registra los bugs en el tablero.\n- Si tienes dudas, pregúntame (botón «Pregúntale a Laura»).\n\nA las 17:00 me cuentas cómo ha ido y qué recomiendas para la demo del viernes.\n\nLaura',
    },
    {
      id: 'chat_oscar',
      channel: 'chat',
      from: 'oscar',
      at: 0,
      body: '¡Hola! Soy Óscar, de IT 👋 Tu portátil ya está configurado. ¿Qué accesos necesitas para empezar?',
      choices: [
        {
          id: 'full',
          text: 'Staging, el gestor de tickets y la wiki. ¿Hay algo más que suela usar QA?',
          cost: 5,
          reply: 'Buena pregunta 👍 QA suele pedir también los logs de staging. Te lo activo todo. ¡Listo!',
          effects: [
            { kind: 'flag', key: 'access.staging' },
            { kind: 'flag', key: 'access.logs' },
            { kind: 'score', key: 'efficiency', add: 1 },
            { kind: 'note', tone: 'good', text: 'Preguntaste qué suele necesitar QA y conseguiste todos los accesos (logs incluidos) a la primera.' },
          ],
        },
        {
          id: 'basic',
          text: 'Lo estándar, ya iré pidiendo lo que me falte.',
          cost: 2,
          reply: 'Hecho: correo, chat, tickets y wiki. Si necesitas algo más, me dices.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Pediste solo los accesos estándar.' }],
        },
      ],
    },

    // ---------------------------------------------------------- 09:30 daily
    {
      id: 'daily',
      channel: 'meeting',
      from: 'laura',
      with: ['diego', 'marta'],
      at: 30,
      subject: 'Daily · Equipo de Pagos',
      body: '**Marta:** Recordad que el viernes enseñamos Transferencias a los inversores. Es LA demo.\n\n**Diego:** KOB-142 está en staging desde ayer. Lo probé en local y va fino.\n\n**Laura:** Hoy se incorpora alguien nuevo a QA. ¿Quieres decir algo al equipo?',
      choices: [
        {
          id: 'ask',
          text: '¡Hola a todos! Hoy me centro en KOB-142. Marta, ¿te puedo escribir luego con dudas sobre los criterios de aceptación?',
          cost: 15,
          reply: '¡Claro! Te escribo yo en cuanto acabemos.',
          replyFrom: 'marta',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'flag', key: 'po.contacted' },
            { kind: 'deliver', sceneId: 'marta_rules' },
            { kind: 'note', tone: 'good', text: 'En la daily te presentaste, dijiste en qué te ibas a centrar y abriste un canal con la PO.' },
          ],
        },
        {
          id: 'promise',
          text: '¡Hola! Lo pruebo todo hoy, el viernes estará perfecto.',
          cost: 15,
          reply: 'Ánimo con eso 😅',
          replyFrom: 'diego',
          effects: [
            { kind: 'flag', key: 'overpromised' },
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Prometiste probarlo «todo» en un día: es imposible y genera expectativas falsas.' },
          ],
        },
        {
          id: 'quiet',
          text: '(Saludar con la mano y no decir nada)',
          cost: 15,
          effects: [{ kind: 'note', tone: 'neutral', text: 'Pasaste desapercibido/a en tu primera daily.' }],
        },
      ],
    },
    {
      id: 'marta_rules',
      channel: 'chat',
      from: 'marta',
      body: '¡Hola! Dime, ¿qué dudas tienes con KOB-142?',
      choices: [
        {
          id: 'rules',
          text: 'Los criterios dicen «importe válido» y «se respetan los límites». ¿Qué significa exactamente? ¿Mínimo, máximo, decimales, límite diario?',
          cost: 10,
          reply:
            '¡Muy buena pregunta! Lo dejo también en el ticket:\n- Importe mínimo 0,01 € y máximo 5.000 € por operación.\n- Hasta 2 decimales, con coma o con punto.\n- Límite diario acumulado: 6.000 €.\n- IBAN español válido (formato y dígitos de control).\n- Concepto opcional, máximo 140 caracteres.\n\nLa especificación de la wiki está desactualizada, ¡no le hagas caso!',
          effects: [
            { kind: 'flag', key: 'rules.known' },
            { kind: 'score', key: 'rigor', add: 2 },
            { kind: 'unlock', conceptId: 'static_testing' },
            { kind: 'note', tone: 'good', text: 'Preguntaste a la PO qué significaban los criterios ambiguos: ahora sabes qué es un bug y qué no (testing estático).' },
          ],
        },
        {
          id: 'none',
          text: 'Nada, creo que está claro. ¡Gracias!',
          cost: 2,
          reply: '¡Genial! 👍',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Diste por claros unos criterios ambiguos («importe válido», «los límites»).' },
          ],
        },
      ],
    },
    {
      id: 'laura_overpromise',
      channel: 'chat',
      from: 'laura',
      at: 60,
      when: { kind: 'flag', key: 'overpromised' },
      body: 'Un consejo de mentora 🙂 En la daily dijiste que lo probarías «todo». Probar todo es imposible: hay infinitas combinaciones. Mejor algo como: «hoy pruebo lo más arriesgado de KOB-142 y a las 17:00 os cuento». ¡Ánimo!',
      onDeliver: [{ kind: 'unlock', conceptId: 'exhaustive' }],
      choices: [
        {
          id: 'thanks',
          text: '¡Entendido, gracias por el consejo!',
          cost: 1,
          effects: [{ kind: 'score', key: 'communication', add: 1 }],
        },
      ],
    },

    // ---------------------------------------------------------- 11:00 imprevisto
    {
      id: 'staging_down',
      channel: 'chat',
      from: 'ivan',
      at: 120,
      probability: 0.6,
      body: '⚠️ Aviso: staging va a estar caído unos 40 minutos por un despliegue de infraestructura. Perdón por las molestias.',
      choices: [
        {
          id: 'prepare',
          text: 'Aprovecho para leer documentación y preparar mis casos de prueba.',
          cost: 40,
          effects: [
            { kind: 'score', key: 'efficiency', add: 1 },
            { kind: 'unlock', conceptId: 'test_design' },
            { kind: 'note', tone: 'good', text: 'Con staging caído, aprovechaste para diseñar casos: la espera se convirtió en preparación.' },
          ],
        },
        {
          id: 'prod',
          text: 'Pruebo un momento en producción con mi cuenta personal. Solo una transferencia pequeña.',
          cost: 10,
          effects: [
            { kind: 'score', key: 'risk', add: -3 },
            { kind: 'metric', key: 'trust_laura', add: -2 },
            { kind: 'unlock', conceptId: 'test_environments' },
            { kind: 'deliver', sceneId: 'laura_prod' },
            { kind: 'note', tone: 'bad', text: 'Probaste en producción con dinero real. En un banco es una falta grave.' },
          ],
        },
        {
          id: 'wait',
          text: 'Espero a que vuelva.',
          cost: 40,
          effects: [
            { kind: 'score', key: 'efficiency', add: -1 },
            { kind: 'note', tone: 'neutral', text: 'Esperaste 40 minutos a que volviera staging sin hacer nada más.' },
          ],
        },
      ],
    },
    {
      id: 'laura_prod',
      channel: 'chat',
      from: 'laura',
      body: 'Oye, Iván ha visto una transferencia de prueba en PRODUCCIÓN desde tu cuenta 😬 En un banco nunca se prueba en producción con dinero real: hay auditorías, regulación y clientes reales. Para eso existe staging. Que no se repita, ¿vale?',
      choices: [
        {
          id: 'sorry',
          text: 'Tienes razón, no volverá a pasar. ¿Hay algún entorno alternativo para cuando staging se cae?',
          cost: 3,
          reply: 'Sí, hay un entorno de QA aislado. Mañana te lo enseño. Gracias por preguntar.',
          effects: [
            { kind: 'metric', key: 'trust_laura', add: 1 },
            { kind: 'score', key: 'communication', add: 1 },
          ],
        },
        {
          id: 'excuse',
          text: 'Solo eran 5 euros…',
          cost: 2,
          reply: 'No es la cantidad, es el riesgo. Lo hablamos a las 17:00.',
          effects: [
            { kind: 'metric', key: 'trust_laura', add: -1 },
            { kind: 'score', key: 'communication', add: -1 },
          ],
        },
      ],
    },

    // ---------------------------------------------------------- 13:00 presión del dev
    {
      id: 'diego_chat',
      channel: 'chat',
      from: 'diego',
      at: 240,
      body: 'Oye, una cosa. Si ves algo raro en Transferencias, dímelo antes por aquí y no abras tickets, que si Marta ve bugs en el tablero antes de la demo se pone nerviosa. Entre nosotros, ¿vale?',
      choices: [
        {
          id: 'both',
          text: 'Te aviso por aquí, claro, pero también lo registro en el tracker con pasos para reproducir: así no se pierde y Marta ve el estado real.',
          cost: 5,
          reply: 'Mmm… vale, tiene sentido. Pásame el enlace cuando lo tengas.',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'metric', key: 'trust_diego', add: 1 },
            { kind: 'flag', key: 'traceability' },
            { kind: 'unlock', conceptId: 'traceability' },
            { kind: 'note', tone: 'good', text: 'Mantuviste la trazabilidad sin romper la relación con Diego: avisar y registrar no son incompatibles.' },
          ],
        },
        {
          id: 'hide',
          text: 'Vale, te lo digo solo a ti.',
          cost: 2,
          reply: '¡Genial, crack! 🙌',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'flag', key: 'hide_bugs' },
            { kind: 'metric', key: 'trust_diego', add: 1 },
            { kind: 'unlock', conceptId: 'traceability' },
            { kind: 'note', tone: 'bad', text: 'Aceptaste ocultar bugs a la PO: sin trazabilidad, el riesgo llega a la demo sin que nadie lo sepa.' },
          ],
        },
        {
          id: 'clash',
          text: 'Mi trabajo es registrar bugs, no pedir permiso.',
          cost: 2,
          reply: 'Vale, vale… 🙄',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'metric', key: 'trust_diego', add: -2 },
            { kind: 'unlock', conceptId: 'traceability' },
            { kind: 'note', tone: 'neutral', text: 'Defendiste la trazabilidad, pero el tono dañó la relación con Diego.' },
          ],
        },
      ],
    },

    // ---------------------------------------------------------- reacciones de Laura
    {
      id: 'laura_first_bug',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'reportsGte', value: 1 },
      body: '¡He visto tu primer bug en el tablero! 🐞 Un detalle para que lo tengas en mente: la severidad es el impacto para el cliente o el negocio, y la prioridad, la urgencia para arreglarlo. No siempre coinciden.',
      onDeliver: [{ kind: 'unlock', conceptId: 'severity_priority' }],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 300,
      when: { kind: 'reportsLt', value: 1 },
      body: '¿Qué tal vas? Una pista: los bugs se esconden en los bordes. Prueba justo en el límite, un poco por encima y un poco por debajo… y escribe las cosas como lo haría un cliente real (¿coma o punto?).',
      onDeliver: [{ kind: 'unlock', conceptId: 'boundary_values' }],
    },

    {
      id: 'laura_regression',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'He visto que Diego ha subido el primer fix 🔧 Recuerda dos cosas: **re-test** (vuelve a probar el caso que falló, en el build nuevo, antes de cerrar) y **regresión** (repite también los casos relacionados que antes pasaban: un fix puede romper otra cosa). Para cerrar o reabrir, adjunta la ejecución del build nuevo.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'confirmation_testing' },
        { kind: 'unlock', conceptId: 'regression' },
        { kind: 'unlock', conceptId: 'defect_lifecycle' },
      ],
    },

    // ---------------------------------------------------------- 15:00 presión de negocio
    {
      id: 'marta_status',
      channel: 'chat',
      from: 'marta',
      at: 360,
      body: '¡Hola! Voy a reunirme con el CEO para preparar la demo. ¿Puedo decirle que Transferencias está lista para el viernes?',
      choices: [
        {
          id: 'critical',
          text: 'Todavía no: hay bugs críticos que afectan a dinero real (te paso los enlaces del tracker). A las 17:00 lo vemos con Laura y te doy una recomendación clara.',
          requires: { kind: 'bugReported', severity: 'critical' },
          cost: 5,
          reply: 'Uf… vale. Gracias por avisar hoy y no el viernes. Espero vuestra recomendación.',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'metric', key: 'trust_marta', add: 1 },
            { kind: 'note', tone: 'good', text: 'Avisaste a tiempo a la PO del riesgo real para la demo, con evidencia.' },
          ],
        },
        {
          id: 'unsure',
          text: 'Aún no puedo confirmarlo. A las 17:00 te doy un estado claro con Laura.',
          cost: 3,
          reply: 'Ok, quedo atenta.',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'note', tone: 'neutral', text: 'No diste luz verde sin información, pero tampoco aportaste datos a la PO.' },
          ],
        },
        {
          id: 'ok',
          text: 'Sí, todo bien, puedes decírselo.',
          cost: 2,
          reply: '¡Genial! Se lo digo ya 🎉',
          effects: [
            { kind: 'unlock', conceptId: 'principles' },
            {
              kind: 'if',
              when: { kind: 'bugTriggered', severity: 'critical' },
              then: [
                { kind: 'score', key: 'risk', add: -3 },
                { kind: 'flag', key: 'false_green' },
                { kind: 'metric', key: 'trust_marta', add: -1 },
                { kind: 'note', tone: 'bad', text: 'Diste luz verde con bugs críticos delante: la PO ha comprometido una demo que puede fallar.' },
              ],
              else: [
                { kind: 'score', key: 'risk', add: -1 },
                { kind: 'note', tone: 'bad', text: 'Diste luz verde sin evidencia: «no he visto bugs» no significa «no hay bugs» (principio 1).' },
              ],
            },
          ],
        },
      ],
    },

    // ---------------------------------------------------------- 17:00 cierre
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Charla con Laura',
      body: '**Laura:** Bueno, ¿qué tal tu primer día? Cuéntame: ¿en qué estado está KOB-142 y qué recomiendas para la demo del viernes?',
      choices: [
        {
          id: 'pro',
          text: 'He probado validaciones de importe, IBAN y límites, y he registrado los bugs con evidencia en el tablero. Con los críticos abiertos, recomiendo no enseñar Transferencias hasta que se corrijan y se vuelvan a probar.',
          requires: { kind: 'reportsGte', value: 1 },
          reply: 'Así se comunica un estado: qué has probado, qué has encontrado, qué riesgo hay y qué recomiendas. Muy bien.',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'score', key: 'risk', add: 1 },
            {
              kind: 'if',
              when: { kind: 'flag', key: 'hide_bugs' },
              then: [{ kind: 'note', tone: 'bad', text: 'Laura: «Por cierto, Diego me ha dicho que algunos bugs los ibais a "hablar entre vosotros". Eso no puede volver a pasar».' }],
            },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'vague',
          text: 'Creo que bien. He visto alguna cosilla, pero nada grave.',
          reply: 'Necesito más concreción: ¿qué has probado y qué riesgo ves? Sin eso no puedo decidir nada.',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Diste un estado vago, sin datos ni recomendación.' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'none',
          text: 'No me ha dado tiempo a mucho, la verdad.',
          reply: 'Es normal el primer día. Mañana organizamos juntos mejor el tiempo.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_qa',
      title: 'Guía de QA de Kobalto',
      updatedLabel: 'Actualizada hace 2 semanas por Laura Méndez',
      readCost: 20,
      onRead: [
        { kind: 'flag', key: 'guide.read' },
        { kind: 'score', key: 'rigor', add: 1 },
        { kind: 'unlock', conceptId: 'principles' },
        { kind: 'unlock', conceptId: 'bug_anatomy' },
      ],
      body: `## Cómo trabajamos
Cada historia pasa por "En QA" antes de llegar a producción. QA prueba en **staging**, nunca en producción.

## Los 7 principios del testing
- El testing muestra la presencia de defectos, no su ausencia.
- Probar todo es imposible: prioriza por riesgo.
- Probar pronto ahorra tiempo y dinero (empieza por los requisitos).
- Los defectos se agrupan: donde hay uno, suele haber más.
- Repetir siempre las mismas pruebas deja de encontrar bugs.
- El testing depende del contexto: en un banco, el dinero manda.
- Que no haya errores no significa que el producto sea útil.

## Escala de severidad
- **Crítica**: pérdida o descuadre de dinero, datos o seguridad.
- **Alta**: se incumple una regla de negocio o normativa, o una función principal no funciona y no hay alternativa.
- **Media**: la función se ve afectada, pero hay alternativa o el impacto es acotado.
- **Baja**: cosmético o textos.

## Cómo escribir un bug
- Título que diga qué falla y dónde.
- Pasos para reproducirlo, uno por línea.
- Resultado esperado y resultado obtenido.
- Severidad según la escala.
- Evidencia: adjunta la operación o el log en el que se ve.`,
    },
    {
      id: 'datos_prueba',
      title: 'Datos de prueba · Staging',
      updatedLabel: 'Actualizada hace 1 mes por Iván Torres',
      readCost: 5,
      onRead: [{ kind: 'flag', key: 'testdata.read' }],
      body: `## Cuenta de pruebas
Cuenta **QA-01**, saldo inicial **7.450,00 €**. El saldo y los límites se reinician cada noche.

## IBAN válidos de prueba
- ES30 9101 0001 1202 0001 2345 · Ana López
- ES84 9101 0001 1503 0006 7890 · Carlos Pérez
- ES39 9101 0002 1104 0009 9999 · Lucía Martín

## Recuerda
Un IBAN es válido si cumple el formato **y** los dígitos de control. Si cambias un solo dígito, deja de ser válido.`,
    },
    {
      id: 'spec_old',
      title: 'Transferencias · Especificación funcional (v0.3)',
      updatedLabel: 'Actualizada hace 7 meses · estado: borrador',
      readCost: 10,
      onRead: [{ kind: 'flag', key: 'spec_old.read' }],
      body: `## Alcance
Transferencias SEPA nacionales desde la web.

## Reglas
- Importe máximo por operación: **3.000 €**.
- Límite diario: **4.000 €**.
- Pendiente de confirmar con Compliance.

## Pendiente
- Definir mensajes de error.
- Revisar con Producto.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-142',
      title: 'Como cliente quiero enviar transferencias a otra cuenta',
      status: 'En QA',
      type: 'story',
      description:
        'Permitir que el cliente envíe transferencias SEPA nacionales desde la web. Necesario para la demo con inversores del viernes.',
      acceptanceCriteria: [
        'El cliente puede enviar una transferencia indicando IBAN, beneficiario, importe y un concepto opcional.',
        'El importe debe ser válido.',
        'Se respetan los límites de la cuenta.',
        'El IBAN debe ser correcto.',
        'Tras enviar, se muestra el justificante y se actualiza el saldo.',
      ],
      comments: [
        { author: 'diego', body: 'Probado en local, funciona 👌' },
        {
          author: 'marta',
          visibleWhen: { kind: 'flag', key: 'rules.known' },
          body: 'Aclaración de criterios: importe entre 0,01 € y 5.000 € por operación, hasta 2 decimales (coma o punto). Límite diario acumulado de 6.000 €. IBAN español con dígitos de control válidos. Concepto opcional, máximo 140 caracteres.',
        },
      ],
      actions: [
        {
          id: 'ask_po',
          label: 'Escribir a Marta (PO) con dudas',
          cost: 2,
          hiddenWhen: { kind: 'flag', key: 'po.contacted' },
          effects: [
            { kind: 'flag', key: 'po.contacted' },
            { kind: 'deliver', sceneId: 'marta_rules' },
          ],
        },
      ],
    },
  ],

  bugs: [
    {
      id: 'B1',
      title: 'Se aceptan importes entre 5.000,01 € y 5.000,99 €',
      severity: 'high',
      requiresFlag: 'rules.known',
      disputeReply: '¿Dónde pone que el máximo es 5.000 €? En la especificación de la wiki pone otra cosa. Confírmalo con Marta y lo vemos.',
      explanation: 'La validación compara solo la parte entera del importe, así que 5.000,50 € supera el límite por operación sin que nadie lo detecte.',
      technique: 'Valores límite: probar 5.000,00 y 5.000,01.',
      fix: { delay: 45 },
    },
    {
      id: 'B2',
      title: 'Los importes negativos se aceptan y aumentan el saldo',
      severity: 'critical',
      explanation: 'Solo se rechaza el 0. Con −50 € el cliente «recibe» dinero: es una puerta abierta al fraude.',
      technique: 'Particiones de equivalencia: probar la partición de los negativos, no solo valores válidos.',
      fix: { delay: 40 },
    },
    {
      id: 'B3',
      title: '«10,50» se procesa como 1.050 €',
      severity: 'critical',
      explanation: 'La app elimina la coma en lugar de usarla como separador decimal. Un cliente que escribe 10,50 envía 100 veces más dinero.',
      technique: 'Particiones sobre el formato (coma frente a punto), pensando como un usuario real.',
      fix: { delay: 50, regression: 'R1', note: 'He cambiado cómo se interpretan los decimales.' },
    },
    {
      id: 'B4',
      title: 'Se aceptan IBAN con dígitos de control incorrectos',
      severity: 'medium',
      explanation: 'Solo se comprueba el formato (ES + 22 dígitos), no los dígitos de control. La transferencia sale hacia una cuenta inexistente y el banco la devuelve días después.',
      technique: 'Datos inválidos con formato correcto: cambiar un dígito de un IBAN válido.',
      fix: { delay: 60 },
    },
    {
      id: 'B5',
      title: 'Hacer doble clic en «Confirmar» crea transferencias duplicadas',
      severity: 'critical',
      explanation: 'El botón no se desactiva mientras se procesa la petición y el backend no controla los duplicados (idempotencia).',
      technique: 'Comportamiento real del usuario: doble clic, reintentos, red lenta.',
      fix: { delay: 45, attempts: ['not_fixed', 'fixed'], note: 'Ahora el botón muestra «Procesando…».' },
    },
    {
      id: 'B6',
      title: 'No se aplica el límite diario acumulado de 6.000 €',
      severity: 'high',
      requiresFlag: 'rules.known',
      disputeReply: '¿Límite diario de 6.000 €? No lo tengo en ningún sitio. Confírmalo con Marta.',
      explanation: 'Se compara cada operación con 6.000 €, no el total del día. Con 4.000 € + 2.500 € se supera el límite.',
      technique: 'Pruebas de secuencia: varias operaciones seguidas, no solo una.',
      fix: { delay: 50 },
    },
    // --- Variantes: cada partida activa una opción por hueco (BUG_SLOTS) ---
    {
      id: 'B1b',
      title: 'No se puede enviar exactamente el máximo de 5.000,00 €',
      severity: 'medium',
      requiresFlag: 'rules.known',
      disputeReply: '¿Seguro que 5.000 € está permitido? Yo tenía entendido otra cosa. Confírmalo con Marta.',
      explanation: 'La validación usa «mayor o igual» en lugar de «mayor»: el valor límite, que es válido, se rechaza.',
      technique: 'Valores límite: probar exactamente el máximo.',
      fix: { delay: 45 },
    },
    {
      id: 'B2b',
      title: 'Se aceptan transferencias de 0 €',
      severity: 'medium',
      explanation: 'Se rechazan los negativos pero no el cero: se generan movimientos vacíos que ensucian extractos y conciliación.',
      technique: 'Particiones de equivalencia: el cero es su propia partición.',
      fix: { delay: 40 },
    },
    {
      id: 'B3b',
      title: '«10,50» se procesa como 10 € (se pierden los decimales)',
      severity: 'high',
      explanation: 'La app corta el importe en la coma: el cliente envía menos dinero del que escribió y el pago queda incompleto.',
      technique: 'Particiones sobre el formato (coma frente a punto), pensando como un usuario real.',
      fix: { delay: 50, regression: 'R1', note: 'He cambiado cómo se interpretan los decimales.' },
    },
    {
      id: 'B4b',
      title: 'Un IBAN válido escrito con espacios se rechaza',
      severity: 'medium',
      explanation: 'La app no ignora los espacios: el formato habitual en que los clientes copian el IBAN da error y no pueden pagar.',
      technique: 'Particiones de formato: el mismo dato válido escrito de otra forma.',
      fix: { delay: 60 },
    },
    {
      id: 'B6b',
      title: 'Se rechaza un acumulado diario de exactamente 6.000 €',
      severity: 'low',
      requiresFlag: 'rules.known',
      disputeReply: '¿El límite diario incluye los 6.000 €? Pregúntaselo a Marta, yo no lo tengo claro.',
      explanation: 'El límite diario se aplica con «mayor o igual»: el acumulado exacto, que es válido, se rechaza.',
      technique: 'Valores límite sobre secuencias: acumulado exactamente en el límite.',
      fix: { delay: 50 },
    },
    {
      id: 'R1',
      title: 'Regresión: tras el fix de la coma, «10.50» con punto se procesa como 1.050 €',
      severity: 'critical',
      regression: true,
      explanation:
        'Al corregir B3, el desarrollador eliminó el punto en lugar de aceptarlo como decimal. Lo que antes funcionaba se ha roto: solo se detecta repitiendo casos que ya pasaban.',
      technique: 'Pruebas de regresión: tras un fix, volver a ejecutar los casos relacionados que antes pasaban.',
    },
  ],

  concepts: [
    {
      id: 'principles',
      title: 'Los 7 principios del testing',
      summary:
        'Los defectos se pueden demostrar, pero no su ausencia. Probar todo es imposible. Probar pronto ahorra. Los defectos se agrupan. Repetir siempre las mismas pruebas deja de encontrar bugs. Todo depende del contexto. Y un producto sin errores no tiene por qué ser útil.',
    },
    {
      id: 'exhaustive',
      title: 'Probar todo es imposible',
      summary: 'Ni con todo el tiempo del mundo se prueban todas las combinaciones. Por eso se prioriza por riesgo y se comunica qué se ha probado y qué no.',
    },
    {
      id: 'static_testing',
      title: 'Testing estático',
      summary:
        'Revisar requisitos, diseños o código sin ejecutar nada. Preguntar «¿qué significa importe válido?» antes de probar es testing estático: encuentra defectos cuando más barato es corregirlos.',
    },
    {
      id: 'equivalence',
      title: 'Particiones de equivalencia',
      summary:
        'Divide las entradas en grupos que el sistema debería tratar igual (negativos, cero, válidos, por encima del límite, coma o punto…) y prueba al menos un valor de cada grupo.',
    },
    {
      id: 'boundary_values',
      title: 'Análisis de valores límite',
      summary: 'Los errores se concentran en los bordes. Para un máximo de 5.000 €, prueba 4.999,99, 5.000,00 y 5.000,01.',
    },
    {
      id: 'severity_priority',
      title: 'Severidad frente a prioridad',
      summary: 'Severidad: impacto en el cliente o el negocio. Prioridad: urgencia para corregir. Un error tipográfico en la portada puede tener baja severidad y alta prioridad.',
    },
    {
      id: 'bug_anatomy',
      title: 'Anatomía de un buen bug report',
      summary: 'Título claro, pasos para reproducirlo, resultado esperado y obtenido, severidad y evidencia. Si el dev no puede reproducirlo, para el equipo ese bug no existe.',
    },
    {
      id: 'test_environments',
      title: 'Entornos de prueba',
      summary: 'Desarrollo, staging (preproducción) y producción. En sectores regulados como la banca, probar en producción con dinero real es una falta grave.',
    },
    {
      id: 'traceability',
      title: 'Trazabilidad',
      summary: 'Todo defecto se registra donde lo ve todo el equipo. Los bugs que solo se hablan por chat se pierden, y el riesgo llega oculto a producción.',
    },
    {
      id: 'test_design',
      title: 'Diseñar antes de ejecutar',
      summary: 'Preparar los casos (entradas y resultado esperado) antes de tocar la app hace que pruebes con intención y no al azar.',
    },
    {
      id: 'confirmation_testing',
      title: 'Re-test (pruebas de confirmación)',
      summary: 'Cuando el dev dice «arreglado», QA lo vuelve a probar en el build nuevo con el mismo caso que falló. Cerrar sin re-probar es confiar, no verificar.',
    },
    {
      id: 'regression',
      title: 'Pruebas de regresión',
      summary: 'Un cambio puede romper lo que ya funcionaba. Tras cada fix, repite los casos relacionados que antes pasaban; por eso merece la pena tener los casos diseñados y guardados.',
    },
    {
      id: 'defect_lifecycle',
      title: 'Ciclo de vida del defecto',
      summary: 'Nuevo → aceptado → en corrección → resuelto → verificado y cerrado, o reabierto si sigue fallando. QA abre y QA cierra: el dev no cierra sus propios bugs.',
    },
    {
      id: 'risk_based',
      title: 'Testing basado en riesgos',
      summary: 'Riesgo = probabilidad de fallo × impacto. Se prueba primero lo que puntúa alto en ambos y se comunica qué queda sin probar.',
    },
    {
      id: 'concurrency',
      title: 'Acciones repetidas y concurrencia',
      summary: 'Doble clic, reintentos, red lenta: los usuarios reales hacen cosas que el camino feliz no cubre. En pagos, un duplicado es dinero perdido.',
    },
  ],
  debriefConcepts: ['principles', 'equivalence', 'boundary_values', 'bug_anatomy', 'concurrency'],
  seniorTips: [
    'Antes de tocar la app, aclara con la PO qué significa cada criterio ambiguo.',
    'Haz una lista rápida de particiones: válidos, cero, negativos, límites y formatos.',
    'Prueba como un cliente real: coma decimal, doble clic, varias transferencias seguidas.',
    'Registra cada bug con evidencia y avisa al dev: transparencia sin conflicto.',
    'Cuando llega un fix, re-prueba el caso que falló y repite los relacionados: un fix puede romper otra cosa.',
    'Comunica el estado con hechos: qué has probado, qué has encontrado, qué riesgo ves y qué recomiendas.',
  ],
}
