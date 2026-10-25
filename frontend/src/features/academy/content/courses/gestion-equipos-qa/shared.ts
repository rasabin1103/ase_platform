import type { Doc } from '../../../engine/types'

/** Documentos que comparten varias misiones del curso (mismo rol). */

/** Ficha del rol de QA manual (misiones 0 y 1). */
export const FICHA_QA_MANUAL: Doc = {
  id: 'ficha_rol',
  title: 'Ficha del rol: QA manual',
  updatedLabel: 'Laura Méndez · QA Lead',
  readCost: 5,
  onRead: [
    { kind: 'unlock', conceptId: 'role_qa_manual' },
    { kind: 'unlock', conceptId: 'risk_ownership' },
    { kind: 'flag', key: 'role.read' },
    { kind: 'score', key: 'rigor', add: 1 },
  ],
  body: `## Lo que posees
- Tus pruebas: entender qué hay que probar, ejecutarlo y guardar la evidencia.
- Tus bug reports: reproducibles, con pasos, datos, entorno y evidencia.
- Tu estado: qué está probado, qué no, qué te bloquea y qué riesgo ves.

## Lo que decides
- Cómo probar lo que tienes asignado y en qué orden (riesgo primero).
- Cuándo pedir ayuda: en cuanto ves que no llegas, no al final.

## Lo que NO decides
- Si el producto sale o no con un riesgo: eso lo decide quien es dueño del negocio (la PO y el Engineering Manager), con tu información.
- Las prioridades de otros equipos: si dos peticiones chocan, lo decide tu QA Lead.

## Lo que escalas a tu QA Lead
- Que no llegas a probar lo comprometido.
- Presión para firmar algo sin probar.
- Un conflicto que no se resuelve con evidencia y una conversación.

## Cómo se te mide
- Defectos útiles encontrados a tiempo.
- Que tu «probado» signifique probado.
- Que nadie se entere de un riesgo por sorpresa.`,
}

/** Ficha del rol de QA Lead (misiones 6 y 7). */
export const FICHA_QA_LEAD: Doc = {
  id: 'ficha_lead',
  title: 'Ficha del rol: QA Lead',
  updatedLabel: 'Laura Méndez · QA Manager',
  readCost: 5,
  onRead: [
    { kind: 'unlock', conceptId: 'role_qa_lead' },
    { kind: 'flag', key: 'role.read' },
    { kind: 'score', key: 'rigor', add: 1 },
  ],
  body: `## Lo que posees
- Las personas de tu equipo: que sepan qué se espera de ellas, que crezcan y que puedan trabajar.
- El reparto del trabajo y las prioridades del equipo.
- Los 1:1 y el feedback, en las dos direcciones.

## Lo que decides
- Quién lleva qué, con qué apoyo y con qué margen.
- Cómo trabaja el equipo (acuerdos, prácticas, revisión).
- Cuándo respaldas a una persona de tu equipo y cuándo la corriges, en privado.

## Lo que NO decides
- Si se sale con un riesgo: lo decide el dueño del negocio. Tú te aseguras de que lo decida con la información de tu equipo.
- La plantilla y el presupuesto: los lleva tu QA Manager. Tú le das los datos.

## Lo que escalas a tu QA Manager
- Falta de capacidad sostenida o sobrecarga de alguien.
- Bajo rendimiento que no mejora con feedback y apoyo.
- Conflictos con otras áreas que no se resuelven a tu nivel.

## Lo que ya no haces
- Ser el mejor QA del equipo ni coger lo más difícil tú: si lo haces, nadie crece y el equipo depende de ti.

## Cómo se te mide
- Lo que entrega el equipo, no lo que entregas tú.
- Que las personas crezcan, se queden y se atrevan a avisar de los riesgos.`,
}

/** Ficha del rol de QA Engineer (misiones 2 y 3). */
export const FICHA_QA_ENGINEER: Doc = {
  id: 'ficha_engineer',
  title: 'Ficha del rol: QA Engineer',
  updatedLabel: 'Laura Méndez · QA Lead',
  readCost: 5,
  onRead: [
    { kind: 'unlock', conceptId: 'role_qa_engineer' },
    { kind: 'flag', key: 'role.read' },
    { kind: 'score', key: 'rigor', add: 1 },
  ],
  body: `## Lo que posees
- La automatización de pruebas del squad: que la suite sea fiable, rápida y útil.
- Las herramientas, los datos y los entornos de prueba que usa el equipo.
- Ayudar a otros (devs y QA) a escribir buenos tests.

## Lo que decides
- Qué automatizar y cómo, y qué hacer con un test que no aporta.
- Cuándo un test sale del camino crítico (cuarentena) y con qué condiciones.

## Lo que NO decides
- El tiempo del sprint: lo negocias con la PO y el EM, con datos.
- Arreglar todos los tests de todos: cada squad es dueño de los suyos; tú pones las reglas y ayudas.

## Lo que escalas a tu QA Lead
- Falta de tiempo sostenida para mantener la suite.
- Problemas de plataforma o entornos que no dependen del equipo.

## Cómo se te mide
- Que el pipeline sea una señal en la que el equipo confía.
- Lo rápido que el equipo sabe si algo se ha roto.
- Cuánto aprenden los demás de ti.`,
}

/** Ficha del rol de QA Architect (misiones 4 y 5). */
export const FICHA_QA_ARCHITECT: Doc = {
  id: 'ficha_architect',
  title: 'Ficha del rol: QA Architect',
  updatedLabel: 'Raúl Ortega · Head of Engineering',
  readCost: 5,
  onRead: [
    { kind: 'unlock', conceptId: 'role_qa_architect' },
    { kind: 'flag', key: 'role.read' },
    { kind: 'score', key: 'rigor', add: 1 },
  ],
  body: `## Lo que posees
- Los estándares, las herramientas y la arquitectura de pruebas comunes a todos los squads.
- Las decisiones técnicas transversales y su documentación (RFC y ADR).

## Lo que decides
- Qué se propone como estándar y con qué criterios, después de escuchar a los squads.
- Qué queda fuera de alcance de cada decisión.

## Lo que NO tienes
- Autoridad sobre los squads: no son tu equipo. Tu herramienta es la influencia: datos, criterios, pilotos y escuchar.
- Presupuesto: lo propones con su coste; lo aprueba Dirección.

## Lo que escalas
- Conflictos entre squads que bloquean una decisión común.
- Inversiones y riesgos técnicos que afectan a toda la organización.

## Cómo se te mide
- Por la adopción real de los estándares, no por los documentos publicados.
- Por si probar es más rápido, barato y fiable en toda la organización.`,
}

/** Ficha del rol de QA Manager (misiones 8 y 9). */
export const FICHA_QA_MANAGER: Doc = {
  id: 'ficha_manager',
  title: 'Ficha del rol: QA Manager',
  updatedLabel: 'Laura Méndez · VP Engineering',
  readCost: 5,
  onRead: [
    { kind: 'unlock', conceptId: 'role_qa_manager' },
    { kind: 'flag', key: 'role.read' },
    { kind: 'score', key: 'rigor', add: 1 },
  ],
  body: `## Lo que posees
- Varios equipos de QA y a sus QA Leads.
- La contratación, la capacidad y el presupuesto de tu área.
- Las carreras: evaluaciones, promociones y desarrollo de tus leads.

## Lo que decides
- A quién se contrata y con qué proceso, junto a tus leads y a Personas.
- Cómo se reparte la capacidad entre equipos.
- Los procesos comunes del área.

## Lo que NO haces
- Entrevistar y decidir solo, ni por intuición: con criterios y un panel.
- Los 1:1 de cada QA: son de sus leads. Tú haces los de tus leads.

## Lo que escalas a tu VP
- Recortes o cambios de presupuesto que afectan a la cobertura de riesgo.
- Presiones de dirección que comprometen un proceso justo.

## Cómo se te mide
- Capacidad y retención de tu área.
- Calidad de las contrataciones y del onboarding.
- Que tus leads crezcan.`,
}

/** Ficha del rol de Head of QA (misiones 10 y 11). */
export const FICHA_HEAD_OF_QA: Doc = {
  id: 'ficha_head',
  title: 'Ficha del rol: Head of QA',
  updatedLabel: 'Irene Sáez · CEO',
  readCost: 5,
  onRead: [
    { kind: 'unlock', conceptId: 'role_head_of_qa' },
    { kind: 'flag', key: 'role.read' },
    { kind: 'score', key: 'rigor', add: 1 },
  ],
  body: `## Lo que posees
- La estrategia de calidad de la empresa, el modelo organizativo de QA y la cultura de calidad.
- La relación con dirección, Compliance y el regulador en todo lo que toca a calidad.

## Lo que decides
- La visión, la inversión y el modelo (centralizado, embebido o plataforma).
- Las políticas comunes: cómo se aceptan los riesgos, qué se exige antes de un release.

## Lo que NO haces
- Ser la última firma de cada release: si QA es la única puerta, la calidad es solo de QA.
- Buscar culpables: tu trabajo es cambiar el sistema que permitió el fallo.

## Lo que escalas al comité de dirección
- Riesgos de negocio y regulatorios, con su coste.

## Cómo se te mide
- Coste de la no calidad e incidentes graves.
- Velocidad de entrega sin perder la confianza de clientes y regulador.
- Confianza de dirección en la calidad de lo que sale.`,
}
