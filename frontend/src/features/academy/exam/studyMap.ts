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

/** Cursos que tienen simulacro y cómo se anuncia en la ficha. */
export const EXAM_COURSES: Record<string, { title: string; titleEn: string; label: string; labelEn: string }> = {
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
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
