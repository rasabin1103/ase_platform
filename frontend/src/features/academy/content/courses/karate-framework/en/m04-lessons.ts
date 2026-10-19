import type { Lesson } from '../../../../engine/types'

/** Sergio's micro-lessons (Karate course · mission 5). English translation of ../m04-lessons.ts. */
export const m04LessonsEn: Lesson[] = [
  {
    id: 'outline',
    question: 'How does a Scenario Outline work?',
    conceptId: 'outline',
    cost: 5,
    body: `It’s a template: the steps with \`<column>\` placeholders and an **Examples** table with one row per case. Karate generates one scenario per row.
\`\`\`
Scenario Outline: amount <amount> → <status>
  * def body = read('payloads/transfer.json')
  Given path 'transfers'
  And request body
  When method post
  Then status <status>

  Examples:
    | amount! | status |
    | 0.01    | 201    |
    | 1000.01 | 422    |
\`\`\`
Each column is also a **variable** (\`amount\`, \`status\`). Put the data in the title so you can recognize the row in the report.`,
  },
  {
    id: 'types',
    question: 'Why does my amount arrive as text?',
    conceptId: 'outline',
    cost: 3,
    body: `Table cells are **text**: \`| 500 |\` is \`"500"\`. If you send it in a JSON body, the API receives a string and answers 400.

With **!** at the end of the column name (\`amount!\`), Karate evaluates the cell: \`500\` is a number, \`true\` a boolean and \`{ a: 1 }\` an object. In \`<amount>\` the name goes without the exclamation mark.`,
  },
  {
    id: 'boundaries',
    question: 'What data goes in the table?',
    conceptId: 'boundaries',
    cost: 5,
    body: `**Boundary value analysis**: for every rule with a range, the value just inside and just outside each edge.
- Minimum €0.01: **0** (outside) and **0.01** (inside).
- Maximum €1,000: **1,000** (inside) and **1,000.01** (outside).
- Text up to 140: **140** and **141** characters.

A value from the middle (500) only checks the easy part. The typical mistakes (\`>\` instead of \`>=\`) only show up at the exact edge.`,
  },
  {
    id: 'dynamic',
    question: 'Can I keep the data in a file?',
    conceptId: 'outline',
    cost: 5,
    body: `Yes: **dynamic Examples**. A single cell with an expression that returns a list of objects:
\`\`\`
Examples:
  | read('data/negativos.json') |
\`\`\`
Each object is a row and each key a variable **with its type** (numbers, objects…), no \`!\` needed. That way someone who never touches the feature can maintain the data, and it grows without changing the steps.`,
  },
  {
    id: 'merge',
    question: 'How do I change just one field of the body in each row?',
    conceptId: 'outline',
    cost: 3,
    body: `With **karate.merge**: it merges objects and the last one wins.
\`\`\`
* def body = karate.merge(read('payloads/transfer.json'), patch)
\`\`\`
with \`"patch": { "fromAccount": "ACC-1004" }\` in the row. Or with \`* set body.field = value\`.

For long texts, \`'x'.repeat(140)\` generates 140 characters without typing them.`,
  },
]
