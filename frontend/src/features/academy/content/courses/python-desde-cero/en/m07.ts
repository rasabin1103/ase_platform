import type { LessonModule } from '../../../../learn/types'

/** Course 9: Python from scratch · Module 7 — Files. English version of ../m07-ficheros.ts. */
export const m07FicherosEn: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm07-ficheros',
  number: 7,
  lang: 'en',
  title: 'Files',
  subtitle: "Save data in files so it isn't lost when the program closes, and read it back.",
  goals: ['Open files with open() and with.', 'Write, append and read text line by line.', 'Read and write CSV with the csv module.', 'Save and load the expenses in your project.'],
  lessons: [
    {
      id: 'texto',
      title: 'Reading and writing text',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `Everything your program keeps in variables is lost when it ends. To make it last, you save it in a **file**.

\`\`\`
with open("notes.txt", "w", encoding="utf-8") as f:
    f.write("First line\\n")
    f.write("Second line\\n")
\`\`\`

- \`open(name, mode)\` opens the file. \`f\` is the open file.
- \`with\` **closes it by itself** at the end of the block, even if there is an error. Always use it.
- \`encoding="utf-8"\` so accents and special characters are saved properly.
- \`write()\` doesn't add the line break: you add it with \`\\n\`.

| Mode | What for |
|---|---|
| \`"w"\` | Write. **Deletes** whatever was there. |
| \`"a"\` | Append at the end, without deleting. |
| \`"r"\` | Read (the default mode). If the file doesn't exist: \`FileNotFoundError\`. |

## Reading
\`\`\`
with open("notes.txt", encoding="utf-8") as f:
    for line in f:
        print(line.strip())
\`\`\`

Going through the file gives you its lines **with the final \`\\n\`**: \`strip()\` removes it. There is also \`f.read()\`, which returns all the text at once.

(On this page files are kept in the browser's memory while the page is open.)`,
        },
        {
          kind: 'example',
          id: 'ej_texto',
          code: 'with open("shopping.txt", "w", encoding="utf-8") as f:\n    f.write("bread\\n")\n    f.write("milk\\n")\n\nwith open("shopping.txt", "a", encoding="utf-8") as f:\n    f.write("eggs\\n")\n\nwith open("shopping.txt", encoding="utf-8") as f:\n    for number, line in enumerate(f, start=1):\n        print(number, line.strip())',
          note: '`enumerate` numbers the items as you go through them.',
        },
        {
          kind: 'predict',
          id: 'p_modo_w',
          code: 'with open("a.txt", "w", encoding="utf-8") as f:\n    f.write("one\\n")\nwith open("a.txt", "w", encoding="utf-8") as f:\n    f.write("two\\n")\nwith open("a.txt", encoding="utf-8") as f:\n    print(f.read().strip())',
          question: 'What does it print?',
          options: ['one\ntwo', 'two', 'one', 'An error: the file already exists'],
          correct: 1,
          explanation: 'Mode `"w"` **empties** the file when it opens it. The second write deletes "one". To add without deleting you use `"a"`.',
        },
        {
          kind: 'exercise',
          id: 'e_diario',
          title: 'Count lines and words',
          prompt: `The program already creates the file \`diary.txt\`. Read it and show how many **lines** and how many **words** it has:

\`\`\`
Lines: 3
Words: 13
\`\`\``,
          starter:
            'with open("diary.txt", "w", encoding="utf-8") as f:\n    f.write("Today I started with Python\\n")\n    f.write("I already know loops\\n")\n    f.write("Tomorrow CSV files too\\n")\n\n# Read diary.txt and count lines and words\n',
          solution:
            'with open("diary.txt", "w", encoding="utf-8") as f:\n    f.write("Today I started with Python\\n")\n    f.write("I already know loops\\n")\n    f.write("Tomorrow CSV files too\\n")\n\nlines = 0\nwords = 0\nwith open("diary.txt", encoding="utf-8") as f:\n    for line in f:\n        lines += 1\n        words += len(line.split())\nprint("Lines:", lines)\nprint("Words:", words)',
          tests: [
            { kind: 'output', label: '3 lines and 13 words', expected: 'Lines: 3\nWords: 13' },
            { kind: 'source', label: 'Opens the file with with to read it', pattern: /with\s+open\s*\(\s*["']diary\.txt["']\s*(,\s*encoding[^)]*)?\)/ },
          ],
          hints: ['Open it for reading: `with open("diary.txt", encoding="utf-8") as f:`.', 'Go through `for line in f:` with two counters.', 'The words of a line: `len(line.split())`.'],
        },
      ],
    },
    {
      id: 'csv',
      title: 'CSV files',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `A **CSV** is a table in text: one row per line and the columns separated by commas. The first row is usually the **header**:

\`\`\`
description,amount,category
super,45.3,food
cinema,9,leisure
\`\`\`

It opens in any spreadsheet. Python comes with the \`csv\` module to read and write it without worrying about commas inside texts or quotes. It's loaded with \`import csv\` at the start of the program (you'll see \`import\` in depth in module 8).

## Writing with DictWriter
\`\`\`
import csv
with open("expenses.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["description", "amount"])
    w.writeheader()
    w.writerow({"description": "cinema", "amount": 9})
\`\`\`

## Reading with DictReader
Each row comes as a **dictionary** with the header's keys:

\`\`\`
with open("expenses.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        print(row["description"], row["amount"])
\`\`\`

**Careful:** everything read from a CSV is **text**. To add amounts you have to convert them: \`float(row["amount"])\`.

\`newline=""\` avoids extra blank lines on some systems: always add it when opening a CSV.`,
        },
        {
          kind: 'example',
          id: 'ej_csv',
          code: 'import csv\n\nstudents = [{"name": "Ann", "grade": 8.5}, {"name": "Luke", "grade": 6}, {"name": "Eve", "grade": 9.2}]\nwith open("grades.csv", "w", newline="", encoding="utf-8") as f:\n    w = csv.DictWriter(f, fieldnames=["name", "grade"])\n    w.writeheader()\n    for s in students:\n        w.writerow(s)\n\nwith open("grades.csv", encoding="utf-8") as f:\n    print(f.read())\n\nwith open("grades.csv", newline="", encoding="utf-8") as f:\n    for row in csv.DictReader(f):\n        print(row["name"], "->", float(row["grade"]) + 1)',
        },
        {
          kind: 'predict',
          id: 'p_csv_texto',
          code: 'import csv\nwith open("p.csv", "w", newline="", encoding="utf-8") as f:\n    f.write("x\\n2\\n3\\n")\nwith open("p.csv", newline="", encoding="utf-8") as f:\n    rows = list(csv.DictReader(f))\nprint(rows[0]["x"] + rows[1]["x"])',
          question: 'What does it print?',
          options: ['5', '23', "['2', '3']", 'An error'],
          correct: 1,
          explanation: 'Values from a CSV are read as **text**: `"2" + "3"` is `"23"`. To add them, `int(...)` or `float(...)`.',
        },
        {
          kind: 'exercise',
          id: 'e_csv_ventas',
          title: 'Add up a CSV',
          prompt: `The program already creates \`sales.csv\` with the columns \`product\` and \`units\`. Read it with \`csv.DictReader\` and show the total units and the best-selling product:

\`\`\`
Total units: 42
Best seller: coffee
\`\`\``,
          starter:
            'import csv\n\nwith open("sales.csv", "w", newline="", encoding="utf-8") as f:\n    f.write("product,units\\ntoast,12\\ncoffee,20\\njuice,10\\n")\n\n# Read sales.csv and work out the total and the best seller\n',
          solution:
            'import csv\n\nwith open("sales.csv", "w", newline="", encoding="utf-8") as f:\n    f.write("product,units\\ntoast,12\\ncoffee,20\\njuice,10\\n")\n\ntotal = 0\nbest = None\nbest_units = -1\nwith open("sales.csv", newline="", encoding="utf-8") as f:\n    for row in csv.DictReader(f):\n        units = int(row["units"])\n        total += units\n        if units > best_units:\n            best = row["product"]\n            best_units = units\nprint("Total units:", total)\nprint("Best seller:", best)',
          tests: [
            { kind: 'output', label: 'Total 42 and the best seller is coffee', expected: 'Total units: 42\nBest seller: coffee' },
            { kind: 'source', label: 'Uses csv.DictReader', pattern: /csv\.DictReader/ },
          ],
          hints: ['`for row in csv.DictReader(f):` gives you each row as a dictionary.', 'The units are text: `int(row["units"])`.', 'For the best seller, keep the best so far and change it if you find a bigger one.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Your project: save and load',
      minutes: 12,
      blocks: [
        {
          kind: 'text',
          md: `Your tracker will finally **remember**: it will save the list of expenses in \`expenses.csv\` and load it when it starts. Two functions:

- \`save(expenses, filename)\`: writes the list to a CSV with the header \`description,amount,category\`.
- \`load(filename)\`: reads the CSV and returns the list of expenses, with the **amount as a number**. If the file doesn't exist, it returns an empty list (catch \`FileNotFoundError\`).`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_csv',
          title: 'Project · Save and load the expenses',
          project: true,
          prompt: `Write \`save(expenses, filename)\` and \`load(filename)\`. The main program (at the end, don't change it) saves two expenses, loads them and shows:

\`\`\`
Loaded: 2
super · 45.30 € · food
cinema · 9.00 € · leisure
Total: 54.30 €
\`\`\``,
          starter:
            'import csv\n\n\ndef save(expenses, filename):\n    pass\n\n\ndef load(filename):\n    pass\n\n\n# Main program (don\'t change it)\nsave([{"description": "super", "amount": 45.3, "category": "food"}, {"description": "cinema", "amount": 9, "category": "leisure"}], "expenses.csv")\nexpenses = load("expenses.csv")\nprint("Loaded:", len(expenses))\nfor e in expenses:\n    print(f"{e[\'description\']} · {e[\'amount\']:.2f} € · {e[\'category\']}")\nprint(f"Total: {sum(e[\'amount\'] for e in expenses):.2f} €")\n',
          solution:
            'import csv\n\n\ndef save(expenses, filename):\n    with open(filename, "w", newline="", encoding="utf-8") as f:\n        w = csv.DictWriter(f, fieldnames=["description", "amount", "category"])\n        w.writeheader()\n        for e in expenses:\n            w.writerow(e)\n\n\ndef load(filename):\n    expenses = []\n    try:\n        with open(filename, newline="", encoding="utf-8") as f:\n            for row in csv.DictReader(f):\n                expenses.append({"description": row["description"], "amount": float(row["amount"]), "category": row["category"]})\n    except FileNotFoundError:\n        return []\n    return expenses\n\n\n# Main program (don\'t change it)\nsave([{"description": "super", "amount": 45.3, "category": "food"}, {"description": "cinema", "amount": 9, "category": "leisure"}], "expenses.csv")\nexpenses = load("expenses.csv")\nprint("Loaded:", len(expenses))\nfor e in expenses:\n    print(f"{e[\'description\']} · {e[\'amount\']:.2f} € · {e[\'category\']}")\nprint(f"Total: {sum(e[\'amount\'] for e in expenses):.2f} €")',
          tests: [
            { kind: 'output', label: 'Saves, loads and shows the two expenses', expected: 'Loaded: 2\nsuper · 45.30 € · food\ncinema · 9.00 € · leisure\nTotal: 54.30 €' },
            {
              kind: 'assert',
              label: 'save writes the header description,amount,category',
              code: 'save([{"description": "bus", "amount": 1.5, "category": "transport"}], "test.csv")\nwith open("test.csv", encoding="utf-8") as _f:\n    _lines = _f.read().splitlines()\nassert _lines == ["description,amount,category", "bus,1.5,transport"], _lines',
            },
            { kind: 'assert', label: 'load returns the amount as a number', code: 'assert isinstance(load("expenses.csv")[0]["amount"], float)' },
            { kind: 'assert', label: "load returns [] if the file doesn't exist", code: 'assert load("does_not_exist_123.csv") == []' },
          ],
          hints: [
            '`save` is the `DictWriter` example with `fieldnames=["description", "amount", "category"]`, `writeheader()` and one `writerow` per expense.',
            'In `load`, create `expenses = []` and add a dictionary per row with `"amount": float(row["amount"])`.',
            'Wrap the `with open(...)` in `try:` and `except FileNotFoundError: return []`. At the end, `return expenses`.',
          ],
        },
        {
          kind: 'text',
          md: `## What you've learned
- \`with open(...)\` opens a file and closes it by itself; the modes \`w\`, \`a\` and \`r\`.
- Going through a file gives its lines; \`strip()\` removes the final line break.
- The \`csv\` module reads and writes tables; what you read is text.

In module 8, the last one before the final project, you'll **organise your code into modules** and use dates and JSON for the monthly summary.`,
        },
      ],
    },
  ],
}
