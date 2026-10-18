import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, ChevronDown, Circle, FileCode2, FileJson2, FilePlus2, GitBranch, Lock, Play, RotateCcw, Sparkles, Trash2, XCircle } from 'lucide-react'
import type { RunState } from '../../engine/types'
import { missionLang, tr, type AcademyLang } from '../../i18n'
import type { RunResult, ScenarioResult } from '../../karate/runner'
import type { ToolProps } from '../../tools/types'
import { CodeEditor, type CodeEditorHandle } from './CodeEditor'
import { ideState, labEnv, newFileError, runLab, smellText, visibleRetos, type PipelineSummary } from './ideLogic'

type Props = ToolProps & { stateRef?: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Panel = 'retos' | 'informe' | 'consola'

// Borradores sin ejecutar: sobreviven a cambiar de herramienta y a recargar.
const DRAFTS = new Map<string, Record<string, string>>()
const draftKey = (courseKey: string, missionId: string, seed: number) => `ase_karate_draft:${courseKey}:${missionId}:${seed}`

function loadDraft(key: string): Record<string, string> | null {
  const mem = DRAFTS.get(key)
  if (mem) return mem
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Record<string, string>) : null
  } catch {
    return null
  }
}

function saveDraft(key: string, files: Record<string, string>) {
  DRAFTS.set(key, files)
  try {
    localStorage.setItem(key, JSON.stringify(files))
  } catch {
    // Sin almacenamiento local el borrador vive solo en memoria.
  }
}

/** Contenido inicial de un fichero nuevo según su extensión. */
function template(path: string): string {
  if (path.endsWith('.feature')) return 'Feature: \n\n  Scenario: \n'
  if (path.endsWith('.json')) return '{\n}\n'
  return 'function fn() {\n}\n'
}

/** **negrita** y `código` en los textos de los retos. */
function rich(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) =>
    p.startsWith('**') ? (
      <strong key={i} className="font-semibold text-slate-100">
        {p.slice(2, -2)}
      </strong>
    ) : p.startsWith('`') ? (
      <code key={i} className="rounded bg-white/10 px-1 py-px font-mono text-[12px] text-amber-200">
        {p.slice(1, -1)}
      </code>
    ) : (
      p
    ),
  )
}

/** IDE de Karate: editor, ejecución contra la API simulada, retos, informe y consola. */
export function KarateIdeApp({ mission, state, dispatch }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const model = mission.codeLab!
  const saved = ideState(model, state)
  const key = draftKey(mission.courseKey, mission.id, state.seed)
  const [files, setFiles] = useState<Record<string, string>>(() => loadDraft(key) ?? saved.files)
  const paths = useMemo(() => {
    const base = model.files.map((f) => f.path)
    const own = Object.keys(files).filter((p) => !base.includes(p)).sort()
    return [...base, ...own]
  }, [model.files, files])
  const [creating, setCreating] = useState(false)
  const [newPath, setNewPath] = useState('')
  const [newError, setNewError] = useState<string | null>(null)
  const [active, setActive] = useState(() => model.files.find((f) => f.path.endsWith('.feature'))?.path ?? paths[0])
  const [panel, setPanel] = useState<Panel>('retos')
  const [envId, setEnvId] = useState(() => labEnv(model).id)
  const [result, setResult] = useState<RunResult | null>(null)
  const [jobId, setJobId] = useState(() => model.pipeline?.jobs[0]?.id ?? '')
  const [pipe, setPipe] = useState<PipelineSummary | null>(null)
  const [newRetos, setNewRetos] = useState<string[]>([])
  const [confirmReset, setConfirmReset] = useState(false)
  const editor = useRef<CodeEditorHandle>(null)
  const retos = visibleRetos(mission, state)
  const done = retos.filter((r) => state.flags[`reto.${r.id}`]).length
  const finished = state.finished
  const file = model.files.find((f) => f.path === active)
  const ownFile = !file && active in files

  useEffect(() => {
    if (!newRetos.length) return
    const id = window.setTimeout(() => setNewRetos([]), 5000)
    return () => window.clearTimeout(id)
  }, [newRetos])

  const update = (path: string, content: string) => {
    const next = { ...files, [path]: content }
    setFiles(next)
    saveDraft(key, next)
  }

  const run = () => {
    if (finished) return
    const lab = runLab(mission, state, files, { env: envId })
    setResult(lab.result)
    setPipe(null)
    setNewRetos(lab.newRetos)
    for (const event of lab.events) dispatch({ type: 'app', event })
    setPanel(lab.result.failed > 0 || lab.result.errors > 0 ? 'informe' : lab.newRetos.length ? 'retos' : 'informe')
  }

  const runPipeline = () => {
    if (finished || !jobId) return
    const lab = runLab(mission, state, files, { job: jobId })
    setResult(lab.result)
    setPipe(lab.pipeline ?? null)
    setNewRetos(lab.newRetos)
    for (const event of lab.events) dispatch({ type: 'app', event })
    setPanel(lab.newRetos.length && lab.pipeline?.build === 'SUCCESS' && !lab.pipeline.failed ? 'retos' : 'informe')
  }

  const reset = () => {
    const original = model.files.find((f) => f.path === active)
    if (original) update(active, original.content)
    else if (ownFile) {
      // Fichero creado por el alumno: «restaurar» es borrarlo.
      const next = { ...files }
      delete next[active]
      setFiles(next)
      saveDraft(key, next)
      setActive(model.files.find((f) => f.path.endsWith('.feature'))?.path ?? paths[0])
    }
    setConfirmReset(false)
  }

  const createFile = () => {
    if (!model.newFiles) return
    const rel = newPath.trim().replace(/^\/+/, '')
    const err = newFileError(rel, paths, lang)
    if (err) {
      setNewError(err)
      return
    }
    const path = model.newFiles.root + rel
    update(path, template(path))
    setActive(path)
    setCreating(false)
    setNewPath('')
    setNewError(null)
  }

  // Errores y escenarios del último resultado para el fichero abierto.
  const { errorLines, passedLines } = useMemo(() => {
    const errs = new Map<number, string>()
    const ok = new Set<number>()
    if (result) {
      for (const f of result.features) {
        if (f.file !== active) continue
        if (f.error) errs.set(f.error.line, f.error.message)
        for (const sc of f.scenarios) {
          if (sc.error) {
            errs.set(sc.error.line, sc.error.message.split('\n')[0])
            // En un esquema, marca también la fila de Examples que ha fallado.
            if (sc.outline && sc.outline.line !== sc.line) errs.set(sc.outline.line, sc.error.message.split('\n')[0])
          }
          else ok.add(sc.outline?.line ?? sc.line)
        }
      }
    }
    return { errorLines: errs, passedLines: ok }
  }, [result, active])

  const last = saved.last
  const counts = result ? { passed: result.passed, failed: result.failed, errors: result.errors } : last ? { passed: last.passed, failed: last.failed, errors: last.errors } : null

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0b0f14] text-slate-200">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#11161d] px-3 py-2">
        <button
          type="button"
          onClick={run}
          disabled={finished}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
          title={t('Ejecutar todos los features (Ctrl/Cmd + Enter)', 'Run all features (Ctrl/Cmd + Enter)')}
        >
          <Play className="h-4 w-4" aria-hidden />
          {t('Ejecutar', 'Run')}
        </button>
        <span className="hidden text-xs text-slate-400 sm:inline">
          {t(`${model.runCost} min + ${model.scenarioCost} por escenario`, `${model.runCost} min + ${model.scenarioCost} per scenario`)}
        </span>
        {model.pipeline && (
          <span className="inline-flex items-center gap-1.5">
            <span className="relative">
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="appearance-none rounded bg-white/5 py-1.5 pl-2 pr-6 text-xs text-slate-200"
                aria-label={t('Job del pipeline', 'Pipeline job')}
              >
                {model.pipeline.jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 top-2 h-3.5 w-3.5 text-slate-400" aria-hidden />
            </span>
            <button
              type="button"
              onClick={runPipeline}
              disabled={finished}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
              title={t(`Lanzar el job en el pipeline de CI (${model.pipeline.cost} min)`, `Run the job in the CI pipeline (${model.pipeline.cost} min)`)}
            >
              <GitBranch className="h-4 w-4" aria-hidden />
              {t('Pipeline', 'Pipeline')}
            </button>
          </span>
        )}
        {counts && (
          <span className="ml-1 inline-flex items-center gap-2 rounded-md bg-black/30 px-2 py-1 font-mono text-xs" aria-live="polite">
            <span className="text-emerald-400">✓ {counts.passed}</span>
            <span className={counts.failed ? 'text-rose-400' : 'text-slate-500'}>✗ {counts.failed}</span>
            {counts.errors > 0 && <span className="text-amber-300">⚠ {counts.errors}</span>}
          </span>
        )}
        {model.envs && model.envs.length > 1 ? (
          <label className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <span>-Dkarate.env=</span>
            <span className="relative">
              <select
                value={envId}
                onChange={(e) => setEnvId(e.target.value)}
                className="appearance-none rounded bg-white/5 py-1 pl-2 pr-6 font-mono text-[12px] text-amber-200"
                aria-label={t('Entorno de ejecución (karate.env)', 'Run environment (karate.env)')}
              >
                {model.envs.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.id}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 top-1.5 h-3.5 w-3.5 text-slate-400" aria-hidden />
            </span>
            <span className="hidden text-slate-500 lg:inline">· {model.envs.find((e) => e.id === envId)?.label}</span>
          </label>
        ) : (
          <span className="ml-auto hidden font-mono text-[11px] text-slate-500 md:inline">{model.env ?? 'sandbox'} · {String(model.config.baseUrl ?? '')}</span>
        )}
      </div>

      {newRetos.length > 0 && (
        <div className="flex items-center gap-2 border-b border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-200" role="status">
          <Sparkles className="h-4 w-4" aria-hidden />
          {t('Reto conseguido:', 'Challenge completed:')} {newRetos.map((id) => retos.find((r) => r.id === id)?.title ?? id).join(' · ')}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1.15fr)_minmax(0,1fr)] lg:grid-cols-[12rem_minmax(0,1fr)_22rem] lg:grid-rows-1">
        {/* Explorador */}
        <nav aria-label={t('Ficheros del proyecto', 'Project files')} className="hidden min-h-0 overflow-y-auto border-r border-white/10 bg-[#0e131a] py-2 lg:block">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('Proyecto', 'Project')}</p>
          {paths.map((p) => {
            const f = model.files.find((x) => x.path === p)
            const Icon = p.endsWith('.feature') ? FileCode2 : FileJson2
            const depth = p.split('/').length - 1
            return (
              <button
                key={p}
                type="button"
                onClick={() => setActive(p)}
                aria-current={p === active ? 'true' : undefined}
                className={`flex w-full items-center gap-1.5 py-1 pr-2 text-left text-[13px] ${p === active ? 'bg-sky-500/15 text-sky-100' : 'text-slate-300 hover:bg-white/5'}`}
                style={{ paddingLeft: 12 + depth * 10 }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <span className="truncate">{p.split('/').pop()}</span>
                {f?.readOnly && <Lock className="ml-auto h-3 w-3 shrink-0 text-slate-500" aria-label={t('solo lectura', 'read-only')} />}
              </button>
            )
          })}
          {model.newFiles && !finished && (
            <div className="mt-2 border-t border-white/10 px-2 pt-2">
              {creating ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    createFile()
                  }}
                  className="space-y-1"
                >
                  <label className="block text-[10px] text-slate-500" htmlFor="ide-new-file">
                    {model.newFiles.root}
                  </label>
                  <input
                    id="ide-new-file"
                    value={newPath}
                    onChange={(e) => {
                      setNewPath(e.target.value)
                      setNewError(null)
                    }}
                    placeholder="openapi/schemas/error.json"
                    className="w-full rounded bg-white/5 px-1.5 py-1 font-mono text-[11px] text-slate-100 placeholder:text-slate-600"
                    autoFocus
                  />
                  {newError && <p className="text-[11px] text-rose-300">{newError}</p>}
                  <div className="flex gap-1">
                    <button type="submit" className="rounded bg-sky-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-sky-500">
                      {t('Crear', 'Create')}
                    </button>
                    <button type="button" onClick={() => setCreating(false)} className="rounded px-2 py-0.5 text-[11px] text-slate-300 hover:bg-white/5">
                      {t('Cancelar', 'Cancel')}
                    </button>
                  </div>
                </form>
              ) : (
                <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-1 text-[12px] text-sky-300 hover:underline">
                  <FilePlus2 className="h-3.5 w-3.5" aria-hidden />
                  {t('Nuevo fichero', 'New file')}
                </button>
              )}
            </div>
          )}
        </nav>

        {/* Editor */}
        <section className="flex min-h-0 min-w-0 flex-col border-white/10 lg:border-r" aria-label={t('Editor', 'Editor')}>
          <div className="flex items-center gap-2 border-b border-white/10 bg-[#0e131a] px-2 py-1">
            <label className="relative lg:hidden">
              <span className="sr-only">{t('Fichero', 'File')}</span>
              <select value={active} onChange={(e) => setActive(e.target.value)} className="appearance-none rounded bg-white/5 py-1 pl-2 pr-7 font-mono text-xs text-slate-200">
                {paths.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1.5 h-3.5 w-3.5 text-slate-400" aria-hidden />
            </label>
            <span className="hidden font-mono text-xs text-slate-400 lg:inline">{active}</span>
            {file?.readOnly && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">{t('solo lectura', 'read-only')}</span>}
            {!file?.readOnly && (
              <span className="ml-auto flex items-center gap-1">
                {confirmReset ? (
                  <>
                    <span className="text-xs text-slate-400">{ownFile ? t('¿Borrar el fichero?', 'Delete the file?') : t('¿Volver al original?', 'Restore the original?')}</span>
                    <button type="button" onClick={reset} className="rounded px-2 py-0.5 text-xs text-rose-300 hover:bg-rose-500/10">
                      {t('Sí', 'Yes')}
                    </button>
                    <button type="button" onClick={() => setConfirmReset(false)} className="rounded px-2 py-0.5 text-xs text-slate-300 hover:bg-white/5">
                      {t('No', 'No')}
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-white/5" title={ownFile ? t('Borrar este fichero', 'Delete this file') : t('Restaurar el fichero original', 'Restore the original file')}>
                    {ownFile ? <Trash2 className="h-3 w-3" aria-hidden /> : <RotateCcw className="h-3 w-3" aria-hidden />}
                    {ownFile ? t('Borrar', 'Delete') : t('Restaurar', 'Restore')}
                  </button>
                )}
              </span>
            )}
          </div>
          {!file?.readOnly && model.snippets.length > 0 && (
            <div className="flex gap-1 overflow-x-auto border-b border-white/10 bg-[#0e131a] px-2 py-1" aria-label={t('Insertar', 'Insert')}>
              <span className="shrink-0 py-0.5 text-[11px] text-slate-500">{t('Insertar:', 'Insert:')}</span>
              {model.snippets.map((s) => (
                <button key={s.label} type="button" onClick={() => editor.current?.insert(s.code)} className="shrink-0 rounded bg-white/5 px-2 py-0.5 font-mono text-[11px] text-teal-200 hover:bg-white/10">
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <div className="min-h-0 flex-1">
            <CodeEditor
              ref={editor}
              path={active}
              value={files[active] ?? ''}
              onChange={(v) => update(active, v)}
              readOnly={file?.readOnly || finished}
              errors={errorLines}
              passed={passedLines}
              onRun={run}
              label={t(`Código de ${active}`, `Code of ${active}`)}
            />
          </div>
        </section>

        {/* Panel derecho / inferior */}
        <section className="flex min-h-0 min-w-0 flex-col border-t border-white/10 bg-[#0e131a] lg:border-t-0" aria-label={t('Resultados', 'Results')}>
          <div className="flex border-b border-white/10" role="tablist">
            {(
              [
                ['retos', t(`Retos ${done}/${retos.length}`, `Challenges ${done}/${retos.length}`)],
                ['informe', t('Informe', 'Report')],
                ['consola', t('Consola', 'Console')],
              ] as [Panel, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={panel === id}
                onClick={() => setPanel(id)}
                className={`flex-1 px-3 py-2 text-xs font-semibold ${panel === id ? 'border-b-2 border-sky-400 text-sky-100' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {panel === 'retos' && <RetosPanel retos={retos} flags={state.flags} lang={lang} exam={!!model.exam} />}
            {panel === 'informe' && <ReportPanel result={result} pipeline={pipe} last={last} lang={lang} onGo={(f, line) => { setActive(f); requestAnimationFrame(() => editor.current?.goToLine(line)) }} />}
            {panel === 'consola' && <ConsolePanel result={result} lang={lang} />}
          </div>
        </section>
      </div>
    </div>
  )
}

function RetosPanel({ retos, flags, lang, exam }: { retos: ReturnType<typeof visibleRetos>; flags: Record<string, boolean>; lang: AcademyLang; exam: boolean }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const [open, setOpen] = useState<string | null>(null)
  return (
    <ol className="space-y-2 p-3">
      {retos.map((r, i) => {
        const ok = !!flags[`reto.${r.id}`]
        return (
          <li key={r.id} className={`rounded-lg border p-3 ${ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/[0.03]'}`}>
            <div className="flex items-start gap-2">
              {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-label={t('conseguido', 'done')} /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-label={t('pendiente', 'pending')} />}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100">
                  {i + 1}. {r.title}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-300">{rich(r.description)}</p>
                {!ok && !exam && (
                  <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} className="mt-2 text-xs font-medium text-sky-300 hover:underline" aria-expanded={open === r.id}>
                    {open === r.id ? t('Ocultar pista', 'Hide hint') : t('Ver pista', 'Show hint')}
                  </button>
                )}
                {open === r.id && !ok && <p className="mt-1 rounded bg-black/30 p-2 text-[13px] text-slate-300">{rich(r.hint)}</p>}
              </div>
            </div>
          </li>
        )
      })}
      <li className="px-1 pt-1 text-[11px] leading-relaxed text-slate-500">
        {exam
          ? t(
              'Examen: sin pistas. Cada reto conseguido suma puntos, igual que cada bug real que reportes en el Tablero; un report rechazado resta.',
              'Exam: no hints. Each challenge completed earns points, as does each real bug you report on the Board; a rejected report subtracts.',
            )
          : null}
        {!exam && t(
          'Los retos se comprueban al ejecutar. Un test que falla no siempre es un test mal hecho: a veces es la API la que está mal. Si lo es, repórtalo en el Tablero con el escenario como evidencia.',
          'Challenges are checked when you run. A failing test is not always a badly written test: sometimes the API is wrong. If it is, report it on the Board with the scenario as evidence.',
        )}
      </li>
    </ol>
  )
}

function ScenarioRow({ sc, lang, onGo }: { sc: ScenarioResult; lang: AcademyLang; onGo: (file: string, line: number) => void }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const [open, setOpen] = useState(sc.status === 'failed')
  const line = sc.outline?.line ?? sc.line
  return (
    <li className="rounded-md border border-white/10 bg-white/[0.03]">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-start gap-2 p-2 text-left" aria-expanded={open}>
        {sc.status === 'passed' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] text-slate-100">{sc.name || t('(sin nombre)', '(unnamed)')}</span>
          <span className="font-mono text-[11px] text-slate-500">
            :{line} · {sc.ms} ms{sc.tags.length ? ' · ' + sc.tags.map((x) => '@' + x).join(' ') : ''}
          </span>
        </span>
      </button>
      {open && (
        <div className="border-t border-white/10 px-2 pb-2 pt-1">
          <ul className="space-y-0.5 font-mono text-[12px]">
            {sc.steps.map((s, i) => (
              <li key={i} className={s.status === 'failed' ? 'text-rose-300' : s.status === 'skipped' ? 'text-slate-600' : 'text-slate-300'}>
                <button type="button" onClick={() => onGo(sc.file, s.line)} className="text-left hover:underline">
                  <span className="text-slate-500">{String(s.line).padStart(3, ' ')} </span>
                  {s.status === 'passed' ? '✓' : s.status === 'failed' ? '✗' : '·'} {s.keyword} {s.text}
                  {s.background ? <span className="text-slate-600"> (Background)</span> : null}
                </button>
              </li>
            ))}
          </ul>
          {sc.error && <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-rose-500/10 p-2 font-mono text-[12px] text-rose-200">{sc.error.message}</pre>}
          {sc.smells.length > 0 && (
            <ul className="mt-2 space-y-1 text-[12px] text-amber-200">
              {sc.smells.map((s) => (
                <li key={s}>⚠ {smellText(s, lang)}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}

function PipelineBanner({ p, lang }: { p: PipelineSummary; lang: AcademyLang }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const ok = p.build === 'SUCCESS'
  const falseGreen = ok && p.failed > 0
  return (
    <div className={`rounded-md border p-2 font-mono text-[12px] ${!ok ? 'border-rose-500/40 bg-rose-500/10' : falseGreen ? 'border-amber-500/40 bg-amber-500/10' : 'border-emerald-500/40 bg-emerald-500/10'}`} role="status">
      <p className="font-semibold text-slate-100">
        {t('Pipeline', 'Pipeline')} #{p.run} · {p.label}
      </p>
      <p className="text-slate-400">$ {p.command}</p>
      <p className="text-slate-300">
        {t('hilos', 'threads')}: {p.threads} · tags: {p.tags || '—'} · {p.scenarios} {t('escenarios', 'scenarios')} · {(p.wallMs / 1000).toFixed(1)} s
        {p.reports.length > 0 && <> · {t('informes', 'reports')}: {p.reports.join(', ')}</>}
      </p>
      {p.compileErrors.map((e) => (
        <p key={e} className="text-rose-300">[ERROR] {e}</p>
      ))}
      <p className={`mt-1 font-bold ${!ok ? 'text-rose-300' : falseGreen ? 'text-amber-200' : 'text-emerald-300'}`}>
        BUILD {p.build} — {p.reason}
      </p>
    </div>
  )
}

function ReportPanel({ result, pipeline, last, lang, onGo }: { result: RunResult | null; pipeline: PipelineSummary | null; last: ReturnType<typeof ideState>['last']; lang: AcademyLang; onGo: (file: string, line: number) => void }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  if (!result) {
    if (last) {
      return (
        <div className="space-y-2 p-3 text-[13px]">
          <p className="text-slate-400">{t('Última ejecución guardada (vuelve a ejecutar para ver el detalle):', 'Last saved run (run again to see the details):')}</p>
          <ul className="space-y-1 font-mono text-[12px]">
            {last.syntax.map((s) => (
              <li key={s.file} className="text-amber-300">⚠ {s.file}:{s.line} {s.message}</li>
            ))}
            {last.scenarios.map((s, i) => (
              <li key={i} className={s.status === 'passed' ? 'text-emerald-300' : 'text-rose-300'}>
                {s.status === 'passed' ? '✓' : '✗'} {s.name} <span className="text-slate-500">:{s.line}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    return <p className="p-3 text-[13px] text-slate-400">{t('Todavía no has ejecutado nada. Escribe tu primer escenario y pulsa Ejecutar.', 'You have not run anything yet. Write your first scenario and press Run.')}</p>
  }
  return (
    <div className="space-y-3 p-3">
      {pipeline && <PipelineBanner p={pipeline} lang={lang} />}
      <p className="font-mono text-[12px] text-slate-400">
        scenarios: {result.passed + result.failed} | passed: <span className="text-emerald-400">{result.passed}</span> | failed: <span className={result.failed ? 'text-rose-400' : ''}>{result.failed}</span> | time: {(result.ms / 1000).toFixed(2)}s
      </p>
      {result.features.map((f) => (
        <section key={f.file}>
          <h4 className="mb-1 font-mono text-[12px] text-slate-400">{f.file}</h4>
          {f.error ? (
            <button type="button" onClick={() => onGo(f.file, f.error!.line)} className="w-full rounded bg-amber-500/10 p-2 text-left font-mono text-[12px] text-amber-200">
              ⚠ {t('línea', 'line')} {f.error.line}: {f.error.message}
            </button>
          ) : f.scenarios.length === 0 ? (
            <p className="text-[12px] text-slate-500">{t('Sin escenarios.', 'No scenarios.')}</p>
          ) : (
            <ul className="space-y-1.5">
              {f.scenarios.map((sc, i) => (
                <ScenarioRow key={`${sc.line}-${sc.outline?.row ?? 0}-${i}`} sc={sc} lang={lang} onGo={onGo} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}

function ConsolePanel({ result, lang }: { result: RunResult | null; lang: AcademyLang }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  if (!result) return <p className="p-3 text-[13px] text-slate-400">{t('La consola muestra el log de Karate de la última ejecución.', 'The console shows the Karate log of the last run.')}</p>
  return (
    <div className="space-y-3 p-3 font-mono text-[12px] leading-[18px]">
      {result.features.flatMap((f) =>
        f.error
          ? [
              <p key={f.file} className="text-amber-300">
                [karate] {f.file}:{f.error.line} {f.error.message}
              </p>,
            ]
          : f.scenarios.map((sc, i) => (
              <div key={`${f.file}-${i}`}>
                <p className="text-slate-500">
                  ── {f.file}:{sc.outline?.line ?? sc.line} Scenario: {sc.name}
                </p>
                {sc.logs.map((l, j) => (
                  <p key={j} className={`whitespace-pre-wrap break-all ${/^\d+ > /.test(l) ? 'text-sky-300' : /^\d+ < /.test(l) ? 'text-emerald-300' : /^\d+ ! /.test(l) ? 'text-rose-300' : l.startsWith('[') ? 'text-amber-200' : 'text-slate-300'}`}>
                    {l}
                  </p>
                ))}
                {sc.error && <p className="whitespace-pre-wrap text-rose-300">{sc.error.message}</p>}
              </div>
            )),
      )}
    </div>
  )
}

