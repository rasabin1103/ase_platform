import type { LessonModule } from '../../../../learn/types'

/** Course 9: Python from scratch · Module 2 — Making decisions. English version of ../m02-decidir.ts. */
export const m02DecidirEn: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm02-decidir',
  number: 2,
  lang: 'en',
  title: 'Making decisions',
  subtitle: 'Make your program compare data and choose what to do in each case.',
  goals: [
    'Compare values and understand True and False.',
    'Choose between paths with if, elif and else.',
    'Combine conditions with and, or and not.',
    'Look for a text inside another with in.',
    'Sort the expenses in your project.',
  ],
  lessons: [
    {
      id: 'comparar',
      title: 'Comparing: True or False',
      minutes: 6,
      blocks: [
        {
          kind: 'text',
          md: `To decide, you first have to **ask**. In Python a question is a **comparison**, and its answer is \`True\` or \`False\`: the \`bool\` type you saw in module 1.

| Operator | Means | Example | Result |
|---|---|---|---|
| \`==\` | equal | \`3 == 3\` | \`True\` |
| \`!=\` | different | \`3 != 4\` | \`True\` |
| \`<\` \`>\` | less, greater | \`5 < 2\` | \`False\` |
| \`<=\` \`>=\` | less or equal, greater or equal | \`5 >= 5\` | \`True\` |

- **Don't mix up** \`=\` (store in a variable) with \`==\` (compare).
- Texts can be compared too: \`"hello" == "hello"\` is \`True\`, but \`"Hello" == "hello"\` is \`False\`: case matters.
- A number and a text are never equal: \`5 == "5"\` is \`False\`.`,
        },
        {
          kind: 'example',
          id: 'ej_comparar',
          code: 'age = 17\nprint(age >= 18)\nprint(age == 17)\nprint("cat" == "Cat")\nadult = age >= 18\nprint("Adult?", adult)',
          note: 'Change the age and see how the results change.',
        },
        {
          kind: 'predict',
          id: 'p_comparar',
          code: 'a = 10\nb = "10"\nprint(a == 10)\nprint(a == b)\nprint(a != 7)',
          question: 'What does it print?',
          options: ['True\nTrue\nTrue', 'True\nFalse\nTrue', 'True\nFalse\nFalse', 'False\nFalse\nTrue'],
          correct: 1,
          explanation: '`a == 10` is true. `a == b` compares the number 10 with the text "10": they are different types, so it is `False`. `10 != 7` is true.',
        },
        {
          kind: 'exercise',
          id: 'e_aprobado',
          title: 'Did they pass?',
          prompt: `Store \`6.5\` in \`grade\`. Then store in \`passed\` whether the grade is **greater than or equal to 5** (a comparison, don't type \`True\` by hand) and show it:

\`\`\`
Passed: True
\`\`\``,
          starter: 'grade = 6.5\n# Store the comparison in passed\n\n# Show the result\n',
          solution: 'grade = 6.5\npassed = grade >= 5\nprint("Passed:", passed)',
          tests: [
            { kind: 'output', label: 'Shows "Passed: True"', expected: 'Passed: True' },
            { kind: 'assert', label: 'passed is the result of comparing the grade', code: 'assert passed is True' },
            { kind: 'source', label: 'Uses the >= operator', pattern: />=/ },
          ],
          hints: ['"Greater than or equal" is written `>=`.', '`passed = grade >= 5` stores `True` or `False`.', 'To show it: `print("Passed:", passed)`.'],
        },
      ],
    },
    {
      id: 'if',
      title: 'if, elif and else',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `With \`if\` the program runs some lines **only if** the condition is true:

\`\`\`
if temperature > 30:
    print("It's hot")
    print("Drink water")
print("End")
\`\`\`

Notice two things:

- The \`if\` line ends with a **colon** \`:\`.
- What depends on the \`if\` is **indented**: 4 spaces to the right (the editor adds them when you press Enter after the colon). Indentation is what tells Python what's inside. \`print("End")\` isn't indented, so it always runs.

## else: otherwise
\`else:\` covers everything else:

\`\`\`
if age >= 18:
    print("You can vote")
else:
    print("Not yet")
\`\`\`

## elif: otherwise, what if...?
For more than two paths, \`elif\` (short for *else if*). Python checks the conditions **in order** and runs **only the first one** that is true:

\`\`\`
if grade >= 9:
    print("Outstanding")
elif grade >= 7:
    print("Very good")
elif grade >= 5:
    print("Pass")
else:
    print("Fail")
\`\`\``,
        },
        {
          kind: 'example',
          id: 'ej_if',
          code: 'grade = float(input("Grade: "))\nif grade >= 9:\n    print("Outstanding")\nelif grade >= 7:\n    print("Very good")\nelif grade >= 5:\n    print("Pass")\nelse:\n    print("Fail")\nprint("Grade checked")',
          inputs: ['7.5'],
          note: 'Try 9.5, 7.5, 5 and 3.',
        },
        {
          kind: 'predict',
          id: 'p_orden_elif',
          code: 'points = 95\nif points > 50:\n    print("Good")\nelif points > 90:\n    print("Excellent")\nelse:\n    print("Keep going")',
          question: 'What does it print?',
          options: ['Excellent', 'Good', 'Good\nExcellent', 'Keep going'],
          correct: 1,
          explanation: 'Python takes the **first** condition that is true. 95 > 50 is already true, so it prints "Good" and doesn\'t look at the rest. That\'s why the strictest conditions go first.',
        },
        {
          kind: 'predict',
          id: 'p_sangria',
          code: 'x = 3\nif x > 5:\n    print("A")\n    print("B")\nprint("C")',
          question: 'What does it print?',
          options: ['A\nB\nC', 'B\nC', 'C', 'Nothing'],
          correct: 2,
          explanation: '3 > 5 is false, so both indented lines are skipped. `print("C")` isn\'t indented: it doesn\'t depend on the `if` and always runs.',
        },
        {
          kind: 'exercise',
          id: 'e_temperatura',
          title: 'What should I wear?',
          prompt: `Ask for the temperature with \`int(input("Temperature: "))\` and show:

- \`Coat\` if it is **less than 10**.
- \`Jacket\` if it is **between 10 and 19** (both included).
- \`T-shirt\` if it is **20 or more**.

\`\`\`
Temperature: 15
Jacket
\`\`\``,
          starter: 'temperature = int(input("Temperature: "))\n# Decide with if, elif and else\n',
          solution: 'temperature = int(input("Temperature: "))\nif temperature < 10:\n    print("Coat")\nelif temperature < 20:\n    print("Jacket")\nelse:\n    print("T-shirt")',
          sampleInputs: ['15'],
          tests: [
            { kind: 'output', label: '5 → Coat', expected: 'Temperature: 5\nCoat', inputs: ['5'] },
            { kind: 'output', label: '10 → Jacket (boundary)', expected: 'Temperature: 10\nJacket', inputs: ['10'] },
            { kind: 'output', label: '19 → Jacket (boundary)', expected: 'Temperature: 19\nJacket', inputs: ['19'] },
            { kind: 'output', label: '20 → T-shirt', expected: 'Temperature: 20\nT-shirt', inputs: ['20'] },
          ],
          hints: [
            'Three paths: `if`, `elif` and `else`.',
            'Start with the cold: `if temperature < 10:`. If that is not true, you already know it is 10 or more.',
            'The second case is `elif temperature < 20:` and the rest goes in `else:`. Don\'t forget the colons and the indentation.',
          ],
        },
      ],
    },
    {
      id: 'logica',
      title: 'and, or, not and in',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `Sometimes a single comparison isn't enough. Conditions are combined with:

- \`and\`: true if **both** are true. \`age >= 18 and has_licence\`.
- \`or\`: true if **at least one** is true. \`day == "Saturday" or day == "Sunday"\`.
- \`not\`: flips it. \`not raining\` is true when \`raining\` is false.

A range can be written in two ways: \`age >= 18 and age <= 65\` or, shorter, \`18 <= age <= 65\`.

## in: is it inside?
\`in\` asks whether a text is **inside** another:

\`\`\`
"bus" in "bus ticket"     # True
"train" in "bus ticket"   # False
\`\`\`

**Common mistake:** \`day == "Saturday" or "Sunday"\` doesn't do what it seems. You have to repeat the comparison: \`day == "Saturday" or day == "Sunday"\`.`,
        },
        {
          kind: 'example',
          id: 'ej_logica',
          code: 'age = 25\nhas_licence = True\nprint("Can drive?", age >= 18 and has_licence)\n\nday = "Sunday"\nprint("Weekend?", day == "Saturday" or day == "Sunday")\n\nraining = False\nprint("Go out without an umbrella?", not raining)\n\ndescription = "bus ticket"\nprint("Is it transport?", "bus" in description)',
        },
        {
          kind: 'predict',
          id: 'p_and_or',
          code: 'age = 16\npermission = True\nprint(age >= 18 and permission)\nprint(age >= 18 or permission)\nprint(not permission)',
          question: 'What does it print?',
          options: ['False\nTrue\nFalse', 'True\nTrue\nFalse', 'False\nFalse\nTrue', 'False\nTrue\nTrue'],
          correct: 0,
          explanation: '`16 >= 18` is false, so with `and` everything is false; with `or` it is enough for `permission` to be true. `not True` is `False`.',
        },
        {
          kind: 'exercise',
          id: 'e_entrada',
          title: 'Concert entry',
          prompt: `Ask for the age with \`int(input("Age: "))\` and whether they come with an adult with \`input("With an adult? (y/n): ")\`.

They can get in if they are **18 or over**, or if they are **14 or over and come with an adult** (\`"y"\`). Show \`Can enter\` or \`Cannot enter\`.

\`\`\`
Age: 15
With an adult? (y/n): y
Can enter
\`\`\``,
          starter: 'age = int(input("Age: "))\nwith_adult = input("With an adult? (y/n): ")\n# Decide whether they can enter\n',
          solution: 'age = int(input("Age: "))\nwith_adult = input("With an adult? (y/n): ")\nif age >= 18 or (age >= 14 and with_adult == "y"):\n    print("Can enter")\nelse:\n    print("Cannot enter")',
          sampleInputs: ['15', 'y'],
          tests: [
            { kind: 'output', label: '20, alone → can', expected: 'Age: 20\nWith an adult? (y/n): n\nCan enter', inputs: ['20', 'n'] },
            { kind: 'output', label: '15, with an adult → can', expected: 'Age: 15\nWith an adult? (y/n): y\nCan enter', inputs: ['15', 'y'] },
            { kind: 'output', label: '15, alone → cannot', expected: 'Age: 15\nWith an adult? (y/n): n\nCannot enter', inputs: ['15', 'n'] },
            { kind: 'output', label: '12, with an adult → cannot', expected: 'Age: 12\nWith an adult? (y/n): y\nCannot enter', inputs: ['12', 'y'] },
          ],
          hints: [
            'There are two ways to get in: join them with `or`.',
            'The second way has two conditions at once: `age >= 14 and with_adult == "y"`.',
            'With brackets it is clear: `if age >= 18 or (age >= 14 and with_adult == "y"):`.',
          ],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Your project: sorting the expense',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `Your tracker already records an expense. Now it will **sort it into a category** by its description, and **warn you** if it is a big one.

The rules (the description comes in lower case):

| If the description contains | Category |
|---|---|
| \`taxi\`, \`bus\` or \`train\` | \`transport\` |
| \`cinema\` or \`concert\` | \`leisure\` |
| \`super\` or \`coffee\` | \`food\` |
| anything else | \`other\` |

And if the amount is **100 or more**, add the line \`Warning: big expense\`.`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_categoria',
          title: 'Project · Sort the expense',
          project: true,
          prompt: `Write the program that:

1. Asks \`input("Description: ")\` and \`input("Amount: ")\` (decimal).
2. Stores the category from the table in the variable \`category\`.
3. Shows \`Category: …\` and, if the amount is 100 or more, \`Warning: big expense\`.

\`\`\`
Description: taxi to the airport
Amount: 35
Category: transport
\`\`\`

\`\`\`
Description: concert tickets
Amount: 120
Category: leisure
Warning: big expense
\`\`\``,
          starter: 'description = input("Description: ")\namount = float(input("Amount: "))\n# Decide the category\n\n# Show the category and, if needed, the warning\n',
          solution:
            'description = input("Description: ")\namount = float(input("Amount: "))\nif "taxi" in description or "bus" in description or "train" in description:\n    category = "transport"\nelif "cinema" in description or "concert" in description:\n    category = "leisure"\nelif "super" in description or "coffee" in description:\n    category = "food"\nelse:\n    category = "other"\nprint(f"Category: {category}")\nif amount >= 100:\n    print("Warning: big expense")',
          sampleInputs: ['taxi to the airport', '35'],
          tests: [
            { kind: 'output', label: '€35 taxi → transport, no warning', expected: 'Description: taxi to the airport\nAmount: 35\nCategory: transport', inputs: ['taxi to the airport', '35'] },
            { kind: 'output', label: '€120 concert → leisure and warning', expected: 'Description: concert tickets\nAmount: 120\nCategory: leisure\nWarning: big expense', inputs: ['concert tickets', '120'] },
            { kind: 'output', label: '€100 supermarket → food and warning (boundary)', expected: 'Description: supermarket\nAmount: 100\nCategory: food\nWarning: big expense', inputs: ['supermarket', '100'] },
            { kind: 'output', label: 'Train pass → transport', expected: 'Description: monthly train pass\nAmount: 54.6\nCategory: transport', inputs: ['monthly train pass', '54.6'] },
            { kind: 'output', label: 'Book → other', expected: 'Description: book\nAmount: 18\nCategory: other', inputs: ['book', '18'] },
            { kind: 'assert', label: 'The category is stored in the variable category', code: 'assert category == "food"', inputs: ['coffee with milk', '2.5'] },
          ],
          hints: [
            'To check whether a word is in the description: `"taxi" in description`.',
            'Join the words of one category with `or`, repeating `in description` for each one.',
            'First an `if … elif … else` that stores `category`; then, **separately**, an `if amount >= 100:` for the warning.',
          ],
        },
        {
          kind: 'text',
          md: `## What you've learned
- Comparisons (\`==\`, \`!=\`, \`<\`, \`>=\`…) give \`True\` or \`False\`.
- \`if\`, \`elif\` and \`else\` choose a path; indentation marks what is inside.
- \`and\`, \`or\` and \`not\` combine conditions, and \`in\` looks for a text inside another.

In module 3 your tracker will learn to **repeat**: record as many expenses as you like until you type "end".`,
        },
      ],
    },
  ],
}
