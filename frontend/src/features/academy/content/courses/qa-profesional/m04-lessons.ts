import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 2 · misión 4). Temario CTFL 4.4. */
export const m04Lessons: Lesson[] = [
  {
    id: 'experience',
    question: '¿Qué son las técnicas basadas en la experiencia? (CTFL 4.4)',
    conceptId: 'experience_based',
    cost: 5,
    body: `Usan el **conocimiento y la experiencia** de testers, desarrolladores y usuarios para diseñar, implementar y ejecutar pruebas.

Las tres del temario:
- **Predicción de errores** (*error guessing*).
- **Pruebas exploratorias**.
- **Pruebas basadas en listas de comprobación**.

Encuentran defectos que las técnicas sistemáticas pueden pasar por alto, pero su eficacia **depende de quién las aplique**. Por eso **complementan**, no sustituyen, a la caja negra y la caja blanca.`,
  },
  {
    id: 'guessing',
    question: '¿Cómo se aplica la predicción de errores? (CTFL 4.4.1)',
    conceptId: 'error_guessing',
    cost: 5,
    body: `Se anticipan **errores, defectos y fallos** a partir de lo que sabemos sobre:

- cómo ha funcionado (y fallado) la aplicación antes;
- los errores típicos de los desarrolladores;
- los fallos que han tenido aplicaciones parecidas.

Una forma metódica son los **ataques de fallos**: una lista de ataques (campos vacíos, valores fuera de rango, caracteres especiales, doble envío, sesión caducada…) que se aplican donde más daño harían.`,
  },
  {
    id: 'exploratory',
    question: '¿Qué hace que una exploración no sea «ir clicando»? (CTFL 4.4.2)',
    conceptId: 'exploratory',
    cost: 5,
    body: `En las pruebas exploratorias se **diseñan, ejecutan y evalúan las pruebas a la vez** mientras se aprende del objeto de prueba.

Para que sean gestionables se hacen **por sesiones**:
- **Charter**: objetivo de la sesión («explorar X con Y para descubrir Z»).
- **Timebox**: tiempo limitado.
- **Notas** durante la sesión.
- **Informe de sesión**: qué se cubrió, qué se encontró, qué queda pendiente.

Son útiles con **especificaciones pobres** o **mucha presión de tiempo**, y se benefician de testers con experiencia y conocimiento del dominio.`,
  },
  {
    id: 'checklist',
    question: '¿Para qué sirve una checklist y cuál es su límite? (CTFL 4.4.3)',
    conceptId: 'checklist_based',
    cost: 5,
    body: `Una **lista de comprobación** recoge condiciones que hay que verificar, basadas en la experiencia, en lo que importa al usuario o en por qué y cómo falla el software.

- Da **consistencia** y sirve de guía cuando no hay casos detallados.
- Sus elementos deben ser comprobables y no tan generales que no aporten.
- **Hay que mantenerla viva**: con el tiempo deja de encontrar defectos (como la paradoja del pesticida) y no sabe nada de lo nuevo.`,
  },
  {
    id: 'session_report',
    question: '¿Qué debe llevar el informe de una sesión exploratoria?',
    conceptId: 'exploratory',
    cost: 5,
    body: `- El **charter** y el tiempo realmente usado.
- Qué **áreas y ataques** se cubrieron.
- Los **defectos** encontrados (y reportados con evidencia).
- Las **dudas** y lo que **queda por explorar**: la entrada de la siguiente sesión.

Sin informe, la exploración no se puede seguir, medir ni repartir entre el equipo.`,
  },
  {
    id: 'decide',
    question: '¿Cómo uso lo que encuentro para decidir un go/no-go?',
    conceptId: 'experience_based',
    cost: 5,
    body: `No basta con contar bugs: hay que valorar el **riesgo** de cada uno.

- ¿Afecta a lo que **más usan** los clientes?
- ¿Hay **pérdida de dinero o de datos**?
- ¿Hay alternativa o se puede contener?

Un solo bug crítico en una operación clave puede justificar un no-go; cinco bugs cosméticos, no.`,
  },
]
