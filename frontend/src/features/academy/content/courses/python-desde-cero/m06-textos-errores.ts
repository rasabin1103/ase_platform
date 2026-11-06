import type { LessonModule } from '../../../learn/types'

/**
 * Curso 9: Python desde cero · Módulo 6 — Textos y errores.
 * Métodos de str, leer un error de Python, try/except. Proyecto: el gestor
 * limpia el concepto y no se rompe si el importe no es un número.
 */
export const m06TextosErrores: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm06-textos-errores',
  number: 6,
  lang: 'es',
  title: 'Textos y errores',
  subtitle: 'Limpia y transforma textos, entiende los errores de Python y evita que tu programa se rompa.',
  goals: [
    'Transformar textos con lower(), strip(), replace(), split() y join().',
    'Leer un error de Python: el tipo, la línea y el mensaje.',
    'Arreglar los errores más habituales.',
    'Capturar errores con try y except.',
    'Validar lo que escribe el usuario en tu proyecto.',
  ],
  lessons: [
    {
      id: 'metodos',
      title: 'Trabajar con textos',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `Los textos (\`str\`) traen **métodos**: funciones que se llaman con un punto detrás del texto. **Devuelven un texto nuevo**; el original no cambia.

| Método | Ejemplo | Resultado |
|---|---|---|
| \`lower()\` / \`upper()\` | \`"Hola".lower()\` | \`"hola"\` |
| \`strip()\` | \`"  hola  ".strip()\` | \`"hola"\` (quita espacios de los extremos) |
| \`replace(a, b)\` | \`"2,5".replace(",", ".")\` | \`"2.5"\` |
| \`split(sep)\` | \`"a;b;c".split(";")\` | \`["a", "b", "c"]\` |
| \`sep.join(lista)\` | \`", ".join(["a", "b"])\` | \`"a, b"\` |
| \`startswith(x)\` | \`"ES12".startswith("ES")\` | \`True\` |
| \`title()\` | \`"ana garcía".title()\` | \`"Ana García"\` |

Se pueden **encadenar**: \`texto.strip().lower()\` primero quita espacios y después pasa a minúsculas.

## Trozos de un texto
Como en las listas, \`texto[0]\` es el primer carácter y \`texto[-1]\` el último. Un **trozo**: \`texto[0:3]\` son los caracteres 0, 1 y 2. \`"Python"[:2]\` es \`"Py"\`.`,
        },
        {
          kind: 'example',
          id: 'ej_metodos',
          code: 'nombre = "   lucía PÉREZ  "\nlimpio = nombre.strip().title()\nprint(f"[{limpio}]")\n\nfrase = "manzanas;peras;uvas"\nfrutas = frase.split(";")\nprint(frutas)\nprint(" y ".join(frutas))\n\nprecio = "12,50"\nprint(float(precio.replace(",", ".")) * 2)\nprint("Python"[:2], "Python"[-1])',
        },
        {
          kind: 'predict',
          id: 'p_metodos',
          code: 'texto = "  Hola Mundo  "\ntexto.upper()\nprint(texto.strip())',
          question: '¿Qué imprime?',
          options: ['HOLA MUNDO', 'Hola Mundo', '  HOLA MUNDO  ', '  Hola Mundo'],
          correct: 1,
          explanation: '`texto.upper()` devuelve un texto nuevo en mayúsculas, pero no se guarda en ningún sitio: `texto` no cambia. Luego `strip()` quita los espacios: «Hola Mundo».',
        },
        {
          kind: 'exercise',
          id: 'e_iniciales',
          title: 'Iniciales',
          prompt: `Pide un nombre completo con \`input("Nombre completo: ")\` y muestra sus **iniciales en mayúsculas, con un punto detrás de cada una**. El usuario puede dejar espacios de más al principio o al final.

\`\`\`
Nombre completo:   ana maría garcía
Iniciales: A.M.G.
\`\`\``,
          starter: 'nombre = input("Nombre completo: ")\n# Separa las palabras y junta sus iniciales\n',
          solution: 'nombre = input("Nombre completo: ")\npalabras = nombre.strip().split()\niniciales = ""\nfor p in palabras:\n    iniciales += p[0].upper() + "."\nprint("Iniciales:", iniciales)',
          sampleInputs: ['  ana maría garcía '],
          tests: [
            { kind: 'output', label: 'ana maría garcía → A.M.G.', expected: 'Nombre completo:   ana maría garcía\nIniciales: A.M.G.', inputs: ['  ana maría garcía '] },
            { kind: 'output', label: 'Luis Gómez → L.G.', expected: 'Nombre completo: Luis Gómez\nIniciales: L.G.', inputs: ['Luis Gómez'] },
            { kind: 'output', label: 'Un solo nombre → E.', expected: 'Nombre completo: eva\nIniciales: E.', inputs: ['eva'] },
          ],
          hints: ['`nombre.strip().split()` da la lista de palabras (sin argumentos, `split()` separa por espacios).', 'La inicial de una palabra `p` es `p[0]`, y en mayúsculas `p[0].upper()`.', 'Ve juntando: `iniciales = ""` y en el bucle `iniciales += p[0].upper() + "."`.'],
        },
      ],
    },
    {
      id: 'leer_errores',
      title: 'Leer un error',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `Los errores no son un fracaso: son Python diciéndote **qué** ha pasado y **dónde**. Un mensaje de error tiene tres partes que conviene leer siempre:

1. **El tipo**: \`NameError\`, \`TypeError\`…
2. **La línea** donde ocurrió.
3. **El mensaje**, que explica el problema.

| Error | Qué suele significar |
|---|---|
| \`SyntaxError\` | Algo mal escrito: comillas o paréntesis sin cerrar, faltan los dos puntos… |
| \`IndentationError\` | La sangría no es la que toca. |
| \`NameError\` | Usas un nombre que no existe: mal escrito, o un texto sin comillas. |
| \`TypeError\` | Mezclas tipos: \`"Total: " + 5\`. |
| \`ValueError\` | El tipo es bueno pero el valor no: \`int("hola")\`. |
| \`ZeroDivisionError\` | Divides entre cero. |
| \`IndexError\` / \`KeyError\` | Una posición o una clave que no existe. |

**Método para arreglar un error:** ve a la línea que dice el error, lee el mensaje y pregúntate qué valor tiene cada variable en ese momento. En este curso, debajo del error verás también una explicación en lenguaje sencillo.`,
        },
        {
          kind: 'predict',
          id: 'p_error_tipo',
          code: 'edad = 30\nprint("Tienes " + edad + " años")',
          question: '¿Qué pasa al ejecutarlo?',
          options: ['Imprime «Tienes 30 años»', 'TypeError: no se puede sumar un texto y un número', 'NameError: edad no existe', 'SyntaxError'],
          correct: 1,
          explanation: 'Con `+` Python no junta un texto y un número. Soluciones: `str(edad)`, una coma en el `print` o una f-string.',
        },
        {
          kind: 'predict',
          id: 'p_error_nombre',
          code: 'precio = 10\nprint(Precio * 2)',
          question: '¿Qué pasa al ejecutarlo?',
          options: ['Imprime 20', 'TypeError', 'NameError: Precio no existe (las mayúsculas cuentan)', 'Imprime «Precio * 2»'],
          correct: 2,
          explanation: '`Precio` y `precio` son nombres distintos. Python no conoce `Precio`: NameError en la línea 2.',
        },
        {
          kind: 'exercise',
          id: 'e_arregla',
          title: 'Arregla el programa',
          prompt: `Este programa tiene **tres errores**. Ejecútalo, lee cada error, arréglalo y vuelve a ejecutar hasta que funcione. Tiene que mostrar:

\`\`\`
Producto: Teclado
Unidades: 3
Total: 89.97 €
\`\`\``,
          starter: 'producto = "Teclado"\nprecio = 29.99\nunidades = "3"\n\nprint("Producto: " + producto\nprint("Unidades: " + unidades)\ntotal = precio * unidades\nprint(f"Total: {totl:.2f} €")\n',
          solution: 'producto = "Teclado"\nprecio = 29.99\nunidades = "3"\n\nprint("Producto: " + producto)\nprint("Unidades: " + unidades)\ntotal = precio * int(unidades)\nprint(f"Total: {total:.2f} €")',
          tests: [
            { kind: 'output', label: 'Muestra producto, unidades y total', expected: 'Producto: Teclado\nUnidades: 3\nTotal: 89.97 €' },
            { kind: 'assert', label: 'total es un número (89.97)', code: 'assert abs(total - 89.97) < 0.001' },
          ],
          hints: [
            'El primer error es un `SyntaxError`: en la línea 5 falta cerrar un paréntesis.',
            'Después sale un `TypeError` al multiplicar: `unidades` es un texto. Conviértelo con `int(unidades)` en la cuenta.',
            'El último es un `NameError`: hay un nombre mal escrito en la f-string.',
          ],
        },
      ],
    },
    {
      id: 'try',
      title: 'try y except: que no se rompa',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `Algunos errores no dependen de ti sino del **usuario**: si escribe «hola» donde esperabas un número, \`int()\` da \`ValueError\` y el programa se para.

\`try\` y \`except\` te dejan **capturar** el error y decidir qué hacer:

\`\`\`
try:
    edad = int(input("Edad: "))
    print("El año que viene tendrás", edad + 1)
except ValueError:
    print("Eso no es un número")
\`\`\`

- Python ejecuta el bloque \`try\`. Si todo va bien, se salta el \`except\`.
- Si ocurre un \`ValueError\`, salta **en ese momento** al \`except\` (lo que quedaba del \`try\` no se ejecuta).
- Pon siempre el **tipo** de error que esperas. Un \`except:\` sin tipo captura todo, también los errores de tu propio código, y los esconde.

## Pedir hasta que sea válido
Con un \`while True\` se repite la pregunta hasta que el dato sirve:

\`\`\`
while True:
    try:
        edad = int(input("Edad: "))
        break                    # válido: salimos del bucle
    except ValueError:
        print("Escribe un número entero")
\`\`\``,
        },
        {
          kind: 'example',
          id: 'ej_try',
          code: 'while True:\n    try:\n        a = int(input("Dividendo: "))\n        b = int(input("Divisor: "))\n        print("Resultado:", a / b)\n        break\n    except ValueError:\n        print("Tienen que ser números enteros")\n    except ZeroDivisionError:\n        print("No se puede dividir entre cero")',
          inputs: ['diez', '10', '0', '10', '4'],
          note: 'Las entradas provocan los dos errores antes de la división buena. Cámbialas y mira qué pasa.',
        },
        {
          kind: 'predict',
          id: 'p_try',
          code: 'try:\n    n = int("3.5")\n    print("Uno")\nexcept ValueError:\n    print("Dos")\nprint("Tres")',
          question: '¿Qué imprime?',
          options: ['Uno\nTres', 'Dos\nTres', 'Uno\nDos\nTres', 'Dos'],
          correct: 1,
          explanation: '`int("3.5")` da `ValueError` (para un texto con decimales hace falta `float`). Salta al `except`, que imprime «Dos», y después el programa sigue con «Tres». «Uno» no llega a ejecutarse.',
        },
        {
          kind: 'exercise',
          id: 'e_pedir_numero',
          title: 'Pide hasta que sea un número',
          prompt: `Pide la edad con \`input("Edad: ")\` hasta que el usuario escriba un **número entero**. Cada vez que no lo sea, muestra \`No es un número\`. Al final:

\`\`\`
Edad: treinta
No es un número
Edad: 30
Tienes 30 años
\`\`\``,
          starter: '# Repite la pregunta hasta que la edad sea un número entero\n\nprint(f"Tienes {edad} años")\n',
          solution: 'while True:\n    try:\n        edad = int(input("Edad: "))\n        break\n    except ValueError:\n        print("No es un número")\n\nprint(f"Tienes {edad} años")',
          sampleInputs: ['treinta', '30'],
          tests: [
            { kind: 'output', label: '«treinta» y luego 30', expected: 'Edad: treinta\nNo es un número\nEdad: 30\nTienes 30 años', inputs: ['treinta', '30'] },
            { kind: 'output', label: 'Válido a la primera', expected: 'Edad: 41\nTienes 41 años', inputs: ['41'] },
            { kind: 'output', label: 'Dos intentos fallidos', expected: 'Edad: x\nNo es un número\nEdad: 2.5\nNo es un número\nEdad: 7\nTienes 7 años', inputs: ['x', '2.5', '7'] },
            { kind: 'source', label: 'Captura ValueError', pattern: /except\s+ValueError/ },
          ],
          hints: ['El patrón es `while True:` con un `try` dentro.', 'En el `try`: `edad = int(input("Edad: "))` y `break`.', '`except ValueError:` con el `print("No es un número")`.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Tu proyecto: datos limpios',
      minutes: 12,
      blocks: [
        {
          kind: 'text',
          md: `Los usuarios escriben de muchas formas: «  Café con LECHE », «2,5» con coma, o «dos» con letras. Tu gestor va a **limpiar** el concepto y a **pedir el importe hasta que sea válido**:

- El concepto, sin espacios en los extremos y en minúsculas.
- El importe acepta coma o punto decimal.
- Si no es un número: \`Importe no válido, escribe un número.\`
- Si es 0 o negativo: \`El importe tiene que ser mayor que 0.\``,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_validar',
          title: 'Proyecto · Valida la entrada',
          project: true,
          prompt: `Escribe el programa que:

1. Pide \`input("Concepto: ")\` y guarda en \`concepto\` el texto limpio (sin espacios en los extremos y en minúsculas).
2. Pide \`input("Importe: ")\` hasta que sea válido (con las reglas de arriba) y lo guarda en \`importe\`.
3. Muestra \`Apuntado: <concepto> · <importe con 2 decimales> €\`.

\`\`\`
Concepto:   Café con LECHE
Importe: dos
Importe no válido, escribe un número.
Importe: -3
El importe tiene que ser mayor que 0.
Importe: 2,5
Apuntado: café con leche · 2.50 €
\`\`\``,
          starter: '# 1. Pide el concepto y límpialo\n\n# 2. Pide el importe hasta que sea válido\n\n# 3. Muestra lo apuntado\n',
          solution:
            'concepto = input("Concepto: ").strip().lower()\nwhile True:\n    texto = input("Importe: ")\n    try:\n        importe = float(texto.replace(",", "."))\n    except ValueError:\n        print("Importe no válido, escribe un número.")\n        continue\n    if importe <= 0:\n        print("El importe tiene que ser mayor que 0.")\n        continue\n    break\nprint(f"Apuntado: {concepto} · {importe:.2f} €")',
          sampleInputs: ['  Café con LECHE ', 'dos', '-3', '2,5'],
          tests: [
            {
              kind: 'output',
              label: 'Limpia el concepto y rechaza «dos» y -3',
              expected: 'Concepto:   Café con LECHE\nImporte: dos\nImporte no válido, escribe un número.\nImporte: -3\nEl importe tiene que ser mayor que 0.\nImporte: 2,5\nApuntado: café con leche · 2.50 €',
              inputs: ['  Café con LECHE ', 'dos', '-3', '2,5'],
            },
            { kind: 'output', label: 'Válido a la primera, con punto', expected: 'Concepto: Taxi\nImporte: 12.4\nApuntado: taxi · 12.40 €', inputs: ['Taxi', '12.4'] },
            { kind: 'output', label: 'El 0 no vale', expected: 'Concepto: cine\nImporte: 0\nEl importe tiene que ser mayor que 0.\nImporte: 9\nApuntado: cine · 9.00 €', inputs: ['cine', '0', '9'] },
            { kind: 'assert', label: 'concepto e importe quedan limpios en sus variables', code: 'assert concepto == "café con leche" and importe == 2.5', inputs: ['  Café con LECHE ', 'dos', '-3', '2,5'] },
            { kind: 'source', label: 'Captura ValueError', pattern: /except\s+ValueError/ },
          ],
          hints: [
            'El concepto en una línea: `concepto = input("Concepto: ").strip().lower()`.',
            'Para el importe: `while True:`, `try: importe = float(texto.replace(",", "."))` y `except ValueError:` con el mensaje y `continue`.',
            'Después del `try`, comprueba `if importe <= 0:` (mensaje y `continue`). Si llega hasta el final de la vuelta, `break`.',
          ],
        },
        {
          kind: 'text',
          md: `## Lo que has aprendido
- Los métodos de texto devuelven un texto nuevo y se pueden encadenar.
- Un error dice el tipo, la línea y el motivo: léelo antes de cambiar nada.
- \`try\` / \`except\` captura los errores esperados para que el programa no se rompa.

En el módulo 7 tu gestor podrá **guardar** los gastos en un fichero y **cargarlos** al volver a abrirlo.`,
        },
      ],
    },
  ],
}
