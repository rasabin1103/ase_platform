import type { LessonModule } from '../../../../learn/types'

/** Course 9: Python from scratch · Module 8 — Organising your code. English version of ../m08-ordenar-codigo.ts. */

const EXPENSES = `expenses = [
    {"date": "2026-02-27", "description": "super", "amount": 45.3},
    {"date": "2026-03-02", "description": "cinema", "amount": 9.0},
    {"date": "2026-03-15", "description": "taxi", "amount": 12.0},
    {"date": "2026-03-28", "description": "coffee", "amount": 2.5},
]`

const MAIN = `# Main program (don't change it)
summary = monthly_summary(expenses)
with open("summary.json", "w", encoding="utf-8") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)
print(json.dumps(summary, ensure_ascii=False, indent=2))`

export const m08OrdenarCodigoEn: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm08-ordenar-codigo',
  number: 8,
  lang: 'en',
  title: 'Organising your code',
  subtitle: "Use Python's standard library, work with dates and JSON, and split your code into modules.",
  goals: [
    'Import modules with import and from … import.',
    'Use math and random from the standard library.',
    'Read, calculate and write dates with datetime.',
    'Save and read data as JSON.',
    "Create your own modules and build your project's monthly summary.",
  ],
  lessons: [
    {
      id: 'import',
      title: 'import and the standard library',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `Python comes with a huge **standard library**: modules with ready-made functions for maths, dates, files, randomness, the internet… To use them, you **import** them at the start of the program:

\`\`\`
import math
print(math.sqrt(16))      # 4.0
print(math.pi)

from math import sqrt, ceil
print(ceil(4.2))          # 5

import random as rnd      # with a shorter name
\`\`\`

- \`import math\`: you use its functions with the \`math.\` prefix.
- \`from math import sqrt\`: you bring just \`sqrt\` and use it without a prefix.
- \`as\` gives it another name.

## random
\`random\` produces random values: \`random.randint(1, 6)\` (a die), \`random.choice(list)\` (one from the list), \`random.shuffle(list)\` (shuffles the list).

To make "chance" always come out the same (very useful for testing a program), set the **seed** at the start: \`random.seed(42)\`.`,
        },
        {
          kind: 'example',
          id: 'ej_import',
          code: 'import math\nimport random\n\nprint("Square root of 2:", round(math.sqrt(2), 3))\nprint("4.1 rounded up:", math.ceil(4.1))\n\nrandom.seed(7)\nprint("Die:", random.randint(1, 6))\nprint("Dinner tonight:", random.choice(["pasta", "pizza", "salad"]))',
          note: 'Remove the line `random.seed(7)` and run it several times: the result changes.',
        },
        {
          kind: 'predict',
          id: 'p_import',
          code: 'from math import floor\nimport math\nprint(floor(7.9), math.ceil(7.1))',
          question: 'What does it print?',
          options: ['7 8', '8 8', '7 7', '8 7'],
          correct: 0,
          explanation: '`floor` rounds down (7) and `ceil` rounds up (8). The first was imported without a prefix; the second is used with `math.`.',
        },
        {
          kind: 'exercise',
          id: 'e_dados',
          title: 'Roll two dice 1000 times',
          prompt: `With \`random.seed(1)\` at the start, roll **two dice** (\`random.randint(1, 6)\` each) **1000 times** and count how many times they add up to **7**. Show the number of sevens and the percentage with one decimal:

\`\`\`
Sevens: …
Percentage: … %
\`\`\`

With that seed chance always comes out the same, so the result is always the same (around 16-17 %).`,
          starter: 'import random\n\nrandom.seed(1)\n# Roll two dice 1000 times and count the sevens\n',
          solution: 'import random\n\nrandom.seed(1)\nsevens = 0\nfor i in range(1000):\n    if random.randint(1, 6) + random.randint(1, 6) == 7:\n        sevens += 1\nprint("Sevens:", sevens)\nprint(f"Percentage: {sevens / 1000 * 100:.1f} %")',
          tests: [
            {
              kind: 'assert',
              label: 'Counts the sevens of 1000 rolls with seed 1',
              code: 'import random as _r\n_r.seed(1)\n_n = sum(1 for _ in range(1000) if _r.randint(1, 6) + _r.randint(1, 6) == 7)\nassert sevens == _n, f"sevens is {sevens}"',
            },
            { kind: 'output', label: 'Shows the sevens and the percentage with one decimal', expected: 'Sevens: 168\nPercentage: 16.8 %' },
            { kind: 'source', label: 'Uses random.randint', pattern: /random\.randint\s*\(\s*1\s*,\s*6\s*\)/ },
          ],
          hints: ['A counter `sevens = 0` and a `for i in range(1000):`.', 'Inside: `if random.randint(1, 6) + random.randint(1, 6) == 7: sevens += 1`.', 'The percentage: `sevens / 1000 * 100` with `:.1f`.'],
        },
      ],
    },
    {
      id: 'fechas_json',
      title: 'Dates and JSON',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `## Dates with datetime
\`\`\`
from datetime import date, datetime, timedelta

d = date(2026, 3, 15)
print(d.year, d.month, d.day)
print(d + timedelta(days=30))          # 2026-04-14
\`\`\`

- **From text to date**: \`datetime.strptime("15/03/2026", "%d/%m/%Y").date()\`.
- **From date to text**: \`d.strftime("%d/%m/%Y")\` → \`"15/03/2026"\`, or \`d.strftime("%Y-%m")\` → \`"2026-03"\`.
- \`%Y\` year, \`%m\` month, \`%d\` day. Dates in \`YYYY-MM-DD\` format can also be read with \`date.fromisoformat("2026-03-15")\`.
- Subtracting two dates gives the days between them: \`(d2 - d1).days\`.
- \`date.today()\` is today's date.

## JSON
**JSON** is the most widely used text format for exchanging data between programs (for example, almost every web API uses it). It looks a lot like Python's dictionaries and lists:

\`\`\`
import json
data = {"name": "Ann", "expenses": [9.5, 12]}
text = json.dumps(data, indent=2)     # from Python to JSON text
again = json.loads(text)              # from JSON text to Python
\`\`\`

For files: \`json.dump(data, f)\` and \`json.load(f)\`. With \`ensure_ascii=False\` accents are saved as they are.`,
        },
        {
          kind: 'example',
          id: 'ej_fechas_json',
          code: 'from datetime import date, datetime, timedelta\nimport json\n\njoined = datetime.strptime("28/02/2026", "%d/%m/%Y").date()\nprint("Joined:", joined)\nprint("A month later:", (joined + timedelta(days=30)).strftime("%d/%m/%Y"))\nprint("Days to the end of the year:", (date(2026, 12, 31) - joined).days)\n\nrecord = {"customer": "Ann", "joined": joined.isoformat(), "purchases": [12.5, 8]}\ntext = json.dumps(record, indent=2)\nprint(text)\nprint(json.loads(text)["purchases"][0])',
        },
        {
          kind: 'predict',
          id: 'p_fechas',
          code: 'from datetime import date\nstart = date(2026, 1, 25)\nend = date(2026, 2, 3)\nprint((end - start).days)\nprint(end.strftime("%d/%m"))',
          question: 'What does it print?',
          options: ['9\n03/02', '8\n03/02', '9\n02/03', '-9\n03/02'],
          correct: 0,
          explanation: 'From 25 January to 3 February there are 9 days (6 left in January + 3). `%d/%m` puts the day first: "03/02".',
        },
        {
          kind: 'exercise',
          id: 'e_vencimiento',
          title: 'Due date',
          prompt: `Write the function \`due_date(date_text, days)\` that receives a date like \`"15/03/2026"\` and a number of days, and **returns** the due date as text in the same format.

- \`due_date("15/03/2026", 30)\` → \`"14/04/2026"\`
- \`due_date("20/12/2026", 15)\` → \`"04/01/2027"\``,
          starter: 'from datetime import datetime, timedelta\n\n\ndef due_date(date_text, days):\n    pass\n\n\nprint(due_date("15/03/2026", 30))\n',
          solution:
            'from datetime import datetime, timedelta\n\n\ndef due_date(date_text, days):\n    d = datetime.strptime(date_text, "%d/%m/%Y")\n    return (d + timedelta(days=days)).strftime("%d/%m/%Y")\n\n\nprint(due_date("15/03/2026", 30))',
          tests: [
            { kind: 'assert', label: '15/03/2026 + 30 days → 14/04/2026', code: 'assert due_date("15/03/2026", 30) == "14/04/2026"' },
            { kind: 'assert', label: 'Changes year: 20/12/2026 + 15 → 04/01/2027', code: 'assert due_date("20/12/2026", 15) == "04/01/2027"' },
            { kind: 'assert', label: 'February: 28/02/2026 + 1 → 01/03/2026', code: 'assert due_date("28/02/2026", 1) == "01/03/2026"' },
          ],
          hints: ['From text to date: `datetime.strptime(date_text, "%d/%m/%Y")`.', 'Add the days with `timedelta(days=days)`.', 'Back to text: `.strftime("%d/%m/%Y")` and `return`.'],
        },
      ],
    },
    {
      id: 'modulos',
      title: 'Your own modules',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `When a program grows, it is split into **several files**. Each \`.py\` file is a **module** that others can import:

\`\`\`
# file tracker.py
def with_vat(amount):
    return round(amount * 1.21, 2)
\`\`\`

\`\`\`
# file main.py
from tracker import with_vat
print(with_vat(100))
\`\`\`

That way each file has one job: \`tracker.py\` the logic, \`main.py\` what you see.

## if __name__ == "__main__"
When a module is imported, Python **runs all its code**. If the module has tests or loose \`print\`s, they would come out when importing it. To make some code run only when you launch that file directly:

\`\`\`
if __name__ == "__main__":
    print(with_vat(100))   # only when running tracker.py, not when importing it
\`\`\`

On your computer you'd have both files in the same folder. Here there's only one editor, so the first exercise **creates** the module file from code and then imports it.`,
        },
        {
          kind: 'example',
          id: 'ej_modulos',
          code: 'module_code = \'\'\'\ndef greeting(name):\n    return f"Hi, {name}"\n\nif __name__ == "__main__":\n    print("This only shows if you run greetings.py directly")\n\'\'\'\nwith open("greetings.py", "w", encoding="utf-8") as f:\n    f.write(module_code)\n\nimport greetings\nprint(greetings.greeting("Ann"))\nprint("The module is called:", greetings.__name__)',
          note: 'Notice that the message in `if __name__ == "__main__"` doesn\'t show: the module was imported, not run.',
        },
        {
          kind: 'predict',
          id: 'p_name',
          code: 'print(__name__)',
          question: 'If you run this file directly, what does it print?',
          options: ['main', '__main__', 'The file name', 'None'],
          correct: 1,
          explanation: 'The file you run directly is called `"__main__"`. When it is imported, `__name__` is the module name.',
        },
        {
          kind: 'exercise',
          id: 'e_modulo_propio',
          title: 'Your utilities module',
          prompt: `Complete the text \`module_code\` so the module \`utils.py\` has the function \`euros(amount)\`, which returns the amount as text with 2 decimals and the euro sign: \`euros(3.5)\` → \`"3.50 €"\`.

The rest of the program already saves it, imports it and shows:

\`\`\`
12.00 €
0.99 €
\`\`\``,
          starter:
            "module_code = '''\n# Write the function euros(amount) here\n'''\nwith open(\"utils.py\", \"w\", encoding=\"utf-8\") as f:\n    f.write(module_code)\n\nfrom utils import euros\nprint(euros(12))\nprint(euros(0.99))\n",
          solution:
            "module_code = '''\ndef euros(amount):\n    return f\"{amount:.2f} €\"\n'''\nwith open(\"utils.py\", \"w\", encoding=\"utf-8\") as f:\n    f.write(module_code)\n\nfrom utils import euros\nprint(euros(12))\nprint(euros(0.99))",
          tests: [
            { kind: 'output', label: 'Shows 12.00 € and 0.99 €', expected: '12.00 €\n0.99 €' },
            { kind: 'assert', label: 'euros(3.5) returns "3.50 €"', code: 'assert euros(3.5) == "3.50 €"' },
            { kind: 'assert', label: 'The function lives in the utils module', code: 'import utils\nassert utils.euros(1) == "1.00 €"' },
          ],
          hints: ['Inside the triple quotes write a normal function: `def euros(amount):`.', 'The body is a `return` with an f-string.', '`return f"{amount:.2f} €"`.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Your project: monthly summary',
      minutes: 12,
      blocks: [
        {
          kind: 'text',
          md: `The last step of the tracker before the final project: a **summary by month**. Each expense now has a \`date\` (\`"YYYY-MM-DD"\`), and the summary says, for each month, how many expenses there were and how much they added up to. It is saved to \`summary.json\` so another program (a spreadsheet, a website) can read it.`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_json',
          title: 'Project · Monthly summary in JSON',
          project: true,
          prompt: `Write \`monthly_summary(expenses)\`, which returns a dictionary with one key per month (\`"YYYY-MM"\`, in the order they appear) and, in each, \`{"expenses": count, "total": sum rounded to 2 decimals}\`. Get the month with \`datetime\`.

The main program saves it to \`summary.json\` and shows it:

\`\`\`
{
  "2026-02": {
    "expenses": 1,
    "total": 45.3
  },
  "2026-03": {
    "expenses": 3,
    "total": 23.5
  }
}
\`\`\``,
          starter: `import json\nfrom datetime import datetime\n\n${EXPENSES}\n\n\ndef monthly_summary(expenses):\n    pass\n\n\n${MAIN}\n`,
          solution: `import json\nfrom datetime import datetime\n\n${EXPENSES}\n\n\ndef monthly_summary(expenses):\n    summary = {}\n    for e in expenses:\n        month = datetime.strptime(e["date"], "%Y-%m-%d").strftime("%Y-%m")\n        if month not in summary:\n            summary[month] = {"expenses": 0, "total": 0}\n        summary[month]["expenses"] += 1\n        summary[month]["total"] = round(summary[month]["total"] + e["amount"], 2)\n    return summary\n\n\n${MAIN}`,
          tests: [
            {
              kind: 'output',
              label: 'Shows the February and March summary',
              expected: '{\n  "2026-02": {\n    "expenses": 1,\n    "total": 45.3\n  },\n  "2026-03": {\n    "expenses": 3,\n    "total": 23.5\n  }\n}',
            },
            {
              kind: 'assert',
              label: 'Works with other expenses',
              code: 'r = monthly_summary([{"date": "2025-12-31", "description": "a", "amount": 1.1}, {"date": "2026-01-01", "description": "b", "amount": 2.2}, {"date": "2025-12-01", "description": "c", "amount": 3.3}])\nassert r == {"2025-12": {"expenses": 2, "total": 4.4}, "2026-01": {"expenses": 1, "total": 2.2}}, r',
            },
            { kind: 'assert', label: 'No expenses, empty summary', code: 'assert monthly_summary([]) == {}' },
            { kind: 'assert', label: 'Saves summary.json', code: 'import json as _j\nwith open("summary.json", encoding="utf-8") as _f:\n    assert _j.load(_f)["2026-03"]["expenses"] == 3' },
            { kind: 'source', label: 'Uses datetime to get the month', pattern: /strptime|fromisoformat/ },
          ],
          hints: [
            'The month of an expense: `datetime.strptime(e["date"], "%Y-%m-%d").strftime("%Y-%m")`.',
            'If the month is not in the summary yet, create it with `{"expenses": 0, "total": 0}`.',
            'Add 1 to `expenses` and the amount to `total`, rounding with `round(..., 2)`. At the end, `return summary`.',
          ],
        },
        {
          kind: 'text',
          md: `## What you've learned
- \`import\` and \`from … import\` bring in modules from the standard library or your own.
- \`random\` with a seed, \`datetime\` for dates and \`json\` for exchanging data.
- A \`.py\` file is a module; \`if __name__ == "__main__"\` keeps apart what only runs when you launch it.

**Your expense tracker is complete.** All that's left is the **practical exam**: ten exercises without hints covering everything you've learned. You pass with 70 out of 100 and then the final test gets you the certificate.`,
        },
      ],
    },
  ],
}
