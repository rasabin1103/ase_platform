import type { LessonModule } from '../../../../learn/types'

/** Course 9: Python from scratch · Module 1 — Your first program. English version of ../m01-primer-programa.ts. */
export const m01PrimerProgramaEn: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm01-primer-programa',
  number: 1,
  lang: 'en',
  title: 'Your first program',
  subtitle: 'Write to the screen, store data in variables, do calculations and ask the user.',
  goals: [
    'Show text and results with print().',
    'Store data in variables and change it.',
    'Tell apart whole numbers, decimals, text and booleans, and convert between them.',
    'Ask for data with input() and show it with f-strings.',
    'Start your project: the expense tracker.',
  ],
  lessons: [
    {
      id: 'print',
      title: 'print: your first line of code',
      minutes: 6,
      blocks: [
        {
          kind: 'text',
          md: `A **program** is a list of instructions the computer runs in order, from top to bottom.

The first instruction you'll use is \`print()\`: it writes on the screen whatever you put between the brackets.

- **Text** goes in quotes: \`print("Hello")\`. Double or single quotes both work, but the opening and closing ones must match.
- A **number** goes without quotes: \`print(42)\`. If you write a calculation, Python works it out: \`print(2 + 3)\` shows \`5\`.
- You can give it **several things** separated by commas: \`print("I have", 3, "cats")\`. Python writes them with a space in between.
- Each \`print()\` writes on a **new line**.

Anything after \`#\` is a **comment**: Python ignores it. It's there to explain the code to whoever reads it.`,
        },
        {
          kind: 'example',
          id: 'ej_print',
          code: '# This is a comment: Python does not run it\nprint("Hello, world!")\nprint("Python", "is", "easy")\nprint(2 + 3)\nprint("2 + 3")',
          note: 'Press "Run". Then change the texts or the calculations and run it again.',
        },
        {
          kind: 'predict',
          id: 'p_comillas',
          code: 'print(10 - 4)\nprint("10 - 4")',
          question: 'What does this program print?',
          options: ['6\n6', '6\n10 - 4', '10 - 4\n6', '10 - 4\n10 - 4'],
          correct: 1,
          explanation: 'Without quotes, `10 - 4` is a calculation and Python works it out. In quotes it is text and is written as it is.',
        },
        {
          kind: 'exercise',
          id: 'e_saludo',
          title: 'Introduce yourself',
          prompt: `Write a program that shows **exactly** these two lines:

\`\`\`
Hi, my name is Python
Today I'm learning to code
\`\`\``,
          starter: '# Write your two print() here\n',
          solution: 'print("Hi, my name is Python")\nprint("Today I\'m learning to code")',
          tests: [{ kind: 'output', label: 'Shows the two exact lines', expected: "Hi, my name is Python\nToday I'm learning to code" }],
          hints: ['You need two `print()`, one per line.', 'Each text goes in quotes: `print("Hi, my name is Python")`.', "Watch the comma, the capital letters and the apostrophe in I'm: use double quotes around that text."],
        },
      ],
    },
    {
      id: 'variables',
      title: 'Variables: storing data',
      minutes: 7,
      blocks: [
        {
          kind: 'text',
          md: `A **variable** is a name that stores a value so you can use it later. It's created with \`=\`:

\`\`\`
name = "Lucy"
age = 30
\`\`\`

\`=\` doesn't mean "is equal": it means **store**. "Store "Lucy" in \`name\`".

Then you use the name instead of the value: \`print(name)\` shows \`Lucy\`, **without quotes**. If you add quotes (\`print("name")\`), you write the word *name*.

## Rules for names
- Letters, numbers and underscores: \`total_price\`, \`expense2\`.
- They can't start with a number or contain spaces.
- Upper and lower case matter: \`Age\` and \`age\` are different variables.
- The Python habit: lower case and words joined with \`_\`.

## Changing the value
A variable can change: \`age = age + 1\` works out \`age + 1\` with the current value and stores it back in \`age\`.`,
        },
        {
          kind: 'example',
          id: 'ej_variables',
          code: 'name = "Lucy"\nage = 30\nprint(name, "is", age, "years old")\n\nage = age + 1\nprint("Next year,", name, "will be", age)',
        },
        {
          kind: 'predict',
          id: 'p_reasignar',
          code: 'points = 5\npoints = points + 2\npoints = points * 2\nprint(points)',
          question: 'What does it print?',
          options: ['5', '7', '14', '12'],
          correct: 2,
          explanation: 'Line by line: `points` is 5, then 5 + 2 = 7, then 7 × 2 = 14.',
        },
        {
          kind: 'exercise',
          id: 'e_producto',
          title: 'A product and its price',
          prompt: `Create two variables:

- \`product\`, with the text \`"Headphones"\`.
- \`price\`, with the number \`59.9\`.

Then show, with **a single** \`print()\` and using the variables:

\`\`\`
Headphones costs 59.9
\`\`\``,
          starter: '# Create the variables product and price\n\n# Show the sentence using the variables\n',
          solution: 'product = "Headphones"\nprice = 59.9\nprint(product, "costs", price)',
          tests: [
            { kind: 'assert', label: 'The variable product is "Headphones"', code: 'assert product == "Headphones"' },
            { kind: 'assert', label: 'The variable price is 59.9 (a number, no quotes)', code: 'assert price == 59.9' },
            { kind: 'output', label: 'Shows "Headphones costs 59.9"', expected: 'Headphones costs 59.9' },
            { kind: 'source', label: "Uses the variables in the print (don't type the whole sentence by hand)", pattern: /print\s*\([^)]*\bproduct\b[^)]*\bprice\b/ },
          ],
          hints: ['Variables are created with `=`: `product = "Headphones"`.', 'The price is a number: no quotes.', 'In `print()` separate with commas: the variable, the text `"costs"` and the other variable.'],
        },
      ],
    },
    {
      id: 'tipos',
      title: 'Data types and operations',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `Every value has a **type**. The four basic ones:

| Type | What it is | Examples |
|---|---|---|
| \`int\` | whole number | \`3\`, \`-10\`, \`2026\` |
| \`float\` | decimal number (with a **dot**) | \`3.5\`, \`0.21\` |
| \`str\` | text (string) | \`"Hello"\`, \`"42"\` |
| \`bool\` | true or false | \`True\`, \`False\` |

\`type(value)\` tells you the type of something.

## Operations with numbers
- \`+\` adds, \`-\` subtracts, \`*\` multiplies, \`/\` divides (always gives a decimal: \`10 / 2\` is \`5.0\`).
- \`//\` whole-number division (\`7 // 2\` is \`3\`) and \`%\` the remainder (\`7 % 2\` is \`1\`).
- \`**\` power (\`2 ** 3\` is \`8\`).
- \`round(x, 2)\` rounds to 2 decimals.

## Operations with text
- \`+\` **joins** texts: \`"ha" + "ha"\` is \`"haha"\`.
- \`*\` repeats them: \`"ha" * 3\` is \`"hahaha"\`.
- A number in quotes is text: \`"5" + "5"\` is \`"55"\`, not \`10\`.

## Converting
\`int("42")\` → \`42\`, \`float("3.5")\` → \`3.5\`, \`str(42)\` → \`"42"\`. Adding text and a number gives an error (\`TypeError\`): you have to convert first.`,
        },
        {
          kind: 'example',
          id: 'ej_tipos',
          code: 'print(type(3), type(3.5), type("3"), type(True))\nprint(7 / 2, 7 // 2, 7 % 2, 2 ** 3)\nprint("ha" * 3)\nprint("5" + "5", int("5") + int("5"))\nprint(round(10 / 3, 2))',
        },
        {
          kind: 'predict',
          id: 'p_texto_suma',
          code: 'a = "5"\nb = "5"\nprint(a + b)',
          question: 'What does it print?',
          options: ['10', '55', '5 5', 'An error'],
          correct: 1,
          explanation: '`a` and `b` are texts (they are in quotes), so `+` joins them: `"55"`. To add them as numbers: `int(a) + int(b)`.',
        },
        {
          kind: 'predict',
          id: 'p_division',
          code: 'print(10 / 2)\nprint(10 // 4)',
          question: 'What does it print?',
          options: ['5\n2.5', '5.0\n2', '5\n2', '5.0\n2.5'],
          correct: 1,
          explanation: '`/` always returns a decimal (`5.0`). `//` is whole-number division: 4 goes into 10 twice.',
        },
        {
          kind: 'exercise',
          id: 'e_iva',
          title: 'Work out the VAT',
          prompt: `You have a product that costs \`120\` euros **before VAT**. VAT is **21 %**.

1. Store the value \`120\` in \`price\`.
2. Work out \`vat\`, 21 % of the price (multiply by \`0.21\`).
3. Work out \`total\`, the price plus the VAT.
4. Show the total rounded to 2 decimals.

The output must be:

\`\`\`
145.2
\`\`\``,
          starter: 'price = 120\n# Work out vat and total\n\n# Show the total rounded to 2 decimals\n',
          solution: 'price = 120\nvat = price * 0.21\ntotal = price + vat\nprint(round(total, 2))',
          tests: [
            { kind: 'assert', label: 'vat is 21 % of price', code: 'assert abs(vat - price * 0.21) < 0.001' },
            { kind: 'assert', label: 'total is price + vat', code: 'assert abs(total - (price + vat)) < 0.001' },
            { kind: 'output', label: 'Shows 145.2', expected: '145.2' },
          ],
          hints: ['21 % of something is multiplying it by `0.21`.', '`vat = price * 0.21` and then `total = price + vat`.', 'To show it: `print(round(total, 2))`.'],
        },
      ],
    },
    {
      id: 'input',
      title: 'Asking the user: input and f-strings',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `\`input("question")\` shows the question, waits for the user to type something and gives it back to you:

\`\`\`
name = input("What's your name? ")
\`\`\`

**Careful:** \`input()\` always returns **text**, even if the user types a number. To do calculations, convert it: \`age = int(input("Age? "))\` or \`float(...)\` if it may have decimals.

## f-strings: text with gaps
An **f-string** is text with an \`f\` in front. Whatever you put in curly brackets \`{}\` is replaced by its value:

\`\`\`
print(f"Hi, {name}. Next year you'll be {age + 1}.")
\`\`\`

To show a number with 2 decimals: \`{price:.2f}\`. So \`3.5\` shows as \`3.50\`.

On this page, when a program calls \`input()\`, the answers come from the box under the editor: **what the user types**, one line per value.`,
        },
        {
          kind: 'example',
          id: 'ej_input',
          code: 'name = input("What\'s your name? ")\nage = int(input("How old are you? "))\nprint(f"{name}, next year you\'ll be {age + 1}")\nprint(f"Pi with two decimals: {3.14159:.2f}")',
          inputs: ['Ann', '30'],
          note: 'Change the inputs and run it again.',
        },
        {
          kind: 'predict',
          id: 'p_fstring',
          code: 'price = 3.5\nquantity = 2\nprint(f"Total: {price * quantity:.2f} €")',
          question: 'What does it print?',
          options: ['Total: 7 €', 'Total: 7.00 €', 'Total: {price * quantity:.2f} €', 'Total: 7.0 €'],
          correct: 1,
          explanation: 'Inside the brackets `3.5 * 2 = 7.0` is worked out, and `:.2f` shows it with two decimals: `7.00`.',
        },
        {
          kind: 'predict',
          id: 'p_input_texto',
          code: 'n = input("Number: ")   # the user types 4\nprint(n * 2)',
          question: 'If the user types `4`, what does it print?',
          options: ['8', '44', '4 4', 'An error'],
          correct: 1,
          explanation: '`input()` returns the text `"4"`, and text times 2 is repeated: `"44"`. With `int(input(...))` you would get 8.',
          inputs: ['4'],
        },
        {
          kind: 'exercise',
          id: 'e_doble',
          title: 'Double it',
          prompt: `Ask for a whole number with \`input("Number: ")\` and show its double with an f-string:

\`\`\`
Number: 4
Double 4 is 8
\`\`\`

(The first line is the question with what the user types.)`,
          starter: '# Ask for the number and convert it to an integer\n\n# Show the double with an f-string\n',
          solution: 'n = int(input("Number: "))\nprint(f"Double {n} is {n * 2}")',
          sampleInputs: ['4'],
          tests: [
            { kind: 'output', label: 'With 4 shows "Double 4 is 8"', expected: 'Number: 4\nDouble 4 is 8', inputs: ['4'] },
            { kind: 'output', label: 'With 15 shows "Double 15 is 30"', expected: 'Number: 15\nDouble 15 is 30', inputs: ['15'] },
            { kind: 'source', label: 'Uses an f-string', pattern: /\bf["']/ },
          ],
          hints: ['`input()` returns text: convert it with `int(...)`.', '`n = int(input("Number: "))`.', 'You can calculate inside the f-string: `f"Double {n} is {n * 2}"`.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Your project: the first expense',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `Throughout the course you'll build **your expense tracker**: a program that records what you spend, sorts it, saves it and gives you a summary. Each module adds a piece.

Today's piece: record **one expense**. The program asks for the description and the amount (before VAT), works out 21 % VAT and shows a summary with two decimals and the euro sign.`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_gasto',
          title: 'Project · Record an expense',
          project: true,
          prompt: `Write the program that:

1. Asks for the description with \`input("Description: ")\`.
2. Asks for the amount with \`input("Amount: ")\` and converts it to a **decimal** number.
3. Works out \`vat\` (21 %) and \`total\` (amount + VAT).
4. Shows the summary, with every amount with 2 decimals:

\`\`\`
Description: Coffee
Amount: 10
--- Summary ---
Description: Coffee
Amount: 10.00 €
VAT (21 %): 2.10 €
Total: 12.10 €
\`\`\``,
          starter: '# 1. Ask for the description\n\n# 2. Ask for the amount and convert it to a decimal\n\n# 3. Work out vat and total\n\n# 4. Show the summary\nprint("--- Summary ---")\n',
          solution:
            'description = input("Description: ")\namount = float(input("Amount: "))\nvat = amount * 0.21\ntotal = amount + vat\nprint("--- Summary ---")\nprint(f"Description: {description}")\nprint(f"Amount: {amount:.2f} €")\nprint(f"VAT (21 %): {vat:.2f} €")\nprint(f"Total: {total:.2f} €")',
          sampleInputs: ['Coffee', '10'],
          tests: [
            {
              kind: 'output',
              label: 'A €10 coffee',
              inputs: ['Coffee', '10'],
              expected: 'Description: Coffee\nAmount: 10\n--- Summary ---\nDescription: Coffee\nAmount: 10.00 €\nVAT (21 %): 2.10 €\nTotal: 12.10 €',
            },
            {
              kind: 'output',
              label: 'A €899.99 laptop (with decimals)',
              inputs: ['Laptop', '899.99'],
              expected: 'Description: Laptop\nAmount: 899.99\n--- Summary ---\nDescription: Laptop\nAmount: 899.99 €\nVAT (21 %): 189.00 €\nTotal: 1088.99 €',
            },
            { kind: 'assert', label: 'Stores the VAT and the total in the variables vat and total', code: 'assert abs(vat - 2.1) < 0.001 and abs(total - 12.1) < 0.001', inputs: ['Coffee', '10'] },
          ],
          hints: [
            'The amount may have decimals: `float(input("Amount: "))`.',
            'Just like in the VAT exercise: `vat = amount * 0.21` and `total = amount + vat`.',
            'For the two decimals, in the f-string: `{amount:.2f}`. For example `print(f"Total: {total:.2f} €")`.',
          ],
        },
        {
          kind: 'text',
          md: `## What you've learned
- \`print()\` writes on the screen; texts go in quotes.
- Variables store values with \`=\` and can change.
- \`int\`, \`float\`, \`str\` and \`bool\`, and how to convert between them.
- \`input()\` always returns text, and f-strings show values with a format.

In module 2 your tracker will learn to **decide**: sort each expense by its amount and description.`,
        },
      ],
    },
  ],
}
