import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 4 · misión 5 · rol QA Architect). */
export const m05Lessons: Lesson[] = [
  {
    id: 'criteria',
    question: '¿Por dónde empiezo a evaluar herramientas?',
    conceptId: 'eval_criteria',
    cost: 5,
    body: `Por los **criterios**, antes de mirar opciones. Salen del problema y de las restricciones:
- lo que no puede fallar (aquí, datos anonimizados);
- el plazo que pide Dirección;
- la integración con lo que ya tenéis;
- el coste total y quién la mantiene;
- cómo salir si no funciona.

Si miras primero las demos, acabas eligiendo criterios que justifican la que más te gustó.`,
  },
  {
    id: 'tco',
    question: '¿Qué es el coste total a tres años?',
    conceptId: 'tco',
    cost: 5,
    body: `Todo lo que cuesta la opción durante su vida, no solo la factura:
- **licencias**;
- **puesta en marcha:** desarrollo, integración y formación;
- **personas** para mantenerla;
- **infraestructura**;
- **salida:** migrar si un día cambias.

«Sin licencias» no es «gratis»: construir u open source suelen costar sobre todo personas, y las personas son lo más caro.`,
  },
  {
    id: 'build_buy',
    question: '¿Construir o comprar?',
    conceptId: 'build_vs_buy',
    cost: 5,
    body: `Construye lo que te **diferencia** del resto o lo que nadie vende como lo necesitas. Compra lo que es **común** y que otros mantienen mejor que tú.

Y mira la **capacidad real**: si el equipo que lo construiría tiene el backlog lleno, construir significa no hacer otra cosa o hacerlo tarde.

Incluye al equipo que quiere construir en la evaluación: con los mismos criterios, sus números suelen cambiar de «dos sprints» a algo más realista.`,
  },
  {
    id: 'pilot',
    question: '¿Cómo hago un piloto que sirva para decidir?',
    conceptId: 'pilot_success',
    cost: 5,
    body: `- **Acotado:** pocas semanas y dos equipos representativos.
- **Con tu realidad:** tu pipeline y tus datos (anonimizados), no los de la demo.
- **Con criterios de éxito medibles antes de empezar:** por ejemplo, entorno en menos de 15 minutos y cero datos reales.
- **Con decisión al final:** firmar solo si se cumplen.

Un piloto sin criterios ni fin no es un piloto: es una implantación sin decidir.`,
  },
  {
    id: 'lockin',
    question: '¿Cómo evito quedarme atado a un proveedor?',
    conceptId: 'vendor_lockin',
    cost: 5,
    body: `- **Cláusula de salida** y **exportación de datos** en formato abierto, en el contrato desde el principio.
- **No firmes a largo plazo antes del piloto**, aunque haya descuento: la urgencia es del proveedor, no tuya.
- **Fecha de revisión** con métricas de uso y coste.

Negocia antes de firmar: después ya no tienes con qué.`,
  },
  {
    id: 'privacy',
    question: '¿Qué riesgo tienen los datos de prueba?',
    conceptId: 'test_data_privacy',
    cost: 5,
    body: `Si se copian de producción, **son datos de clientes**, con todas sus obligaciones (RGPD).

- Usa **datos sintéticos o anonimizados** antes de que salgan de tu entorno.
- Con un proveedor externo, **contrato de encargo de tratamiento**.
- Hazlo **criterio de éxito del piloto** y cuéntaselo a Riesgos antes de firmar, no después.`,
  },
]
