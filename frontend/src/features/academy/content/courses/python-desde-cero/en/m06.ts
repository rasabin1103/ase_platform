import type { LessonModule } from '../../../../learn/types'

/** Course 9: Python from scratch · Module 6 — Text and errors. English version of ../m06-textos-errores.ts. */
export const m06TextosErroresEn: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm06-textos-errores',
  number: 6,
  lang: 'en',
  title: 'Text and errors',
  subtitle: "Clean up and transform text, understand Python's errors and stop your program from breaking.",
  goals: [
    'Transform text with lower(), strip(), replace(), split() and join().',
    'Read a Python error: the type, the line and the message.',
    'Fix the most common errors.',
    'Catch errors with try and except.',
    'Validate what the user types in your project.',
  ],
  lessons: [
    {
      id: 'metodos',
      title: 'Working with text',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `Texts (\`str\`) come with **methods**: functions you call with a dot after the text. They **return a new text**; the original doesn't change.

| Method | Example | Result |
|---|---|---|
| \`lower()\` / \`upper()\` | \`"Hello".lower()\` | \`"hello"\` |
| \`strip()\` | \`"  hello  ".strip()\` | \`"hello"\` (removes spaces at both ends) |
| \`replace(a, b)\` | \`"2,5".replace(",", ".")\` | \`"2.5"\` |
| \`split(sep)\` | \`"a;b;c".split(";")\` | \`["a", "b", "c"]\` |
| \`sep.join(list)\` | \`", ".join(["a", "b"])\` | \`"a, b"\` |
| \`startswith(x)\` | \`"GB12".startswith("GB")\` | \`True\` |
| \`title()\` | \`"ann smith".title()\` | \`"Ann Smith"\` |

They can be **chained**: \`text.strip().lower()\` first removes spaces and then makes it lower case.

## Pieces of a text
As with lists, \`text[0]\` is the first character and \`text[-1]\` the last. A **slice**: \`text[0:3]\` is characters 0, 1 and 2. \`"Python"[:2]\` is \`"Py"\`.`,
        },
        {
          kind: 'example',
          id: 'ej_metodos',
          code: 'name = "   lucy SMITH  "\nclean = name.strip().title()\nprint(f"[{clean}]")\n\nsentence = "apples;pears;grapes"\nfruits = sentence.split(";")\nprint(fruits)\nprint(" and ".join(fruits))\n\nprice = "12,50"\nprint(float(price.replace(",", ".")) * 2)\nprint("Python"[:2], "Python"[-1])',
        },
        {
          kind: 'predict',
          id: 'p_metodos',
          code: 'text = "  Hello World  "\ntext.upper()\nprint(text.strip())',
          question: 'What does it print?',
          options: ['HELLO WORLD', 'Hello World', '  HELLO WORLD  ', '  Hello World'],
          correct: 1,
          explanation: '`text.upper()` returns a new upper-case text, but it isn\'t stored anywhere: `text` doesn\'t change. Then `strip()` removes the spaces: "Hello World".',
        },
        {
          kind: 'exercise',
          id: 'e_iniciales',
          title: 'Initials',
          prompt: `Ask for a full name with \`input("Full name: ")\` and show its **initials in upper case, with a dot after each one**. The user may leave extra spaces at the start or the end.

\`\`\`
Full name:   ann mary smith
Initials: A.M.S.
\`\`\``,
          starter: 'name = input("Full name: ")\n# Split the words and join their initials\n',
          solution: 'name = input("Full name: ")\nwords = name.strip().split()\ninitials = ""\nfor w in words:\n    initials += w[0].upper() + "."\nprint("Initials:", initials)',
          sampleInputs: ['  ann mary smith '],
          tests: [
            { kind: 'output', label: 'ann mary smith → A.M.S.', expected: 'Full name:   ann mary smith\nInitials: A.M.S.', inputs: ['  ann mary smith '] },
            { kind: 'output', label: 'Luke Brown → L.B.', expected: 'Full name: Luke Brown\nInitials: L.B.', inputs: ['Luke Brown'] },
            { kind: 'output', label: 'A single name → E.', expected: 'Full name: eve\nInitials: E.', inputs: ['eve'] },
          ],
          hints: ['`name.strip().split()` gives the list of words (with no arguments, `split()` splits on spaces).', 'The initial of a word `w` is `w[0]`, and in upper case `w[0].upper()`.', 'Build it up: `initials = ""` and in the loop `initials += w[0].upper() + "."`.'],
        },
      ],
    },
    {
      id: 'leer_errores',
      title: 'Reading an error',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `Errors aren't a failure: they're Python telling you **what** happened and **where**. An error message has three parts that are always worth reading:

1. **The type**: \`NameError\`, \`TypeError\`…
2. **The line** where it happened.
3. **The message**, which explains the problem.

| Error | What it usually means |
|---|---|
| \`SyntaxError\` | Something badly written: unclosed quotes or brackets, missing colons… |
| \`IndentationError\` | The indentation isn't the right one. |
| \`NameError\` | You use a name that doesn't exist: misspelt, or text without quotes. |
| \`TypeError\` | You mix types: \`"Total: " + 5\`. |
| \`ValueError\` | The type is fine but the value isn't: \`int("hello")\`. |
| \`ZeroDivisionError\` | You divide by zero. |
| \`IndexError\` / \`KeyError\` | A position or a key that doesn't exist. |

**How to fix an error:** go to the line the error mentions, read the message and ask yourself what value each variable has at that moment. In this course, under the error you'll also see an explanation in plain language.`,
        },
        {
          kind: 'predict',
          id: 'p_error_tipo',
          code: 'age = 30\nprint("You are " + age + " years old")',
          question: 'What happens when you run it?',
          options: ['It prints "You are 30 years old"', "TypeError: text and a number can't be added", "NameError: age doesn't exist", 'SyntaxError'],
          correct: 1,
          explanation: "With `+` Python doesn't join text and a number. Fixes: `str(age)`, a comma in the `print` or an f-string.",
        },
        {
          kind: 'predict',
          id: 'p_error_nombre',
          code: 'price = 10\nprint(Price * 2)',
          question: 'What happens when you run it?',
          options: ['It prints 20', 'TypeError', "NameError: Price doesn't exist (case matters)", 'It prints "Price * 2"'],
          correct: 2,
          explanation: "`Price` and `price` are different names. Python doesn't know `Price`: NameError on line 2.",
        },
        {
          kind: 'exercise',
          id: 'e_arregla',
          title: 'Fix the program',
          prompt: `This program has **three errors**. Run it, read each error, fix it and run again until it works. It must show:

\`\`\`
Product: Keyboard
Units: 3
Total: 89.97 €
\`\`\``,
          starter: 'product = "Keyboard"\nprice = 29.99\nunits = "3"\n\nprint("Product: " + product\nprint("Units: " + units)\ntotal = price * units\nprint(f"Total: {totl:.2f} €")\n',
          solution: 'product = "Keyboard"\nprice = 29.99\nunits = "3"\n\nprint("Product: " + product)\nprint("Units: " + units)\ntotal = price * int(units)\nprint(f"Total: {total:.2f} €")',
          tests: [
            { kind: 'output', label: 'Shows product, units and total', expected: 'Product: Keyboard\nUnits: 3\nTotal: 89.97 €' },
            { kind: 'assert', label: 'total is a number (89.97)', code: 'assert abs(total - 89.97) < 0.001' },
          ],
          hints: [
            'The first error is a `SyntaxError`: on line 5 a bracket is not closed.',
            'Then a `TypeError` comes up when multiplying: `units` is text. Convert it with `int(units)` in the calculation.',
            'The last one is a `NameError`: there is a misspelt name in the f-string.',
          ],
        },
      ],
    },
    {
      id: 'try',
      title: "try and except: so it doesn't break",
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `Some errors don't depend on you but on the **user**: if they type "hello" where you expected a number, \`int()\` gives \`ValueError\` and the program stops.

\`try\` and \`except\` let you **catch** the error and decide what to do:

\`\`\`
try:
    age = int(input("Age: "))
    print("Next year you'll be", age + 1)
except ValueError:
    print("That's not a number")
\`\`\`

- Python runs the \`try\` block. If everything goes well, it skips the \`except\`.
- If a \`ValueError\` happens, it jumps **at that moment** to the \`except\` (the rest of the \`try\` doesn't run).
- Always give the **type** of error you expect. An \`except:\` without a type catches everything, including the errors in your own code, and hides them.

## Ask until it's valid
With a \`while True\` the question repeats until the value is valid:

\`\`\`
while True:
    try:
        age = int(input("Age: "))
        break                    # valid: leave the loop
    except ValueError:
        print("Type a whole number")
\`\`\``,
        },
        {
          kind: 'example',
          id: 'ej_try',
          code: 'while True:\n    try:\n        a = int(input("Dividend: "))\n        b = int(input("Divisor: "))\n        print("Result:", a / b)\n        break\n    except ValueError:\n        print("They must be whole numbers")\n    except ZeroDivisionError:\n        print("You can\'t divide by zero")',
          inputs: ['ten', '10', '0', '10', '4'],
          note: 'The inputs cause both errors before the good division. Change them and see what happens.',
        },
        {
          kind: 'predict',
          id: 'p_try',
          code: 'try:\n    n = int("3.5")\n    print("One")\nexcept ValueError:\n    print("Two")\nprint("Three")',
          question: 'What does it print?',
          options: ['One\nThree', 'Two\nThree', 'One\nTwo\nThree', 'Two'],
          correct: 1,
          explanation: '`int("3.5")` gives `ValueError` (for text with decimals you need `float`). It jumps to the `except`, which prints "Two", and then the program goes on with "Three". "One" never runs.',
        },
        {
          kind: 'exercise',
          id: 'e_pedir_numero',
          title: "Ask until it's a number",
          prompt: `Ask for the age with \`input("Age: ")\` until the user types a **whole number**. Each time it isn't one, show \`Not a number\`. At the end:

\`\`\`
Age: thirty
Not a number
Age: 30
You are 30 years old
\`\`\``,
          starter: '# Repeat the question until the age is a whole number\n\nprint(f"You are {age} years old")\n',
          solution: 'while True:\n    try:\n        age = int(input("Age: "))\n        break\n    except ValueError:\n        print("Not a number")\n\nprint(f"You are {age} years old")',
          sampleInputs: ['thirty', '30'],
          tests: [
            { kind: 'output', label: '"thirty" and then 30', expected: 'Age: thirty\nNot a number\nAge: 30\nYou are 30 years old', inputs: ['thirty', '30'] },
            { kind: 'output', label: 'Valid the first time', expected: 'Age: 41\nYou are 41 years old', inputs: ['41'] },
            { kind: 'output', label: 'Two failed attempts', expected: 'Age: x\nNot a number\nAge: 2.5\nNot a number\nAge: 7\nYou are 7 years old', inputs: ['x', '2.5', '7'] },
            { kind: 'source', label: 'Catches ValueError', pattern: /except\s+ValueError/ },
          ],
          hints: ['The pattern is `while True:` with a `try` inside.', 'In the `try`: `age = int(input("Age: "))` and `break`.', '`except ValueError:` with the `print("Not a number")`.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Your project: clean data',
      minutes: 12,
      blocks: [
        {
          kind: 'text',
          md: `Users type in all sorts of ways: "  Coffee with MILK ", "2,5" with a comma, or "two" in letters. Your tracker will **clean** the description and **ask for the amount until it is valid**:

- The description, without spaces at the ends and in lower case.
- The amount accepts a decimal comma or dot.
- If it isn't a number: \`Invalid amount, type a number.\`
- If it is 0 or negative: \`The amount must be greater than 0.\``,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_validar',
          title: 'Project · Validate the input',
          project: true,
          prompt: `Write the program that:

1. Asks \`input("Description: ")\` and stores the clean text in \`description\` (no spaces at the ends and in lower case).
2. Asks \`input("Amount: ")\` until it is valid (with the rules above) and stores it in \`amount\`.
3. Shows \`Recorded: <description> · <amount with 2 decimals> €\`.

\`\`\`
Description:   Coffee with MILK
Amount: two
Invalid amount, type a number.
Amount: -3
The amount must be greater than 0.
Amount: 2,5
Recorded: coffee with milk · 2.50 €
\`\`\``,
          starter: '# 1. Ask for the description and clean it\n\n# 2. Ask for the amount until it is valid\n\n# 3. Show what was recorded\n',
          solution:
            'description = input("Description: ").strip().lower()\nwhile True:\n    text = input("Amount: ")\n    try:\n        amount = float(text.replace(",", "."))\n    except ValueError:\n        print("Invalid amount, type a number.")\n        continue\n    if amount <= 0:\n        print("The amount must be greater than 0.")\n        continue\n    break\nprint(f"Recorded: {description} · {amount:.2f} €")',
          sampleInputs: ['  Coffee with MILK ', 'two', '-3', '2,5'],
          tests: [
            {
              kind: 'output',
              label: 'Cleans the description and rejects "two" and -3',
              expected: 'Description:   Coffee with MILK\nAmount: two\nInvalid amount, type a number.\nAmount: -3\nThe amount must be greater than 0.\nAmount: 2,5\nRecorded: coffee with milk · 2.50 €',
              inputs: ['  Coffee with MILK ', 'two', '-3', '2,5'],
            },
            { kind: 'output', label: 'Valid the first time, with a dot', expected: 'Description: Taxi\nAmount: 12.4\nRecorded: taxi · 12.40 €', inputs: ['Taxi', '12.4'] },
            { kind: 'output', label: '0 is not valid', expected: 'Description: cinema\nAmount: 0\nThe amount must be greater than 0.\nAmount: 9\nRecorded: cinema · 9.00 €', inputs: ['cinema', '0', '9'] },
            { kind: 'assert', label: 'description and amount are clean in their variables', code: 'assert description == "coffee with milk" and amount == 2.5', inputs: ['  Coffee with MILK ', 'two', '-3', '2,5'] },
            { kind: 'source', label: 'Catches ValueError', pattern: /except\s+ValueError/ },
          ],
          hints: [
            'The description in one line: `description = input("Description: ").strip().lower()`.',
            'For the amount: `while True:`, `try: amount = float(text.replace(",", "."))` and `except ValueError:` with the message and `continue`.',
            'After the `try`, check `if amount <= 0:` (message and `continue`). If it reaches the end of the round, `break`.',
          ],
        },
        {
          kind: 'text',
          md: `## What you've learned
- Text methods return a new text and can be chained.
- An error tells you the type, the line and the reason: read it before changing anything.
- \`try\` / \`except\` catches the errors you expect so the program doesn't break.

In module 7 your tracker will be able to **save** the expenses to a file and **load** them when it opens again.`,
        },
      ],
    },
  ],
}
