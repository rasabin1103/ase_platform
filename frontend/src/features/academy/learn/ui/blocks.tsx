import { useEffect, useMemo, useState } from 'react'
import { Check, CircleAlert, Eye, Lightbulb, Loader2, Play, RotateCcw, X } from 'lucide-react'
import { CodeEditor } from '../../apps/karate-ide/CodeEditor'
import { RichText } from '../../ui'
import { browserRunner, TimeoutError } from '../python/browserRunner'
import type { PyRunner, PyRunResult } from '../python/core'
import { explainError } from '../python/errors'
import { gradeExercise, type GradeResult } from '../python/grade'
import type { ExampleBlock, ExerciseBlock, LearnLang, PredictBlock } from '../types'

/**
 * Bloques de una lección: ejemplo ejecutable, «¿qué imprime?» y ejercicio.
 * El texto se pinta con RichText directamente en ModulePlayer.
 */

const T = {
  es: {
    run: 'Ejecutar',
    running: 'Ejecutando…',
    loading: 'Preparando Python (solo la primera vez)…',
    restore: 'Restaurar',
    output: 'Salida',
    noOutput: '(el programa no ha escrito nada)',
    inputs: 'Lo que escribe el usuario en input() (una línea por dato)',
    timeout: 'El programa ha tardado demasiado y se ha parado. ¿Hay un bucle que no termina?',
    loadFail: 'No se ha podido cargar Python. Revisa la conexión y vuelve a intentarlo.',
    check: 'Comprobar',
    checking: 'Comprobando…',
    passed: '¡Correcto! Ejercicio superado.',
    failed: 'Todavía no: revisa lo que falla.',
    hint: 'Pista',
    moreHint: 'Otra pista',
    solution: 'Ver la solución',
    solutionNote: 'Esta es una solución posible. Escríbela tú (o cópiala) y pulsa «Comprobar».',
    got: 'Salió',
    expected: 'Se esperaba',
    predict: '¿Qué imprime?',
    right: '¡Correcto!',
    wrong: 'No es esa. Vuelve a intentarlo.',
    project: 'Tu proyecto',
    done: 'Superado',
    editor: 'Código Python',
    noHints: 'En el examen no hay pistas.',
  },
  en: {
    run: 'Run',
    running: 'Running…',
    loading: 'Getting Python ready (only the first time)…',
    restore: 'Restore',
    output: 'Output',
    noOutput: "(the program didn't write anything)",
    inputs: 'What the user types in input() (one line per value)',
    timeout: 'The program took too long and was stopped. Is there a loop that never ends?',
    loadFail: "Python couldn't be loaded. Check your connection and try again.",
    check: 'Check',
    checking: 'Checking…',
    passed: 'Correct! Exercise passed.',
    failed: 'Not yet: check what fails.',
    hint: 'Hint',
    moreHint: 'Another hint',
    solution: 'See the solution',
    solutionNote: 'This is one possible solution. Type it (or copy it) and press "Check".',
    got: 'Got',
    expected: 'Expected',
    predict: 'What does it print?',
    right: 'Correct!',
    wrong: "That's not it. Try again.",
    project: 'Your project',
    done: 'Passed',
    editor: 'Python code',
    noHints: 'There are no hints in the exam.',
  },
}

/** Borradores del alumno (comodidad local; el progreso real va en useModuleRun). */
function useDraft(key: string, initial: string): [string, (v: string) => void] {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) ?? initial
    } catch {
      return initial
    }
  })
  const set = (v: string) => {
    setValue(v)
    try {
      localStorage.setItem(key, v)
    } catch {
      // Sin almacenamiento, el borrador vive solo en memoria.
    }
  }
  return [value, set]
}

function Editor({ value, onChange, onRun, label }: { value: string; onChange: (v: string) => void; onRun?: () => void; label: string }) {
  const lines = value.split('\n').length
  const height = Math.min(Math.max(lines * 20 + 24, 120), 420)
  return (
    <div className="overflow-hidden rounded-ase-md border border-ase-border" style={{ height }}>
      <CodeEditor path="programa.py" value={value} onChange={onChange} onRun={onRun} label={label} />
    </div>
  )
}

function ErrorBox({ result, lang }: { result: PyRunResult; lang: LearnLang }) {
  if (!result.error) return null
  const e = explainError(result.error, lang)
  return (
    <div className="mt-2 rounded-ase-md border border-ase-error/40 bg-ase-error/10 p-3 text-body-sm">
      <p className="font-mono font-semibold text-ase-error">{e.title}</p>
      <p className="font-mono text-ase-text">{e.message}</p>
      {e.hint ? <p className="mt-1 text-ase-text2">{e.hint}</p> : null}
    </div>
  )
}

function Output({ text, lang }: { text: string; lang: LearnLang }) {
  const t = T[lang]
  return (
    <div className="mt-2">
      <p className="mb-1 text-caption uppercase text-ase-muted">{t.output}</p>
      <pre className="max-h-64 overflow-auto rounded-ase-md bg-black/50 p-3 font-mono text-[13px] leading-5 text-emerald-200" data-testid="py-output">
        {text || <span className="text-ase-muted">{t.noOutput}</span>}
      </pre>
    </div>
  )
}

function InputsField({ value, onChange, lang }: { value: string; onChange: (v: string) => void; lang: LearnLang }) {
  return (
    <label className="block text-caption text-ase-muted">
      {T[lang].inputs}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={Math.min(Math.max(value.split('\n').length, 1), 5)}
        className="mt-1 block w-full rounded-ase-md border border-ase-border bg-ase-bg p-2 font-mono text-body-sm text-ase-text"
      />
    </label>
  )
}

const toInputs = (s: string) => (s.trim() === '' ? [] : s.replace(/\r/g, '').split('\n'))

type RunState = { kind: 'idle' } | { kind: 'running' } | { kind: 'done'; result: PyRunResult } | { kind: 'fail'; message: string }

async function runSafe(runner: PyRunner, code: string, inputs: string[], lang: LearnLang): Promise<RunState> {
  try {
    return { kind: 'done', result: await runner.run({ code, inputs }) }
  } catch (e) {
    return { kind: 'fail', message: e instanceof TimeoutError ? T[lang].timeout : T[lang].loadFail }
  }
}

function RunPanel({ state, lang }: { state: RunState; lang: LearnLang }) {
  const t = T[lang]
  if (state.kind === 'running') return <p className="mt-2 flex items-center gap-2 text-body-sm text-ase-muted"><Loader2 className="h-4 w-4 animate-spin" /> {t.running}</p>
  if (state.kind === 'fail') return <p className="mt-2 flex items-center gap-2 text-body-sm text-ase-warning"><CircleAlert className="h-4 w-4" /> {state.message}</p>
  if (state.kind !== 'done') return null
  return (
    <>
      <Output text={state.result.stdout} lang={lang} />
      <ErrorBox result={state.result} lang={lang} />
    </>
  )
}

function useRunner(): PyRunner {
  return useMemo(() => browserRunner(), [])
}

export function ExampleView({ block, lang, draftKey }: { block: ExampleBlock; lang: LearnLang; draftKey: string }) {
  const t = T[lang]
  const runner = useRunner()
  const [code, setCode] = useDraft(draftKey, block.code)
  const [inputs, setInputs] = useState((block.inputs ?? []).join('\n'))
  const [state, setState] = useState<RunState>({ kind: 'idle' })
  const usesInput = /\binput\s*\(/.test(code)
  const run = async () => {
    setState({ kind: 'running' })
    setState(await runSafe(runner, code, toInputs(inputs), lang))
  }
  return (
    <div className="space-y-2 rounded-ase-lg border border-ase-border bg-ase-bg2 p-3" data-block={block.id}>
      {block.note ? <p className="text-body-sm text-ase-text2">{block.note}</p> : null}
      <Editor value={code} onChange={setCode} onRun={run} label={t.editor} />
      {usesInput ? <InputsField value={inputs} onChange={setInputs} lang={lang} /> : null}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={run} disabled={state.kind === 'running'} className="inline-flex items-center gap-2 rounded-ase-md bg-ase-brand px-3 py-1.5 text-body-sm font-semibold text-white hover:bg-ase-brand-strong disabled:opacity-60">
          <Play className="h-4 w-4" /> {t.run}
        </button>
        <button type="button" onClick={() => { setCode(block.code); setState({ kind: 'idle' }) }} className="inline-flex items-center gap-1 text-body-sm text-ase-muted hover:text-ase-text">
          <RotateCcw className="h-3.5 w-3.5" /> {t.restore}
        </button>
      </div>
      <RunPanel state={state} lang={lang} />
    </div>
  )
}

export function PredictView({ block, lang, passed, onPass }: { block: PredictBlock; lang: LearnLang; passed: boolean; onPass: () => void }) {
  const t = T[lang]
  const [picked, setPicked] = useState<number | null>(passed ? block.correct : null)
  const ok = picked === block.correct
  return (
    <div className="space-y-3 rounded-ase-lg border border-ase-border bg-ase-bg2 p-4" data-block={block.id}>
      <p className="flex items-center gap-2 text-label uppercase text-ase-brand">
        {t.predict} {passed ? <Check className="h-4 w-4 text-ase-success" aria-label={t.done} /> : null}
      </p>
      <pre className="overflow-x-auto rounded-ase-md bg-black/40 p-3 font-mono text-[13px] leading-5 text-ase-text">{block.code}</pre>
      <p className="text-body-sm text-ase-text">{block.question}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {block.options.map((o, i) => {
          const chosen = picked === i
          const style = chosen ? (ok ? 'border-ase-success bg-ase-success/10' : 'border-ase-error bg-ase-error/10') : 'border-ase-border hover:border-ase-brand/60'
          return (
            <button
              key={i}
              type="button"
              disabled={ok}
              onClick={() => {
                setPicked(i)
                if (i === block.correct) onPass()
              }}
              className={`rounded-ase-md border p-2 text-left transition ${style}`}
            >
              <pre className="whitespace-pre-wrap font-mono text-[13px] leading-5 text-ase-text">{o}</pre>
            </button>
          )
        })}
      </div>
      {picked !== null ? (
        <div className={`rounded-ase-md p-3 text-body-sm ${ok ? 'bg-ase-success/10' : 'bg-ase-error/10'}`}>
          <p className={`font-semibold ${ok ? 'text-ase-success' : 'text-ase-error'}`}>{ok ? t.right : t.wrong}</p>
          {ok ? <RichText text={block.explanation} /> : null}
        </div>
      ) : null}
    </div>
  )
}

export function ExerciseView({
  block,
  lang,
  passed,
  onPass,
  draftKey,
  exam,
}: {
  block: ExerciseBlock
  lang: LearnLang
  passed: boolean
  onPass: () => void
  draftKey: string
  exam?: boolean
}) {
  const t = T[lang]
  const runner = useRunner()
  const [code, setCode] = useDraft(draftKey, block.starter)
  const [inputs, setInputs] = useState((block.sampleInputs ?? []).join('\n'))
  const [state, setState] = useState<RunState>({ kind: 'idle' })
  const [grading, setGrading] = useState(false)
  const [grade, setGrade] = useState<GradeResult | null>(null)
  const [gradeFail, setGradeFail] = useState<string | null>(null)
  const [fails, setFails] = useState(0)
  const [hints, setHints] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const usesInput = /\binput\s*\(/.test(code) || (block.sampleInputs?.length ?? 0) > 0

  useEffect(() => {
    if (grade?.passed) onPass()
  }, [grade, onPass])

  const run = async () => {
    setState({ kind: 'running' })
    setState(await runSafe(runner, code, toInputs(inputs), lang))
  }
  const check = async () => {
    setGrading(true)
    setGradeFail(null)
    try {
      const g = await gradeExercise(runner, block, code)
      setGrade(g)
      if (!g.passed) setFails((n) => n + 1)
    } catch (e) {
      setGradeFail(e instanceof TimeoutError ? t.timeout : t.loadFail)
    } finally {
      setGrading(false)
    }
  }

  return (
    <div className={`space-y-3 rounded-ase-lg border p-4 ${block.project ? 'border-ase-gold/50 bg-ase-gold/5' : 'border-ase-brand/40 bg-ase-brand/5'}`} data-block={block.id}>
      <div className="flex flex-wrap items-center gap-2">
        {block.project ? <span className="rounded bg-ase-gold/20 px-2 py-0.5 text-caption font-semibold text-ase-gold">{t.project}</span> : null}
        <h3 className="font-semibold text-ase-text">{block.title}</h3>
        {passed ? (
          <span className="ml-auto inline-flex items-center gap-1 text-caption font-semibold text-ase-success">
            <Check className="h-4 w-4" /> {t.done}
          </span>
        ) : null}
      </div>
      <RichText text={block.prompt} />
      <Editor value={code} onChange={setCode} onRun={run} label={t.editor} />
      {usesInput ? <InputsField value={inputs} onChange={setInputs} lang={lang} /> : null}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={run} disabled={state.kind === 'running'} className="inline-flex items-center gap-2 rounded-ase-md border border-ase-border px-3 py-1.5 text-body-sm font-semibold text-ase-text hover:border-ase-brand disabled:opacity-60">
          <Play className="h-4 w-4" /> {t.run}
        </button>
        <button type="button" onClick={check} disabled={grading} className="inline-flex items-center gap-2 rounded-ase-md bg-ase-brand px-3 py-1.5 text-body-sm font-semibold text-white hover:bg-ase-brand-strong disabled:opacity-60">
          {grading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {grading ? t.checking : t.check}
        </button>
        {!exam && hints < block.hints.length ? (
          <button type="button" onClick={() => setHints((n) => n + 1)} className="inline-flex items-center gap-1 text-body-sm text-ase-gold hover:underline">
            <Lightbulb className="h-4 w-4" /> {hints === 0 ? t.hint : t.moreHint}
          </button>
        ) : null}
        {!exam && (fails >= 3 || hints >= block.hints.length) && !showSolution && !passed ? (
          <button type="button" onClick={() => setShowSolution(true)} className="inline-flex items-center gap-1 text-body-sm text-ase-muted hover:text-ase-text">
            <Eye className="h-4 w-4" /> {t.solution}
          </button>
        ) : null}
        <button type="button" onClick={() => { setCode(block.starter); setGrade(null); setState({ kind: 'idle' }) }} className="ml-auto inline-flex items-center gap-1 text-body-sm text-ase-muted hover:text-ase-text">
          <RotateCcw className="h-3.5 w-3.5" /> {t.restore}
        </button>
      </div>
      {hints > 0 ? (
        <ol className="space-y-1 rounded-ase-md bg-ase-gold/10 p-3 text-body-sm text-ase-text2">
          {block.hints.slice(0, hints).map((h, i) => (
            <li key={i} className="flex gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-ase-gold" />
              <RichText text={h} />
            </li>
          ))}
        </ol>
      ) : null}
      {showSolution ? (
        <div className="rounded-ase-md border border-ase-border bg-ase-bg p-3">
          <p className="mb-2 text-body-sm text-ase-text2">{t.solutionNote}</p>
          <pre className="overflow-x-auto font-mono text-[13px] leading-5 text-ase-text">{block.solution}</pre>
        </div>
      ) : null}
      <RunPanel state={state} lang={lang} />
      {gradeFail ? <p className="text-body-sm text-ase-warning">{gradeFail}</p> : null}
      {grade ? (
        <div className={`rounded-ase-md p-3 ${grade.passed ? 'bg-ase-success/10' : 'bg-ase-error/10'}`} data-testid="grade">
          <p className={`mb-2 font-semibold ${grade.passed ? 'text-ase-success' : 'text-ase-error'}`}>{grade.passed ? t.passed : t.failed}</p>
          <ul className="space-y-2 text-body-sm">
            {grade.tests.map((r, i) => (
              <li key={i}>
                <p className="flex items-center gap-2">
                  {r.ok ? <Check className="h-4 w-4 text-ase-success" /> : <X className="h-4 w-4 text-ase-error" />}
                  <span className="text-ase-text">{r.label}</span>
                </p>
                {!r.ok && r.error ? <p className="ml-6 font-mono text-caption text-ase-error">{explainError(r.error, lang).title}: {explainError(r.error, lang).message}</p> : null}
                {!r.ok && !r.error && r.message ? <p className="ml-6 text-caption text-ase-text2">{r.message}</p> : null}
                {!exam && !r.ok && !r.error && r.expected !== undefined ? (
                  <div className="ml-6 mt-1 grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-caption text-ase-muted">{t.got}</p>
                      <pre className="overflow-x-auto rounded bg-black/40 p-2 font-mono text-caption text-ase-text">{r.got || ' '}</pre>
                    </div>
                    <div>
                      <p className="text-caption text-ase-muted">{t.expected}</p>
                      <pre className="overflow-x-auto rounded bg-black/40 p-2 font-mono text-caption text-ase-text">{r.expected}</pre>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {exam ? <p className="text-caption text-ase-muted">{t.noHints}</p> : null}
    </div>
  )
}
