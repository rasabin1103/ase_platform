import type { LessonModule } from '../../../learn/types'

/**
 * Curso 9: Python desde cero · Módulo 1 — Tu primer programa.
 * print, variables, tipos y operaciones, input y f-strings. Proyecto: el
 * primer gasto del «gestor de gastos» (concepto, importe, IVA y total).
 */
export const m01PrimerPrograma: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm01-primer-programa',
  number: 1,
  lang: 'es',
  title: 'Tu primer programa',
  subtitle: 'Escribe en pantalla, guarda datos en variables, haz cuentas y pregunta al usuario.',
  goals: [
    'Mostrar texto y resultados con print().',
    'Guardar datos en variables y cambiarlos.',
    'Distinguir números enteros, decimales, textos y booleanos, y convertir entre ellos.',
    'Pedir datos con input() y mostrarlos con f-strings.',
    'Empezar tu proyecto: el gestor de gastos.',
  ],
  lessons: [
    {
      id: 'print',
      title: 'print: tu primera línea de código',
      minutes: 6,
      blocks: [
        {
          kind: 'text',
          md: `Un **programa** es una lista de instrucciones que el ordenador ejecuta en orden, de arriba abajo.

La primera instrucción que vas a usar es \`print()\`: escribe en pantalla lo que le pongas entre los paréntesis.

- Un **texto** va entre comillas: \`print("Hola")\`. Da igual comillas dobles o simples, pero las de abrir y cerrar tienen que ser iguales.
- Un **número** va sin comillas: \`print(42)\`. Si escribes una operación, Python la calcula: \`print(2 + 3)\` muestra \`5\`.
- Puedes darle **varias cosas** separadas por comas: \`print("Tengo", 3, "gatos")\`. Python las escribe con un espacio entre ellas.
- Cada \`print()\` escribe en una **línea nueva**.

Lo que va detrás de \`#\` es un **comentario**: Python lo ignora. Sirve para explicar el código a quien lo lea.`,
        },
        {
          kind: 'example',
          id: 'ej_print',
          code: '# Esto es un comentario: Python no lo ejecuta\nprint("¡Hola, mundo!")\nprint("Python", "es", "fácil")\nprint(2 + 3)\nprint("2 + 3")',
          note: 'Pulsa «Ejecutar». Después cambia los textos o las cuentas y vuelve a ejecutar.',
        },
        {
          kind: 'predict',
          id: 'p_comillas',
          code: 'print(10 - 4)\nprint("10 - 4")',
          question: '¿Qué imprime este programa?',
          options: ['6\n6', '6\n10 - 4', '10 - 4\n6', '10 - 4\n10 - 4'],
          correct: 1,
          explanation: 'Sin comillas, `10 - 4` es una operación y Python la calcula. Entre comillas es un texto y se escribe tal cual.',
        },
        {
          kind: 'exercise',
          id: 'e_saludo',
          title: 'Tu presentación',
          prompt: `Escribe un programa que muestre **exactamente** estas dos líneas:

\`\`\`
Hola, me llamo Python
Hoy aprendo a programar
\`\`\``,
          starter: '# Escribe aquí tus dos print()\n',
          solution: 'print("Hola, me llamo Python")\nprint("Hoy aprendo a programar")',
          tests: [{ kind: 'output', label: 'Muestra las dos líneas exactas', expected: 'Hola, me llamo Python\nHoy aprendo a programar' }],
          hints: ['Necesitas dos `print()`, uno por línea.', 'Cada texto va entre comillas: `print("Hola, me llamo Python")`.', 'Fíjate en la coma, las mayúsculas y que no sobre ningún espacio.'],
        },
      ],
    },
    {
      id: 'variables',
      title: 'Variables: guardar datos',
      minutes: 7,
      blocks: [
        {
          kind: 'text',
          md: `Una **variable** es un nombre que guarda un valor para usarlo después. Se crea con \`=\`:

\`\`\`
nombre = "Lucía"
edad = 30
\`\`\`

El \`=\` no significa «es igual»: significa **guarda**. «Guarda "Lucía" en \`nombre\`».

Después usas el nombre en lugar del valor: \`print(nombre)\` muestra \`Lucía\`, **sin comillas**. Si pones comillas (\`print("nombre")\`), escribes la palabra *nombre*.

## Reglas para los nombres
- Letras, números y guion bajo: \`precio_total\`, \`gasto2\`.
- No pueden empezar por número ni tener espacios.
- Mayúsculas y minúsculas cuentan: \`Edad\` y \`edad\` son variables distintas.
- La costumbre en Python: minúsculas y palabras unidas con \`_\`.

## Cambiar el valor
Una variable puede cambiar: \`edad = edad + 1\` calcula \`edad + 1\` con el valor de ahora y lo guarda otra vez en \`edad\`.`,
        },
        {
          kind: 'example',
          id: 'ej_variables',
          code: 'nombre = "Lucía"\nedad = 30\nprint(nombre, "tiene", edad, "años")\n\nedad = edad + 1\nprint("El año que viene,", nombre, "tendrá", edad)',
        },
        {
          kind: 'predict',
          id: 'p_reasignar',
          code: 'puntos = 5\npuntos = puntos + 2\npuntos = puntos * 2\nprint(puntos)',
          question: '¿Qué imprime?',
          options: ['5', '7', '14', '12'],
          correct: 2,
          explanation: 'Línea a línea: `puntos` vale 5, luego 5 + 2 = 7, luego 7 × 2 = 14.',
        },
        {
          kind: 'exercise',
          id: 'e_producto',
          title: 'Un producto y su precio',
          prompt: `Crea dos variables:

- \`producto\`, con el texto \`"Auriculares"\`.
- \`precio\`, con el número \`59.9\`.

Después muestra con **un solo** \`print()\` y usando las variables:

\`\`\`
Auriculares cuesta 59.9
\`\`\``,
          starter: '# Crea las variables producto y precio\n\n# Muestra la frase usando las variables\n',
          solution: 'producto = "Auriculares"\nprecio = 59.9\nprint(producto, "cuesta", precio)',
          tests: [
            { kind: 'assert', label: 'La variable producto vale "Auriculares"', code: 'assert producto == "Auriculares"' },
            { kind: 'assert', label: 'La variable precio vale 59.9 (número, sin comillas)', code: 'assert precio == 59.9' },
            { kind: 'output', label: 'Muestra «Auriculares cuesta 59.9»', expected: 'Auriculares cuesta 59.9' },
            { kind: 'source', label: 'Usa las variables en el print (no escribas la frase entera a mano)', pattern: /print\s*\([^)]*\bproducto\b[^)]*\bprecio\b/ },
          ],
          hints: ['Las variables se crean con `=`: `producto = "Auriculares"`.', 'El precio es un número: va sin comillas.', 'En `print()` separa con comas: la variable, el texto `"cuesta"` y la otra variable.'],
        },
      ],
    },
    {
      id: 'tipos',
      title: 'Tipos de datos y operaciones',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `Cada valor tiene un **tipo**. Los cuatro básicos:

| Tipo | Qué es | Ejemplos |
|---|---|---|
| \`int\` | número entero | \`3\`, \`-10\`, \`2026\` |
| \`float\` | número decimal (con **punto**) | \`3.5\`, \`0.21\` |
| \`str\` | texto («string») | \`"Hola"\`, \`"42"\` |
| \`bool\` | verdadero o falso | \`True\`, \`False\` |

\`type(valor)\` te dice el tipo de algo.

## Operaciones con números
- \`+\` suma, \`-\` resta, \`*\` multiplica, \`/\` divide (siempre da decimal: \`10 / 2\` es \`5.0\`).
- \`//\` división entera (\`7 // 2\` es \`3\`) y \`%\` el resto (\`7 % 2\` es \`1\`).
- \`**\` potencia (\`2 ** 3\` es \`8\`).
- \`round(x, 2)\` redondea a 2 decimales.

## Operaciones con textos
- \`+\` **une** textos: \`"ja" + "ja"\` es \`"jaja"\`.
- \`*\` los repite: \`"ja" * 3\` es \`"jajaja"\`.
- Un número entre comillas es un texto: \`"5" + "5"\` es \`"55"\`, no \`10\`.

## Convertir
\`int("42")\` → \`42\`, \`float("3.5")\` → \`3.5\`, \`str(42)\` → \`"42"\`. Sumar un texto y un número da un error (\`TypeError\`): primero hay que convertir.`,
        },
        {
          kind: 'example',
          id: 'ej_tipos',
          code: 'print(type(3), type(3.5), type("3"), type(True))\nprint(7 / 2, 7 // 2, 7 % 2, 2 ** 3)\nprint("ja" * 3)\nprint("5" + "5", int("5") + int("5"))\nprint(round(10 / 3, 2))',
        },
        {
          kind: 'predict',
          id: 'p_texto_suma',
          code: 'a = "5"\nb = "5"\nprint(a + b)',
          question: '¿Qué imprime?',
          options: ['10', '55', '5 5', 'Un error'],
          correct: 1,
          explanation: '`a` y `b` son textos (van entre comillas), así que `+` los une: `"55"`. Para sumarlos como números: `int(a) + int(b)`.',
        },
        {
          kind: 'predict',
          id: 'p_division',
          code: 'print(10 / 2)\nprint(10 // 4)',
          question: '¿Qué imprime?',
          options: ['5\n2.5', '5.0\n2', '5\n2', '5.0\n2.5'],
          correct: 1,
          explanation: '`/` siempre devuelve un decimal (`5.0`). `//` es la división entera: 10 entre 4 cabe 2 veces.',
        },
        {
          kind: 'exercise',
          id: 'e_iva',
          title: 'Calcula el IVA',
          prompt: `Tienes un producto que cuesta \`120\` euros **sin IVA**. El IVA es el **21 %**.

1. Guarda en \`precio\` el valor \`120\`.
2. Calcula en \`iva\` el 21 % del precio (multiplica por \`0.21\`).
3. Calcula en \`total\` el precio más el IVA.
4. Muestra el total redondeado a 2 decimales.

La salida tiene que ser:

\`\`\`
145.2
\`\`\``,
          starter: 'precio = 120\n# Calcula iva y total\n\n# Muestra el total redondeado a 2 decimales\n',
          solution: 'precio = 120\niva = precio * 0.21\ntotal = precio + iva\nprint(round(total, 2))',
          tests: [
            { kind: 'assert', label: 'iva es el 21 % de precio', code: 'assert abs(iva - precio * 0.21) < 0.001' },
            { kind: 'assert', label: 'total es precio + iva', code: 'assert abs(total - (precio + iva)) < 0.001' },
            { kind: 'output', label: 'Muestra 145.2', expected: '145.2' },
          ],
          hints: ['El 21 % de algo es multiplicarlo por `0.21`.', '`iva = precio * 0.21` y luego `total = precio + iva`.', 'Para mostrarlo: `print(round(total, 2))`.'],
        },
      ],
    },
    {
      id: 'input',
      title: 'Preguntar al usuario: input y f-strings',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `\`input("pregunta")\` muestra la pregunta, espera a que el usuario escriba algo y te lo devuelve:

\`\`\`
nombre = input("¿Cómo te llamas? ")
\`\`\`

**Ojo:** \`input()\` siempre devuelve un **texto**, aunque el usuario escriba un número. Para hacer cuentas, conviértelo: \`edad = int(input("¿Edad? "))\` o \`float(...)\` si puede llevar decimales.

## f-strings: textos con huecos
Una **f-string** es un texto con una \`f\` delante. Lo que pongas entre llaves \`{}\` se sustituye por su valor:

\`\`\`
print(f"Hola, {nombre}. El año que viene tendrás {edad + 1} años.")
\`\`\`

Para mostrar un número con 2 decimales: \`{precio:.2f}\`. Así \`3.5\` se ve \`3.50\`.

En esta página, cuando un programa llama a \`input()\`, las respuestas salen de la caja que hay debajo del editor: **lo que escribe el usuario**, una línea por dato.`,
        },
        {
          kind: 'example',
          id: 'ej_input',
          code: 'nombre = input("¿Cómo te llamas? ")\nedad = int(input("¿Cuántos años tienes? "))\nprint(f"{nombre}, el año que viene tendrás {edad + 1} años")\nprint(f"Pi con dos decimales: {3.14159:.2f}")',
          inputs: ['Ana', '30'],
          note: 'Cambia las entradas y vuelve a ejecutar.',
        },
        {
          kind: 'predict',
          id: 'p_fstring',
          code: 'precio = 3.5\ncantidad = 2\nprint(f"Total: {precio * cantidad:.2f} €")',
          question: '¿Qué imprime?',
          options: ['Total: 7 €', 'Total: 7.00 €', 'Total: {precio * cantidad:.2f} €', 'Total: 7.0 €'],
          correct: 1,
          explanation: 'Dentro de las llaves se calcula `3.5 * 2 = 7.0`, y `:.2f` lo muestra con dos decimales: `7.00`.',
        },
        {
          kind: 'predict',
          id: 'p_input_texto',
          code: 'n = input("Número: ")   # el usuario escribe 4\nprint(n * 2)',
          question: 'Si el usuario escribe `4`, ¿qué imprime?',
          options: ['8', '44', '4 4', 'Un error'],
          correct: 1,
          explanation: '`input()` devuelve el texto `"4"`, y un texto por 2 se repite: `"44"`. Con `int(input(...))` saldría 8.',
          inputs: ['4'],
        },
        {
          kind: 'exercise',
          id: 'e_doble',
          title: 'El doble',
          prompt: `Pide un número entero con \`input("Número: ")\` y muestra su doble con una f-string:

\`\`\`
Número: 4
El doble de 4 es 8
\`\`\`

(La primera línea es la pregunta con lo que escribe el usuario.)`,
          starter: '# Pide el número y conviértelo a entero\n\n# Muestra el doble con una f-string\n',
          solution: 'n = int(input("Número: "))\nprint(f"El doble de {n} es {n * 2}")',
          sampleInputs: ['4'],
          tests: [
            { kind: 'output', label: 'Con 4 muestra «El doble de 4 es 8»', expected: 'Número: 4\nEl doble de 4 es 8', inputs: ['4'] },
            { kind: 'output', label: 'Con 15 muestra «El doble de 15 es 30»', expected: 'Número: 15\nEl doble de 15 es 30', inputs: ['15'] },
            { kind: 'source', label: 'Usa una f-string', pattern: /\bf["']/ },
          ],
          hints: ['`input()` devuelve texto: conviértelo con `int(...)`.', '`n = int(input("Número: "))`.', 'Dentro de la f-string puedes calcular: `f"El doble de {n} es {n * 2}"`.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Tu proyecto: el primer gasto',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `Durante el curso vas a construir **tu gestor de gastos**: un programa que apunta lo que gastas, lo clasifica, lo guarda y te da un resumen. Cada módulo le añade una pieza.

La de hoy: apuntar **un gasto**. El programa pregunta el concepto y el importe (sin IVA), calcula el IVA del 21 % y muestra un resumen con dos decimales y el símbolo del euro.`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_gasto',
          title: 'Proyecto · Apunta un gasto',
          project: true,
          prompt: `Escribe el programa que:

1. Pide el concepto con \`input("Concepto: ")\`.
2. Pide el importe con \`input("Importe: ")\` y lo convierte a número **decimal**.
3. Calcula \`iva\` (21 %) y \`total\` (importe + IVA).
4. Muestra el resumen, con todos los importes con 2 decimales:

\`\`\`
Concepto: Café
Importe: 10
--- Resumen ---
Concepto: Café
Importe: 10.00 €
IVA (21 %): 2.10 €
Total: 12.10 €
\`\`\``,
          starter: '# 1. Pide el concepto\n\n# 2. Pide el importe y conviértelo a decimal\n\n# 3. Calcula iva y total\n\n# 4. Muestra el resumen\nprint("--- Resumen ---")\n',
          solution:
            'concepto = input("Concepto: ")\nimporte = float(input("Importe: "))\niva = importe * 0.21\ntotal = importe + iva\nprint("--- Resumen ---")\nprint(f"Concepto: {concepto}")\nprint(f"Importe: {importe:.2f} €")\nprint(f"IVA (21 %): {iva:.2f} €")\nprint(f"Total: {total:.2f} €")',
          sampleInputs: ['Café', '10'],
          tests: [
            {
              kind: 'output',
              label: 'Café de 10 €',
              inputs: ['Café', '10'],
              expected: 'Concepto: Café\nImporte: 10\n--- Resumen ---\nConcepto: Café\nImporte: 10.00 €\nIVA (21 %): 2.10 €\nTotal: 12.10 €',
            },
            {
              kind: 'output',
              label: 'Portátil de 899.99 € (con decimales)',
              inputs: ['Portátil', '899.99'],
              expected: 'Concepto: Portátil\nImporte: 899.99\n--- Resumen ---\nConcepto: Portátil\nImporte: 899.99 €\nIVA (21 %): 189.00 €\nTotal: 1088.99 €',
            },
            { kind: 'assert', label: 'Guarda el IVA y el total en las variables iva y total', code: 'assert abs(iva - 2.1) < 0.001 and abs(total - 12.1) < 0.001', inputs: ['Café', '10'] },
          ],
          hints: [
            'El importe puede tener decimales: `float(input("Importe: "))`.',
            'Igual que en el ejercicio del IVA: `iva = importe * 0.21` y `total = importe + iva`.',
            'Para los dos decimales, en la f-string: `{importe:.2f}`. Por ejemplo `print(f"Total: {total:.2f} €")`.',
          ],
        },
        {
          kind: 'text',
          md: `## Lo que has aprendido
- \`print()\` escribe en pantalla; los textos van entre comillas.
- Las variables guardan valores con \`=\` y pueden cambiar.
- \`int\`, \`float\`, \`str\` y \`bool\`, y cómo convertir entre ellos.
- \`input()\` siempre devuelve texto, y las f-strings muestran valores con formato.

En el módulo 2 tu gestor aprenderá a **decidir**: clasificar cada gasto según su importe y su concepto.`,
        },
      ],
    },
  ],
}
