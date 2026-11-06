import type { LessonModule } from '../../../../learn/types'

/** Course 9: Python from scratch · Module 3 — Repeating. English version of ../m03-repetir.ts. */
export const m03RepetirEn: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm03-repetir',
  number: 3,
  lang: 'en',
  title: 'Repeating',
  subtitle: 'Let the computer repeat the work for you: for and while loops.',
  goals: [
    'Repeat a fixed number of times with for and range().',
    'Repeat while a condition holds with while.',
    'Count and add up inside a loop.',
    'Leave early with break and skip a round with continue.',
    'Record as many expenses as you like in your project.',
  ],
  lessons: [
    {
      id: 'for',
      title: 'for and range: repeat N times',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `A **loop** repeats a block of code. The most common one is \`for\`:

\`\`\`
for i in range(3):
    print("Hello", i)
\`\`\`

It writes \`Hello 0\`, \`Hello 1\` and \`Hello 2\`. As with \`if\`, the line ends in \`:\` and what repeats is **indented**.

\`range\` produces the numbers the loop goes through:

| You write | Numbers |
|---|---|
| \`range(5)\` | 0, 1, 2, 3, 4 (starts at 0 and does **not** include 5) |
| \`range(1, 6)\` | 1, 2, 3, 4, 5 |
| \`range(0, 10, 2)\` | 0, 2, 4, 6, 8 (in steps of 2) |

The \`for\` variable (here \`i\`) takes each value in turn. You can call it what you like: \`for number in range(1, 11):\`.

\`for\` also goes through the characters of a text: \`for letter in "hello":\`.`,
        },
        {
          kind: 'example',
          id: 'ej_for',
          code: 'for number in range(1, 6):\n    print(number, "x 3 =", number * 3)\n\nfor letter in "Python":\n    print(letter)',
        },
        {
          kind: 'predict',
          id: 'p_range',
          code: 'for i in range(2, 6):\n    print(i)',
          question: 'What does it print?',
          options: ['2\n3\n4\n5\n6', '2\n3\n4\n5', '3\n4\n5', '2\n6'],
          correct: 1,
          explanation: '`range(2, 6)` starts at 2 and stops **before** 6: 2, 3, 4, 5.',
        },
        {
          kind: 'exercise',
          id: 'e_tabla',
          title: 'Times table',
          prompt: `Ask for a number with \`int(input("Number: "))\` and show its times table from 1 to 10, with this format:

\`\`\`
Number: 7
7 x 1 = 7
7 x 2 = 14
…
7 x 10 = 70
\`\`\``,
          starter: 'n = int(input("Number: "))\n# Go from 1 to 10 and show each line\n',
          solution: 'n = int(input("Number: "))\nfor i in range(1, 11):\n    print(f"{n} x {i} = {n * i}")',
          sampleInputs: ['7'],
          tests: [
            {
              kind: 'output',
              label: 'The 7 times table, from 1 to 10',
              expected: 'Number: 7\n7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63\n7 x 10 = 70',
              inputs: ['7'],
            },
            {
              kind: 'output',
              label: 'The 2 times table',
              expected: 'Number: 2\n2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20',
              inputs: ['2'],
            },
            { kind: 'source', label: 'Uses a for loop', pattern: /\bfor\b/ },
          ],
          hints: ['From 1 to 10 included is `range(1, 11)`.', '`for i in range(1, 11):` and, inside, a `print`.', 'With an f-string: `print(f"{n} x {i} = {n * i}")`.'],
        },
      ],
    },
    {
      id: 'acumular',
      title: 'Counting and adding in a loop',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `Two patterns you'll use all the time:

**Accumulator**: a variable that starts at 0 and adds up on every round.

\`\`\`
total = 0
for price in [3, 5, 2]:
    total = total + price
print(total)   # 10
\`\`\`

**Counter**: the same, but adds 1 each time something happens.

\`\`\`
evens = 0
for n in range(1, 11):
    if n % 2 == 0:
        evens = evens + 1
\`\`\`

\`%\` is the **remainder** of the division: \`7 % 2\` is 1, \`8 % 2\` is 0. If the remainder when dividing by 2 is 0, the number is even.

Shortcut: \`total += price\` is the same as \`total = total + price\`.

**Very important:** the variable is created **before** the loop. If you put it inside, it goes back to 0 on every round.`,
        },
        {
          kind: 'example',
          id: 'ej_acumular',
          code: 'total = 0\nhow_many = 0\nfor n in range(1, 11):\n    total += n\n    if n % 2 == 0:\n        how_many += 1\nprint("Sum from 1 to 10:", total)\nprint("Even numbers:", how_many)',
        },
        {
          kind: 'predict',
          id: 'p_acumular_dentro',
          code: 'for n in range(1, 4):\n    total = 0\n    total += n\nprint(total)',
          question: 'What does it print?',
          options: ['6', '3', '0', '1'],
          correct: 1,
          explanation: '`total = 0` is **inside** the loop: on every round it is set to 0 and then only `n` is added. On the last round `n` is 3, so it ends at 3. Accumulators are created before the loop.',
        },
        {
          kind: 'exercise',
          id: 'e_suma_notas',
          title: 'The average of five grades',
          prompt: `Ask for **5 grades** (decimals) with \`input("Grade: ")\` using a loop, add them up in \`total\` and show the average with one decimal:

\`\`\`
Grade: 7
Grade: 8.5
Grade: 6
Grade: 9
Grade: 5.5
Average: 7.2
\`\`\``,
          starter: 'total = 0\n# Ask for 5 grades with a loop and add them up\n\n# Show the average with one decimal\n',
          solution: 'total = 0\nfor i in range(5):\n    grade = float(input("Grade: "))\n    total += grade\naverage = total / 5\nprint(f"Average: {average:.1f}")',
          sampleInputs: ['7', '8.5', '6', '9', '5.5'],
          tests: [
            { kind: 'output', label: 'Average of 7, 8.5, 6, 9 and 5.5 → 7.2', expected: 'Grade: 7\nGrade: 8.5\nGrade: 6\nGrade: 9\nGrade: 5.5\nAverage: 7.2', inputs: ['7', '8.5', '6', '9', '5.5'] },
            { kind: 'output', label: 'Five tens → 10.0', expected: 'Grade: 10\nGrade: 10\nGrade: 10\nGrade: 10\nGrade: 10\nAverage: 10.0', inputs: ['10', '10', '10', '10', '10'] },
            { kind: 'assert', label: 'total is the sum of the grades', code: 'assert abs(total - 36) < 0.001', inputs: ['7', '8.5', '6', '9', '5.5'] },
            { kind: 'source', label: 'Uses a loop (not five input() written by hand)', pattern: /\b(for|while)\b/ },
          ],
          hints: ['A `for i in range(5):` repeats 5 times.', 'Inside: `grade = float(input("Grade: "))` and `total += grade`.', 'After the loop (not indented): `print(f"Average: {total / 5:.1f}")`.'],
        },
      ],
    },
    {
      id: 'while',
      title: 'while, break and continue',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `\`for\` works when you know **how many times** to repeat. When you don't, \`while\` repeats **as long as** the condition is true:

\`\`\`
balance = 100
while balance > 0:
    balance = balance - 30
    print("Left:", balance)
\`\`\`

**Watch out for infinite loops:** if the condition never becomes false, the loop never ends. Here, if you forget to subtract, \`balance\` is always 100. (On this page the program stops by itself after 8 seconds.)

## break: leave now
\`break\` ends the loop right there. It's the typical pattern to **ask for data until a keyword**:

\`\`\`
while True:
    text = input("Type something (end to stop): ")
    if text == "end":
        break
    print("You typed", text)
\`\`\`

\`while True\` would be infinite; the \`break\` is the way out.

## continue: skip this round
\`continue\` jumps straight to the next round, without running the rest:

\`\`\`
for n in range(1, 6):
    if n == 3:
        continue
    print(n)    # 1, 2, 4, 5
\`\`\``,
        },
        {
          kind: 'example',
          id: 'ej_while',
          code: 'attempts = 0\nwhile True:\n    password = input("Password: ")\n    attempts += 1\n    if password == "python":\n        print("You\'re in!")\n        break\n    print("Wrong")\nprint("Attempts:", attempts)',
          inputs: ['hello', '1234', 'python'],
          note: 'The inputs have three attempts. Change the order or put the right one first.',
        },
        {
          kind: 'predict',
          id: 'p_while',
          code: 'n = 1\nwhile n < 20:\n    n = n * 3\nprint(n)',
          question: 'What does it print?',
          options: ['9', '20', '27', '81'],
          correct: 2,
          explanation: '1 → 3 → 9 → 27. When `n` is 27, `27 < 20` is false and the loop stops. It is printed after the loop.',
        },
        {
          kind: 'predict',
          id: 'p_continue',
          code: 'for n in range(1, 7):\n    if n % 2 == 0:\n        continue\n    print(n)',
          question: 'What does it print?',
          options: ['2\n4\n6', '1\n3\n5', '1\n2\n3\n4\n5\n6', '1'],
          correct: 1,
          explanation: 'For even numbers (remainder 0) `continue` runs and the `print` is skipped. Only odd numbers are printed.',
        },
        {
          kind: 'exercise',
          id: 'e_hasta_cero',
          title: 'Add up until zero',
          prompt: `Ask for whole numbers with \`input("Number (0 to stop): ")\` **until the user types 0**. Then show how many numbers they typed (not counting the 0) and their sum:

\`\`\`
Number (0 to stop): 5
Number (0 to stop): 10
Number (0 to stop): 0
Numbers: 2
Sum: 15
\`\`\``,
          starter: 'how_many = 0\ntotal = 0\n# Repeat until a 0 comes in\n\nprint("Numbers:", how_many)\nprint("Sum:", total)\n',
          solution: 'how_many = 0\ntotal = 0\nwhile True:\n    n = int(input("Number (0 to stop): "))\n    if n == 0:\n        break\n    how_many += 1\n    total += n\nprint("Numbers:", how_many)\nprint("Sum:", total)',
          sampleInputs: ['5', '10', '0'],
          tests: [
            { kind: 'output', label: '5, 10 and 0 → 2 numbers, sum 15', expected: 'Number (0 to stop): 5\nNumber (0 to stop): 10\nNumber (0 to stop): 0\nNumbers: 2\nSum: 15', inputs: ['5', '10', '0'] },
            { kind: 'output', label: 'A 0 straight away → 0 numbers', expected: 'Number (0 to stop): 0\nNumbers: 0\nSum: 0', inputs: ['0'] },
            {
              kind: 'output',
              label: 'Negatives count too',
              expected: 'Number (0 to stop): 3\nNumber (0 to stop): -1\nNumber (0 to stop): 4\nNumber (0 to stop): 0\nNumbers: 3\nSum: 6',
              inputs: ['3', '-1', '4', '0'],
            },
          ],
          hints: ["Since you don't know how many numbers there will be: `while True:`.", 'Inside, first ask for the number; if it is 0, `break`.', 'If it is not 0, `how_many += 1` and `total += n`.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Your project: every expense',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `Until now your tracker recorded **one** expense. Now it will ask for expenses **until you type \`end\`** as the description, and at the end it will tell you how many you recorded and how much they add up to.

It's the pattern from the previous lesson: \`while True\`, ask, check the keyword with \`break\`, then count and add up.`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_bucle',
          title: 'Project · Record expenses until "end"',
          project: true,
          prompt: `Write the program that repeats:

1. Ask \`input("Description (or end): ")\`. If it is \`end\`, stop.
2. Otherwise, ask \`input("Amount: ")\` (decimal), add 1 to \`how_many\` and the amount to \`total\`.

When it finishes, show:

\`\`\`
Description (or end): coffee
Amount: 2.5
Description (or end): taxi
Amount: 12
Description (or end): end
Expenses recorded: 2
Total: 14.50 €
\`\`\``,
          starter: 'how_many = 0\ntotal = 0\n# Repeat until the description is "end"\n\n# Show the summary\n',
          solution:
            'how_many = 0\ntotal = 0\nwhile True:\n    description = input("Description (or end): ")\n    if description == "end":\n        break\n    amount = float(input("Amount: "))\n    how_many += 1\n    total += amount\nprint(f"Expenses recorded: {how_many}")\nprint(f"Total: {total:.2f} €")',
          sampleInputs: ['coffee', '2.5', 'taxi', '12', 'end'],
          tests: [
            {
              kind: 'output',
              label: 'Coffee and taxi → 2 expenses, €14.50',
              expected: 'Description (or end): coffee\nAmount: 2.5\nDescription (or end): taxi\nAmount: 12\nDescription (or end): end\nExpenses recorded: 2\nTotal: 14.50 €',
              inputs: ['coffee', '2.5', 'taxi', '12', 'end'],
            },
            { kind: 'output', label: '"end" straight away → 0 expenses', expected: 'Description (or end): end\nExpenses recorded: 0\nTotal: 0.00 €', inputs: ['end'] },
            {
              kind: 'output',
              label: 'Three expenses',
              expected: 'Description (or end): super\nAmount: 45.3\nDescription (or end): cinema\nAmount: 9\nDescription (or end): bus\nAmount: 1.5\nDescription (or end): end\nExpenses recorded: 3\nTotal: 55.80 €',
              inputs: ['super', '45.3', 'cinema', '9', 'bus', '1.5', 'end'],
            },
            { kind: 'assert', label: 'The variables how_many and total hold the result', code: 'assert how_many == 2 and abs(total - 14.5) < 0.001', inputs: ['coffee', '2.5', 'taxi', '12', 'end'] },
          ],
          hints: [
            'Create `how_many = 0` and `total = 0` before the loop.',
            'Inside `while True:` ask for the description and, if it is `"end"`, `break` **before** asking for the amount.',
            'After the loop: `print(f"Total: {total:.2f} €")`.',
          ],
        },
        {
          kind: 'text',
          md: `## What you've learned
- \`for\` with \`range()\` repeats a fixed number of times; \`while\` repeats while a condition holds.
- Counters and accumulators: created before the loop and updated inside it.
- \`break\` leaves the loop and \`continue\` jumps to the next round.

In module 4 your tracker will stop forgetting expenses: it will keep them all in a **list** so you can go back over them and group them.`,
        },
      ],
    },
  ],
}
