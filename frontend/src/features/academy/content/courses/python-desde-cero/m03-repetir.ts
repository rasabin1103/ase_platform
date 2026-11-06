import type { LessonModule } from '../../../learn/types'

/**
 * Curso 9: Python desde cero · Módulo 3 — Repetir.
 * for y range, while, contadores y acumuladores, break y continue. Proyecto:
 * el gestor pide gastos hasta «fin» y saca el número y el total.
 */
export const m03Repetir: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm03-repetir',
  number: 3,
  lang: 'es',
  title: 'Repetir',
  subtitle: 'Haz que el ordenador repita el trabajo por ti: bucles for y while.',
  goals: [
    'Repetir un número fijo de veces con for y range().',
    'Repetir mientras se cumpla una condición con while.',
    'Contar y sumar dentro de un bucle.',
    'Salir antes de tiempo con break y saltar una vuelta con continue.',
    'Apuntar todos los gastos que quieras en tu proyecto.',
  ],
  lessons: [
    {
      id: 'for',
      title: 'for y range: repetir N veces',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `Un **bucle** repite un bloque de código. El más habitual es \`for\`:

\`\`\`
for i in range(3):
    print("Hola", i)
\`\`\`

Escribe \`Hola 0\`, \`Hola 1\` y \`Hola 2\`. Como en el \`if\`, la línea acaba en \`:\` y lo que se repite va **sangrado**.

\`range\` genera los números que recorre el bucle:

| Escribes | Números |
|---|---|
| \`range(5)\` | 0, 1, 2, 3, 4 (empieza en 0 y **no** incluye el 5) |
| \`range(1, 6)\` | 1, 2, 3, 4, 5 |
| \`range(0, 10, 2)\` | 0, 2, 4, 6, 8 (de 2 en 2) |

La variable del \`for\` (aquí \`i\`) toma cada valor por turno. Puedes llamarla como quieras: \`for numero in range(1, 11):\`.

\`for\` también recorre los caracteres de un texto: \`for letra in "hola":\`.`,
        },
        {
          kind: 'example',
          id: 'ej_for',
          code: 'for numero in range(1, 6):\n    print(numero, "x 3 =", numero * 3)\n\nfor letra in "Python":\n    print(letra)',
        },
        {
          kind: 'predict',
          id: 'p_range',
          code: 'for i in range(2, 6):\n    print(i)',
          question: '¿Qué imprime?',
          options: ['2\n3\n4\n5\n6', '2\n3\n4\n5', '3\n4\n5', '2\n6'],
          correct: 1,
          explanation: '`range(2, 6)` empieza en 2 y para **antes** del 6: 2, 3, 4, 5.',
        },
        {
          kind: 'exercise',
          id: 'e_tabla',
          title: 'Tabla de multiplicar',
          prompt: `Pide un número con \`int(input("Número: "))\` y muestra su tabla del 1 al 10, con este formato:

\`\`\`
Número: 7
7 x 1 = 7
7 x 2 = 14
…
7 x 10 = 70
\`\`\``,
          starter: 'n = int(input("Número: "))\n# Recorre del 1 al 10 y muestra cada línea\n',
          solution: 'n = int(input("Número: "))\nfor i in range(1, 11):\n    print(f"{n} x {i} = {n * i}")',
          sampleInputs: ['7'],
          tests: [
            {
              kind: 'output',
              label: 'La tabla del 7, del 1 al 10',
              expected: 'Número: 7\n7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63\n7 x 10 = 70',
              inputs: ['7'],
            },
            {
              kind: 'output',
              label: 'La tabla del 2',
              expected: 'Número: 2\n2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20',
              inputs: ['2'],
            },
            { kind: 'source', label: 'Usa un bucle for', pattern: /\bfor\b/ },
          ],
          hints: ['Del 1 al 10 incluido es `range(1, 11)`.', '`for i in range(1, 11):` y, dentro, un `print`.', 'Con f-string: `print(f"{n} x {i} = {n * i}")`.'],
        },
      ],
    },
    {
      id: 'acumular',
      title: 'Contar y sumar en un bucle',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `Dos patrones que vas a usar siempre:

**Acumulador**: una variable que empieza en 0 y va sumando en cada vuelta.

\`\`\`
total = 0
for precio in [3, 5, 2]:
    total = total + precio
print(total)   # 10
\`\`\`

**Contador**: igual, pero suma 1 cada vez que pasa algo.

\`\`\`
pares = 0
for n in range(1, 11):
    if n % 2 == 0:
        pares = pares + 1
\`\`\`

\`%\` es el **resto** de la división: \`7 % 2\` es 1, \`8 % 2\` es 0. Si el resto entre 2 es 0, el número es par.

Atajo: \`total += precio\` es lo mismo que \`total = total + precio\`.

**Muy importante:** la variable se crea **antes** del bucle. Si la pones dentro, vuelve a 0 en cada vuelta.`,
        },
        {
          kind: 'example',
          id: 'ej_acumular',
          code: 'total = 0\ncuantos = 0\nfor n in range(1, 11):\n    total += n\n    if n % 2 == 0:\n        cuantos += 1\nprint("Suma del 1 al 10:", total)\nprint("Pares:", cuantos)',
        },
        {
          kind: 'predict',
          id: 'p_acumular_dentro',
          code: 'for n in range(1, 4):\n    suma = 0\n    suma += n\nprint(suma)',
          question: '¿Qué imprime?',
          options: ['6', '3', '0', '1'],
          correct: 1,
          explanation: '`suma = 0` está **dentro** del bucle: en cada vuelta se pone a 0 y luego se suma solo `n`. En la última vuelta `n` vale 3, así que queda 3. Los acumuladores se crean antes del bucle.',
        },
        {
          kind: 'exercise',
          id: 'e_suma_notas',
          title: 'La media de cinco notas',
          prompt: `Pide **5 notas** (decimales) con \`input("Nota: ")\` usando un bucle, súmalas en \`total\` y muestra la media con un decimal:

\`\`\`
Nota: 7
Nota: 8.5
Nota: 6
Nota: 9
Nota: 5.5
Media: 7.2
\`\`\``,
          starter: 'total = 0\n# Pide 5 notas con un bucle y súmalas\n\n# Muestra la media con un decimal\n',
          solution: 'total = 0\nfor i in range(5):\n    nota = float(input("Nota: "))\n    total += nota\nmedia = total / 5\nprint(f"Media: {media:.1f}")',
          sampleInputs: ['7', '8.5', '6', '9', '5.5'],
          tests: [
            { kind: 'output', label: 'Media de 7, 8.5, 6, 9 y 5.5 → 7.2', expected: 'Nota: 7\nNota: 8.5\nNota: 6\nNota: 9\nNota: 5.5\nMedia: 7.2', inputs: ['7', '8.5', '6', '9', '5.5'] },
            { kind: 'output', label: 'Cinco dieces → 10.0', expected: 'Nota: 10\nNota: 10\nNota: 10\nNota: 10\nNota: 10\nMedia: 10.0', inputs: ['10', '10', '10', '10', '10'] },
            { kind: 'assert', label: 'total es la suma de las notas', code: 'assert abs(total - 36) < 0.001', inputs: ['7', '8.5', '6', '9', '5.5'] },
            { kind: 'source', label: 'Usa un bucle (no cinco input escritos a mano)', pattern: /\b(for|while)\b/ },
          ],
          hints: ['Un `for i in range(5):` repite 5 veces.', 'Dentro: `nota = float(input("Nota: "))` y `total += nota`.', 'Después del bucle (sin sangría): `print(f"Media: {total / 5:.1f}")`.'],
        },
      ],
    },
    {
      id: 'while',
      title: 'while, break y continue',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `\`for\` sirve cuando sabes **cuántas veces** repetir. Cuando no lo sabes, \`while\` repite **mientras** la condición sea cierta:

\`\`\`
saldo = 100
while saldo > 0:
    saldo = saldo - 30
    print("Quedan", saldo)
\`\`\`

**Cuidado con los bucles infinitos:** si la condición nunca se vuelve falsa, el bucle no termina. Aquí, si se te olvida restar, \`saldo\` siempre vale 100. (En esta página el programa se para solo a los 8 segundos.)

## break: salir ya
\`break\` termina el bucle en ese momento. Es el patrón típico para **pedir datos hasta una palabra clave**:

\`\`\`
while True:
    texto = input("Escribe algo (fin para salir): ")
    if texto == "fin":
        break
    print("Has escrito", texto)
\`\`\`

\`while True\` sería infinito; el \`break\` es la salida.

## continue: saltar esta vuelta
\`continue\` pasa directamente a la siguiente vuelta, sin ejecutar lo que queda:

\`\`\`
for n in range(1, 6):
    if n == 3:
        continue
    print(n)    # 1, 2, 4, 5
\`\`\``,
        },
        {
          kind: 'example',
          id: 'ej_while',
          code: 'intentos = 0\nwhile True:\n    clave = input("Contraseña: ")\n    intentos += 1\n    if clave == "python":\n        print("¡Dentro!")\n        break\n    print("Incorrecta")\nprint("Intentos:", intentos)',
          inputs: ['hola', '1234', 'python'],
          note: 'Las entradas tienen tres intentos. Cambia el orden o pon la buena primero.',
        },
        {
          kind: 'predict',
          id: 'p_while',
          code: 'n = 1\nwhile n < 20:\n    n = n * 3\nprint(n)',
          question: '¿Qué imprime?',
          options: ['9', '20', '27', '81'],
          correct: 2,
          explanation: '1 → 3 → 9 → 27. Cuando `n` vale 27, `27 < 20` es falso y el bucle para. Se imprime después del bucle.',
        },
        {
          kind: 'predict',
          id: 'p_continue',
          code: 'for n in range(1, 7):\n    if n % 2 == 0:\n        continue\n    print(n)',
          question: '¿Qué imprime?',
          options: ['2\n4\n6', '1\n3\n5', '1\n2\n3\n4\n5\n6', '1'],
          correct: 1,
          explanation: 'Con los pares (resto 0) se ejecuta `continue` y se salta el `print`. Solo se imprimen los impares.',
        },
        {
          kind: 'exercise',
          id: 'e_hasta_cero',
          title: 'Suma hasta cero',
          prompt: `Pide números enteros con \`input("Número (0 para terminar): ")\` **hasta que el usuario escriba 0**. Después muestra cuántos números ha escrito (sin contar el 0) y su suma:

\`\`\`
Número (0 para terminar): 5
Número (0 para terminar): 10
Número (0 para terminar): 0
Números: 2
Suma: 15
\`\`\``,
          starter: 'cuantos = 0\nsuma = 0\n# Repite hasta que llegue un 0\n\nprint("Números:", cuantos)\nprint("Suma:", suma)\n',
          solution: 'cuantos = 0\nsuma = 0\nwhile True:\n    n = int(input("Número (0 para terminar): "))\n    if n == 0:\n        break\n    cuantos += 1\n    suma += n\nprint("Números:", cuantos)\nprint("Suma:", suma)',
          sampleInputs: ['5', '10', '0'],
          tests: [
            { kind: 'output', label: '5, 10 y 0 → 2 números, suma 15', expected: 'Número (0 para terminar): 5\nNúmero (0 para terminar): 10\nNúmero (0 para terminar): 0\nNúmeros: 2\nSuma: 15', inputs: ['5', '10', '0'] },
            { kind: 'output', label: 'Un 0 de entrada → 0 números', expected: 'Número (0 para terminar): 0\nNúmeros: 0\nSuma: 0', inputs: ['0'] },
            {
              kind: 'output',
              label: 'Con negativos también cuenta',
              expected: 'Número (0 para terminar): 3\nNúmero (0 para terminar): -1\nNúmero (0 para terminar): 4\nNúmero (0 para terminar): 0\nNúmeros: 3\nSuma: 6',
              inputs: ['3', '-1', '4', '0'],
            },
          ],
          hints: ['Como no sabes cuántos números habrá: `while True:`.', 'Dentro, lo primero es pedir el número; si es 0, `break`.', 'Si no es 0, `cuantos += 1` y `suma += n`.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Tu proyecto: todos los gastos',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `Hasta ahora tu gestor apuntaba **un** gasto. Ahora va a pedir gastos **hasta que escribas \`fin\`** como concepto, y al final dirá cuántos has apuntado y cuánto suman.

Es el patrón de la lección anterior: \`while True\`, pedir, comprobar la palabra clave con \`break\`, y contar y sumar.`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_bucle',
          title: 'Proyecto · Apunta gastos hasta «fin»',
          project: true,
          prompt: `Escribe el programa que repite:

1. Pide \`input("Concepto (o fin): ")\`. Si es \`fin\`, termina.
2. Si no, pide \`input("Importe: ")\` (decimal), suma 1 a \`cuantos\` y el importe a \`total\`.

Al terminar muestra:

\`\`\`
Concepto (o fin): café
Importe: 2.5
Concepto (o fin): taxi
Importe: 12
Concepto (o fin): fin
Gastos apuntados: 2
Total: 14.50 €
\`\`\``,
          starter: 'cuantos = 0\ntotal = 0\n# Repite hasta que el concepto sea «fin»\n\n# Muestra el resumen\n',
          solution:
            'cuantos = 0\ntotal = 0\nwhile True:\n    concepto = input("Concepto (o fin): ")\n    if concepto == "fin":\n        break\n    importe = float(input("Importe: "))\n    cuantos += 1\n    total += importe\nprint(f"Gastos apuntados: {cuantos}")\nprint(f"Total: {total:.2f} €")',
          sampleInputs: ['café', '2.5', 'taxi', '12', 'fin'],
          tests: [
            {
              kind: 'output',
              label: 'Café y taxi → 2 gastos, 14.50 €',
              expected: 'Concepto (o fin): café\nImporte: 2.5\nConcepto (o fin): taxi\nImporte: 12\nConcepto (o fin): fin\nGastos apuntados: 2\nTotal: 14.50 €',
              inputs: ['café', '2.5', 'taxi', '12', 'fin'],
            },
            { kind: 'output', label: '«fin» de entrada → 0 gastos', expected: 'Concepto (o fin): fin\nGastos apuntados: 0\nTotal: 0.00 €', inputs: ['fin'] },
            {
              kind: 'output',
              label: 'Tres gastos',
              expected: 'Concepto (o fin): super\nImporte: 45.3\nConcepto (o fin): cine\nImporte: 9\nConcepto (o fin): bus\nImporte: 1.5\nConcepto (o fin): fin\nGastos apuntados: 3\nTotal: 55.80 €',
              inputs: ['super', '45.3', 'cine', '9', 'bus', '1.5', 'fin'],
            },
            { kind: 'assert', label: 'Las variables cuantos y total tienen el resultado', code: 'assert cuantos == 2 and abs(total - 14.5) < 0.001', inputs: ['café', '2.5', 'taxi', '12', 'fin'] },
          ],
          hints: [
            'Crea `cuantos = 0` y `total = 0` antes del bucle.',
            'Dentro de `while True:` pide el concepto y, si es `"fin"`, haz `break` **antes** de pedir el importe.',
            'Después del bucle: `print(f"Total: {total:.2f} €")`.',
          ],
        },
        {
          kind: 'text',
          md: `## Lo que has aprendido
- \`for\` con \`range()\` repite un número fijo de veces; \`while\` repite mientras se cumpla una condición.
- Contadores y acumuladores: se crean antes del bucle y se actualizan dentro.
- \`break\` sale del bucle y \`continue\` salta a la siguiente vuelta.

En el módulo 4 tu gestor dejará de olvidar los gastos: los guardará todos en una **lista** para poder repasarlos y agruparlos.`,
        },
      ],
    },
  ],
}
