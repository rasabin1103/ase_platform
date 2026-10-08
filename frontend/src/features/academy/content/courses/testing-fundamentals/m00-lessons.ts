import type { Lesson } from '../../../engine/types'

/**
 * Microlecciones de Laura (misión 0). Enseñan la técnica con ejemplos
 * ajenos a Kobalto para que el alumno la aplique él mismo, sin regalarle
 * los bugs.
 */
export const m00Lessons: Lesson[] = [
  {
    id: 'start',
    question: '¿Por dónde empiezo a probar una historia?',
    conceptId: 'static_testing',
    cost: 5,
    body: `Antes de tocar la app, **lee la historia y sus criterios de aceptación** como si fueras a explicárselos a otra persona.

- Subraya todo lo ambiguo: «válido», «correcto», «los límites»… Si no sabes qué significa exactamente, no sabrás si algo es un bug.
- **Pregunta a la PO** y deja la respuesta escrita en el ticket. Eso es testing estático: encontrar defectos en el requisito, cuando arreglarlos cuesta casi nada.
- Revisa si la documentación está al día: una especificación vieja te hará reportar falsos bugs.
- Después, **diseña tus casos** y solo entonces ejecuta.`,
  },
  {
    id: 'partitions',
    question: '¿Cómo elijo qué valores probar?',
    conceptId: 'equivalence',
    cost: 5,
    body: `No se trata de probar muchos valores, sino de probar **uno de cada grupo** que el sistema debería tratar igual: eso son las particiones de equivalencia.

Ejemplo: un campo «edad» que admite de 18 a 65 años.
- Partición válida: 18–65 → prueba 30.
- Inválidas: menores de 18 (prueba 10), mayores de 65 (prueba 80).
- Y las que nadie piensa: 0, negativos, decimales, texto, vacío, otros formatos de escritura.

Piensa también en **cómo escribe un usuario real**: separadores, espacios, mayúsculas, copiar y pegar.`,
  },
  {
    id: 'boundaries',
    question: '¿Qué son los valores límite?',
    conceptId: 'boundary_values',
    cost: 5,
    body: `Los errores se concentran en los **bordes** de las particiones, porque ahí es donde el desarrollador elige entre «>» y «>=».

Con la edad de 18 a 65:
- Prueba **17, 18** (borde inferior) y **65, 66** (borde superior).
- Si hay decimales, el borde es más fino: 65,00 y 65,01.

Para cada límite que encuentres en los criterios (importes, longitudes, acumulados del día…), prueba **justo en el límite y justo fuera**.`,
  },
  {
    id: 'bug_report',
    question: '¿Cómo escribo un buen bug report?',
    conceptId: 'bug_anatomy',
    cost: 5,
    body: `Un bug que el desarrollador no puede reproducir, para el equipo no existe.

- **Título**: qué falla y dónde. «Transferencias: X ocurre al hacer Y», no «no funciona».
- **Pasos**: numerados, uno por línea, con los datos exactos que usaste.
- **Esperado** y **obtenido**: según el criterio de aceptación, no según tu opinión.
- **Severidad** según la escala del equipo.
- **Evidencia**: la ejecución o el log donde se ve.`,
  },
  {
    id: 'severity',
    question: '¿Severidad o prioridad?',
    conceptId: 'severity_priority',
    cost: 5,
    body: `- **Severidad**: el impacto del fallo en el cliente o en el negocio. En un banco, todo lo que mueve dinero de forma incorrecta es crítico.
- **Prioridad**: la urgencia para arreglarlo, que decide el equipo según calendario y riesgo.

Un error tipográfico en la portada el día de la demo puede ser de severidad baja y prioridad alta. Tú propones la severidad con argumentos; la prioridad se negocia.`,
  },
  {
    id: 'risk',
    question: 'No me da tiempo a probarlo todo, ¿qué hago?',
    conceptId: 'risk_based',
    cost: 5,
    body: `Probar todo es imposible, así que se **prioriza por riesgo**: riesgo = **probabilidad** de que falle × **impacto** si falla.

- Alta probabilidad: lógica nueva o compleja, validaciones con números, cosas que «el dev probó en local».
- Alto impacto: dinero, datos, seguridad, normativa, lo que se enseña en la demo.

Empieza por lo que puntúa alto en las dos y **dilo en voz alta**: «hoy cubro X e Y; Z queda sin probar». Esconder lo que no has probado es peor que no probarlo.`,
  },
  {
    id: 'retest',
    question: 'Me dicen que ya está arreglado, ¿qué hago?',
    conceptId: 'regression',
    cost: 5,
    body: `Dos cosas, siempre en el **build nuevo**:

1. **Re-test**: repite exactamente el caso que falló. Si sigue fallando, reábrelo con la nueva evidencia.
2. **Regresión**: repite también los casos relacionados que antes **pasaban**. Un cambio en una validación puede romper la de al lado.

Nunca cierres un bug porque «el dev dice que está». QA abre y QA cierra.`,
  },
  {
    id: 'environments',
    question: '¿Puedo probar en producción?',
    conceptId: 'test_environments',
    cost: 5,
    body: `En general, **no**. Para eso existen los entornos de desarrollo y **staging** (preproducción).

En sectores regulados como la banca, una operación de prueba en producción mueve dinero real, queda en auditoría y puede afectar a clientes. Si staging se cae, avisa, aprovecha para diseñar casos o pide un entorno alternativo.`,
  },
]
