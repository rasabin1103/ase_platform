import type { LessonModule } from '../../../../learn/types'

/** Course 9: Python from scratch · Module 5 — Functions. English version of ../m05-funciones.ts. */
export const m05FuncionesEn: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm05-funciones',
  number: 5,
  lang: 'en',
  title: 'Functions',
  subtitle: 'Give a piece of code a name and use it as many times as you like.',
  goals: [
    'Define functions with def and call them.',
    'Pass data with parameters and give back results with return.',
    'Tell apart showing a value (print) and returning it (return).',
    'Use default values and understand which variables each function sees.',
    'Reorganise your project into functions.',
  ],
  lessons: [
    {
      id: 'definir',
      title: 'Defining and calling',
      minutes: 7,
      blocks: [
        {
          kind: 'text',
          md: `A **function** is a block of code with a name. You've already used lots: \`print()\`, \`len()\`, \`input()\`. Now you'll create your own with \`def\`:

\`\`\`
def greet():
    print("Hi!")
    print("Welcome")
\`\`\`

This **defines** the function, but doesn't run it. To run it you have to **call** it by its name with brackets:

\`\`\`
greet()
greet()
\`\`\`

Each call runs its whole block. Advantages:

- **You don't repeat code**: you write it once and call it whenever you want.
- **You give a name** to what it does: \`work_out_vat()\` is clearer than three lines of calculations.
- **You change it in one place.**

The function has to be **defined before** you call it (higher up in the program).`,
        },
        {
          kind: 'example',
          id: 'ej_definir',
          code: 'def line():\n    print("-" * 20)\n\ndef header():\n    line()\n    print("  MY EXPENSE TRACKER")\n    line()\n\nheader()\nprint("No expenses today")\nline()',
        },
        {
          kind: 'predict',
          id: 'p_definir',
          code: 'def message():\n    print("B")\n\nprint("A")\nmessage()\nprint("C")\nmessage()',
          question: 'What does it print?',
          options: ['B\nA\nC\nB', 'A\nB\nC\nB', 'A\nC', 'A\nB\nC'],
          correct: 1,
          explanation: 'The `def` only defines the function; it prints nothing. Then the program goes on in order: "A", the call prints "B", "C" and another call prints "B".',
        },
        {
          kind: 'exercise',
          id: 'e_marco',
          title: 'A frame of asterisks',
          prompt: `Define a function \`frame()\` that shows a line of **10 asterisks**. Then call it, show \`Python\` and call it again:

\`\`\`
**********
Python
**********
\`\`\``,
          starter: '# Define the function frame\n\n# Call it, show Python and call it again\n',
          solution: 'def frame():\n    print("*" * 10)\n\nframe()\nprint("Python")\nframe()',
          tests: [
            { kind: 'output', label: 'Frame, text and frame', expected: '**********\nPython\n**********' },
            { kind: 'assert', label: 'The function frame exists', code: 'assert callable(frame)' },
          ],
          hints: ['`def frame():` and inside, indented, the `print`.', 'Text times a number is repeated: `"*" * 10`.', 'To call it: `frame()` (not indented, outside the function).'],
        },
      ],
    },
    {
      id: 'return',
      title: 'Parameters and return',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `Functions are much more useful when they **receive data** and **give back a result**.

**Parameters** go between the brackets of the \`def\`. When calling, you give them values (the **arguments**):

\`\`\`
def greet(name):
    print(f"Hi, {name}")

greet("Ann")     # Hi, Ann
\`\`\`

\`return\` **gives back** a value to whoever called, so they can store it or use it:

\`\`\`
def with_vat(price):
    return price * 1.21

total = with_vat(100)          # total is 121.0
print(with_vat(50) + 10)       # 70.5
\`\`\`

## print or return
It's the most common confusion:

- \`print\` **shows** the value on the screen, but the function gives nothing to whoever called it.
- \`return\` **hands over** the value; it doesn't show anything by itself.

A function without \`return\` returns \`None\` ("nothing"). If you do \`x = greet("Ann")\`, \`x\` is \`None\`.

When it reaches a \`return\` the function **ends**: anything below it doesn't run.`,
        },
        {
          kind: 'example',
          id: 'ej_return',
          code: 'def rectangle_area(base, height):\n    return base * height\n\ndef is_even(n):\n    return n % 2 == 0\n\na = rectangle_area(3, 4)\nprint("Area:", a)\nprint("Double the area:", rectangle_area(3, 4) * 2)\nprint("Is 8 even?", is_even(8))\nprint("Is 7 even?", is_even(7))',
        },
        {
          kind: 'predict',
          id: 'p_print_return',
          code: 'def double(n):\n    print(n * 2)\n\nresult = double(5)\nprint(result)',
          question: 'What does it print?',
          options: ['10\n10', '10\nNone', 'None\n10', '10'],
          correct: 1,
          explanation: 'The function **shows** 10 with `print`, but it has no `return`, so it returns `None`. That\'s why `result` is `None`.',
        },
        {
          kind: 'exercise',
          id: 'e_mayor',
          title: 'The biggest of three',
          prompt: `Write the function \`biggest(a, b, c)\` that **returns** (with \`return\`) the biggest of the three numbers, **without using** \`max()\`.

For example, \`biggest(3, 9, 5)\` returns \`9\`. The function doesn't have to show anything.`,
          starter: 'def biggest(a, b, c):\n    # Return the biggest of the three\n    pass\n\nprint(biggest(3, 9, 5))\n',
          solution: 'def biggest(a, b, c):\n    if a >= b and a >= c:\n        return a\n    elif b >= c:\n        return b\n    else:\n        return c\n\nprint(biggest(3, 9, 5))',
          tests: [
            { kind: 'assert', label: 'biggest(3, 9, 5) returns 9', code: 'assert biggest(3, 9, 5) == 9' },
            { kind: 'assert', label: 'biggest(10, 2, 7) returns 10', code: 'assert biggest(10, 2, 7) == 10' },
            { kind: 'assert', label: 'biggest(1, 4, 8) returns 8', code: 'assert biggest(1, 4, 8) == 8' },
            { kind: 'assert', label: 'Works with ties: biggest(5, 5, 2) returns 5', code: 'assert biggest(5, 5, 2) == 5' },
            { kind: 'assert', label: 'Works with negatives', code: 'assert biggest(-3, -1, -7) == -1' },
            { kind: 'source', label: "Doesn't use max()", pattern: /\bmax\s*\(/, forbid: true },
          ],
          hints: [
            'Compare: if `a` is greater than or equal to the other two, return `a`.',
            "If it isn't `a`, the biggest is between `b` and `c`: another comparison.",
            'Use `return` in each case (not `print`). Remove the `pass` when you write the body.',
          ],
        },
      ],
    },
    {
      id: 'defecto',
      title: 'Default values and scope',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `## Default values
A parameter can have a **default** value, used if you don't give it another one when calling:

\`\`\`
def with_vat(price, rate=21):
    return price * (1 + rate / 100)

with_vat(100)       # 121.0  (uses rate=21)
with_vat(100, 10)   # 110.0
\`\`\`

Parameters with a default value go **at the end**. When calling you can also name them: \`with_vat(100, rate=4)\`.

## Scope: which variables each function sees
Variables you create **inside** a function are **local**: they only exist while the function runs and can't be seen from outside.

\`\`\`
def calculate():
    result = 42
    return result

calculate()
print(result)   # NameError: it doesn't exist outside
\`\`\`

The right way to get a value out of a function is to return it: \`r = calculate()\`.

A function can **read** variables from outside, but it's better to pass it what it needs as a parameter: that way it's clearer and easier to reuse.`,
        },
        {
          kind: 'example',
          id: 'ej_defecto',
          code: 'def final_price(price, discount=0, vat_rate=21):\n    discounted = price * (1 - discount / 100)\n    return round(discounted * (1 + vat_rate / 100), 2)\n\nprint(final_price(100))\nprint(final_price(100, 10))\nprint(final_price(100, vat_rate=4))\nprint(final_price(100, discount=20, vat_rate=10))',
        },
        {
          kind: 'predict',
          id: 'p_ambito',
          code: 'def add_one(x):\n    x = x + 1\n    return x\n\nn = 5\nadd_one(n)\nprint(n)',
          question: 'What does it print?',
          options: ['6', '5', 'None', 'An error'],
          correct: 1,
          explanation: "Inside the function, `x` is a local variable: changing it doesn't change `n`. Also, the value the function returns isn't stored anywhere. `n` is still 5.",
        },
        {
          kind: 'exercise',
          id: 'e_propina',
          title: 'The tip',
          prompt: `Write the function \`bill_with_tip(amount, tip=10)\` that returns the amount plus the tip percentage, **rounded to 2 decimals**.

- \`bill_with_tip(50)\` → \`55.0\`
- \`bill_with_tip(50, 15)\` → \`57.5\`
- \`bill_with_tip(33.3, 0)\` → \`33.3\``,
          starter: '# Define bill_with_tip with tip=10 by default\n',
          solution: 'def bill_with_tip(amount, tip=10):\n    return round(amount * (1 + tip / 100), 2)',
          tests: [
            { kind: 'assert', label: 'Without a tip given it uses 10 %: 50 → 55.0', code: 'assert bill_with_tip(50) == 55.0' },
            { kind: 'assert', label: 'With 15 %: 50 → 57.5', code: 'assert bill_with_tip(50, 15) == 57.5' },
            { kind: 'assert', label: 'With 0 %: 33.3 → 33.3', code: 'assert bill_with_tip(33.3, 0) == 33.3' },
            { kind: 'assert', label: 'Rounds to 2 decimals: 19.99 → 21.99', code: 'assert bill_with_tip(19.99) == 21.99' },
          ],
          hints: ['The header is `def bill_with_tip(amount, tip=10):`.', 'The amount plus X % is `amount * (1 + tip / 100)`.', 'Return the rounded result: `return round(..., 2)`.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: "Your project: the tracker's functions",
      minutes: 12,
      blocks: [
        {
          kind: 'text',
          md: `Your tracker already does lots of things, but it's all mixed up. You'll split the logic into **three named functions**. That way you can use them from anywhere in the program (and in the next modules, from other files).

The functions **return** values; they don't show anything. The \`print\` is done by the main program, at the end.`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_funciones',
          title: "Project · The tracker's functions",
          project: true,
          prompt: `Write these functions:

1. \`with_vat(amount, rate=21)\`: returns the amount with VAT, rounded to 2 decimals.
2. \`category(description)\`: returns \`"transport"\`, \`"leisure"\`, \`"food"\` or \`"other"\` with the rules from module 2 (taxi/bus/train, cinema/concert, super/coffee).
3. \`totals(expenses)\`: receives a list of expenses (dictionaries with \`amount\` and \`category\`) and returns a dictionary with the total of each category.

The main program is already written at the end: don't change it.`,
          starter:
            'def with_vat(amount, rate=21):\n    pass\n\n\ndef category(description):\n    pass\n\n\ndef totals(expenses):\n    pass\n\n\n# Main program (don\'t change it)\nexpenses = []\nfor description, amount in [("super", 40), ("taxi", 15), ("coffee", 2)]:\n    expenses.append({"description": description, "amount": with_vat(amount), "category": category(description)})\nprint(totals(expenses))\n',
          solution:
            'def with_vat(amount, rate=21):\n    return round(amount * (1 + rate / 100), 2)\n\n\ndef category(description):\n    if "taxi" in description or "bus" in description or "train" in description:\n        return "transport"\n    elif "cinema" in description or "concert" in description:\n        return "leisure"\n    elif "super" in description or "coffee" in description:\n        return "food"\n    return "other"\n\n\ndef totals(expenses):\n    result = {}\n    for e in expenses:\n        cat = e["category"]\n        result[cat] = round(result.get(cat, 0) + e["amount"], 2)\n    return result\n\n\n# Main program (don\'t change it)\nexpenses = []\nfor description, amount in [("super", 40), ("taxi", 15), ("coffee", 2)]:\n    expenses.append({"description": description, "amount": with_vat(amount), "category": category(description)})\nprint(totals(expenses))',
          tests: [
            { kind: 'assert', label: 'with_vat(100) returns 121.0', code: 'assert with_vat(100) == 121.0' },
            { kind: 'assert', label: 'with_vat(100, 10) returns 110.0', code: 'assert with_vat(100, 10) == 110.0' },
            { kind: 'assert', label: 'with_vat(9.99) rounds to 12.09', code: 'assert with_vat(9.99) == 12.09' },
            { kind: 'assert', label: 'category sorts transport, leisure and food', code: 'assert category("train pass") == "transport"\nassert category("cinema") == "leisure"\nassert category("local supermarket") == "food"' },
            { kind: 'assert', label: 'category returns "other" if nothing fits', code: 'assert category("book") == "other"' },
            { kind: 'assert', label: 'totals groups by category', code: 'r = totals([{"amount": 10, "category": "leisure"}, {"amount": 5.5, "category": "food"}, {"amount": 2, "category": "leisure"}])\nassert r == {"leisure": 12, "food": 5.5}, r' },
            { kind: 'assert', label: 'totals of an empty list is an empty dictionary', code: 'assert totals([]) == {}' },
            { kind: 'output', label: 'The main program shows the totals', expected: "{'food': 50.82, 'transport': 18.15}" },
          ],
          hints: [
            '`with_vat` is one line: `return round(amount * (1 + rate / 100), 2)`.',
            'In `category`, use `return` in each case of the `if`/`elif`, and `return "other"` at the end.',
            '`totals` is the grouping from module 4 inside a function: create `result = {}`, add up with `.get(cat, 0)` and `return result`.',
          ],
        },
        {
          kind: 'text',
          md: `## What you've learned
- \`def\` defines a function and it runs when you call it.
- Parameters receive data and \`return\` gives back the result (\`print\` only shows it).
- Default values make some parameters optional.
- Variables inside a function are local.

In module 6 you'll work with **text** and make your program not break when the user types something unexpected.`,
        },
      ],
    },
  ],
}
