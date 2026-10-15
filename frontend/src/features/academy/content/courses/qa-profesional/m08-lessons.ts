import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 2 · misión 8). Temario CTFL 6.1 y 6.2. */
export const m08Lessons: Lesson[] = [
  {
    id: 'categories',
    question: '¿Qué tipos de herramientas de prueba hay? (CTFL 6.1)',
    conceptId: 'tool_categories',
    cost: 5,
    body: `- **Gestión**: proceso, requisitos, pruebas, defectos y configuración; trazabilidad.
- **Pruebas estáticas**: apoyo a revisiones y análisis estático.
- **Diseño e implementación**: generan casos, datos y procedimientos.
- **Ejecución y cobertura**: ejecutan pruebas automatizadas y miden cobertura.
- **No funcionales**: rendimiento, carga, seguridad… pruebas difíciles o imposibles a mano.
- **DevOps**: el pipeline de entrega, builds automáticas, CI/CD.
- **Colaboración**: comunicación entre roles.
- Y las de **escalabilidad y estandarización del despliegue** (máquinas virtuales, contenedores).

Primero la necesidad, después la categoría y por último la herramienta.`,
  },
  {
    id: 'benefits',
    question: '¿Qué beneficios tiene la automatización? (CTFL 6.2)',
    conceptId: 'automation_benefits',
    cost: 5,
    body: `- Ahorra tiempo en el trabajo **repetitivo**: regresión, reintroducir datos, comparar resultados, revisar contra estándares.
- Menos errores humanos: más **consistencia y repetibilidad**.
- Evaluación más **objetiva** (cobertura) y medidas difíciles de obtener a mano.
- Acceso más fácil a la información para gestionar e informar.
- Ejecución más rápida: **detección temprana** y feedback más ágil.
- Libera tiempo para diseñar pruebas nuevas, más profundas y eficaces.`,
  },
  {
    id: 'risks',
    question: '¿Qué riesgos tiene la automatización? (CTFL 6.2)',
    conceptId: 'automation_risks',
    cost: 5,
    body: `- **Expectativas irreales** sobre la funcionalidad y la facilidad de uso.
- Estimar mal el tiempo, el coste y el esfuerzo: introducirla, **mantener los scripts**, cambiar el proceso.
- Usarla cuando lo manual es más adecuado.
- **Confiar demasiado** e ignorar el pensamiento crítico.
- **Dependencia del proveedor**: que cierre, la retire, la venda o dé mal soporte.
- Software libre abandonado o con actualizaciones constantes.
- **Incompatibilidad** con la plataforma de desarrollo.
- No cumplir requisitos normativos o de seguridad.`,
  },
  {
    id: 'evaluate',
    question: '¿Cómo se evalúa una herramienta candidata?',
    conceptId: 'automation_risks',
    cost: 5,
    body: `Mira lo que no sale en la demo:

- **encaje** con la necesidad concreta;
- **coste total** a varios años: licencia, formación, infraestructura y mantenimiento de los scripts;
- **curva de aprendizaje** del equipo;
- **integración** con el CI y con las herramientas que ya usáis;
- **formato** de los scripts: ¿se pueden versionar y exportar?;
- **soporte** y salud del proveedor o de la comunidad.`,
  },
  {
    id: 'pilot',
    question: '¿Para qué sirve un piloto de herramientas?',
    conceptId: 'tool_pilot',
    cost: 5,
    body: `Para decidir con datos antes de comprometer a todo el equipo:

- conocer la herramienta en un **alcance acotado** y real;
- comprobar que **encaja** con el proceso y la infraestructura;
- fijar formas de uso y estándares;
- medir costes y beneficios con **criterios de éxito medibles** y una fecha de decisión.

Es buena práctica de adopción; el CTFL v4.0 ya no lo examina como sección propia, pero en el trabajo real es lo que separa una compra de una solución.`,
  },
  {
    id: 'balance',
    question: '¿La automatización sustituye a las pruebas manuales?',
    conceptId: 'automation_benefits',
    cost: 5,
    body: `No. Automatiza lo **repetitivo y estable** (regresión, comprobaciones de datos, carga) y deja a las personas lo que requiere **criterio**: exploratorias, usabilidad, casos nuevos y ambiguos.

«Automatizar el 100 % en un mes» es una expectativa irreal: la automatización es un producto de software que hay que diseñar, revisar y mantener.`,
  },
]
