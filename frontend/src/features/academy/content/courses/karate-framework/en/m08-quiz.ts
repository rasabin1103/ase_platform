import type { QuizQuestion } from '../../../../engine/types'

/** Pre- and post-test for mission 9 (Green in the pipeline). English translation of ../m08-quiz.ts. */
export const m08QuizEn: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k8pre_green',
      conceptId: 'runner',
      question: 'The pipeline says BUILD SUCCESS, but the Karate report has red scenarios. What is most likely?',
      options: ['The report is wrong', 'The runner does not check the number of failures', 'Maven is broken', 'It is normal in parallel'],
      correct: 1,
      explanation: 'Runner…parallel() returns results; without an assert on getFailCount(), the JUnit test always passes.',
    },
    {
      id: 'k8pre_smoke',
      conceptId: 'runner',
      question: 'Which scenarios go in the smoke on every pull request?',
      options: ['All of them', 'The essential, fast ones', 'The ones that fail often', 'None: smoke is manual'],
      correct: 1,
      explanation: 'The smoke gives a fast signal; the full regression goes in another job.',
    },
    {
      id: 'k8pre_flaky',
      conceptId: 'flaky',
      question: 'A test fails one run out of three. What do you do first?',
      options: ['Retry it until it passes', 'Investigate what changes between runs', 'Delete it', 'Tag it @ignore'],
      correct: 1,
      explanation: 'An unstable test has a cause: in the test (data, waits) or in the application.',
    },
    {
      id: 'k8pre_shared',
      conceptId: 'paralelo',
      question: 'In parallel, a test checks the exact balance of an account that other tests also use. What will happen?',
      options: ['It will always pass', 'It will pass or fail depending on the order', 'It will always fail', 'Karate blocks it'],
      correct: 1,
      explanation: 'The other scenarios change the balance at the same time: it depends on who gets there first.',
    },
  ],
  post: [
    {
      id: 'k8post_assert',
      conceptId: 'runner',
      question: 'Which line makes the job fail when a scenario fails?',
      options: ['System.out.println(results.getFailCount());', 'assertEquals(0, results.getFailCount(), results.getErrorMessages());', '.parallel(4);', '.tags("~@ignore");'],
      correct: 1,
      explanation: 'The assert turns Karate failures into a failed JUnit test and a BUILD FAILURE.',
    },
    {
      id: 'k8post_tags',
      conceptId: 'runner',
      question: 'What does .tags("@pagos", "~@lento") run?',
      options: ['@pagos or the ones not tagged @lento', 'The @pagos ones that are not @lento', 'Only the @lento ones', 'Nothing: it is an error'],
      correct: 1,
      explanation: 'Each argument adds a condition (AND); a comma inside an argument means OR.',
    },
    {
      id: 'k8post_data',
      conceptId: 'paralelo',
      question: 'How do you fix a balance test that fails in parallel?',
      options: ['By running it last', 'With its own account created in the scenario itself', 'With parallel(1) forever', 'With a sleep'],
      correct: 1,
      explanation: 'With its own data, whatever the other scenarios do does not affect it.',
    },
    {
      id: 'k8post_api',
      conceptId: 'flaky',
      question: 'A scenario fails only in parallel and always passes when run alone. Its data is its own. What do you suspect?',
      options: ['The test is wrong', 'An API problem with simultaneous requests', 'The pipeline is slow', 'Nothing: it is normal'],
      correct: 1,
      explanation: 'If the test is isolated, different behavior under concurrency points to the application.',
    },
  ],
}
