import type { LessonModule } from '../../../../learn/types'

/** Course 9: Python from scratch · Module 4 — Collections. English version of ../m04-colecciones.ts. */

const EXPENSES = `expenses = [
    {"description": "super", "amount": 45.3, "category": "food"},
    {"description": "cinema", "amount": 9.0, "category": "leisure"},
    {"description": "coffee", "amount": 2.5, "category": "food"},
    {"description": "taxi", "amount": 12.0, "category": "transport"},
]`

export const m04ColeccionesEn: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm04-colecciones',
  number: 4,
  lang: 'en',
  title: 'Collections',
  subtitle: 'Keep lots of data together: lists, tuples, sets and dictionaries.',
  goals: [
    'Create lists, read their items by position and add new ones.',
    'Go through a list and calculate with sum(), min(), max() and len().',
    'Know when to use a tuple or a set.',
    'Store named data in dictionaries and go through them.',
    'Group the expenses in your project by category.',
  ],
  lessons: [
    {
      id: 'listas',
      title: 'Lists',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `A **list** keeps several values in order, in square brackets and separated by commas:

\`\`\`
shopping = ["bread", "milk", "eggs"]
prices = [1.2, 0.95, 2.4]
\`\`\`

- **Read by position:** \`shopping[0]\` is \`"bread"\`. Positions (**indexes**) start at **0**. \`shopping[-1]\` is the last one.
- **How many:** \`len(shopping)\` → 3.
- **Add at the end:** \`shopping.append("fruit")\`.
- **Change one:** \`shopping[1] = "yogurt"\`.
- **Is it there?:** \`"bread" in shopping\` → \`True\`.
- **Go through it:** \`for product in shopping:\` gives each item in turn.
- With numbers: \`sum(prices)\`, \`min(prices)\`, \`max(prices)\`.

Asking for a position that doesn't exist (\`shopping[10]\`) gives an \`IndexError\`.`,
        },
        {
          kind: 'example',
          id: 'ej_listas',
          code: 'shopping = ["bread", "milk", "eggs"]\nprint(shopping[0], "and", shopping[-1])\nshopping.append("fruit")\nprint(len(shopping), "products:", shopping)\n\nprices = [1.2, 0.95, 2.4, 3.1]\nprint("Total:", sum(prices))\nprint("Most expensive:", max(prices))\nfor p in prices:\n    print("-", p)',
        },
        {
          kind: 'predict',
          id: 'p_indices',
          code: 'colours = ["red", "green", "blue"]\ncolours.append("black")\nprint(colours[1])\nprint(len(colours))',
          question: 'What does it print?',
          options: ['red\n3', 'green\n4', 'green\n3', 'red\n4'],
          correct: 1,
          explanation: 'Index 1 is the **second** item: "green". After the `append` there are 4 colours.',
        },
        {
          kind: 'exercise',
          id: 'e_temperaturas',
          title: "The week's temperatures",
          prompt: `The list \`temps\` has the temperatures of 7 days. Work out and show:

\`\`\`
Highest: 24
Lowest: 15
Average: 19.6
Days above 20: 3
\`\`\`

The average with one decimal. For the days above 20, go through the list with a counter.`,
          starter: 'temps = [18, 22, 15, 24, 19, 21, 18]\n# Work out the highest, lowest, average and days above 20\n',
          solution:
            'temps = [18, 22, 15, 24, 19, 21, 18]\nprint("Highest:", max(temps))\nprint("Lowest:", min(temps))\nprint(f"Average: {sum(temps) / len(temps):.1f}")\nhot = 0\nfor t in temps:\n    if t > 20:\n        hot += 1\nprint("Days above 20:", hot)',
          tests: [
            { kind: 'output', label: 'Highest, lowest, average and hot days', expected: 'Highest: 24\nLowest: 15\nAverage: 19.6\nDays above 20: 3' },
            { kind: 'source', label: 'Uses max(), min() and len()', pattern: /max\s*\([\s\S]*min\s*\([\s\S]*len\s*\(|max\s*\([\s\S]*len\s*\([\s\S]*min\s*\(|min\s*\([\s\S]*max\s*\([\s\S]*len\s*\(/ },
            { kind: 'source', label: 'Goes through the list with a for', pattern: /for\s+\w+\s+in\s+temps/ },
          ],
          hints: ['`max(temps)` and `min(temps)` give you the highest and the lowest.', 'The average is `sum(temps) / len(temps)`; with `:.1f` it shows one decimal.', 'To count: `hot = 0`, `for t in temps:` and `if t > 20: hot += 1`.'],
        },
      ],
    },
    {
      id: 'tuplas_sets',
      title: 'Tuples and sets',
      minutes: 6,
      blocks: [
        {
          kind: 'text',
          md: `Two more collections, for specific cases:

**Tuple**: like a list, but with round brackets and it **can't be changed**. It's for data that goes together and stays fixed, like coordinates or a date:

\`\`\`
point = (3, 7)
x, y = point      # unpacking: x is 3, y is 7
\`\`\`

**Set**: in curly brackets, **no duplicates** and no order. Ideal for removing duplicates or finding out which different values there are:

\`\`\`
visits = ["ann", "luke", "ann", "eve", "luke"]
different = set(visits)      # {"ann", "luke", "eve"} (in any order)
print(len(different))        # 3
\`\`\`

Since a set has no order, if you want to show it sorted use \`sorted(set)\`, which returns a sorted list.`,
        },
        {
          kind: 'example',
          id: 'ej_tuplas_sets',
          code: 'date = (2026, 3, 15)\nyear, month, day = date\nprint(f"Day {day} of month {month} of {year}")\n\nvisits = ["ann", "luke", "ann", "eve", "luke"]\nprint("Visits:", len(visits))\nprint("Different people:", len(set(visits)))\nprint("Who:", sorted(set(visits)))',
        },
        {
          kind: 'predict',
          id: 'p_set',
          code: 'numbers = [3, 1, 3, 2, 1, 3]\nprint(len(set(numbers)))\nprint(sorted(set(numbers)))',
          question: 'What does it print?',
          options: ['6\n[1, 1, 2, 3, 3, 3]', '3\n[1, 2, 3]', '3\n[3, 1, 2]', '6\n[1, 2, 3]'],
          correct: 1,
          explanation: 'The set removes the duplicates: 1, 2 and 3 remain. `sorted()` returns them as a sorted list.',
        },
        {
          kind: 'exercise',
          id: 'e_etiquetas',
          title: 'Tags without repeats',
          prompt: `The list \`tags\` has duplicates. Show how many **different** tags there are and the list of different tags, **sorted**:

\`\`\`
Different: 4
['leisure', 'super', 'transport', 'travel']
\`\`\``,
          starter: 'tags = ["super", "leisure", "super", "travel", "transport", "leisure", "super"]\n# Show how many different ones there are and which, sorted\n',
          solution: 'tags = ["super", "leisure", "super", "travel", "transport", "leisure", "super"]\ndifferent = set(tags)\nprint("Different:", len(different))\nprint(sorted(different))',
          tests: [
            { kind: 'output', label: '4 different ones and the sorted list', expected: "Different: 4\n['leisure', 'super', 'transport', 'travel']" },
            { kind: 'source', label: 'Uses set()', pattern: /set\s*\(/ },
          ],
          hints: ['`set(tags)` removes the duplicates.', '`len(...)` tells you how many are left.', '`print(sorted(different))` shows the sorted list.'],
        },
      ],
    },
    {
      id: 'diccionarios',
      title: 'Dictionaries',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `A **dictionary** stores **key: value** pairs. Instead of using a position, you use a **name**:

\`\`\`
expense = {"description": "cinema", "amount": 9.0}
print(expense["description"])     # cinema
expense["category"] = "leisure"   # adds a new key (or changes the existing one)
\`\`\`

- \`len(expense)\` → how many keys it has.
- \`"amount" in expense\` → does that key exist?
- A key that doesn't exist gives \`KeyError\`. With \`expense.get("note", 0)\` you get 0 instead of the error.
- **Go through it**: \`for key, value in expense.items():\`.
- Keys are kept in the **order you add them**.

## Counting with a dictionary
A very common use: adding up by key.

\`\`\`
count = {}
for word in ["yes", "no", "yes"]:
    count[word] = count.get(word, 0) + 1
# {"yes": 2, "no": 1}
\`\`\`

## Lists of dictionaries
For many records with the same shape, a **list of dictionaries**: each item is a dictionary.`,
        },
        {
          kind: 'example',
          id: 'ej_diccionarios',
          code: 'prices = {"bread": 1.2, "milk": 0.95, "eggs": 2.4}\nprint(prices["milk"])\nprices["fruit"] = 3.1\nfor product, price in prices.items():\n    print(f"{product}: {price:.2f} €")\n\nvotes = ["yes", "no", "yes", "yes"]\ncount = {}\nfor v in votes:\n    count[v] = count.get(v, 0) + 1\nprint(count)',
        },
        {
          kind: 'predict',
          id: 'p_dict',
          code: 'stock = {"apples": 5, "pears": 2}\nstock["pears"] = stock["pears"] + 3\nstock["grapes"] = 1\nprint(stock)',
          question: 'What does it print?',
          options: ["{'apples': 5, 'pears': 2, 'grapes': 1}", "{'apples': 5, 'pears': 5, 'grapes': 1}", "{'apples': 5, 'pears': 5}", 'A KeyError'],
          correct: 1,
          explanation: 'The pears go from 2 to 5. Assigning to a new key (`"grapes"`) adds it at the end.',
        },
        {
          kind: 'predict',
          id: 'p_keyerror',
          code: 'grades = {"ann": 8}\nprint(grades["luke"])',
          question: 'What happens?',
          options: ['It prints 0', 'It prints None', "KeyError: the key doesn't exist", 'It prints 8'],
          correct: 2,
          explanation: "Reading with square brackets a key that doesn't exist gives `KeyError`. For a default value: `grades.get(\"luke\", 0)`.",
        },
        {
          kind: 'exercise',
          id: 'e_contar_letras',
          title: 'Count the vowels',
          prompt: `Go through the word in \`word\` and count how many times each **vowel** appears in a dictionary \`count\` (only the vowels that appear, in the order they appear). Show it:

\`\`\`
{'e': 2, 'a': 1, 'i': 1, 'o': 1}
\`\`\``,
          starter: 'word = "elevation"\ncount = {}\n# Go through the letters and count only the vowels\n\nprint(count)\n',
          solution: 'word = "elevation"\ncount = {}\nfor letter in word:\n    if letter in "aeiou":\n        count[letter] = count.get(letter, 0) + 1\nprint(count)',
          tests: [
            { kind: 'output', label: "Shows {'e': 2, 'a': 1, 'i': 1, 'o': 1}", expected: "{'e': 2, 'a': 1, 'i': 1, 'o': 1}" },
            { kind: 'assert', label: 'count has the vowels counted', code: 'assert count == {"e": 2, "a": 1, "i": 1, "o": 1}' },
            { kind: 'source', label: 'Uses a for loop', pattern: /\bfor\b/ },
          ],
          hints: ['`for letter in word:` goes through each letter.', 'To know whether it is a vowel: `if letter in "aeiou":`.', 'To count: `count[letter] = count.get(letter, 0) + 1`.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Your project: expenses by category',
      minutes: 12,
      blocks: [
        {
          kind: 'text',
          md: `Your tracker already asks for expenses, but forgets them as soon as it adds up the total. From now on each expense will be a **dictionary** with \`description\`, \`amount\` and \`category\`, and they will all go in a **list** \`expenses\`.

With that list you can work out whatever you want. Today: the **total for each category**, the overall total and the **biggest expense**.

So you don't have to type the expenses every time, in this exercise the list is already there.`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_categorias',
          title: 'Project · Totals by category',
          project: true,
          prompt: `With the list \`expenses\`:

1. Work out in the dictionary \`by_category\` the total for each category (in the order they appear).
2. Show each category with its total, the overall total and the biggest expense:

\`\`\`
food: 47.80 €
leisure: 9.00 €
transport: 12.00 €
Total: 68.80 €
Biggest expense: super (45.30 €)
\`\`\``,
          starter: `${EXPENSES}\nby_category = {}\n# 1. Add up the amount of each category\n\n# 2. Show the totals, the overall total and the biggest expense\n`,
          solution: `${EXPENSES}\nby_category = {}\nfor e in expenses:\n    cat = e["category"]\n    by_category[cat] = by_category.get(cat, 0) + e["amount"]\nfor cat, amount in by_category.items():\n    print(f"{cat}: {amount:.2f} €")\ntotal = sum(by_category.values())\nprint(f"Total: {total:.2f} €")\nbiggest = expenses[0]\nfor e in expenses:\n    if e["amount"] > biggest["amount"]:\n        biggest = e\nprint(f"Biggest expense: {biggest['description']} ({biggest['amount']:.2f} €)")`,
          tests: [
            { kind: 'output', label: 'Totals by category, overall total and biggest expense', expected: 'food: 47.80 €\nleisure: 9.00 €\ntransport: 12.00 €\nTotal: 68.80 €\nBiggest expense: super (45.30 €)' },
            {
              kind: 'assert',
              label: 'by_category has the total of each category',
              code: 'assert list(by_category) == ["food", "leisure", "transport"]\nassert abs(by_category["food"] - 47.8) < 0.001 and by_category["leisure"] == 9 and by_category["transport"] == 12',
            },
            { kind: 'source', label: "Works out the totals by going through the list (don't type them by hand)", pattern: /for\s+\w+\s+in\s+expenses/ },
            { kind: 'source', label: "Doesn't type the total by hand", pattern: /47\.8|68\.8/, forbid: true },
          ],
          hints: [
            'Go through the expenses: `for e in expenses:`; the category is `e["category"]` and the amount `e["amount"]`.',
            'To add up: `by_category[cat] = by_category.get(cat, 0) + e["amount"]`. Then go through it with `.items()`.',
            "For the biggest, start with `biggest = expenses[0]` and change it when you find one with a larger amount. Inside an f-string with double quotes, use single quotes for the keys: `{biggest['description']}`.",
          ],
        },
        {
          kind: 'text',
          md: `## What you've learned
- Lists keep values in order; indexes start at 0.
- Tuples are fixed and sets have no duplicates.
- Dictionaries store key: value pairs, and are great for counting and grouping.
- A list of dictionaries is the natural way to store records.

In module 5 you'll organise this code into **functions**, named pieces you can reuse.`,
        },
      ],
    },
  ],
}
