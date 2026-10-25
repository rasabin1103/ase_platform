import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 4 · misión 10 · rol Head of QA). */
export const m10Lessons: Lesson[] = [
  {
    id: 'crisis',
    question: '¿Qué hago primero en una crisis?',
    conceptId: 'crisis_transparency',
    cost: 5,
    body: `1. **Los clientes:** frenar el daño y compensar.
2. **Los hechos, pronto:** a Compliance y al regulador, con lo que se sabe y lo que no. Mejor transparente hoy que perfecto en tres semanas.
3. **Nada de minimizar:** «caso aislado» con miles de clientes destruye la confianza.
4. **El análisis, después**, con calma y sin culpables.`,
  },
  {
    id: 'blameless',
    question: '¿Qué es un postmortem sin culpables?',
    conceptId: 'blameless_culture',
    cost: 5,
    body: `Parte de una idea: **las personas hicieron lo razonable con lo que sabían y con el sistema que tenían**. La pregunta no es «¿quién?», sino «¿por qué el sistema lo permitió?».

Si se busca culpable, la gente deja de contar lo que sabe, y el próximo aviso no llega. No significa esconder los fallos: significa ponerlos donde se pueden arreglar.`,
  },
  {
    id: 'causes',
    question: '¿Cómo encuentro las causas de sistema?',
    conceptId: 'system_causes',
    cost: 5,
    body: `Por cada «alguien hizo X», pregunta **por qué el sistema lo hizo posible o no lo detectó**:
- ¿Se podía probar? (entornos)
- ¿Quién podía decidir sobre el riesgo? (gobierno)
- ¿Cuánto tardamos en saberlo? (monitorización)
- ¿Cuánto impacto podía tener de golpe? (despliegue)
- ¿El diseño lo evitaba? (arquitectura)

Cada causa, una acción con dueño y fecha.`,
  },
  {
    id: 'people',
    question: '¿Cómo protejo a las personas sin esconder el fallo?',
    conceptId: 'protect_people',
    cost: 5,
    body: `- **Asume la parte de tu área** en público.
- **No señales a nadie**, y menos a quien avisó.
- **Habla con la persona afectada** pronto: incertidumbre y rumores hacen más daño que el incidente.
- **Corrige los informes** que culpan a una persona: no es cierto ni útil, y el regulador pedirá medidas que no atacan la causa.`,
  },
  {
    id: 'gate',
    question: '¿Por qué «más QA» no es la solución?',
    conceptId: 'org_change',
    cost: 5,
    body: `Porque el riesgo **ya estaba firmado y avisado**. Si QA es la única puerta, la calidad es «cosa de QA» y nadie más decide sobre los riesgos.

El cambio de organización:
- los riesgos los acepta **su dueño de negocio**;
- la calidad **dentro del sistema**: entornos, alertas, despliegue gradual y diseño;
- el **coste de la no calidad** en el comité, cada mes.`,
  },
  {
    id: 'role',
    question: '¿Qué cambia como Head of QA?',
    conceptId: 'role_head_of_qa',
    cost: 5,
    body: `Ya no firmas releases ni llevas equipos directamente: **posees la estrategia, el modelo y la cultura de calidad**. Ante un incidente, tu trabajo es que la empresa aprenda: hechos al regulador, protección a las personas y cambios en la organización.

Se te mide por el coste de la no calidad, los incidentes graves y la confianza de dirección.`,
  },
]
