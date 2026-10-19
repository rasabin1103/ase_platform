import { backendScript } from './support'

/** Alumnos E2E nuevos (uno por curso e idioma) con acceso a los cursos. */
export default function globalSetup() {
  const users = JSON.parse(backendScript('seed')) as { course: string; lang: string; email: string }[]
  console.log(`[e2e] ${users.length} alumnos preparados`)
}
