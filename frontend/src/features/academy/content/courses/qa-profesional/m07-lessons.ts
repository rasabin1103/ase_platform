import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 2 · misión 7). Temario CTFL 5.4, 2.3 y 5.5. */
export const m07Lessons: Lesson[] = [
  {
    id: 'config',
    question: '¿Qué es la gestión de la configuración? (CTFL 5.4)',
    conceptId: 'config_mgmt',
    cost: 5,
    body: `Es la disciplina que **identifica, controla y sigue** los elementos de trabajo: código, builds, esquemas, ficheros de configuración, flags, entornos, datos y también el **testware** (casos, scripts, datos de prueba).

- Cada elemento tiene un identificador único y versiones.
- Se registra qué versiones forman cada build o entorno, y los cambios pasan por control.
- Así toda prueba y todo defecto se pueden relacionar con una versión exacta y reproducir.

En DevOps se automatiza en el pipeline: si algo se cambia a mano en un servidor, deja de estar controlado.`,
  },
  {
    id: 'envs',
    question: '¿Cómo se investiga un bug que solo pasa en un entorno?',
    conceptId: 'config_mgmt',
    cost: 5,
    body: `Antes de mirar el código, **compara los entornos** elemento a elemento:

- versión de la app y de cada servicio (build);
- esquema de base de datos;
- flags;
- ficheros de configuración;
- datos.

La diferencia que explica el fallo suele estar en lo que **no** está versionado: un fichero tocado a mano, un flag activado en un solo sitio, unos datos distintos.`,
  },
  {
    id: 'confirmation',
    question: '¿Qué diferencia hay entre una prueba de confirmación y una de regresión? (CTFL 2.2.3)',
    conceptId: 'confirmation',
    cost: 5,
    body: `- **Confirmación**: comprueba que el defecto original se ha corregido. Se ejecuta en la **build que contiene el fix**.
- **Regresión**: comprueba que el cambio no ha roto nada más. Es candidata a automatizarse, porque se repite mucho.

Mergeado no es desplegado: antes de cerrar o reabrir un defecto, mira qué build está en el entorno donde pruebas y anótala en el ticket.`,
  },
  {
    id: 'maintenance',
    question: '¿Qué dispara las pruebas de mantenimiento? (CTFL 2.3)',
    conceptId: 'maintenance',
    cost: 5,
    body: `Cualquier cambio en un sistema que ya está en uso:

- **modificaciones**: mejoras, correcciones y parches planificados;
- **actualizaciones o migraciones del entorno operativo**: de plataforma, de un servicio externo, de datos;
- **retirada**: cuando un sistema o parte deja de usarse; puede requerir probar el archivado y la restauración de datos.

El alcance depende del riesgo del cambio, del tamaño del sistema y del tamaño del cambio.`,
  },
  {
    id: 'impact',
    question: '¿Qué es el análisis de impacto? (CTFL 2.3)',
    conceptId: 'impact_analysis',
    cost: 5,
    body: `Evaluar, **antes del cambio**, qué partes del sistema se ven afectadas y qué consecuencias puede tener, para decidir **qué probar**.

- Se apoya en la trazabilidad y en conocer las dependencias.
- Es difícil si las especificaciones están desactualizadas, si no hay trazabilidad o si nadie conoce el sistema.

Ni regresión completa por miedo ni ninguna por confianza: la que el impacto justifica.`,
  },
  {
    id: 'report',
    question: '¿Qué debe tener un informe de defecto? (CTFL 5.5)',
    conceptId: 'defect_report',
    cost: 5,
    body: `Lo necesario para que otra persona lo **reproduzca** y lo pueda gestionar:

- identificador, título conciso, fecha y autor;
- **objeto de prueba y entorno con versiones**;
- contexto (caso de prueba, actividad, nivel);
- pasos para reproducirlo;
- **resultado esperado y real**;
- severidad y prioridad;
- estado y referencias.

Sin versiones, «no lo reproduzco» es la respuesta más probable.`,
  },
]
