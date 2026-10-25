import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 4 · misión 11 · rol Head of QA). */
export const m11Lessons: Lesson[] = [
  {
    id: 'metrics',
    question: '¿Qué métricas llevo a un comité de dirección?',
    conceptId: 'quality_metrics',
    cost: 5,
    body: `Las que hablan su idioma: **dinero, clientes y velocidad**.
- Coste de la no calidad.
- Incidentes graves.
- Tiempo del código a producción.
- Defectos que llegan al cliente.

Número de tests, cobertura o bugs encontrados son métricas internas: útiles para el equipo, pero al comité no le dicen qué decidir.`,
  },
  {
    id: 'model',
    question: '¿Qué modelo organizativo de QA elijo?',
    conceptId: 'quality_model',
    cost: 5,
    body: `- **Centralizado:** control, pero QA se convierte en la puerta y en el cuello de botella.
- **Embebido sin nada común:** rápido, pero cada squad reinventa.
- **Híbrido:** QA en los squads, una **plataforma de calidad** común (entornos, datos, herramientas) y un equipo pequeño de estándares. Los riesgos los acepta su dueño.

No hay modelo perfecto: elige el que resuelve tus problemas de hoy (aquí, la puerta y la espera).`,
  },
  {
    id: 'invest',
    question: '¿Cómo pido inversión?',
    conceptId: 'exec_pitch',
    cost: 5,
    body: `**Por fases y ligada a métricas**: la primera fase se aprueba ya y las siguientes se liberan si los números mejoran. Dirección arriesga poco y decide con datos.

Y cuenta siempre el **coste de no hacer nada**: es el argumento que más pesa.`,
  },
  {
    id: 'pitch',
    question: '¿Cómo presento al comité?',
    conceptId: 'exec_pitch',
    cost: 5,
    body: `1. **El problema en su idioma:** 2,1 M€, cuatro incidentes, cinco días de espera.
2. **La causa**, en una frase.
3. **La propuesta:** modelo, inversión, hoja de ruta y personas.
4. **La petición concreta:** «aprobad la primera fase».
5. **Cómo lo veréis:** cuatro números cada trimestre.

Diez minutos. El detalle, en el anexo.`,
  },
  {
    id: 'change',
    question: '¿Cómo consigo que los escépticos se sumen?',
    conceptId: 'lead_change',
    cost: 5,
    body: `- **Escucha el riesgo que ven**: suele ser real.
- **Dales una pieza del cambio**: quien lidera una parte la defiende.
- **Usa su métrica**: al CTO, el tiempo a producción.
- **Propón un piloto medible** con una condición de salida.

Imponer consigue cumplimiento; involucrar consigue compromiso.`,
  },
  {
    id: 'people',
    question: '¿Qué pasa con los QA manuales en el nuevo modelo?',
    conceptId: 'quality_model',
    cost: 5,
    body: `Conocen el negocio mejor que nadie. Un **plan de transición**, con formación en automatización y calidad y una carrera técnica y de gestión, convierte ese conocimiento en ventaja.

Sustituirlos rompe la confianza de todo el área. Y callar llena el silencio de miedo: los mejores se van primero.`,
  },
]
