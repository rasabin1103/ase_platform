/**
 * Dónde repasar cada sección del temario CTFL en cada curso: el informe del
 * simulacro enlaza las secciones flojas con su misión (ver la tabla de
 * cobertura de docs/academy/qa-profesional/PLAN.md §5).
 */
const STUDY_MAP: Record<string, Record<string, string>> = {
  'qa-profesional': {
    '1.1': 'm00-equipo',
    '1.2': 'm00-equipo',
    '1.3': 'm00-equipo',
    '1.4': 'm00-equipo',
    '1.5': 'm00-equipo',
    '2.1': 'm02-gherkin',
    '2.2': 'm03-cobertura',
    '2.3': 'm07-configuracion',
    '3.1': 'm01-inspeccion',
    '3.2': 'm01-inspeccion',
    '4.1': 'm02-gherkin',
    '4.2': 'm02-gherkin',
    '4.3': 'm03-cobertura',
    '4.4': 'm04-exploratoria',
    '4.5': 'm02-gherkin',
    '5.1': 'm05-plan',
    '5.2': 'm05-plan',
    '5.3': 'm06-metricas',
    '5.4': 'm07-configuracion',
    '5.5': 'm07-configuracion',
    '6.1': 'm08-herramientas',
    '6.2': 'm08-herramientas',
  },
  // Evaluación final de Karate: bloques 1–5 (en el banco, 11–15).
  'karate-framework': {
    '1.1': 'm00-hola-karate',
    '1.2': 'm01-match',
    '2.1': 'm02-config',
    '2.2': 'm03-payloads',
    '2.3': 'm04-datos',
    '3.1': 'm05-auth',
    '3.2': 'm05-auth',
    '4.1': 'm06-errores',
    '4.2': 'm07-mocks',
    '5.1': 'm08-pipeline',
    '5.2': 'm09-framework',
  },
  // Evaluación situacional de gestión: un bloque por rol (en el banco, 21–26) y una sección por misión.
  'gestion-equipos-qa': {
    '1.1': 'm00-la-firma',
    '1.2': 'm01-cuello-botella',
    '2.1': 'm02-suite',
    '2.2': 'm03-junior',
    '3.1': 'm04-estandar',
    '3.2': 'm05-comprar',
    '4.1': 'm06-primer-equipo',
    '4.2': 'm07-conversacion',
    '5.1': 'm08-contratar',
    '5.2': 'm09-recortes',
    '6.1': 'm10-incidente',
    '6.2': 'm11-estrategia',
  },
  // Test final de SQL: un bloque por pareja de misiones (en el banco, 31–35) y una sección por misión.
  'sql-iniciacion': {
    '1.1': 'm00-primera-consulta',
    '1.2': 'm01-filtrar',
    '2.1': 'm02-ordenar',
    '2.2': 'm03-nulos',
    '3.1': 'm04-contar',
    '3.2': 'm05-agrupar',
    '4.1': 'm06-join',
    '4.2': 'm07-left-join',
    '5.1': 'm08-modificar',
    '5.2': 'm09-crear-tabla',
  },
  // Test final de SQL intermedio: bloques 41–45 en el banco, una sección por misión.
  'sql-intermedio': {
    '1.1': 'm00-subconsultas',
    '1.2': 'm01-cte',
    '2.1': 'm02-fechas-textos',
    '2.2': 'm03-conjuntos',
    '3.1': 'm04-informes',
    '3.2': 'm05-ranking',
    '4.1': 'm06-tendencias',
    '4.2': 'm07-cruces',
    '5.1': 'm08-calidad',
    '5.2': 'm09-vistas',
  },
  'testing-fundamentals': {
    '1.1': 'm00-primer-dia',
    '1.2': 'm00-primer-dia',
    '1.3': 'm00-primer-dia',
    '2.2': 'm06-piramide',
    '3.1': 'm01-historia-ambigua',
    '4.1': 'm02-simulador-prestamos',
    '4.2': 'm02-simulador-prestamos',
    '5.2': 'm05-release',
    '5.5': 'm04-reportar',
  },
}

export function studyMissionFor(courseKey: string, section: string): string | null {
  return STUDY_MAP[courseKey]?.[section] ?? null
}

/** Cursos que tienen simulacro y cómo se anuncia en la ficha. `disclaimer` sustituye al aviso de ISTQB® en los cursos que no preparan ese examen. */
export const EXAM_COURSES: Record<string, { title: string; titleEn: string; label: string; labelEn: string; disclaimer?: string; disclaimerEn?: string }> = {
  'qa-profesional': {
    title: 'Simulacro de examen CTFL',
    titleEn: 'CTFL mock exam',
    label: 'Simulacro de examen CTFL v4.0 (40 preguntas, 60 min) y certificado de finalización',
    labelEn: 'CTFL v4.0 mock exam (40 questions, 60 min) and completion certificate',
  },
  'karate-framework': {
    title: 'Evaluación final teórica',
    titleEn: 'Final theory assessment',
    label: 'Evaluación final: teórica (30 preguntas, 45 min) y examen práctico en el IDE; certificado de finalización',
    labelEn: 'Final assessment: theory (30 questions, 45 min) and a hands-on exam in the IDE; completion certificate',
  },
  'testing-fundamentals': {
    title: 'Evaluación final',
    titleEn: 'Final assessment',
    label: 'Evaluación final (20 preguntas, 30 min) y certificado de finalización',
    labelEn: 'Final assessment (20 questions, 30 min) and completion certificate',
  },
  'gestion-equipos-qa': {
    title: 'Evaluación situacional final',
    titleEn: 'Final situational assessment',
    label: 'Evaluación situacional final (30 casos, 5 por rol, 45 min) con informe por rol y certificado de finalización',
    labelEn: 'Final situational assessment (30 cases, 5 per role, 45 min) with a per-role report and completion certificate',
    disclaimer: 'Certificado de finalización de ASE Academy. No es una certificación oficial de ninguna entidad. Los casos son originales de ASE Academy.',
    disclaimerEn: 'ASE Academy certificate of completion. It is not an official certification from any body. All cases are original ASE Academy content.',
  },
  'sql-iniciacion': {
    title: 'Test final',
    titleEn: 'Final test',
    label: 'Evaluación final: examen práctico en la consola SQL y test (30 preguntas, 40 min); certificado de finalización',
    labelEn: 'Final assessment: a hands-on exam in the SQL console and a test (30 questions, 40 min); completion certificate',
    disclaimer: 'Certificado de finalización de ASE Academy. No es una certificación oficial de ninguna entidad.',
    disclaimerEn: 'ASE Academy certificate of completion. It is not an official certification from any body.',
  },
  'sql-intermedio': {
    title: 'Test final',
    titleEn: 'Final test',
    label: 'Evaluación final: examen práctico en la consola SQL y test (30 preguntas, 40 min); certificado de finalización',
    labelEn: 'Final assessment: a hands-on exam in the SQL console and a test (30 questions, 40 min); completion certificate',
    disclaimer: 'Certificado de finalización de ASE Academy. No es una certificación oficial de ninguna entidad.',
    disclaimerEn: 'ASE Academy certificate of completion. It is not an official certification from any body.',
  },
}

/** Aviso propio del curso (si lo tiene) en el idioma pedido. */
export function examDisclaimer(courseKey: string, lang: 'es' | 'en'): string | null {
  const info = EXAM_COURSES[courseKey]
  return (lang === 'en' ? info?.disclaimerEn : info?.disclaimer) ?? null
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Textos propios de la evaluación de un curso, que sustituyen a los del
 * simulacro de examen (pensados para CTFL: «reparto oficial por capítulo»,
 * «como en el examen real»…). Solo se indican los que cambian.
 */
type CopyOverride = Record<string, unknown> & { cards?: Record<string, unknown> }
const EXAM_COPY: Record<string, Record<'es' | 'en', CopyOverride>> = {
  'gestion-equipos-qa': {
    es: {
      backToExam: 'Volver a la evaluación',
      forbidden: 'La evaluación está incluida en el curso completo.',
      startError: 'No se pudo empezar la evaluación. Inténtalo de nuevo.',
      intro:
        'Casos de juicio situacional: en cada uno eliges qué harías desde el rol que se indica. Cinco casos por rol, tiempo limitado y corrección al entregar, con un informe por rol y la misión que repasar.',
      signInPrompt: 'Inicia sesión para hacer la evaluación y guardar tus resultados.',
      includedInFull: 'La evaluación y el certificado están incluidos en el curso completo.',
      inProgress: 'Tienes una evaluación en curso. El tiempo sigue corriendo.',
      extended: (ext: number, min: number) => `Quiero el tiempo ampliado (${ext} minutos en lugar de ${min}).`,
      newExam: 'Nueva evaluación',
      startExam: 'Empezar la evaluación',
      retry: 'Nueva evaluación',
      byChapter: 'Por rol',
      howTo: 'Se obtiene al aprobar la evaluación y terminar todas las misiones del curso.',
      cards: {
        questions: 'Casos',
        questionsHint: 'Una respuesta por caso',
        timeHint: (n: number) => `${n} min con tiempo ampliado`,
        bestHint: (n: number) => `${n} evaluaciones distintas sin repetir`,
        distribution: 'Reparto por rol',
      },
    },
    en: {
      backToExam: 'Back to the assessment',
      forbidden: 'The assessment is included in the full course.',
      startError: "The assessment couldn't be started. Please try again.",
      intro:
        'Situational judgement cases: in each one you choose what you would do in the given role. Five cases per role, a time limit and scoring on submission, plus a per-role report and the mission to review.',
      signInPrompt: 'Sign in to take the assessment and save your results.',
      includedInFull: 'The assessment and the certificate are included in the full course.',
      inProgress: 'You have an assessment in progress. The clock is still running.',
      extended: (ext: number, min: number) => `I want extended time (${ext} minutes instead of ${min}).`,
      newExam: 'New assessment',
      startExam: 'Start the assessment',
      retry: 'New assessment',
      byChapter: 'By role',
      howTo: 'You earn it by passing the assessment and completing every mission of the course.',
      cards: {
        questions: 'Cases',
        questionsHint: 'One answer per case',
        timeHint: (n: number) => `${n} min with extended time`,
        bestHint: (n: number) => `${n} distinct assessments without repeats`,
        distribution: 'Distribution by role',
      },
    },
  },
}

// El test final de SQL usa los mismos textos que la evaluación de gestión, salvo los que hablan de casos y roles.
EXAM_COPY['sql-iniciacion'] = {
  es: {
    ...EXAM_COPY['gestion-equipos-qa'].es,
    backToExam: 'Volver al test final',
    forbidden: 'El test final está incluido en el curso completo.',
    startError: 'No se pudo empezar el test. Inténtalo de nuevo.',
    intro:
      'Preguntas sobre consultas reales: qué devuelve una consulta, qué falla en ella o cuál es la correcta. Seis por bloque del curso, tiempo limitado y corrección al entregar, con un informe por bloque y la misión que repasar. El certificado exige también aprobar el examen práctico (la última misión).',
    signInPrompt: 'Inicia sesión para hacer el test y guardar tus resultados.',
    includedInFull: 'El test final y el certificado están incluidos en el curso completo.',
    inProgress: 'Tienes un test en curso. El tiempo sigue corriendo.',
    newExam: 'Nuevo test',
    startExam: 'Empezar el test',
    retry: 'Nuevo test',
    byChapter: 'Por bloque',
    howTo: 'Se obtiene al aprobar el test, aprobar el examen práctico y terminar todas las misiones del curso.',
    cards: {
      questions: 'Preguntas',
      questionsHint: 'Una respuesta por pregunta',
      timeHint: (n: number) => `${n} min con tiempo ampliado`,
      bestHint: (n: number) => `${n} tests distintos sin repetir`,
      distribution: 'Reparto por bloque',
    },
  },
  en: {
    ...EXAM_COPY['gestion-equipos-qa'].en,
    backToExam: 'Back to the final test',
    forbidden: 'The final test is included in the full course.',
    startError: "The test couldn't be started. Please try again.",
    intro:
      'Questions about real queries: what a query returns, what is wrong with it or which one is correct. Six per course block, a time limit and scoring on submission, plus a per-block report and the mission to review. The certificate also requires passing the hands-on exam (the last mission).',
    signInPrompt: 'Sign in to take the test and save your results.',
    includedInFull: 'The final test and the certificate are included in the full course.',
    inProgress: 'You have a test in progress. The clock is still running.',
    newExam: 'New test',
    startExam: 'Start the test',
    retry: 'New test',
    byChapter: 'By block',
    howTo: 'You earn it by passing the test and the hands-on exam and completing every mission of the course.',
    cards: {
      questions: 'Questions',
      questionsHint: 'One answer per question',
      timeHint: (n: number) => `${n} min with extended time`,
      bestHint: (n: number) => `${n} distinct tests without repeats`,
      distribution: 'Distribution by block',
    },
  },
}

/** Copia de `base` con los textos propios del curso (solo las claves que ya existen en `base`). */
export function withExamCopy<T extends Record<string, unknown>>(base: T, courseKey: string, lang: 'es' | 'en'): T {
  const override = EXAM_COPY[courseKey]?.[lang]
  if (!override) return base
  const pick = (target: Record<string, unknown>, source: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(source).filter(([k]) => k in target && k !== 'cards'))
  const merged: Record<string, unknown> = { ...base, ...pick(base, override) }
  if (override.cards && typeof base.cards === 'object' && base.cards) merged.cards = { ...(base.cards as Record<string, unknown>), ...pick(base.cards as Record<string, unknown>, override.cards) }
  return merged as T
}

// SQL intermedio usa los mismos textos que el test final de SQL desde cero.
EXAM_COPY['sql-intermedio'] = EXAM_COPY['sql-iniciacion']
