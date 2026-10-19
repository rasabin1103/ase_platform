import type { Lesson } from '../../../../engine/types'

/** Sergio's micro-lessons (Karate course · mission 1). English translation of ../m00-lessons.ts. */
export const m00LessonsEn: Lesson[] = [
  {
    id: 'why_karate',
    question: 'Why Karate and not Postman or RestAssured?',
    conceptId: 'api_automation',
    cost: 5,
    body: `- **Postman** is great for exploring an API by hand, but its collections fall short for a large suite versioned alongside the code.
- **RestAssured** is powerful, but every test is Java code: hard to read if you don't program.
- **Karate** writes tests in an almost natural language (Gherkin), comes with HTTP, JSON and assertions built in, and runs with JUnit in the pipeline. No *step definitions* to code, unlike Cucumber.

The tool isn't what matters: what matters is that the tests run **on their own on every deployment**.`,
  },
  {
    id: 'anatomy',
    question: 'How do you read a Karate feature?',
    conceptId: 'feature_anatomy',
    cost: 5,
    body: `\`\`\`
Feature: what is being tested
  Scenario: one behaviour
    Given url baseUrl
    And path 'accounts', 'ACC-1001'
    When method get
    Then status 200
    And match response.id == 'ACC-1001'
\`\`\`
- **url** and **path** build the address (path segments are joined with “/”).
- **method** fires the request. Before it, nothing has happened.
- The response is stored in the **response** variable (already parsed JSON) and the code in **responseStatus**.
- **status** and **match** check: if they fail, the scenario stops there.`,
  },
  {
    id: 'gwt',
    question: 'Does it matter whether I write Given, When, Then or *?',
    conceptId: 'feature_anatomy',
    cost: 3,
    body: `Not to Karate: **Given, When, Then, And, But and \`*\`** are equivalent; they only help readability. The convention:
- **Given** to set up (url, path, param, request).
- **When** for the action (method).
- **Then / And** for the checks.
- **\`*\`** for supporting steps (def, print, url in the Background).

What does matter: Karate is case-sensitive (**Given**, not *given*) and every step starts with a keyword.`,
  },
  {
    id: 'match',
    question: 'What exactly does match do?',
    conceptId: 'assertions',
    cost: 5,
    body: `**match** compares an actual value with an expected one and, if they differ, fails with a clear message:
\`\`\`
match failed: EQUALS
  $ | not equal (STRING:STRING)
  'ACTIVE'
  'BLOCKED'
\`\`\`
First the **actual** value, then the **expected** one.

- \`match response.status == 'UP'\` compares one field.
- \`match response == { ... }\` compares the whole response (you'll go deep into it tomorrow).
- \`status 200\` only looks at the HTTP code: a 200 with wrong data would pass it. That's why you almost always use **status + match**.`,
  },
  {
    id: 'background',
    question: 'What is the Background for?',
    conceptId: 'background',
    cost: 3,
    body: `The **Background:** steps run **before each scenario** (not once per file). It's the place for what every scenario shares, like \`* url baseUrl\`.

Benefits: less repetition and a single place to change things. Remember each scenario is **independent**: don't count on another scenario having run first.`,
  },
  {
    id: 'red',
    question: 'My test fails: is it the test or the API?',
    conceptId: 'red_test',
    cost: 5,
    body: `Before blaming anyone:
1. **Read the message** in the report and the **console**: what was sent and what came back.
2. Compare with the **specification** (wiki): what should the API respond?
3. If your test asks for something the specification doesn't say, the test is wrong: fix it.
4. If the test asks for the right thing and the API doesn't deliver, it's a **bug**: report it with the scenario as evidence, the expected response and the actual one.

A test that fails because of a bug **is not changed to make it pass**: it stays red until the bug is fixed.`,
  },
]
