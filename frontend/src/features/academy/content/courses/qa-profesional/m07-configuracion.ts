import type { Mission } from '../../../engine/types'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m07Lessons } from './m07-lessons'
import { m07Quiz } from './m07-quiz'
import { m07Scenes } from './m07-scenes'

/**
 * Curso 2: QA Profesional · Misión 7 — ¿Qué versión es? (CTFL 5.4, 2.3 y 5.5).
 * Guion legible: docs/academy/qa-profesional/missions/m07-configuracion.md
 *
 * Un bug «imposible» que solo pasa en staging, un fix «ya subido» que no
 * está desplegado y una migración del proveedor de facturación electrónica
 * que obliga a decidir qué regresión ejecutar.
 */
export const m07Configuracion: Mission = {
  id: 'm07-configuracion',
  courseKey: 'qa-profesional',
  number: 7,
  title: '¿Qué versión es?',
  subtitle: 'Gestión de la configuración, pruebas de mantenimiento, análisis de impacto e informe de defectos.',
  world: kobaltoWorld,
  playerRole: 'QA del squad Empresas',
  dayStart: 9 * 60,
  dayLabel: 'Martes',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-config',
  appLabel: 'Configuración',
  hideBugList: true,
  initialMetrics: {},
  lessons: m07Lessons,
  mentor: 'laura',
  quiz: m07Quiz,
  verdicts: {
    good: {
      title: 'Sabes qué estás probando',
      body: 'El bug «imposible» quedó explicado, el fix se verificó en su build, la configuración está bajo control y la migración se prueba donde importa.',
    },
    ok: {
      title: 'Versiones a medias',
      body: 'Encontraste parte del problema, pero alguna pieza de la configuración o del mantenimiento se va a notar. Mira el debrief.',
    },
    bad: {
      title: 'Probando a ciegas',
      body: 'Sin saber qué versión había en cada entorno, se cerraron y reabrieron cosas sin fundamento. Repite la misión empezando por el comparador de entornos.',
    },
  },

  briefing: {
    title: 'Martes: ¿qué versión es?',
    paragraphs: [
      'Elena ve en staging que las facturas recurrentes redondean el IVA a la baja. Tomás no lo reproduce en su local y, de paso, te pide cerrar EMP-231 porque «ya está subido».',
      'Además, el proveedor de facturación electrónica migra a su API v2 el lunes y Raúl necesita saber qué regresión ejecutar en tres días.',
      'En la app «Configuración» tienes el trazador: comparador de entornos, historial de builds, informe del defecto y análisis de impacto.',
    ],
    goals: [
      'Compara los entornos y encuentra la causa y el elemento sin control de versiones.',
      'Decide en qué build se puede verificar EMP-231.',
      'Redacta un informe de defecto reproducible, con versiones exactas.',
      'Identifica el disparador de mantenimiento y acota la regresión por impacto.',
      'Pon la configuración bajo control y defiende la regresión ante Raúl.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }],

  scenes: m07Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_configuracion',
      title: 'Gestión de la configuración en Kobalto',
      updatedLabel: 'Mantenida por Iván Torres',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'config_mgmt' },
        { kind: 'unlock', conceptId: 'confirmation' },
      ],
      body: `## Qué es (CTFL 5.4)
Disciplina para **identificar, controlar y seguir** los elementos de la configuración: código, builds, esquemas, ficheros de configuración, flags, datos y el propio testware (casos, scripts, datos de prueba).

- Cada elemento tiene identificador único y versión.
- Se sabe qué versiones forman cada build o entorno (**línea base**), y sus cambios pasan por control.
- Así cualquier prueba y cualquier defecto se pueden relacionar con una versión exacta y reproducir.
- En DevOps se automatiza dentro del pipeline (CI/CD).

## Regla de Kobalto
Nada se cambia a mano en un entorno. Si no está en el repositorio y no se despliega con el pipeline, no existe.

## Verificar un fix
Una prueba de **confirmación** se ejecuta en la build que contiene el fix. Comprueba siempre qué build hay desplegada antes de cerrar o reabrir un defecto.`,
    },
    {
      id: 'guia_mantenimiento',
      title: 'Pruebas de mantenimiento y defectos',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'maintenance' },
        { kind: 'unlock', conceptId: 'impact_analysis' },
        { kind: 'unlock', conceptId: 'defect_report' },
      ],
      body: `## Disparadores (CTFL 2.3)
- **Modificaciones**: mejoras, correcciones, parches planificados.
- **Actualizaciones o migraciones del entorno operativo**: cambio de plataforma, de servicio externo o de datos.
- **Retirada**: un sistema o una parte deja de usarse (archivado y restauración de datos).

## Análisis de impacto
Antes de cambiar: qué partes se ven afectadas, cuáles son las consecuencias y **qué regresión hace falta**. Se apoya en la trazabilidad y en conocer las dependencias. Regresión completa por miedo = tiempo perdido; ninguna regresión = riesgo sin gestionar.

## Informe de defecto (CTFL 5.5)
Identificador, título conciso, fecha y autor, **objeto de prueba y entorno con versiones**, contexto, pasos para reproducir, **resultado esperado y real**, severidad y prioridad, estado y referencias.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'P-CAUSA', title: 'Dos días buscando el bug del IVA en el código: era el billing.yml de staging', severity: 'medium', explanation: 'Nadie comparó la configuración de los entornos.', technique: 'Comparar entornos elemento a elemento.', preventedBy: 'config.found' },
    { id: 'P-FIX', title: 'EMP-231 se cerró sin estar desplegado y el vencimiento falla en producción', severity: 'critical', explanation: 'El fix estaba mergeado, pero no en la build de staging.', technique: 'Prueba de confirmación sobre la build que contiene el fix.', preventedBy: 'fix.verified' },
    { id: 'P-INFORME', title: 'El defecto del IVA rebota tres veces: «no se reproduce»', severity: 'medium', explanation: 'El informe no decía en qué versión ni con qué configuración pasaba.', technique: 'Informe con entorno, versiones y resultado esperado frente al real.', preventedBy: 'report.ok' },
    { id: 'P-CONFIG', title: 'El redondeo vuelve a cambiar en el siguiente despliegue', severity: 'high', explanation: 'billing.yml seguía sin control de versiones.', technique: 'Configuración en el repositorio y desplegada con el pipeline.', preventedBy: 'config.controlled' },
    { id: 'P-IMPACTO', title: 'Las rectificativas fallan con el proveedor nuevo: nadie las probó', severity: 'high', explanation: 'Sin análisis de impacto, se dejó fuera una funcionalidad afectada.', technique: 'Análisis de impacto siguiendo las dependencias.', preventedBy: 'impact.ok' },
    { id: 'P-REGRESION', title: 'La migración llega sin la regresión adecuada', severity: 'high', explanation: 'Regresión completa que no cabe en el plazo, o ninguna.', technique: 'Regresión acotada por impacto y defendida con números.', preventedBy: 'regression.impact' },
  ],

  prevention: {
    title: 'Tu trazado',
    intro: 'Saber qué versión se prueba y qué toca cada cambio evita problemas muy concretos.',
    preventedLabel: 'Problemas que evitas',
    appearedLabel: 'Problemas que llegarán',
    rules: [
      { flag: 'config.found', label: 'Causa en la configuración', explanation: 'staging tenía billing.yml con round: down.' },
      { flag: 'fix.verified', label: 'Fix verificado en su build', explanation: 'EMP-231 entra en la #412; se desplegó y se verificó sobre ella.' },
      { flag: 'report.ok', label: 'Informe reproducible', explanation: 'Título concreto, versiones exactas y 7,00 € esperado frente a 6,99 € real.' },
      { flag: 'config.controlled', label: 'Configuración bajo control de versiones', explanation: 'billing.yml en el repositorio y desplegado con el pipeline.' },
      { flag: 'impact.ok', label: 'Impacto bien acotado', explanation: 'Emisión, recurrentes, rectificativas y PDF.' },
      { flag: 'regression.impact', label: 'Regresión por impacto', explanation: 'Tres días donde toca la migración, no cinco y medio por miedo.' },
    ],
  },

  concepts: [
    { id: 'config_mgmt', title: 'Gestión de la configuración', summary: 'Identificar, controlar y seguir los elementos (código, builds, esquemas, configuración, flags, datos, testware) para que cada prueba y cada defecto se relacionen con una versión exacta. (CTFL 5.4)' },
    { id: 'confirmation', title: 'Pruebas de confirmación y de regresión', summary: 'Confirmación: comprobar que el fix corrige el defecto, en la build que lo contiene. Regresión: comprobar que el cambio no ha roto otra cosa. (CTFL 2.2.3)' },
    { id: 'maintenance', title: 'Pruebas de mantenimiento', summary: 'Disparadas por modificaciones, migraciones o actualizaciones del entorno operativo y retiradas. (CTFL 2.3)' },
    { id: 'impact_analysis', title: 'Análisis de impacto', summary: 'Antes de un cambio, identificar qué partes se ven afectadas para decidir qué regresión ejecutar. (CTFL 2.3)' },
    { id: 'defect_report', title: 'Informe de defecto', summary: 'Título, objeto y entorno con versiones, pasos, esperado frente a real, severidad, prioridad y estado: lo necesario para reproducirlo. (CTFL 5.5)' },
  ],
  debriefConcepts: ['config_mgmt', 'confirmation', 'maintenance', 'impact_analysis', 'defect_report'],
  seniorTips: [
    'Causa y elemento sin versionar: billing.yml (round: down en staging, editado a mano).',
    'EMP-231 entra en la #412 y staging tiene la #409: desplegar la #412 y verificar sobre ella.',
    'Informe: título concreto, entorno con versiones exactas y 7,00 € esperado frente a 6,99 € real.',
    'La migración del proveedor es un disparador de tipo migración o actualización del entorno operativo.',
    'Impacto: emisión, recurrentes, rectificativas y PDF (3 días). El resto va con la regresión automática.',
  ],
}
