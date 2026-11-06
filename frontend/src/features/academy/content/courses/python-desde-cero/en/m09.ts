import type { ExerciseBlock, LessonModule } from '../../../../learn/types'

/** Course 9: Python from scratch · Practical exam. English version of ../m09-proyecto-final.ts. */

const ex = (e: Omit<ExerciseBlock, 'kind' | 'hints'>): ExerciseBlock => ({ kind: 'exercise', hints: [], ...e })

export const m09ProyectoFinalEn: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm09-proyecto-final',
  number: 9,
  lang: 'en',
  title: 'Practical exam',
  subtitle: 'Ten exercises without hints covering everything you have learned. Each is worth 10 points and you pass with 70.',
  goals: [
    'Solve ten exercises without hints or solutions.',
    'Each exercise passed adds 10 points; you pass with 70 out of 100.',
    'You can check as many times as you like and come back later: your score is saved.',
    'Once you pass, take the final test to get the certificate.',
  ],
  exam: { passMark: 70, points: 10 },
  lessons: [
    {
      id: 'parte1',
      title: 'Part 1 · Fundamentals',
      minutes: 25,
      blocks: [
        {
          kind: 'text',
          md: `There are no hints or solutions in this exam. Write your code, press **Run** to try it and **Check** when you think it's right. You can check as many times as you like.

In the exercises that ask for a **function**, the function must **return** the result with \`return\` (not show it).`,
        },
        ex({
          id: 'x01_descuento',
          title: '1 · Discounted price',
          prompt: `Ask for the price with \`input("Price: ")\` (decimal) and the discount in % with \`input("Discount: ")\` (whole number). Show the final price with 2 decimals:

\`\`\`
Price: 80
Discount: 15
Final price: 68.00 €
\`\`\``,
          starter: '# Ask for the price and the discount and show the final price\n',
          solution: 'price = float(input("Price: "))\ndiscount = int(input("Discount: "))\nfinal = price * (1 - discount / 100)\nprint(f"Final price: {final:.2f} €")',
          sampleInputs: ['80', '15'],
          tests: [
            { kind: 'output', label: '€80 with 15 % off → €68.00', expected: 'Price: 80\nDiscount: 15\nFinal price: 68.00 €', inputs: ['80', '15'] },
            { kind: 'output', label: '€19.99 with 0 % off → €19.99', expected: 'Price: 19.99\nDiscount: 0\nFinal price: 19.99 €', inputs: ['19.99', '0'] },
            { kind: 'output', label: '€250 with 30 % off → €175.00', expected: 'Price: 250\nDiscount: 30\nFinal price: 175.00 €', inputs: ['250', '30'] },
          ],
        }),
        ex({
          id: 'x02_bisiesto',
          title: '2 · Leap year',
          prompt: `Write the function \`is_leap(year)\` that returns \`True\` if the year is a leap year and \`False\` otherwise.

A year is a leap year if it is divisible by 4, **except** those divisible by 100, which only are if they are also divisible by 400. (2024 yes, 1900 no, 2000 yes.)`,
          starter: 'def is_leap(year):\n    pass\n',
          solution: 'def is_leap(year):\n    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)',
          tests: [
            { kind: 'assert', label: '2024 is a leap year', code: 'assert is_leap(2024) is True' },
            { kind: 'assert', label: '2023 is not a leap year', code: 'assert is_leap(2023) is False' },
            { kind: 'assert', label: '1900 is not a leap year', code: 'assert is_leap(1900) is False' },
            { kind: 'assert', label: '2000 is a leap year', code: 'assert is_leap(2000) is True' },
          ],
        }),
        ex({
          id: 'x03_fizzbuzz',
          title: '3 · FizzBuzz',
          prompt: `Show the numbers from **1 to 15**, one per line, but:

- if it is a multiple of 3 and of 5, write \`FizzBuzz\`;
- if it is only a multiple of 3, \`Fizz\`;
- if it is only a multiple of 5, \`Buzz\`.`,
          starter: '# From 1 to 15\n',
          solution: 'for n in range(1, 16):\n    if n % 15 == 0:\n        print("FizzBuzz")\n    elif n % 3 == 0:\n        print("Fizz")\n    elif n % 5 == 0:\n        print("Buzz")\n    else:\n        print(n)',
          tests: [
            { kind: 'output', label: 'From 1 to 15 with Fizz, Buzz and FizzBuzz', expected: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' },
            { kind: 'source', label: 'Uses a loop', pattern: /\b(for|while)\b/ },
          ],
        }),
        ex({
          id: 'x04_digitos',
          title: '4 · Sum of digits',
          prompt: `Write the function \`digit_sum(n)\` that returns the sum of the digits of a positive whole number **without converting it to text** (use \`%\` and \`//\` in a \`while\` loop).

\`digit_sum(4721)\` → \`14\`. (\`//\` is whole-number division: \`4721 // 10\` is \`472\`.)`,
          starter: 'def digit_sum(n):\n    pass\n',
          solution: 'def digit_sum(n):\n    total = 0\n    while n > 0:\n        total += n % 10\n        n = n // 10\n    return total',
          tests: [
            { kind: 'assert', label: 'digit_sum(4721) → 14', code: 'assert digit_sum(4721) == 14' },
            { kind: 'assert', label: 'digit_sum(9) → 9', code: 'assert digit_sum(9) == 9' },
            { kind: 'assert', label: 'digit_sum(1000) → 1', code: 'assert digit_sum(1000) == 1' },
            { kind: 'source', label: "Doesn't convert the number to text", pattern: /\bstr\s*\(/, forbid: true },
          ],
        }),
      ],
    },
    {
      id: 'parte2',
      title: 'Part 2 · Collections and functions',
      minutes: 25,
      blocks: [
        ex({
          id: 'x05_pares',
          title: '5 · Only the even ones',
          prompt: 'Write the function `evens(numbers)` that receives a list of whole numbers and **returns a new list** with the even ones, in the same order. `evens([3, 8, 1, 4])` → `[8, 4]`.',
          starter: 'def evens(numbers):\n    pass\n',
          solution: 'def evens(numbers):\n    result = []\n    for n in numbers:\n        if n % 2 == 0:\n            result.append(n)\n    return result',
          tests: [
            { kind: 'assert', label: '[3, 8, 1, 4] → [8, 4]', code: 'assert evens([3, 8, 1, 4]) == [8, 4]' },
            { kind: 'assert', label: 'Empty list → []', code: 'assert evens([]) == []' },
            { kind: 'assert', label: 'With negatives and zero', code: 'assert evens([-2, 0, 5]) == [-2, 0]' },
            { kind: 'assert', label: "Doesn't change the original list", code: '_l = [1, 2, 3]\nevens(_l)\nassert _l == [1, 2, 3]' },
          ],
        }),
        ex({
          id: 'x06_palabras',
          title: '6 · Most repeated words',
          prompt: `Write the function \`frequencies(text)\` that returns a dictionary with how many times each word of the text appears, **in lower case** and in the order they first appear.

\`frequencies("The cat and the dog")\` → \`{"the": 2, "cat": 1, "and": 1, "dog": 1}\``,
          starter: 'def frequencies(text):\n    pass\n',
          solution: 'def frequencies(text):\n    count = {}\n    for word in text.lower().split():\n        count[word] = count.get(word, 0) + 1\n    return count',
          tests: [
            { kind: 'assert', label: '"The cat and the dog"', code: 'assert frequencies("The cat and the dog") == {"the": 2, "cat": 1, "and": 1, "dog": 1}' },
            { kind: 'assert', label: 'Keeps the order of appearance', code: 'assert list(frequencies("b a b c")) == ["b", "a", "c"]' },
            { kind: 'assert', label: 'Empty text → {}', code: 'assert frequencies("") == {}' },
          ],
        }),
        ex({
          id: 'x07_descuentos',
          title: '7 · Sale',
          prompt: `Write the function \`reduce(prices, discount=10)\` that returns a new list with each price reduced by that percentage and **rounded to 2 decimals**.

- \`reduce([100, 20])\` → \`[90.0, 18.0]\`
- \`reduce([100, 20], 25)\` → \`[75.0, 15.0]\``,
          starter: 'def reduce(prices, discount=10):\n    pass\n',
          solution: 'def reduce(prices, discount=10):\n    reduced = []\n    for p in prices:\n        reduced.append(round(p * (1 - discount / 100), 2))\n    return reduced',
          tests: [
            { kind: 'assert', label: 'With 10 % by default', code: 'assert reduce([100, 20]) == [90.0, 18.0]' },
            { kind: 'assert', label: 'With 25 %', code: 'assert reduce([100, 20], 25) == [75.0, 15.0]' },
            { kind: 'assert', label: 'Rounds to 2 decimals', code: 'assert reduce([9.99], 15) == [8.49]' },
            { kind: 'assert', label: 'Empty list → []', code: 'assert reduce([]) == []' },
          ],
        }),
      ],
    },
    {
      id: 'parte3',
      title: 'Part 3 · Text, errors, files and dates',
      minutes: 30,
      blocks: [
        ex({
          id: 'x08_numero',
          title: '8 · Is it a number?',
          prompt: `Write the function \`to_number(text)\` that converts a text into a decimal number and returns it. It accepts spaces at the ends and a decimal **comma**. If it isn't a number, it returns \`None\` (without breaking).

- \`to_number(" 3,5 ")\` → \`3.5\`
- \`to_number("twelve")\` → \`None\``,
          starter: 'def to_number(text):\n    pass\n\n\nprint(to_number("12"))\n',
          solution: 'def to_number(text):\n    try:\n        return float(text.strip().replace(",", "."))\n    except ValueError:\n        return None\n\n\nprint(to_number("12"))',
          tests: [
            { kind: 'assert', label: '" 3,5 " → 3.5', code: 'assert to_number(" 3,5 ") == 3.5' },
            { kind: 'assert', label: '"12" → 12.0', code: 'assert to_number("12") == 12.0' },
            { kind: 'assert', label: '"twelve" → None', code: 'assert to_number("twelve") is None' },
            { kind: 'assert', label: '"" → None', code: 'assert to_number("") is None' },
          ],
        }),
        ex({
          id: 'x09_csv',
          title: '9 · Averages from a CSV',
          prompt: `The program creates \`grades.csv\` with the columns \`student\` and \`grade\` (a student may have several rows). Write the function \`averages(filename)\` that returns a dictionary with **each student's average**, rounded to 1 decimal, in the order they appear.

With the example file: \`{"ann": 7.5, "luke": 6.0, "eve": 9.0}\`.`,
          starter:
            'import csv\n\nwith open("grades.csv", "w", newline="", encoding="utf-8") as f:\n    f.write("student,grade\\nann,7\\nluke,6\\nann,8\\neve,9\\n")\n\n\ndef averages(filename):\n    pass\n\n\nprint(averages("grades.csv"))\n',
          solution:
            'import csv\n\nwith open("grades.csv", "w", newline="", encoding="utf-8") as f:\n    f.write("student,grade\\nann,7\\nluke,6\\nann,8\\neve,9\\n")\n\n\ndef averages(filename):\n    total = {}\n    count = {}\n    with open(filename, newline="", encoding="utf-8") as f:\n        for row in csv.DictReader(f):\n            s = row["student"]\n            total[s] = total.get(s, 0) + float(row["grade"])\n            count[s] = count.get(s, 0) + 1\n    result = {}\n    for s in total:\n        result[s] = round(total[s] / count[s], 1)\n    return result\n\n\nprint(averages("grades.csv"))',
          tests: [
            { kind: 'assert', label: 'Averages of the example file', code: 'assert averages("grades.csv") == {"ann": 7.5, "luke": 6.0, "eve": 9.0}' },
            {
              kind: 'assert',
              label: 'Works with another file',
              code: 'with open("others.csv", "w", newline="", encoding="utf-8") as _f:\n    _f.write("student,grade\\nzoe,5\\nzoe,6\\nzoe,6\\n")\nassert averages("others.csv") == {"zoe": 5.7}',
            },
          ],
        }),
        ex({
          id: 'x10_edad',
          title: '10 · Exact age',
          prompt: `Write the function \`age(birth, today)\` that receives two dates as text \`"YYYY-MM-DD"\` and returns the **years completed** on the date \`today\` (if that year's birthday hasn't arrived yet, one year less).

- \`age("1990-06-15", "2026-06-15")\` → \`36\`
- \`age("1990-06-15", "2026-06-14")\` → \`35\``,
          starter: 'from datetime import date\n\n\ndef age(birth, today):\n    pass\n',
          solution:
            'from datetime import date\n\n\ndef age(birth, today):\n    b = date.fromisoformat(birth)\n    t = date.fromisoformat(today)\n    years = t.year - b.year\n    if (t.month, t.day) < (b.month, b.day):\n        years -= 1\n    return years',
          tests: [
            { kind: 'assert', label: 'On the birthday', code: 'assert age("1990-06-15", "2026-06-15") == 36' },
            { kind: 'assert', label: 'The day before the birthday', code: 'assert age("1990-06-15", "2026-06-14") == 35' },
            { kind: 'assert', label: 'A month before the birthday month', code: 'assert age("2000-12-01", "2026-03-01") == 25' },
            { kind: 'assert', label: 'Newborn', code: 'assert age("2026-01-01", "2026-03-01") == 0' },
          ],
        }),
      ],
    },
  ],
}

/** Reference solutions of the exam (used by the E2E test). */
export const M09_PY_ANSWERS_EN: Record<string, string> = Object.fromEntries(
  m09ProyectoFinalEn.lessons.flatMap((l) => l.blocks.flatMap((b) => (b.kind === 'exercise' ? [[b.id, b.solution]] : []))),
)
