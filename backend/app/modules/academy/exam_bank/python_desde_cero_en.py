"""Python from scratch final test · English version (same ids as python_desde_cero.py; correct answer first).

The code snippets are the same as in Spanish (they use neutral names).
"""

from app.modules.academy.exam_bank.model import BankText, en
from app.modules.academy.exam_bank.python_desde_cero import QUESTIONS

_CODE = {question.id: question.code for question in QUESTIONS}

EN: dict[str, BankText] = {
    # ------------------------------------------------------- 71 · First programs and decisions
    # 71.1 · Your first program (module 1)
    "c71-01": en(
        "What does this code print?",
        "10 - 4",
        ["6", "An error", "10-4"],
        "In quotes it is text and is written as it is; without quotes Python would work out 6.",
        code=_CODE["c71-01"],
    ),
    "c71-02": en("What does this code print?", "14", ["5", "7", "12"], "Line by line: 5, then 5 + 2 = 7, then 7 × 2 = 14.", code=_CODE["c71-02"]),
    "c71-03": en(
        "What does this code print?",
        "55",
        ["10", "5 5", "An error"],
        "Both values are texts: `+` joins them. To add them as numbers you have to convert them with `int()`.",
        code=_CODE["c71-03"],
    ),
    "c71-04": en(
        "What does `input()` return when the user types 42?",
        'The text "42".',
        ["The whole number 42.", "The decimal number 42.0.", "None."],
        "`input()` always returns text. To do calculations you have to convert it with `int()` or `float()`.",
    ),
    "c71-05": en(
        "What does this code print?",
        "7.00",
        ["7", "7.0", "{x * 2:.2f}"],
        "Inside the brackets 3.5 × 2 = 7.0 is worked out, and `:.2f` shows it with two decimals.",
        code=_CODE["c71-05"],
    ),
    # 71.2 · Making decisions (module 2)
    "c71-06": en("What does this code print?", "False", ["True", "An error", "10"], "A number and a text are never equal, even if they look alike.", code=_CODE["c71-06"]),
    "c71-07": en(
        "What does this code print?",
        "B",
        ["A", "A\nB", "C"],
        "Python only runs the first condition that is true: 95 > 50 already is. The strictest ones go first.",
        code=_CODE["c71-07"],
    ),
    "c71-08": en(
        "What does this code print?",
        "Z",
        ["X\nY\nZ", "Y\nZ", "Nothing"],
        "3 > 5 is false: both indented lines are skipped. The last one isn't indented and always runs.",
        code=_CODE["c71-08"],
    ),
    "c71-09": en(
        "What does this code print?",
        "False True",
        ["True True", "False False", "True False"],
        "With `and` both are needed; with `or` one is enough.",
        code=_CODE["c71-09"],
    ),
    "c71-10": en(
        'We want to know whether `day` is "sat" or "sun". Which condition is correct?',
        'day == "sat" or day == "sun"',
        ['day == "sat" or "sun"', 'day == ("sat" and "sun")', 'day in "sat" and "sun"'],
        '`day == "sat" or "sun"` is always true: a non-empty text counts as true. You have to repeat the comparison.',
    ),
    # ------------------------------------------------------- 72 · Loops and collections
    # 72.1 · Repeating (module 3)
    "c72-01": en(
        "Which numbers does `range(2, 6)` go through?",
        "2, 3, 4 and 5",
        ["2, 3, 4, 5 and 6", "3, 4, 5 and 6", "2 and 6"],
        "`range` starts at the first and stops before the second.",
    ),
    "c72-02": en(
        "What does this code print?",
        "3",
        ["6", "0", "1"],
        "The accumulator is set to 0 inside the loop, on every round. It has to be created before the loop.",
        code=_CODE["c72-02"],
    ),
    "c72-03": en("What does this code print?", "27", ["9", "20", "81"], "1 → 3 → 9 → 27; with 27 the condition is false and the loop stops.", code=_CODE["c72-03"]),
    "c72-04": en(
        "What does this code print?",
        "1\n3\n5",
        ["2\n4\n6", "1\n2\n3\n4\n5\n6", "1"],
        "For even numbers `continue` runs and the `print` is skipped.",
        code=_CODE["c72-04"],
    ),
    "c72-05": en(
        'This loop asks for data until the user types "fin". What is it missing?',
        'A `break` when the text is "fin": otherwise the loop never ends.',
        ["Nothing: `while True` stops by itself.", "A `continue` at the end.", "Changing `while` to `for`."],
        "`while True` is infinite; the way out is the `break`.",
        code=_CODE["c72-05"],
    ),
    # 72.2 · Collections (module 4)
    "c72-06": en(
        "What does this code print?",
        "b 4",
        ["a 3", "b 3", "a 4"],
        "Indexes start at 0: index 1 is the second item. After the `append` there are 4.",
        code=_CODE["c72-06"],
    ),
    "c72-07": en("What does this code print?", "3", ["6", "1", "2"], "A set removes duplicates: 1, 2 and 3 are left.", code=_CODE["c72-07"]),
    "c72-08": en(
        "What happens when you run this code?",
        "KeyError: the key doesn't exist.",
        ["It prints 0.", "It prints None.", "It prints 8."],
        'With square brackets, a key that doesn\'t exist gives an error. For a default value: `d.get("y", 0)`.',
        code=_CODE["c72-08"],
    ),
    "c72-09": en(
        "What does this code print?",
        "{'a': 5, 'b': 5, 'c': 1}",
        ["{'a': 5, 'b': 2, 'c': 1}", "{'a': 5, 'b': 5}", "A KeyError"],
        '"b" goes from 2 to 5 and assigning to a new key adds it at the end.',
        code=_CODE["c72-09"],
    ),
    "c72-10": en(
        "Which line counts how many times each word `w` appears in the dictionary `count`?",
        "count[w] = count.get(w, 0) + 1",
        ["count[w] = count[w] + 1", "count.append(w)", "count[w] = 1"],
        "`count[w] + 1` fails the first time (the key doesn't exist yet); `.get(w, 0)` gives 0 in that case.",
    ),
    # ------------------------------------------------------- 73 · Functions, text and errors
    # 73.1 · Functions (module 5)
    "c73-01": en(
        "What does this code print?",
        "10\nNone",
        ["10\n10", "None\n10", "10"],
        "The function shows 10 with `print`, but it has no `return`: it returns `None`.",
        code=_CODE["c73-01"],
    ),
    "c73-02": en(
        "What does `return` do in a function?",
        "It gives a value back to whoever called the function and ends it.",
        ["It shows the value on the screen.", "It starts the function again.", "It saves the value to a file."],
        "`print` shows; `return` hands over the result so it can be stored or used.",
    ),
    "c73-03": en(
        "What does this code print?",
        "121.0 110.0",
        ["121.0 121.0", "110.0 110.0", "An error"],
        "Without a second argument the default value (21) is used; with it, the one you pass.",
        code=_CODE["c73-03"],
    ),
    "c73-04": en(
        "What does this code print?",
        "5",
        ["6", "None", "An error"],
        "`x` is local: changing it doesn't change `n`, and the returned value isn't stored anywhere.",
        code=_CODE["c73-04"],
    ),
    "c73-05": en(
        "What happens when you run this code?",
        "NameError: `result` only exists inside the function.",
        ["It prints 42.", "It prints None.", "SyntaxError."],
        "Variables created inside a function are local. To get the value out: `r = calc()`.",
        code=_CODE["c73-05"],
    ),
    # 73.2 · Text and errors (module 6)
    "c73-06": en(
        "What does this code print?",
        "Hi there",
        ["HI THERE", "  HI THERE  ", "  Hi there"],
        "`upper()` returns a new text that isn't stored: the original doesn't change. `strip()` removes the spaces at both ends.",
        code=_CODE["c73-06"],
    ),
    "c73-07": en(
        'What does `"a;b;c".split(";")` return?',
        "['a', 'b', 'c']",
        ["'a b c'", "('a', 'b', 'c')", "'abc'"],
        "`split` cuts the text at the separator and returns a list.",
    ),
    "c73-08": en(
        "What error does this code give?",
        "TypeError: text and a number can't be added.",
        ["NameError.", "ValueError.", 'None: it prints "Total: 5".'],
        'With `+` you have to convert first: `"Total: " + str(n)`, or use an f-string.',
        code=_CODE["c73-08"],
    ),
    "c73-09": en(
        "What does this code print?",
        "B\nC",
        ["A\nC", "A\nB\nC", "B"],
        '`int("3.5")` gives `ValueError`: it jumps to the `except` and then the program goes on. "A" never runs.',
        code=_CODE["c73-09"],
    ),
    "c73-10": en(
        "Why is it a bad idea to write `except:` without an error type?",
        "It also catches the errors in your own code and hides them.",
        ["Because it is slower.", "Because Python doesn't allow it.", "Because it only catches ValueError."],
        "Give the type you expect (`except ValueError:`) so you don't hide failures you should see.",
    ),
    # ------------------------------------------------------- 74 · Files, libraries and modules
    # 74.1 · Files (module 7)
    "c74-01": en(
        'You open a file that already has text with `open(name, "w")`. What happens to what was there?',
        'It is deleted: mode "w" starts with the file empty.',
        ["It is kept and the new text is written at the end.", "It gives an error because it already exists.", "A copy is saved."],
        'To add without deleting you use mode "a".',
    ),
    "c74-02": en(
        "What is the advantage of `with open(...) as f:`?",
        "It closes the file by itself at the end of the block, even if there is an error.",
        ["It reads the file faster.", "It creates the file if it doesn't exist in any mode.", "It converts the content to numbers."],
        "That's why `with` is always used to open files.",
    ),
    "c74-03": en(
        "A CSV has the column `n` with the values 2 and 3. What does this code print?",
        "23",
        ["5", "['2', '3']", "An error"],
        "Everything read from a CSV is text: you have to convert it with `int()` or `float()` to add it.",
        code=_CODE["c74-03"],
    ),
    "c74-04": en(
        "When going through a file with `for line in f:`, what does each line have at the end?",
        "The line break `\\n` (removed with `strip()`).",
        ["Nothing.", "A space.", "A semicolon."],
        "That's why you usually write `line.strip()`.",
    ),
    "c74-05": en(
        'What error does `open("missing.txt")` give if the file doesn\'t exist?',
        "FileNotFoundError",
        ["KeyError", "ValueError", "None: it creates an empty file."],
        "In read mode the file has to exist. It can be caught with `except FileNotFoundError:`.",
    ),
    # 74.2 · Organising your code (module 8)
    "c74-06": en(
        "After `from math import sqrt`, how do you call the function?",
        "sqrt(16)",
        ["math.sqrt(16)", "math(sqrt(16))", "import.sqrt(16)"],
        "`from … import` brings the name without a prefix; with `import math` it would be `math.sqrt(16)`.",
    ),
    "c74-07": en(
        "What is `random.seed(42)` for?",
        "To make the random values always come out the same so the program can be tested.",
        ["To generate the number 42.", "To get different values on every run.", "To pick 42 numbers."],
        'With the same seed, the sequence of "random" values is always the same.',
    ),
    "c74-08": en("What does this code print?", "9", ["8", "10", "-9"], "Subtracting two dates gives an interval; `.days` is the number of days between them.", code=_CODE["c74-08"]),
    "c74-09": en(
        "What does `json.dumps(data)` do?",
        "It turns Python data (dictionaries, lists…) into JSON text.",
        ["It reads a JSON file.", "It turns JSON text into a dictionary.", "It deletes the data."],
        "`dumps` goes from Python to text and `loads` from text to Python.",
    ),
    "c74-10": en(
        'In a module, what does the code inside `if __name__ == "__main__":` do?',
        "It only runs when you launch that file directly, not when it is imported.",
        ["It always runs, also when imported.", "It never runs.", "It only runs when imported."],
        'When a module is imported, its `__name__` is the module name, not "__main__".',
    ),
}
