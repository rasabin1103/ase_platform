import { expect, test, type Page, type Response } from '@playwright/test'
import { ACADEMY_COURSES, PENDING_TRANSLATION } from '../src/features/academy/content/courseList'
import { M10_SOLUTION } from '../src/features/academy/content/courses/karate-framework/m10-lab'
import { M10_SQL_ANSWERS } from '../src/features/academy/content/courses/sql-iniciacion/m10-examen'
import { E2E_PASSWORD, backendScript, emailFor } from './support'

/**
 * ASE Academy de principio a fin, en el navegador, como un alumno: cada curso
 * en español y en inglés.
 *
 *   iniciar sesión → jugar TODAS las misiones del curso hasta su debrief
 *   (diagnóstico, jornada, reunión de cierre, comprobación final) → la
 *   evaluación final aprobada → el certificado verificable y su PDF.
 *
 * En cada misión se contesta a las reuniones y se termina el día: se
 * comprueba que el curso se puede completar, no que se saque buena nota. El
 * examen práctico de Karate se resuelve en el IDE con la solución de
 * referencia (8 retos = 80/100, aprueba con 70), y el de SQL, en la consola
 * con PostgreSQL real (10 encargos = 100/100). Las respuestas correctas de
 * la evaluación teórica las da scripts/e2e_academy.py leyendo el intento.
 */

type Lang = 'es' | 'en'
const LANGS: Lang[] = ['es', 'en']

const T = {
  start: /^(Hacer el diagnóstico|Take the diagnostic|Empezar la jornada|Start the day)/,
  endDay: /^(Terminar el día|End the day)$/,
  results: /^(Ver mis resultados|See my results)/,
  debrief: /^(Repetir con otras decisiones|Replay with other decisions)$/,
  cookies: /^(Entendido|Got it|Aceptar|Accept)$/,
  skipSurvey: /^(Omitir por ahora|Skip for now)$/,
  ide: /^(IDE Karate|Karate IDE)/,
  newFile: /^(Nuevo fichero|New file)$/,
  create: /^(Crear|Create)$/,
  run: /^(Ejecutar|Run)$/,
  allRetos: /^(Retos|Challenges) 8\/8/,
  startExam: /^(Empezar simulacro|Start mock exam|Nuevo simulacro|New mock exam|Empezar la evaluación|Nueva evaluación|Start the assessment|New assessment)/,
  submit: /^(Entregar|Submit)$/,
  submitAndSee: /^(Entregar y ver resultado|Submit and see result)$/,
  passed: /^(Aprobado|Passed)$/,
  viewCert: /^(Ver certificado|View certificate)$/,
}

async function dismissOverlays(page: Page) {
  for (const name of [T.cookies, T.skipSurvey]) {
    const b = page.getByRole('button', { name }).first()
    if (await b.isVisible()) await b.click({ timeout: 5_000 }).catch(() => {})
  }
}

async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.locator('#login-email').fill(email)
  await page.locator('#login-password').fill(E2E_PASSWORD)
  await page.locator('#login-password').press('Enter')
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 })
  await dismissOverlays(page)
}

async function answerVisibleQuiz(page: Page) {
  const groups = page.getByRole('radiogroup')
  const n = await groups.count()
  for (let i = 0; i < n; i++) await groups.nth(i).getByRole('radio').first().click()
}

/** Examen práctico de Karate: la solución de referencia en el IDE, ejecutada y en el pipeline nocturno. */
async function solvePracticalExam(page: Page, lang: Lang) {
  await page.getByRole('navigation').getByRole('button', { name: T.ide }).click()
  const root = 'src/test/java/'
  for (const [file, content] of Object.entries(M10_SOLUTION)) {
    const name = file.split('/').pop()!
    if (!(await page.getByRole('button', { name, exact: true }).count())) {
      await page.getByRole('button', { name: T.newFile }).click()
      await page.locator('#ide-new-file').fill(file.startsWith(root) ? file.slice(root.length) : file)
      await page.getByRole('button', { name: T.create }).click()
    }
    await page.getByRole('button', { name, exact: true }).click()
    await page.getByLabel(lang === 'en' ? `Code of ${file}` : `Código de ${file}`).fill(content)
  }
  await page.getByRole('button', { name: T.run, exact: true }).click()
  await closeMeetings(page)
  await page.getByLabel(lang === 'en' ? 'Pipeline job' : 'Job del pipeline').selectOption('nightly')
  await page.getByRole('button', { name: 'Pipeline', exact: true }).click()
  await closeMeetings(page)
  await expect(page.getByRole('tab', { name: T.allRetos })).toBeVisible()
}

/** Examen práctico de SQL: las respuestas de referencia, una ejecución por encargo, en la consola. */
async function solveSqlExam(page: Page) {
  await page.getByRole('navigation').getByRole('button', { name: /^Consola SQL/ }).click()
  await expect(page.getByText('Arrancando PostgreSQL')).toHaveCount(0, { timeout: 90_000 })
  for (const [i, sql] of M10_SQL_ANSWERS.entries()) {
    await page.getByLabel('Consulta SQL').fill(sql)
    await page.getByRole('button', { name: /^Ejecutar ·/ }).click()
    await closeMeetings(page)
    await expect(page.getByText(`Encargos: ${i + 1}/${M10_SQL_ANSWERS.length}`)).toBeVisible({ timeout: 30_000 })
  }
}

async function closeMeetings(page: Page) {
  for (let i = 0; i < 10 && (await page.getByRole('dialog').count()); i++) {
    await page.getByRole('dialog').locator('button:not([disabled])').first().click()
    await page.waitForTimeout(300)
  }
}

/** Una misión de «Empezar» a su debrief. */
async function playMission(page: Page, course: string, missionId: string, lang: Lang) {
  // La partida terminada tiene que quedar guardada en el servidor: es lo que cuenta para el certificado.
  let savedFinished = 0
  const onResponse = (r: Response) => {
    if (
      r.ok() &&
      r.request().method() === 'PUT' &&
      r.url().includes(`/academy/runs/${course}/${missionId}`) &&
      (r.request().postDataJSON() as { finished?: boolean } | null)?.finished === true
    )
      savedFinished++
  }
  page.on('response', onResponse)
  await page.goto(`/academy/${course}/${missionId}`)
  await dismissOverlays(page)
  let examSolved = false
  // Sin progreso visible durante este tiempo = atascada (con margen para el servidor de desarrollo cargando).
  const STUCK_MS = 120_000
  let lastProgress = Date.now()
  for (let i = 0; i < 1000; i++) {
    if (await page.getByRole('button', { name: T.debrief }).count()) {
      await expect
        .poll(() => savedFinished, {
          message: `${course}/${missionId}: no se guardó la partida terminada`,
          timeout: 30_000,
        })
        .toBeGreaterThan(0)
      page.off('response', onResponse)
      return
    }
    if (await page.getByRole('dialog').count()) {
      await closeMeetings(page)
      lastProgress = Date.now()
      continue
    }
    const start = page.getByRole('button', { name: T.start })
    if (await start.count()) {
      await start.first().click()
      await answerVisibleQuiz(page)
      lastProgress = Date.now()
      continue
    }
    const endDay = page.getByRole('button', { name: T.endDay })
    if (await endDay.count()) {
      if (missionId === 'm10-examen' && !examSolved) {
        if (course === 'sql-iniciacion') await solveSqlExam(page)
        else await solvePracticalExam(page, lang)
        examSolved = true
      }
      await endDay.click() // el confirm del navegador se acepta solo (page.on('dialog'))
      lastProgress = Date.now()
      continue
    }
    const results = page.getByRole('button', { name: T.results })
    if (await results.count()) {
      await answerVisibleQuiz(page)
      await results.click()
      lastProgress = Date.now()
      continue
    }
    if (Date.now() - lastProgress > STUCK_MS) break
    await page.waitForTimeout(500)
  }
  throw new Error(`${course}/${missionId} (${lang}): la misión se quedó atascada antes del debrief`)
}

async function passFinalExam(page: Page, course: string, email: string, missions: number) {
  await page.goto(`/academy/${course}/simulacro`)
  await dismissOverlays(page)
  await expect(
    page.getByText(
      new RegExp(`(Misiones terminadas: ${missions} de ${missions}|Missions completed: ${missions} of ${missions})`),
    ),
  ).toBeVisible()
  await page.getByRole('button', { name: T.startExam }).click()
  await expect(page.getByRole('button', { name: T.submit })).toBeVisible()
  const answers = JSON.parse(backendScript('answers', email, course)) as number[]
  for (const option of answers) {
    await page.keyboard.press(String(option))
    await page.keyboard.press('ArrowRight')
  }
  await page.getByRole('button', { name: T.submit }).first().click()
  await page.getByRole('button', { name: T.submitAndSee }).click()
  await expect(page.getByText(T.passed).first()).toBeVisible()
}

test.describe.configure({ mode: 'parallel' })

// Solo los cursos terminados: todas las misiones jugables y con evaluación
// final (los cursos en construcción no tienen certificado). Los que aún no
// están traducidos, solo en español.
const FINISHED_COURSES = ACADEMY_COURSES.filter((c) => c.missions.every((m) => m.available))

for (const course of FINISHED_COURSES) {
  for (const lang of PENDING_TRANSLATION.has(course.key) ? (['es'] as Lang[]) : LANGS) {
    test(`${course.key} (${lang}): todas las misiones, evaluación final y certificado`, async ({ page, context }) => {
      const email = emailFor(course.key, lang)
      await context.addInitScript((l) => localStorage.setItem('ase_language', l), lang)
      page.on('dialog', (d) => void d.accept())

      await login(page, email)

      // La página del curso lista todas sus misiones.
      await page.goto(`/academy/${course.key}`)
      await dismissOverlays(page)

      for (const m of course.missions) {
        await test.step(`misión ${m.id}`, () => playMission(page, course.key, m.id, lang))
      }

      await test.step('evaluación final', () => passFinalExam(page, course.key, email, course.missions.length))

      await test.step('certificado', async () => {
        await page
          .getByRole('link', { name: T.viewCert })
          .or(page.getByRole('button', { name: T.viewCert }))
          .first()
          .click()
        await expect(page).toHaveURL(/\/academy\/certificado\/ASE-[A-Z]+-/)
        const code = decodeURIComponent(page.url().split('/').pop()!)
        await expect(page.getByText('Alumna E2E').first()).toBeVisible()
        await expect(page.getByText(code).first()).toBeVisible()
        const pdf = await page.request.get(`/api/v1/academy/certificates/verify/${code}/pdf?lang=${lang}`)
        expect(pdf.status()).toBe(200)
        expect(pdf.headers()['content-type']).toContain('application/pdf')
      })
    })
  }
}
