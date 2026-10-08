import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 2 · misión 5). Temario CTFL 5.1 y 5.2. */
export const m05Lessons: Lesson[] = [
  {
    id: 'plan',
    question: '¿Para qué sirve un plan de pruebas? (CTFL 5.1.1)',
    conceptId: 'test_plan',
    cost: 5,
    body: `Describe los **objetivos, recursos y procesos** de las pruebas. Sirve para:

- documentar cómo se va a probar y cómo se van a cumplir los objetivos;
- asegurar que las actividades cumplen los criterios fijados;
- **comunicar** con el equipo y las partes interesadas;
- demostrar que se respeta la política y la estrategia de pruebas.

Contenido típico: contexto (alcance, objetivos), supuestos y restricciones, partes interesadas, comunicación, registro de riesgos, enfoque, presupuesto y calendario.`,
  },
  {
    id: 'criteria',
    question: '¿Qué son los criterios de entrada y de salida? (CTFL 5.1.3)',
    conceptId: 'entry_exit',
    cost: 5,
    body: `- **Entrada**: precondiciones para empezar una actividad. Ej.: build estable en staging, historias con criterios de aceptación, datos disponibles.
- **Salida**: qué hay que conseguir para declararla terminada. Ej.: cobertura alcanzada, ningún defecto crítico abierto, riesgo residual aceptado.

Tienen que ser **medibles**. Agotar el tiempo o el presupuesto también puede ser un criterio de salida válido, si las partes interesadas aceptan el riesgo de parar. En ágil: **definición de listo** (entrada) y **definición de hecho** (salida).`,
  },
  {
    id: 'estimation',
    question: '¿Qué técnicas de estimación entran en el examen? (CTFL 5.1.4)',
    conceptId: 'estimation',
    cost: 5,
    body: `- **Por ratios**: con datos históricos de la organización. Ej.: pruebas = 40 % del desarrollo → 50 × 0,4 = 20.
- **Extrapolación**: medir pronto en el proyecto actual y extrapolar.
- **Wideband Delphi**: expertos estiman a ciegas; los que están en los extremos explican sus razones y se repite hasta converger. *Planning poker* es una variante.
- **Tres puntos**: optimista (a), más probable (m) y pesimista (b). **E = (a + 4m + b) ÷ 6**; desviación estándar **(b − a) ÷ 6**. Ej.: (12 + 4·18 + 36) ÷ 6 = 20 ± 4.`,
  },
  {
    id: 'priority',
    question: '¿Cómo se prioriza la ejecución de casos? (CTFL 5.1.5)',
    conceptId: 'prioritization',
    cost: 5,
    body: `Estrategias habituales:
- **Por riesgo**: primero lo de mayor riesgo.
- **Por cobertura**: primero lo que más cobertura aporta.
- **Por requisitos**: según la prioridad de los requisitos.

Pero hay que respetar las **dependencias**: si un caso de riesgo alto necesita uno de riesgo medio, ese va antes. También cuentan la disponibilidad de recursos (entornos, personas).`,
  },
  {
    id: 'quadrants',
    question: '¿Qué son la pirámide y los cuadrantes de testing? (CTFL 5.1.6–5.1.7)',
    conceptId: 'quadrants',
    cost: 5,
    body: `**Pirámide**: muchas pruebas pequeñas, rápidas y aisladas en la base (unitarias) y pocas lentas y grandes arriba (extremo a extremo).

**Cuadrantes** (Brian Marick):
- **Q1** · tecnología, apoyan al equipo: unitarias, de componentes e integración.
- **Q2** · negocio, apoyan al equipo: funcionales, ejemplos, pruebas de historias (BDD), prototipos.
- **Q3** · negocio, critican el producto: exploratorias, usabilidad, aceptación de usuario.
- **Q4** · tecnología, critican el producto: rendimiento, carga, seguridad y otras no funcionales.

Sirven para no olvidar tipos de prueba al planificar.`,
  },
  {
    id: 'risk',
    question: '¿Riesgo de producto o de proyecto? (CTFL 5.2)',
    conceptId: 'risk_mgmt',
    cost: 5,
    body: `- **Riesgo de producto**: afecta a la **calidad** de lo que se entrega (cálculos erróneos, lentitud, agujeros de seguridad). Se mitiga **probando**.
- **Riesgo de proyecto**: afecta a la **gestión y el control** (proveedores que se retrasan, personas no disponibles, entornos compartidos, plazos). Se **gestiona**: planes de contingencia, transferir, aceptar.

Nivel de riesgo = **probabilidad × impacto**. El análisis de riesgos guía qué probar, con qué intensidad y en qué orden.`,
  },
]
