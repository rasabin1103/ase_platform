import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import {
  SEVERITY_LABEL,
  quizScore,
  summarize,
  PRIORITY_LABEL,
} from "../engine/engine";
import { riskAssessment } from "../engine/risk";
import { reviewSummary } from "../engine/review";
import type { Mission, RunState, ScoreKey } from "../engine/types";
import { Avatar, Stars } from "../ui";
import { CourseReviewPrompt } from "../CourseReviews";
import { getCourse } from "../content/registry";
import { useCourseAccess } from "../useCourseAccess";
import { SCORE_LABEL, SEVERITY_STYLE, npcOf } from "../uiHelpers";

const TONE = {
  good: "border-ase-success/40 bg-ase-success/10",
  ok: "border-ase-brand/40 bg-ase-brand/10",
  bad: "border-ase-warning/40 bg-ase-warning/10",
};

export function Debrief({
  mission,
  state,
  onRestart,
  backTo,
}: {
  mission: Mission;
  state: RunState;
  onRestart: () => void;
  backTo: string;
}) {
  const { access } = useCourseAccess(mission.courseKey);
  const courseMissions = getCourse(mission.courseKey)?.missions ?? [];
  const lastMission =
    courseMissions.length > 0 &&
    courseMissions[courseMissions.length - 1].id === mission.id;
  const summary = summarize(mission, state);
  const risk = riskAssessment(mission, state);
  const review = reviewSummary(mission, state);
  const closing = state.messages.find((m) => m.sceneId === mission.endSceneId);
  const laura = npcOf(mission, closing?.from ?? "laura");
  const conceptIds = Array.from(
    new Set([...state.unlocked, ...mission.debriefConcepts]),
  );
  const concepts = mission.concepts.filter((c) => conceptIds.includes(c.id));

  return (
    <div className="min-h-dvh bg-ase-bg px-4 py-10 text-ase-text">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <p className="text-label uppercase text-ase-brand">
            Debrief · Misión {mission.number}: {mission.title}
          </p>
          <h1 className="font-display text-heading-xl">
            {summary.verdict.title}
          </h1>
          <p className="text-body-md text-ase-text2">{summary.verdict.body}</p>
        </header>

        {closing?.replies[0] && (
          <div
            className={`flex gap-3 rounded-ase-lg border p-4 ${TONE[summary.verdict.tone]}`}
          >
            <Avatar npc={laura} />
            <p className="text-body-sm text-ase-text">
              «{closing.replies[0].body}»
            </p>
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(SCORE_LABEL) as ScoreKey[]).map((k) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-ase-lg border border-ase-border bg-ase-surface px-4 py-3"
            >
              <span className="text-body-sm">{SCORE_LABEL[k]}</span>
              <Stars value={summary.stars[k]} />
            </div>
          ))}
        </section>

        {mission.quiz && quizScore(mission, state, "post").answered > 0 && (
          <section className="rounded-ase-lg border border-ase-border bg-ase-surface p-5">
            <h2 className="mb-1 font-sans text-heading-sm font-semibold">
              Diagnóstico {quizScore(mission, state, "pre").correct}/
              {quizScore(mission, state, "pre").total} → Comprobación{" "}
              {quizScore(mission, state, "post").correct}/
              {quizScore(mission, state, "post").total}
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              Mismos conceptos antes y después de la misión, en situaciones
              distintas.
            </p>
            <ul className="space-y-3">
              {mission.quiz.post.map((q) => {
                const ok = state.quizAnswers.post[q.id] === q.correct;
                return (
                  <li key={q.id} className="text-body-sm">
                    <p className={ok ? "text-ase-text" : "text-ase-warning"}>
                      {ok ? "✓" : "✗"} {q.question}
                    </p>
                    {!ok && (
                      <p className="text-ase-text2">
                        Respuesta correcta: {q.options[q.correct]}
                      </p>
                    )}
                    <p className="text-caption text-ase-muted">
                      {q.explanation}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {review && (
          <section>
            <h2 className="mb-1 font-sans text-heading-sm font-semibold">
              Revisión de requisitos: {review.found} de {review.total} defectos
              detectados
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              {review.prevented.length > 0
                ? `${mission.requirementsReview?.teamFindings ? "Gracias a la revisión" : "Gracias a lo que aclaraste"} antes del desarrollo, ${review.prevented.length} bug${review.prevented.length === 1 ? "" : "s"} nunca llegaron a existir. `
                : "Nada de lo que revisaste llegó a tiempo de evitar bugs. "}
              {review.falsePositives > 0 &&
                `Marcaste ${review.falsePositives} fragmento${review.falsePositives === 1 ? "" : "s"} que estaban bien.`}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {review.prevented.length > 0 && (
                <article className="rounded-ase-lg border border-ase-success/40 bg-ase-success/5 p-4">
                  <h3 className="mb-2 font-sans text-body-md font-semibold text-ase-success">
                    {mission.requirementsReview?.teamFindings ? 'Bugs evitados en la revisión' : 'Bugs evitados (coste: una pregunta)'}
                  </h3>
                  <ul className="space-y-1 text-body-sm text-ase-text2">
                    {review.prevented.map((b) => (
                      <li key={b.id}>✓ {b.title}</li>
                    ))}
                  </ul>
                </article>
              )}
              {review.appeared.length > 0 && (
                <article className="rounded-ase-lg border border-ase-warning/40 bg-ase-warning/5 p-4">
                  <h3 className="mb-2 font-sans text-body-md font-semibold text-ase-warning">
                    Bugs que nacieron de dudas sin aclarar
                  </h3>
                  <ul className="space-y-1 text-body-sm text-ase-text2">
                    {review.appeared.map((b) => (
                      <li key={b.id}>! {b.title}</li>
                    ))}
                  </ul>
                </article>
              )}
            </div>
            <ul className="mt-4 space-y-3">
              {review.issues.map((i) => (
                <li
                  key={i.key}
                  className="rounded-ase-lg border border-ase-border bg-ase-surface p-4 text-body-sm"
                >
                  <p className={i.found ? "text-ase-text" : "text-ase-warning"}>
                    {i.found ? "✓" : "✗"}{" "}
                    {i.fragments.map((f) => `«${f}»`).join(" / ")}
                    {i.foundBy && (
                      <span className="ml-1 text-caption text-ase-muted">
                        (lo encontró{" "}
                        {npcOf(mission, i.foundBy).name.split(" ")[0]})
                      </span>
                    )}
                  </p>
                  <p className="text-ase-text2">{i.explanation}</p>
                  <p className="text-caption text-ase-brand">
                    Aclaración de la PO: {i.clarification}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!review && mission.prevention && (() => {
          const p = mission.prevention;
          const prevented = state.preventedBugs.map((id) => mission.bugs.find((b) => b.id === id)).filter((b) => !!b);
          const appeared = mission.bugs.filter((b) => b.preventedBy && state.activeBugs.includes(b.id));
          const covered = p.rules.filter((r) => state.flags[r.flag]).length;
          return (
            <section>
              <h2 className="mb-1 font-sans text-heading-sm font-semibold">
                {p.title}: {covered} de {p.rules.length}
              </h2>
              <p className="mb-4 text-body-sm text-ase-muted">{p.intro}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {prevented.length > 0 && (
                  <article className="rounded-ase-lg border border-ase-success/40 bg-ase-success/5 p-4">
                    <h3 className="mb-2 font-sans text-body-md font-semibold text-ase-success">{p.preventedLabel}</h3>
                    <ul className="space-y-1 text-body-sm text-ase-text2">
                      {prevented.map((b) => (
                        <li key={b.id}>✓ {b.title}</li>
                      ))}
                    </ul>
                  </article>
                )}
                {appeared.length > 0 && (
                  <article className="rounded-ase-lg border border-ase-warning/40 bg-ase-warning/5 p-4">
                    <h3 className="mb-2 font-sans text-body-md font-semibold text-ase-warning">{p.appearedLabel}</h3>
                    <ul className="space-y-1 text-body-sm text-ase-text2">
                      {appeared.map((b) => (
                        <li key={b.id}>! {b.title}</li>
                      ))}
                    </ul>
                  </article>
                )}
              </div>
              <ul className="mt-4 space-y-3">
                {p.rules.map((r) => (
                  <li key={r.flag} className="rounded-ase-lg border border-ase-border bg-ase-surface p-4 text-body-sm">
                    <p className={state.flags[r.flag] ? "text-ase-text" : "text-ase-warning"}>
                      {state.flags[r.flag] ? "✓" : "✗"} {r.label}
                    </p>
                    <p className="text-ase-text2">{r.explanation}</p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })()}

        {!mission.hideBugList && (
          <section>
            <h2 className="mb-1 font-sans text-heading-sm font-semibold">
              Bugs reportados: {summary.found} de {summary.total}
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              Estos eran todos los bugs sembrados en esta misión y la técnica
              que los encuentra.
            </p>
            <ul className="space-y-3">
              {summary.bugs.map((b) => {
                const status =
                  b.reportStatus &&
                  [
                    "accepted",
                    "needs_info",
                    "resolved",
                    "verified",
                    "reopened",
                  ].includes(b.reportStatus)
                    ? { t: "Reportado", c: "text-ase-success" }
                    : b.reportStatus === "disputed"
                      ? {
                          t: "Reportado, pero sin poder justificarlo",
                          c: "text-ase-warning",
                        }
                      : b.triggered
                        ? {
                            t: "Lo provocaste, pero no lo reportaste",
                            c: "text-ase-warning",
                          }
                        : { t: "No encontrado", c: "text-ase-muted" };
                return (
                  <li
                    key={b.id}
                    className="rounded-ase-lg border border-ase-border bg-ase-surface p-4"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded border px-2 text-caption ${SEVERITY_STYLE[b.severity]}`}
                      >
                        {SEVERITY_LABEL[b.severity]}
                      </span>
                      {b.regression && (
                        <span className="rounded border border-ase-error/40 px-2 text-caption text-ase-error">
                          Regresión
                        </span>
                      )}
                      <span className="font-medium">{b.title}</span>
                      <span className={`ml-auto text-caption ${status.c}`}>
                        {status.t}
                      </span>
                    </div>
                    <p className="text-body-sm text-ase-text2">
                      {b.explanation}
                    </p>
                    <p className="mt-1 text-caption text-ase-brand">
                      Técnica: {b.technique}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {mission.reportPriority && summary.reportQuality.length > 0 && (
          <section>
            <h2 className="mb-1 font-sans text-heading-sm font-semibold">
              Calidad de tus reports
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              Aceptados a la primera:{" "}
              {
                summary.reportQuality.filter(
                  (r) =>
                    r.amendments === 0 &&
                    r.status !== "needs_info" &&
                    r.status !== "disputed",
                ).length
              }{" "}
              de {summary.reportQuality.length}. Cada ida y vuelta con el
              desarrollador es tiempo perdido para los dos.
            </p>
            <div className="overflow-x-auto rounded-ase-lg border border-ase-border">
              <table className="w-full min-w-[640px] text-left text-body-sm">
                <thead className="bg-ase-bg2 text-caption uppercase text-ase-muted">
                  <tr>
                    <th className="px-3 py-2">Report</th>
                    <th className="px-3 py-2">Idas y vueltas</th>
                    <th className="px-3 py-2">Severidad (tuya → equipo)</th>
                    <th className="px-3 py-2">Prioridad (tuya → triaje)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ase-border">
                  {summary.reportQuality.map((r) => (
                    <tr key={r.key} className="align-top">
                      <td className="px-3 py-2">
                        <span className="font-mono text-caption text-ase-brand">
                          {r.key}
                        </span>{" "}
                        {r.title}
                        {(r.status === "needs_info" ||
                          r.status === "disputed") && (
                          <span className="block text-caption text-ase-warning">
                            Se quedó sin aceptar
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-3 py-2 ${r.amendments === 0 ? "text-ase-success" : "text-ase-warning"}`}
                      >
                        {r.amendments}
                      </td>
                      <td
                        className={`px-3 py-2 ${r.realSeverity && r.realSeverity !== r.severity ? "text-ase-warning" : "text-ase-text2"}`}
                      >
                        {SEVERITY_LABEL[r.severity]}
                        {r.realSeverity &&
                          r.realSeverity !== r.severity &&
                          ` → ${SEVERITY_LABEL[r.realSeverity]}`}
                      </td>
                      <td
                        className={`px-3 py-2 ${r.realPriority && r.realPriority !== r.priority ? "text-ase-warning" : "text-ase-text2"}`}
                      >
                        {r.priority
                          ? PRIORITY_LABEL[r.priority]
                          : "Sin indicar"}
                        {r.realPriority &&
                          r.realPriority !== r.priority &&
                          ` → ${PRIORITY_LABEL[r.realPriority]}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {summary.fixes.length > 0 && (
          <section>
            <h2 className="mb-1 font-sans text-heading-sm font-semibold">
              Verificación de correcciones
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              QA abre y QA cierra: cada fix se verifica en el build nuevo, y se
              repiten los casos relacionados.
            </p>
            <ul className="space-y-2">
              {summary.fixes.map((f) => {
                const last = f.verifications.at(-1);
                const verdict = !last
                  ? { t: "No lo verificaste", c: "text-ase-warning" }
                  : !last.retested
                    ? { t: "Lo cerraste sin re-probar", c: "text-ase-warning" }
                    : last.correct
                      ? {
                          t:
                            last.verdict === "close"
                              ? "Verificado correctamente"
                              : "Reabierto con razón",
                          c: "text-ase-success",
                        }
                      : {
                          t:
                            last.verdict === "close"
                              ? "Cerrado, pero el fix no funcionaba"
                              : "Reabierto sin motivo",
                          c: "text-ase-error",
                        };
                return (
                  <li
                    key={f.key}
                    className="flex flex-wrap items-center gap-2 rounded-ase-lg border border-ase-border bg-ase-surface px-4 py-3 text-body-sm"
                  >
                    <span className="font-mono text-caption text-ase-brand">
                      {f.key}
                    </span>
                    <span className="text-ase-text">{f.title}</span>
                    <span className="text-caption text-ase-muted">
                      · el primer fix{" "}
                      {f.firstFixWorks ? "funcionaba" : "no funcionaba"}
                    </span>
                    <span className={`ml-auto text-caption ${verdict.c}`}>
                      {verdict.t}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {summary.design && (
          <section>
            <h2 className="mb-1 font-sans text-heading-sm font-semibold">
              Tu diseño de pruebas: {summary.design.coreCovered} de{" "}
              {summary.design.coreTotal} particiones clave
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              {summary.design.cases.length === 0
                ? "No diseñaste casos: probaste sin plan. Diseñar antes de ejecutar es lo que hace que no se escapen bugs."
                : summary.design.designedBeforeExecuting
                  ? "Diseñaste antes de ejecutar: así se prueba con intención y no al azar."
                  : "Empezaste a probar antes de diseñar. La próxima vez, diseña primero."}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {summary.design.areas.map((a) => (
                <article
                  key={a.areaId}
                  className="rounded-ase-lg border border-ase-border bg-ase-surface p-4"
                >
                  <h3 className="mb-2 flex justify-between font-sans text-body-md font-semibold">
                    {a.label}
                    <span
                      className={
                        a.coreCovered === a.coreTotal
                          ? "text-ase-success"
                          : "text-ase-muted"
                      }
                    >
                      {a.coreCovered}/{a.coreTotal}
                    </span>
                  </h3>
                  <ul className="space-y-0.5 text-body-sm">
                    {a.covered.map((p) => (
                      <li key={p.id} className="text-ase-text2">
                        <span className="text-ase-success">✓</span> {p.label}
                      </li>
                    ))}
                    {a.missing.map((p) => (
                      <li key={p.id} className="text-ase-muted">
                        <span className="text-ase-warning">✗</span> {p.label}{" "}
                        <span className="text-caption text-ase-brand">
                          · {p.technique}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            {summary.design.cases.some(
              (c) => c.reveals || c.expectedWrong || c.resultWrong,
            ) && (
              <ul className="mt-4 space-y-1 text-body-sm">
                {summary.design.cases
                  .filter((c) => c.reveals)
                  .map((c) => (
                    <li key={`r${c.case.id}`} className="text-ase-text2">
                      🐞 Tu caso #{c.case.id} («{c.case.input}») encontraba:{" "}
                      {mission.bugs.find((b) => b.id === c.reveals)?.title}
                    </li>
                  ))}
                {summary.design.cases
                  .filter((c) => c.expectedWrong)
                  .map((c) => (
                    <li key={`e${c.case.id}`} className="text-ase-warning">
                      ! Caso #{c.case.id} («{c.case.input}»): esperabas «
                      {c.case.expectAccept ? "se acepta" : "se rechaza"}», pero
                      según los criterios{" "}
                      {c.correctAccept ? "se acepta" : "se rechaza"}.
                      {c.missingRules
                        ? " Sin preguntar a la PO no podías saberlo."
                        : ""}
                    </li>
                  ))}
                {summary.design.cases
                  .filter((c) => c.resultWrong)
                  .map((c) => (
                    <li key={`x${c.case.id}`} className="text-ase-warning">
                      ! Caso #{c.case.id}: lo marcaste como «
                      {c.case.result === "pass" ? "pasa" : "falla"}», pero{" "}
                      {c.reveals
                        ? "ese caso revela un bug."
                        : "el sistema se comporta correctamente."}
                    </li>
                  ))}
              </ul>
            )}
          </section>
        )}

        {risk && (
          <section>
            <h2 className="mb-1 font-sans text-heading-sm font-semibold">
              Priorización por riesgo
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              {risk.rated === 0
                ? "No priorizaste: sin saber qué es lo más arriesgado, el tiempo se reparte al azar."
                : `Coincidiste en ${risk.topMatches} de ${risk.refTop.length} zonas prioritarias.`}
            </p>
            <div className="overflow-x-auto rounded-ase-lg border border-ase-border">
              <table className="w-full min-w-[600px] text-left text-body-sm">
                <thead className="bg-ase-bg2 text-caption uppercase text-ase-muted">
                  <tr>
                    <th className="px-3 py-2">Zona</th>
                    <th className="px-3 py-2">Tu valoración</th>
                    <th className="px-3 py-2">QA senior</th>
                    <th className="px-3 py-2">Por qué</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ase-border">
                  {risk.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 text-ase-text">
                        {r.label}
                        {risk.refTop.includes(r.id) && (
                          <span className="ml-2 text-caption text-ase-error">
                            prioridad
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-caption">
                        {r.mine
                          ? `${r.mine.p}×${r.mine.i} = ${r.mine.score}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-caption">{`${r.ref.p}×${r.ref.i} = ${r.ref.score}`}</td>
                      <td className="px-3 py-2 text-caption text-ase-text2">
                        {r.why}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {state.notes.length > 0 && (
          <section>
            <h2 className="mb-3 font-sans text-heading-sm font-semibold">
              Tus decisiones
            </h2>
            <ul className="space-y-2">
              {state.notes.map((n, i) => (
                <li key={i} className="flex gap-2 text-body-sm">
                  <span
                    className={
                      n.tone === "good"
                        ? "text-ase-success"
                        : n.tone === "bad"
                          ? "text-ase-warning"
                          : "text-ase-muted"
                    }
                  >
                    {n.tone === "good" ? "✓" : n.tone === "bad" ? "!" : "·"}
                  </span>
                  <span className="text-ase-text2">{n.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-3 font-sans text-heading-sm font-semibold">
            Lo que has aprendido hoy
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {concepts.map((c) => (
              <article
                key={c.id}
                className="rounded-ase-lg border border-ase-border bg-ase-surface p-4"
              >
                <h3 className="mb-1 font-sans text-body-md font-semibold">
                  {c.title}
                </h3>
                <p className="text-body-sm text-ase-text2">{c.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-ase-lg border border-ase-gold/40 bg-ase-gold/5 p-5">
          <h2 className="mb-2 font-sans text-heading-sm font-semibold">
            Qué habría hecho un QA senior
          </h2>
          <ul className="ml-5 list-disc space-y-1 text-body-sm text-ase-text2">
            {mission.seniorTips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>

        {(mission.number >= 2 || lastMission) && (
          <CourseReviewPrompt access={access} lastMission={lastMission} />
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-2 rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong"
          >
            <RotateCcw className="h-4 w-4" /> Repetir con otras decisiones
          </button>
          <Link
            to={backTo}
            className="rounded-ase-md border border-ase-border px-4 py-2 text-body-sm text-ase-text hover:border-ase-brand"
          >
            Volver al curso
          </Link>
        </div>
      </div>
    </div>
  );
}
