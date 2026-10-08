import type { Condition, Mission } from '../../../engine/types'
import { INCIDENT_BUG_SLOTS } from '../../../apps/kobalto-incident/incidentLogic'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m07Lessons } from './m07-lessons'
import { m07Quiz } from './m07-quiz'

const rootCauseFound: Condition = { kind: 'any', of: [{ kind: 'bugReported', bugId: 'I1' }, { kind: 'bugReported', bugId: 'I1b' }] }

/**
 * Curso: Fundamentos de Testing · Misión 7 — Incidente en producción.
 * Guion legible: docs/academy/missions/m07-incidente.md
 *
 * Miércoles. La campaña de transferencias instantáneas lleva dos días y a
 * las 09:00 salta una alerta: la API de pagos falla más de lo normal. Hay
 * que acotar con datos, mitigar sin apagar lo que funciona, comunicar,
 * reproducir la causa en staging y cerrar con un postmortem sin culpables.
 */
export const m07Incidente: Mission = {
  id: 'm07-incidente',
  courseKey: 'testing-fundamentals',
  number: 7,
  title: 'Incidente en producción',
  subtitle: 'Respuesta a incidentes, observabilidad, mitigación y postmortem sin culpables.',
  world: kobaltoWorld,
  playerRole: 'QA Junior',
  dayStart: 9 * 60,
  dayLabel: 'Miércoles',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'INC',
  appId: 'kobalto-incident',
  reportPriority: true,
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  lessons: m07Lessons,
  mentor: 'laura',
  quiz: m07Quiz,
  bugSlots: INCIDENT_BUG_SLOTS,
  verdicts: {
    good: {
      title: 'Incidente bajo control',
      body: 'Mitigaste rápido, encontraste la causa con datos y el postmortem dejó al equipo mejor que antes. Raúl te pide que estés en la guardia del próximo trimestre.',
    },
    ok: {
      title: 'Incidente superado',
      body: 'El incidente se resolvió, pero la mitigación tardó o la causa raíz no quedó clara. Revisa la cronología en el debrief.',
    },
    bad: {
      title: 'Un día largo',
      body: 'Sin acotar con datos ni mitigar primero, el daño crece cada minuto. Repite la misión: desglosa, apaga lo justo y luego investiga.',
    },
  },

  briefing: {
    title: 'Miércoles: incidente en producción',
    paragraphs: [
      'La 5.1 lleva dos días en producción y la campaña de transferencias instantáneas está en marcha. A las 09:00 salta una alerta: la API de pagos falla bastante más de lo normal.',
      'Tienes la consola de observabilidad: puedes desglosar los errores por operación, sistema, versión, importe o antigüedad de la cuenta, desactivar flags, hacer un rollback y reproducir combinaciones en staging.',
      'Cada minuto sin mitigar suma clientes afectados. A las 15:00, postmortem con todo el equipo.',
    ],
    goals: [
      'Mitiga primero: acota con datos qué funcionalidad falla y apágala.',
      'Comunica a Atención al cliente con honestidad.',
      'No persigas pistas falsas: comprueba la correlación.',
      'Reproduce la causa exacta en staging y repórtala.',
      'Lleva al postmortem una causa raíz sin culpables y acciones concretas.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'tickets' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'logs' }],

  scenes: [
    {
      id: 'alert',
      channel: 'chat',
      from: 'ivan',
      at: 0,
      body: '🚨 **ALERTA** · La tasa de error de la API de pagos está muy por encima del 0,3 % habitual desde las 09:00. Atención al cliente ya tiene llamadas. ¿Abrimos incidente?',
      choices: [
        {
          id: 'declare',
          text: 'Sí: incidente abierto y sala de crisis. Me pongo a acotar con los datos de observabilidad.',
          cost: 2,
          reply: 'Abierto. Raúl coordina. 🚒',
          effects: [
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'unlock', conceptId: 'incident_response' },
            { kind: 'note', tone: 'good', text: 'Abriste el incidente en cuanto saltó la alerta.' },
          ],
        },
        {
          id: 'wait',
          text: 'Esperemos 30 minutos, a lo mejor baja sola.',
          cost: 30,
          reply: 'Mmm… sigue subiendo. Lo abro yo.',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'unlock', conceptId: 'incident_response' },
            { kind: 'note', tone: 'bad', text: 'Esperaste 30 minutos con clientes afectados antes de actuar.' },
          ],
        },
      ],
    },
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Incidente: el orden importa',
      body: 'Estoy en el médico hasta las 11, te dejo esto rápido:\n\n1. **Mitigar** primero: acota qué funcionalidad falla y apágala (flag). El rollback es la última red.\n2. **Comunicar** a Nuria con lo que sepas.\n3. **Reproducir** la condición exacta en staging y reportarla.\n4. Postmortem **sin culpables**.\n\nTienes la guía de incidentes en la wiki. ¡Tú puedes!\n\nLaura',
    },
    {
      id: 'war_room',
      channel: 'meeting',
      from: 'raul',
      with: ['ivan', 'diego'],
      at: 10,
      subject: '09:10 · Sala de crisis',
      body: '**Raúl:** Coordino yo. Iván, infraestructura; Diego, código. QA, tú ayudas a acotar y reproducir. ¿Por dónde empezamos?',
      choices: [
        {
          id: 'data',
          text: 'Acotamos con los datos: desglose de errores por operación, versión, sistema… En cuanto sepamos qué funcionalidad es, la apagamos con su flag.',
          cost: 10,
          reply: 'Bien. Avisa en cuanto tengas la funcionalidad.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'observability' },
            { kind: 'note', tone: 'good', text: 'Propusiste acotar con datos y mitigar con el flag correcto.' },
          ],
        },
        {
          id: 'code',
          text: 'Revisemos el código de la 5.1 línea a línea hasta encontrar el fallo.',
          cost: 10,
          reply: 'Eso son horas. Necesito reducir el daño ya.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Propusiste buscar la causa en el código antes de mitigar.' },
          ],
        },
        {
          id: 'rollback',
          text: 'Rollback de todo a la 5.0.3 ya, y luego miramos.',
          cost: 10,
          reply: 'Es una opción, pero tarda 40 minutos y nos llevamos lo bueno. ¿Podemos acotar antes?',
          replyFrom: 'raul',
          effects: [{ kind: 'unlock', conceptId: 'mitigation' }, { kind: 'note', tone: 'neutral', text: 'Propusiste un rollback completo sin acotar.' }],
        },
      ],
    },
    {
      id: 'nuria',
      channel: 'chat',
      from: 'nuria',
      at: 30,
      body: 'Tenemos la centralita a tope 📞 Los clientes dicen que «la transferencia da error». ¿Qué les digo?',
      choices: [
        {
          id: 'honest',
          text: 'Que algunas transferencias están fallando desde las 09:00, que no se ha cobrado nada de las que fallan, que lo reintenten en una hora o usen la transferencia ordinaria, y que te actualizo cada 30 minutos.',
          cost: 5,
          reply: '¡Gracias! Con eso puedo trabajar.',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'unlock', conceptId: 'incident_response' },
            { kind: 'note', tone: 'good', text: 'Diste a Atención al cliente un mensaje honesto, útil y con próxima actualización.' },
          ],
        },
        {
          id: 'bank',
          text: 'Que es un problema del banco de destino.',
          cost: 2,
          reply: '¿Seguro? Si luego no es así, quedamos fatal…',
          effects: [
            { kind: 'score', key: 'communication', add: -2 },
            { kind: 'note', tone: 'bad', text: 'Culpaste a un tercero sin pruebas.' },
          ],
        },
        {
          id: 'nothing',
          text: 'Todavía no sabemos nada, mejor no decir nada.',
          cost: 1,
          reply: 'Ya, pero me siguen llamando…',
          effects: [{ kind: 'score', key: 'communication', add: -1 }, { kind: 'note', tone: 'neutral', text: 'Dejaste a Atención al cliente sin mensaje.' }],
        },
      ],
    },
    {
      id: 'cpu',
      channel: 'chat',
      from: 'sergio',
      at: 45,
      body: 'Oye, he visto que el servicio de **notificaciones** está al 95 % de CPU. ¿No será eso? ¿Lo reiniciamos?',
      choices: [
        {
          id: 'correlate',
          text: 'Antes, comprobemos la correlación: esa CPU sube cada día a las 09:00 por el envío masivo, y los errores están en la API de pagos. No coincide.',
          cost: 3,
          reply: 'Cierto, eso pasa todos los días. Falsa alarma 👍',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'observability' },
            { kind: 'note', tone: 'good', text: 'Descartaste una pista falsa comprobando la correlación.' },
          ],
        },
        {
          id: 'restart',
          text: 'Sí, reiniciadlo por si acaso.',
          cost: 15,
          reply: 'Reiniciado… y los errores siguen igual 😕',
          effects: [
            { kind: 'score', key: 'efficiency', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Perseguiste una pista falsa (la CPU de notificaciones) y perdiste 15 minutos.' },
          ],
        },
      ],
    },
    {
      id: 'wrong_flag',
      channel: 'chat',
      from: 'raul',
      when: { kind: 'flag', key: 'flag.wrong' },
      body: 'Has desactivado un flag y la tasa de error sigue igual. Ojo con apagar cosas a ciegas: cada flag apagado es una funcionalidad que los clientes pierden.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'mitigation' },
        { kind: 'note', tone: 'bad', text: 'Desactivaste un flag que no tenía que ver con el incidente.' },
      ],
    },
    {
      id: 'mitigated_fast',
      channel: 'chat',
      from: 'raul',
      when: { kind: 'flag', key: 'mitigated.fast' },
      body: 'Errores de vuelta al 0,3 % en menos de una hora 👏 Ahora, causa raíz y fix con calma.',
      onDeliver: [
        { kind: 'score', key: 'risk', add: 2 },
        { kind: 'note', tone: 'good', text: 'Mitigaste el incidente en menos de una hora.' },
      ],
    },
    {
      id: 'mitigated_slow',
      channel: 'chat',
      from: 'raul',
      when: { kind: 'all', of: [{ kind: 'flag', key: 'mitigated' }, { kind: 'notFlag', key: 'mitigated.fast' }] },
      body: 'Mitigado, pero hemos tardado más de una hora. En el postmortem veremos qué nos frenó.',
      onDeliver: [{ kind: 'note', tone: 'neutral', text: 'La mitigación llegó después de la primera hora.' }],
    },
    {
      id: 'marta_flag',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'mitigated.flag' },
      body: 'He visto que se han desactivado las instantáneas nuevas 😬 La campaña… ¿cuándo las volvemos a encender?',
      choices: [
        {
          id: 'after_fix',
          text: 'Cuando el fix esté verificado en staging con la condición exacta que falla. Mientras, las instantáneas van por el motor anterior: los clientes pueden seguir usándolas.',
          cost: 3,
          reply: 'Vale, lo explico al banco partner.',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'mitigation' },
            { kind: 'note', tone: 'good', text: 'Explicaste a negocio cuándo y con qué condición se reactiva el flag.' },
          ],
        },
        {
          id: 'now',
          text: 'Podemos reactivarlo ya, seguro que era algo puntual.',
          cost: 1,
          reply: '¿Seguro? No me gustaría repetir lo de esta mañana…',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'note', tone: 'bad', text: 'Propusiste reactivar el flag sin causa raíz ni fix.' },
          ],
        },
      ],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 120,
      when: { kind: 'notFlag', key: 'mitigated' },
      body: 'Ya estoy aquí 👋 ¿Aún sin mitigar? Desglosa por **operación** primero: lo que destaque te dirá qué flag apagar. Luego sigue desglosando para encontrar la condición exacta.',
      onDeliver: [{ kind: 'unlock', conceptId: 'observability' }],
    },
    {
      id: 'diego_fix',
      channel: 'chat',
      from: 'diego',
      when: rootCauseFound,
      body: 'Con tu reproducción lo veo clarísimo 🙏 Me pongo con el fix. Cuando lo suba, verifícalo en staging con esa misma combinación antes de reactivar el flag.',
      onDeliver: [{ kind: 'unlock', conceptId: 'incident_response' }],
    },
    {
      id: 'laura_verify',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'Fix en staging 🔧 Repite la reproducción exacta y alguna combinación vecina antes de que Raúl reactive el flag.',
      onDeliver: [{ kind: 'unlock', conceptId: 'confirmation_testing' }],
    },
    {
      id: 'postmortem',
      channel: 'meeting',
      from: 'raul',
      with: ['laura', 'diego', 'marta', 'ivan'],
      at: 360,
      subject: '15:00 · Postmortem del incidente',
      body: '**Raúl:** Postmortem sin culpables. Cronología, impacto y, sobre todo: ¿cuál fue la causa raíz y qué cambiamos para que no vuelva a pasar?',
      choices: [
        {
          id: 'blameless',
          text: 'Causa raíz: el motor nuevo de instantáneas falla con una combinación concreta que he reproducido en staging (está en el report). Factores: no teníamos datos de prueba ni un test de contrato para ese caso, la alerta no separaba por versión y el flag se encendió al 100 % de golpe. Acciones: test con esos datos, alerta por versión y despliegue gradual de los flags.',
          requires: rootCauseFound,
          cost: 30,
          reply: 'Postmortem de manual. Esas tres acciones van al sprint con responsable.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'unlock', conceptId: 'postmortem' },
            { kind: 'unlock', conceptId: 'shift_right' },
            { kind: 'note', tone: 'good', text: 'Llevaste al postmortem una causa raíz reproducida, factores del sistema y acciones de shift-left y shift-right.' },
          ],
        },
        {
          id: 'blame',
          text: 'Diego subió el motor nuevo sin probarlo bien.',
          cost: 30,
          reply: 'Aquí no buscamos culpables. Diego trabajó con lo que el sistema le permitía. ¿Qué faltó?',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'communication', add: -2 },
            { kind: 'metric', key: 'trust_diego', add: -2 },
            { kind: 'unlock', conceptId: 'postmortem' },
            { kind: 'note', tone: 'bad', text: 'Señalaste a una persona en un postmortem sin culpables.' },
          ],
        },
        {
          id: 'self_blame',
          text: 'Fue culpa mía: debería haberlo encontrado en la regresión del viernes.',
          cost: 30,
          reply: 'Sin culpables significa también sin culparte tú. ¿Qué cambiamos en el sistema?',
          replyFrom: 'laura',
          effects: [
            { kind: 'unlock', conceptId: 'postmortem' },
            { kind: 'note', tone: 'neutral', text: 'Te culpaste en lugar de proponer cambios en el sistema.' },
          ],
        },
        {
          id: 'luck',
          text: 'Mala suerte: son cosas que pasan.',
          cost: 30,
          reply: 'Si no aprendemos nada, volverá a pasar.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'unlock', conceptId: 'postmortem' },
            { kind: 'note', tone: 'bad', text: 'Cerraste el postmortem sin causa ni acciones.' },
          ],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Charla con Laura',
      body: '**Laura:** Has terminado tus primeras semanas en Kobalto. Del primer día a un incidente en producción. ¿Qué te llevas?',
      choices: [
        {
          id: 'lesson',
          text: 'Que testing no es solo encontrar bugs: es dar información para decidir. Antes del desarrollo, al diseñar, al reportar, al publicar… y también cuando algo falla en producción.',
          requires: rootCauseFound,
          reply: 'Exacto. Bienvenida, bienvenido al equipo de verdad. 💜',
          effects: [{ kind: 'score', key: 'communication', add: 2 }, { kind: 'endMission' }],
        },
        {
          id: 'fear',
          text: 'Que en producción siempre va a fallar algo y no se puede hacer nada.',
          reply: 'Fallará, sí. Pero se puede detectar antes, limitar el daño y aprender. Repasa el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con el fatalismo en lugar de las acciones.' }, { kind: 'endMission' }],
        },
        {
          id: 'little',
          text: 'Que hoy me ha superado un poco.',
          reply: 'Un incidente supera a cualquiera la primera vez. La segunda ya sabrás por dónde empezar.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_incidentes',
      title: 'Guía de incidentes de Kobalto',
      updatedLabel: 'Mantenida por Raúl Ortega',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'incident_response' },
        { kind: 'flag', key: 'guide.read' },
      ],
      body: `## Roles
- **Coordinador** (Raúl): decide y prioriza. **Infra** (Iván), **Desarrollo** (Diego), **QA**: acota, reproduce y verifica. **Comunicación**: Atención al cliente (Nuria) recibe actualizaciones cada 30 minutos.

## Orden
1. Mitigar (flag de la funcionalidad afectada; rollback si no hay flag o no se acota).
2. Comunicar estado: qué falla, a quién, qué hacer, próxima actualización.
3. Causa raíz: reproducir en staging con la condición exacta y reportarla.
4. Fix verificado → reactivar el flag de forma gradual.
5. Postmortem sin culpables en 24 h.

## Herramientas
- **Observabilidad**: desglose de errores por operación, sistema, versión, importe y antigüedad de la cuenta.
- **Flags** de la 5.1: instant_fees_v2 (instantáneas), split_payments (dividir gastos), new_onboarding.`,
    },
    {
      id: 'cambios',
      title: 'Cambios en producción esta semana',
      updatedLabel: 'Registro de cambios',
      readCost: 3,
      body: `- **Viernes 19:00**: despliegue de la app y la API 5.1 (flags desactivados).
- **Lunes 09:00**: flag split_payments activado al 10 % de clientes.
- **Martes 18:00**: flag new_onboarding activado al 100 %.
- **Miércoles 08:55**: flag **instant_fees_v2** activado al **100 %** para la campaña.
- **Todos los días 09:00**: envío masivo de notificaciones (pico de CPU habitual).`,
    },
  ],

  tickets: [
    {
      id: 'INC-77',
      title: 'Incidente: aumento de errores en la API de pagos desde las 09:00',
      status: 'Abierto · SEV1',
      type: 'story',
      description: 'La tasa de error de la API de pagos está muy por encima de lo habitual (0,3 %). Coordina Raúl. QA: acotar, reproducir y verificar.',
      acceptanceCriteria: [
        'El impacto se mitiga (tasa de error en niveles normales).',
        'La causa raíz está reproducida en staging y reportada.',
        'El fix se verifica con la combinación que fallaba antes de reactivar ningún flag.',
        'Hay postmortem sin culpables con acciones concretas.',
      ],
      comments: [{ author: 'ivan', body: 'Dashboards y desglose disponibles en la consola de observabilidad (Staging → producción, solo lectura).' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'I1',
      title: 'Instantáneas de más de 1.000 € desde la app Android 5.1 devuelven error 500',
      severity: 'critical',
      priority: 'p1',
      priorityWhy: 'incidente activo en producción',
      explanation: 'La app Android 5.1 envía el importe con formato local («1.250,00») solo a partir de 1.000 €, y el motor nuevo no lo interpreta.',
      technique: 'Observabilidad + aislamiento: desglose por operación → sistema → versión → importe, y reproducción exacta en staging.',
      repro: { groups: [['android'], ['1.000', '1000', 'mas de 1', 'superior a 1', 'mayor de 1', '1.250', '1250']], ask: 'Con importes pequeños no falla. ¿Con qué sistema y qué importe lo reproduces?' },
      fix: { delay: 60, note: 'He normalizado el importe en el motor nuevo.' },
    },
    {
      id: 'I1b',
      title: 'Instantáneas de cuentas abiertas antes de 2024 devuelven error 500',
      severity: 'critical',
      priority: 'p1',
      priorityWhy: 'incidente activo en producción',
      explanation: 'Las cuentas antiguas no tienen el campo iban_country, que el motor nuevo da por hecho. Staging solo tenía cuentas recientes.',
      technique: 'Observabilidad + aislamiento por tipo de dato (antigüedad de la cuenta) y reproducción con datos representativos.',
      repro: { groups: [['antes de 2024', 'antigua', 'antiguas', '2023', 'legacy', 'iban_country', 'anteriores a 2024']], ask: 'Con mi cuenta de pruebas no falla. ¿Qué tienen en común las cuentas afectadas?' },
      fix: { delay: 60, note: 'He añadido el valor por defecto para cuentas antiguas.' },
    },
  ],

  concepts: [
    { id: 'incident_response', title: 'Respuesta a incidentes', summary: 'Mitigar, comunicar, diagnosticar, corregir y aprender, con roles claros. QA acota, reproduce y verifica.' },
    { id: 'observability', title: 'Observabilidad', summary: 'Desglosar las métricas por dimensiones, filtrar lo que destaca y comprobar la correlación en el tiempo antes de perseguir una pista.' },
    { id: 'mitigation', title: 'Mitigación', summary: 'El flag apaga solo lo afectado en minutos; el rollback es más lento y se lleva lo bueno. Nunca apagar a ciegas.' },
    { id: 'postmortem', title: 'Postmortem sin culpables', summary: 'Cronología, impacto, causa raíz, factores del sistema y acciones concretas; se cambia el sistema, no se señala a personas.' },
    { id: 'shift_right', title: 'Shift-left y shift-right', summary: 'Detectar antes (pruebas y datos realistas) y limitar el daño en producción (alertas por versión, despliegue gradual, flags).' },
    { id: 'confirmation_testing', title: 'Re-test (pruebas de confirmación)', summary: 'El fix se verifica con la combinación exacta que fallaba antes de reactivar la funcionalidad.' },
  ],
  debriefConcepts: ['incident_response', 'observability', 'mitigation', 'postmortem', 'shift_right'],
  seniorTips: [
    'Abre el incidente en cuanto salta la alerta: esperar a ver si baja suma clientes afectados.',
    'Desglosa primero por operación: las instantáneas destacan; apaga instant_fees_v2 y no otro flag.',
    'Mira el registro de cambios: el flag se encendió al 100 % a las 08:55; el pico de CPU de las 09:00 pasa cada día.',
    'Sigue desglosando (sistema, versión, importe, antigüedad) hasta la condición exacta y reprodúcela en staging.',
    'Da a Atención al cliente un mensaje honesto con próxima actualización.',
    'En el postmortem: causa reproducida, factores del sistema (datos de prueba, alerta, despliegue al 100 %) y acciones, sin culpables.',
  ],
}
