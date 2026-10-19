import type { Lesson } from '../../../../engine/types'

/** Sergio's micro-lessons (Karate course · mission 2). English translation of ../m01-lessons.ts. */
export const m01LessonsEn: Lesson[] = [
  {
    id: 'fuzzy',
    question: 'What are fuzzy markers?',
    conceptId: 'fuzzy',
    cost: 5,
    body: `Special strings on the **expected** side of a match that check the shape instead of the value:
- \`#string\`, \`#number\`, \`#boolean\`, \`#array\`, \`#object\`
- \`#null\` (present and null), \`#notnull\`, \`#present\`, \`#notpresent\`
- \`#ignore\`: I don’t care what comes back
- \`#uuid\`, \`#regex EXPRESSION\`
- \`#? expression\`: \`_\` is the value. E.g.: \`'#? _ > 0'\` or \`'#number? _ >= 0'\`
- With two hash signs it is **optional**: \`##string\` accepts a string, null or the key being absent.

\`\`\`
match response == { id: '#string', balance: '#number', alias: '##string' }
\`\`\``,
  },
  {
    id: 'eq_contains',
    question: '== or contains?',
    conceptId: 'fuzzy',
    cost: 3,
    body: `- **==** requires the object to have **exactly** those keys: if the API adds or removes one, it fails. That is what you want in a **contract**.
- **contains** only looks at the keys you write and ignores the rest. Useful to check a couple of values (\`match response contains { status: 'ACTIVE' }\`).
- In lists, \`contains\` looks for elements: \`match [1, 2, 3] contains 2\`.
- There are also \`!contains\`, \`contains only\` (same elements in any order) and \`contains any\`.`,
  },
  {
    id: 'each',
    question: 'How do I validate every element of a list?',
    conceptId: 'each',
    cost: 3,
    body: `With **match each**: it applies the comparison to every element.
\`\`\`
And match each response.items == account
And match each response.items contains { status: 'ACTIVE' }
\`\`\`
If it fails, the message tells you which one: \`$[1].balance | not a number\` is the balance field of the **second** element (counting starts at 0).`,
  },
  {
    id: 'reuse',
    question: 'Where do I keep the schema so I don’t repeat it?',
    conceptId: 'fuzzy',
    cost: 3,
    body: `With **def** in the **Background**: it is available in every scenario of the file.
\`\`\`
Background:
  * url baseUrl
  * def account = { id: '#string', iban: '#regex ES\\\\d{22}', ... }
\`\`\`
Then \`match response == account\` or \`match each response.items == account\`. When the contract changes, you change it in **one** place. In later missions you will move it to a JSON file with \`read()\`.`,
  },
  {
    id: 'regex',
    question: 'How do I write a regular expression in Karate?',
    conceptId: 'fuzzy',
    cost: 3,
    body: `\`'#regex ES\\\\d{22}'\`: the expression has to match the **whole** value.

Inside a string, the backslash is written **twice** (\`\\\\d\` means “a digit”). So ES followed by 22 digits is \`'#regex ES\\\\d{22}'\`.

For conditions that are not a regex, use a predicate: \`'#number? _ >= 0'\` (a number, greater than or equal to zero).`,
  },
  {
    id: 'compat',
    question: 'Which API changes break the people using it?',
    conceptId: 'compat',
    cost: 5,
    body: `**Compatible** (they don’t break a well-built client):
- Adding a new **optional** field.
- Adding an endpoint or an optional parameter.

**Breaking** (they do break):
- Removing or **renaming** a field.
- Changing the **type** (number → text) or the format.
- Making something mandatory that used to be optional.

A strict contract (\`==\`) fails in both cases. Your job is to read the changelog and decide: if it is compatible, you update the schema; if not, it is a bug (or a new version announced well in advance).`,
  },
]
