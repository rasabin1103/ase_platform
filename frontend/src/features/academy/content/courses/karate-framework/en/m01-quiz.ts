import type { QuizQuestion } from '../../../../engine/types'

/** Quiz before and after mission 2 (Match, your superpower). English translation of ../m01-quiz.ts. */
export const m01QuizEn: { pre: QuizQuestion[]; post: QuizQuestion[] } = {
  pre: [
    {
      id: 'k1pre_marker',
      conceptId: 'fuzzy',
      question: "What does match response.balance == '#number' check?",
      options: ['That balance is the text “#number”', 'That balance is a number, whatever its value', 'That balance is greater than zero', 'Nothing: it is a comment'],
      correct: 1,
      explanation: 'Fuzzy markers check the type or the format, not a specific value.',
    },
    {
      id: 'k1pre_eq',
      conceptId: 'fuzzy',
      question: "The response is { id: 'A', extra: 1 }. What happens with match response == { id: '#string' }?",
      options: ['It passes: id is a string', 'It fails: with == the extra key is one too many', 'It fails: id is not a number', 'It passes: == ignores additional keys'],
      correct: 1,
      explanation: '== requires exactly the same keys. To ignore the others, use contains.',
    },
    {
      id: 'k1pre_each',
      conceptId: 'each',
      question: 'How do you check that every account in response.items is active?',
      options: ["match response.items == { status: 'ACTIVE' }", "match each response.items contains { status: 'ACTIVE' }", "match response.items[0].status == 'ACTIVE'", "assert response.items == 'ACTIVE'"],
      correct: 1,
      explanation: 'match each applies the comparison to every element; contains only looks at status.',
    },
    {
      id: 'k1pre_compat',
      conceptId: 'compat',
      question: 'Which of these API changes is compatible with existing clients?',
      options: ['Renaming holder to holderName', 'Changing balance from a number to text', 'Adding a new optional field', 'Removing the createdAt field'],
      correct: 2,
      explanation: 'Adding something optional breaks nobody; removing, renaming or changing the type does.',
    },
  ],
  post: [
    {
      id: 'k1post_optional',
      conceptId: 'fuzzy',
      question: "Which values does the marker '##string' accept?",
      options: ['Only strings', 'Strings, null or the key being absent', 'Anything', 'Only null'],
      correct: 1,
      explanation: 'The double hash makes the marker optional: absent or null are also accepted.',
    },
    {
      id: 'k1post_message',
      conceptId: 'each',
      question: 'A match each fails with “$[1].balance | not a number”. What does it mean?',
      options: ['The first element has no balance', 'The second element has a balance that is not a number', 'There is one element too many', 'The schema is written wrong'],
      correct: 1,
      explanation: 'Indexes start at 0: $[1] is the second element.',
    },
    {
      id: 'k1post_snapshot',
      conceptId: 'contract',
      question: 'Why not compare against the exact response saved in a file?',
      options: ['Because Karate can’t read files', 'Because the data (balances, dates) changes and the test would fail without the contract having changed', 'Because it is slower', 'Because == doesn’t work with objects'],
      correct: 1,
      explanation: 'A contract checks shape, not data: fuzzy markers make it robust.',
    },
    {
      id: 'k1post_v15',
      conceptId: 'compat',
      question: 'After a deployment, your strict contract fails because the field alias appears, documented as new and optional. What do you do?',
      options: ['Report a critical bug', "Add alias: '##string' to the schema: it is a compatible change", 'Replace == with contains in every test', 'Delete the contract test'],
      correct: 1,
      explanation: 'A new, optional, documented field is compatible: you update the schema.',
    },
  ],
}
