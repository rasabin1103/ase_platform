import type { Lesson } from '../../../../engine/types'

/** Sergio's micro-lessons (Karate course · mission 9). English translation of ../m08-lessons.ts. */
export const m08LessonsEn: Lesson[] = [
  {
    id: 'runner',
    question: 'How do I make the pipeline fail when a test fails?',
    conceptId: 'runner',
    cost: 5,
    body: `For CI you use a JUnit 5 runner with \`Runner\`:
\`\`\`
Results results = Runner.path("classpath:openapi")
        .tags("~@ignore")
        .parallel(4);
assertEquals(0, results.getFailCount(), results.getErrorMessages());
\`\`\`
\`parallel(n)\` runs the scenarios and **returns** the results; it does not fail anything on its own. Without the \`assertEquals\`, the JUnit test always passes and Maven says **BUILD SUCCESS** even with red scenarios. It needs \`import static org.junit.jupiter.api.Assertions.*;\`.`,
  },
  {
    id: 'tags',
    question: 'How do I choose which scenarios each job runs?',
    conceptId: 'runner',
    cost: 3,
    body: `With **tags**: \`@smoke\` on the line before \`Scenario:\` (or before \`Feature:\`, for the whole file).
- \`.tags("@smoke")\`: only the tagged ones.
- \`.tags("@smoke,@critico")\`: one **or** the other (comma = OR).
- \`.tags("@pagos", "~@lento")\`: tagged @pagos **and** not @lento (each argument adds a condition).

The smoke on every PR is short: the essentials (the API responds, one read, a typical error) and nothing that waits for seconds.`,
  },
  {
    id: 'paralelo',
    question: 'What changes when you run in parallel?',
    conceptId: 'paralelo',
    cost: 5,
    body: `The scenarios are spread across threads and run **at the same time** against the same API, and the order changes on every run.

A scenario that reads or changes data another one also touches (the balance of ACC-1001, “the latest transfer”, a counter) will pass or fail depending on who gets there first. The fix is for each scenario to **create its own data** (\`POST /sandbox/accounts\`) and check only its own.`,
  },
  {
    id: 'flaky',
    question: 'What do I do with a test that fails “sometimes”?',
    conceptId: 'flaky',
    cost: 5,
    body: `An unstable (*flaky*) test has a cause. The usual ones:
- **Shared data** or order dependency → own data per scenario.
- **Fixed waits** on asynchronous processes → \`retry until\`.
- **The API** behaves differently under load or concurrency → it is a **bug**: report it.

Retrying until it passes or tagging it \`@ignore\` hides all three. Tip: if the scenario always passes when run alone, look at what was happening at the same time.`,
  },
  {
    id: 'informes',
    question: 'Which reports does Karate generate?',
    conceptId: 'runner',
    cost: 3,
    body: `Always the **HTML** one in \`target/karate-reports/karate-summary.html\` (the one you look at when something fails).

For other tools, in the \`Runner\`:
- \`.outputCucumberJson(true)\`: Cucumber JSON (Xray, Allure, Jenkins plugins).
- \`.outputJunitXml(true)\`: JUnit XML (what almost every CI reads).

They go before \`.parallel(…)\`, which is what starts the run.`,
  },
]
