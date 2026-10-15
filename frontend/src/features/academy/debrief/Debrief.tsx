import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import {
  priorityLabels,
  quizScore,
  severityLabels,
  summarize,
} from "../engine/engine";
import { riskAssessment } from "../engine/risk";
import { reviewSummary } from "../engine/review";
import type { Mission, RunState, ScoreKey } from "../engine/types";
import { Avatar, Stars } from "../ui";
import { CourseReviewPrompt } from "../CourseReviews";
import { getCourse } from "../content/registry";
import { useCourseAccess } from "../useCourseAccess";
import { SCORE_LABEL, SEVERITY_STYLE, npcOf, scoreLabels } from "../uiHelpers";
import { missionLang } from "../i18n";

const plural = (n: number, s: string, p: string) => (n === 1 ? s : p);

const COPY = {
  es: {
    kicker: (n: number, title: string) => `Debrief · Misión ${n}: ${title}`,
    quizTitle: (pc: number, pt: number, qc: number, qt: number) =>
      `Diagnóstico ${pc}/${pt} → Comprobación ${qc}/${qt}`,
    quizIntro: "Mismos conceptos antes y después de la misión, en situaciones distintas.",
    correctAnswer: "Respuesta correcta:",
    reviewTitle: (found: number, total: number) =>
      `Revisión de requisitos: ${found} de ${total} defectos detectados`,
    prevented: (team: boolean, n: number) =>
      `${team ? "Gracias a la revisión" : "Gracias a lo que aclaraste"} antes del desarrollo, ${n} bug${plural(n, "", "s")} nunca llegaron a existir. `,
    nonePrevented: "Nada de lo que revisaste llegó a tiempo de evitar bugs. ",
    falsePositives: (n: number) =>
      `Marcaste ${n} fragmento${plural(n, "", "s")} que estaban bien.`,
    preventedTeam: "Bugs evitados en la revisión",
    preventedQuestion: "Bugs evitados (coste: una pregunta)",
    appeared: "Bugs que nacieron de dudas sin aclarar",
    foundBy: (name: string) => `(lo encontró ${name})`,
    poClarification: "Aclaración de la PO:",
    of: "de",
    bugsTitle: (found: number, total: number) => `Bugs reportados: ${found} de ${total}`,
    bugsIntro: "Estos eran todos los bugs sembrados en esta misión y la técnica que los encuentra.",
    reported: "Reportado",
    disputed: "Reportado, pero sin poder justificarlo",
    triggered: "Lo provocaste, pero no lo reportaste",
    notFound: "No encontrado",
    regression: "Regresión",
    technique: "Técnica:",
    qualityTitle: "Calidad de tus reports",
    qualityIntro: (ok: number, total: number) =>
      `Aceptados a la primera: ${ok} de ${total}. Cada ida y vuelta con el desarrollador es tiempo perdido para los dos.`,
    thReport: "Report",
    thRounds: "Idas y vueltas",
    thSeverity: "Severidad (tuya → equipo)",
    thPriority: "Prioridad (tuya → triaje)",
    notAccepted: "Se quedó sin aceptar",
    notSet: "Sin indicar",
    fixesTitle: "Verificación de correcciones",
    fixesIntro: "QA abre y QA cierra: cada fix se verifica en el build nuevo, y se repiten los casos relacionados.",
    notVerified: "No lo verificaste",
    closedNoRetest: "Lo cerraste sin re-probar",
    verifiedOk: "Verificado correctamente",
    reopenedOk: "Reabierto con razón",
    closedBroken: "Cerrado, pero el fix no funcionaba",
    reopenedNoReason: "Reabierto sin motivo",
    firstFix: (works: boolean) => `· el primer fix ${works ? "funcionaba" : "no funcionaba"}`,
    designTitle: (c: number, t: number) => `Tu diseño de pruebas: ${c} de ${t} particiones clave`,
    noDesign: "No diseñaste casos: probaste sin plan. Diseñar antes de ejecutar es lo que hace que no se escapen bugs.",
    designedFirst: "Diseñaste antes de ejecutar: así se prueba con intención y no al azar.",
    designedLate: "Empezaste a probar antes de diseñar. La próxima vez, diseña primero.",
    caseFound: (id: number, input: string) => `🐞 Tu caso #${id} («${input}») encontraba: `,
    accepts: "se acepta",
    rejects: "se rechaza",
    expectedWrong: (id: number, input: string, mine: string, correct: string, missing: boolean) =>
      `! Caso #${id} («${input}»): esperabas «${mine}», pero según los criterios ${correct}.${missing ? " Sin preguntar a la PO no podías saberlo." : ""}`,
    resultWrong: (id: number, pass: boolean, reveals: boolean) =>
      `! Caso #${id}: lo marcaste como «${pass ? "pasa" : "falla"}», pero ${reveals ? "ese caso revela un bug." : "el sistema se comporta correctamente."}`,
    riskTitle: "Priorización por riesgo",
    noRisk: "No priorizaste: sin saber qué es lo más arriesgado, el tiempo se reparte al azar.",
    riskMatches: (m: number, t: number) => `Coincidiste en ${m} de ${t} zonas prioritarias.`,
    thArea: "Zona",
    thMine: "Tu valoración",
    thSenior: "QA senior",
    thWhy: "Por qué",
    priorityTag: "prioridad",
    decisions: "Tus decisiones",
    learned: "Lo que has aprendido hoy",
    senior: "Qué habría hecho un QA senior",
    restart: "Repetir con otras decisiones",
    back: "Volver al curso",
  },
  en: {
    kicker: (n: number, title: string) => `Debrief · Mission ${n}: ${title}`,
    quizTitle: (pc: number, pt: number, qc: number, qt: number) =>
      `Diagnostic ${pc}/${pt} → Check ${qc}/${qt}`,
    quizIntro: "The same concepts before and after the mission, in different situations.",
    correctAnswer: "Correct answer:",
    reviewTitle: (found: number, total: number) =>
      `Requirements review: ${found} of ${total} defects detected`,
    prevented: (team: boolean, n: number) =>
      `${team ? "Thanks to the review" : "Thanks to what you clarified"} before development, ${n} bug${plural(n, "", "s")} never came to exist. `,
    nonePrevented: "Nothing you reviewed came in time to prevent bugs. ",
    falsePositives: (n: number) =>
      `You marked ${n} fragment${plural(n, "", "s")} that ${plural(n, "was", "were")} fine.`,
    preventedTeam: "Bugs prevented in the review",
    preventedQuestion: "Bugs prevented (cost: one question)",
    appeared: "Bugs born from unclarified questions",
    foundBy: (name: string) => `(found by ${name})`,
    poClarification: "PO clarification:",
    of: "of",
    bugsTitle: (found: number, total: number) => `Bugs reported: ${found} of ${total}`,
    bugsIntro: "These were all the bugs seeded in this mission and the technique that finds them.",
    reported: "Reported",
    disputed: "Reported, but couldn't justify it",
    triggered: "You triggered it, but didn't report it",
    notFound: "Not found",
    regression: "Regression",
    technique: "Technique:",
    qualityTitle: "Quality of your reports",
    qualityIntro: (ok: number, total: number) =>
      `Accepted first time: ${ok} of ${total}. Every back-and-forth with the developer is time lost for both of you.`,
    thReport: "Report",
    thRounds: "Back-and-forths",
    thSeverity: "Severity (yours → team)",
    thPriority: "Priority (yours → triage)",
    notAccepted: "Never got accepted",
    notSet: "Not set",
    fixesTitle: "Fix verification",
    fixesIntro: "QA opens and QA closes: every fix is verified on the new build, and the related cases are re-run.",
    notVerified: "You didn't verify it",
    closedNoRetest: "You closed it without retesting",
    verifiedOk: "Verified correctly",
    reopenedOk: "Rightly reopened",
    closedBroken: "Closed, but the fix didn't work",
    reopenedNoReason: "Reopened for no reason",
    firstFix: (works: boolean) => `· the first fix ${works ? "worked" : "didn't work"}`,
    designTitle: (c: number, t: number) => `Your test design: ${c} of ${t} key partitions`,
    noDesign: "You didn't design any cases: you tested without a plan. Designing before executing is what keeps bugs from slipping through.",
    designedFirst: "You designed before executing: that's how you test with intent, not at random.",
    designedLate: "You started testing before designing. Next time, design first.",
    caseFound: (id: number, input: string) => `🐞 Your case #${id} (“${input}”) found: `,
    accepts: "accepted",
    rejects: "rejected",
    expectedWrong: (id: number, input: string, mine: string, correct: string, missing: boolean) =>
      `! Case #${id} (“${input}”): you expected “${mine}”, but according to the acceptance criteria it is ${correct}.${missing ? " You couldn't have known without asking the PO." : ""}`,
    resultWrong: (id: number, pass: boolean, reveals: boolean) =>
      `! Case #${id}: you marked it as “${pass ? "pass" : "fail"}”, but ${reveals ? "that case reveals a bug." : "the system behaves correctly."}`,
    riskTitle: "Risk-based prioritization",
    noRisk: "You didn't prioritize: without knowing what's riskiest, time gets spread at random.",
    riskMatches: (m: number, t: number) => `You matched ${m} of ${t} priority areas.`,
    thArea: "Area",
    thMine: "Your rating",
    thSenior: "Senior QA",
    thWhy: "Why",
    priorityTag: "priority",
    decisions: "Your decisions",
    learned: "What you learned today",
    senior: "What a senior QA would have done",
    restart: "Replay with other decisions",
    back: "Back to the course",
  },
};

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
  const lang = missionLang(mission);
  const t = COPY[lang];
  const scoreLabel = scoreLabels(lang);
  const sevLabel = severityLabels(lang);
  const prioLabel = priorityLabels(lang);
  const courseMissions = getCourse(mission.courseKey, lang)?.missions ?? [];
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
            {t.kicker(mission.number, mission.title)}
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
              {lang === "en" ? `“${closing.replies[0].body}”` : `«${closing.replies[0].body}»`}
            </p>
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(SCORE_LABEL) as ScoreKey[]).map((k) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-ase-lg border border-ase-border bg-ase-surface px-4 py-3"
            >
              <span className="text-body-sm">{scoreLabel[k]}</span>
              <Stars value={summary.stars[k]} lang={lang} />
            </div>
          ))}
        </section>

        {mission.quiz && quizScore(mission, state, "post").answered > 0 && (
          <section className="rounded-ase-lg border border-ase-border bg-ase-surface p-5">
            <h2 className="mb-1 font-sans text-heading-sm font-semibold">
              {t.quizTitle(
                quizScore(mission, state, "pre").correct,
                quizScore(mission, state, "pre").total,
                quizScore(mission, state, "post").correct,
                quizScore(mission, state, "post").total,
              )}
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              {t.quizIntro}
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
                        {t.correctAnswer} {q.options[q.correct]}
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
              {t.reviewTitle(review.found, review.total)}
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              {review.prevented.length > 0
                ? t.prevented(!!mission.requirementsReview?.teamFindings, review.prevented.length)
                : t.nonePrevented}
              {review.falsePositives > 0 && t.falsePositives(review.falsePositives)}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {review.prevented.length > 0 && (
                <article className="rounded-ase-lg border border-ase-success/40 bg-ase-success/5 p-4">
                  <h3 className="mb-2 font-sans text-body-md font-semibold text-ase-success">
                    {mission.requirementsReview?.teamFindings ? t.preventedTeam : t.preventedQuestion}
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
                    {t.appeared}
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
                    {i.fragments.map((f) => (lang === "en" ? `“${f}”` : `«${f}»`)).join(" / ")}
                    {i.foundBy && (
                      <span className="ml-1 text-caption text-ase-muted">
                        {t.foundBy(npcOf(mission, i.foundBy).name.split(" ")[0])}
                      </span>
                    )}
                  </p>
                  <p className="text-ase-text2">{i.explanation}</p>
                  <p className="text-caption text-ase-brand">
                    {t.poClarification} {i.clarification}
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
                {p.title}: {covered} {t.of} {p.rules.length}
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
              {t.bugsTitle(summary.found, summary.total)}
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              {t.bugsIntro}
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
                    ? { t: t.reported, c: "text-ase-success" }
                    : b.reportStatus === "disputed"
                      ? { t: t.disputed, c: "text-ase-warning" }
                      : b.triggered
                        ? { t: t.triggered, c: "text-ase-warning" }
                        : { t: t.notFound, c: "text-ase-muted" };
                return (
                  <li
                    key={b.id}
                    className="rounded-ase-lg border border-ase-border bg-ase-surface p-4"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded border px-2 text-caption ${SEVERITY_STYLE[b.severity]}`}
                      >
                        {sevLabel[b.severity]}
                      </span>
                      {b.regression && (
                        <span className="rounded border border-ase-error/40 px-2 text-caption text-ase-error">
                          {t.regression}
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
                      {t.technique} {b.technique}
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
              {t.qualityTitle}
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              {t.qualityIntro(
                summary.reportQuality.filter(
                  (r) =>
                    r.amendments === 0 &&
                    r.status !== "needs_info" &&
                    r.status !== "disputed",
                ).length,
                summary.reportQuality.length,
              )}
            </p>
            <div className="overflow-x-auto rounded-ase-lg border border-ase-border">
              <table className="w-full min-w-[640px] text-left text-body-sm">
                <thead className="bg-ase-bg2 text-caption uppercase text-ase-muted">
                  <tr>
                    <th className="px-3 py-2">{t.thReport}</th>
                    <th className="px-3 py-2">{t.thRounds}</th>
                    <th className="px-3 py-2">{t.thSeverity}</th>
                    <th className="px-3 py-2">{t.thPriority}</th>
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
                            {t.notAccepted}
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
                        {sevLabel[r.severity]}
                        {r.realSeverity &&
                          r.realSeverity !== r.severity &&
                          ` → ${sevLabel[r.realSeverity]}`}
                      </td>
                      <td
                        className={`px-3 py-2 ${r.realPriority && r.realPriority !== r.priority ? "text-ase-warning" : "text-ase-text2"}`}
                      >
                        {r.priority
                          ? prioLabel[r.priority]
                          : t.notSet}
                        {r.realPriority &&
                          r.realPriority !== r.priority &&
                          ` → ${prioLabel[r.realPriority]}`}
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
              {t.fixesTitle}
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              {t.fixesIntro}
            </p>
            <ul className="space-y-2">
              {summary.fixes.map((f) => {
                const last = f.verifications.at(-1);
                const verdict = !last
                  ? { t: t.notVerified, c: "text-ase-warning" }
                  : !last.retested
                    ? { t: t.closedNoRetest, c: "text-ase-warning" }
                    : last.correct
                      ? {
                          t: last.verdict === "close" ? t.verifiedOk : t.reopenedOk,
                          c: "text-ase-success",
                        }
                      : {
                          t: last.verdict === "close" ? t.closedBroken : t.reopenedNoReason,
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
                      {t.firstFix(f.firstFixWorks)}
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
              {t.designTitle(summary.design.coreCovered, summary.design.coreTotal)}
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              {summary.design.cases.length === 0
                ? t.noDesign
                : summary.design.designedBeforeExecuting
                  ? t.designedFirst
                  : t.designedLate}
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
                      {t.caseFound(c.case.id, c.case.input)}
                      {mission.bugs.find((b) => b.id === c.reveals)?.title}
                    </li>
                  ))}
                {summary.design.cases
                  .filter((c) => c.expectedWrong)
                  .map((c) => (
                    <li key={`e${c.case.id}`} className="text-ase-warning">
                      {t.expectedWrong(
                        c.case.id,
                        c.case.input,
                        c.case.expectAccept ? t.accepts : t.rejects,
                        c.correctAccept ? t.accepts : t.rejects,
                        c.missingRules,
                      )}
                    </li>
                  ))}
                {summary.design.cases
                  .filter((c) => c.resultWrong)
                  .map((c) => (
                    <li key={`x${c.case.id}`} className="text-ase-warning">
                      {t.resultWrong(c.case.id, c.case.result === "pass", !!c.reveals)}
                    </li>
                  ))}
              </ul>
            )}
          </section>
        )}

        {risk && (
          <section>
            <h2 className="mb-1 font-sans text-heading-sm font-semibold">
              {t.riskTitle}
            </h2>
            <p className="mb-4 text-body-sm text-ase-muted">
              {risk.rated === 0
                ? t.noRisk
                : t.riskMatches(risk.topMatches, risk.refTop.length)}
            </p>
            <div className="overflow-x-auto rounded-ase-lg border border-ase-border">
              <table className="w-full min-w-[600px] text-left text-body-sm">
                <thead className="bg-ase-bg2 text-caption uppercase text-ase-muted">
                  <tr>
                    <th className="px-3 py-2">{t.thArea}</th>
                    <th className="px-3 py-2">{t.thMine}</th>
                    <th className="px-3 py-2">{t.thSenior}</th>
                    <th className="px-3 py-2">{t.thWhy}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ase-border">
                  {risk.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 text-ase-text">
                        {r.label}
                        {risk.refTop.includes(r.id) && (
                          <span className="ml-2 text-caption text-ase-error">
                            {t.priorityTag}
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
              {t.decisions}
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
            {t.learned}
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
            {t.senior}
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
            <RotateCcw className="h-4 w-4" /> {t.restart}
          </button>
          <Link
            to={backTo}
            className="rounded-ase-md border border-ase-border px-4 py-2 text-body-sm text-ase-text hover:border-ase-brand"
          >
            {t.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
