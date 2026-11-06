import type { LessonModule } from '../../../learn/types'

/**
 * Curso 9: Python desde cero · Módulo 2 — Decidir.
 * Comparaciones y booleanos, if/elif/else, and/or/not e in. Proyecto: el
 * gestor clasifica cada gasto y avisa de los grandes.
 */
export const m02Decidir: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm02-decidir',
  number: 2,
  lang: 'es',
  title: 'Decidir',
  subtitle: 'Haz que tu programa compare datos y elija qué hacer en cada caso.',
  goals: [
    'Comparar valores y entender True y False.',
    'Elegir entre caminos con if, elif y else.',
    'Combinar condiciones con and, or y not.',
    'Buscar un texto dentro de otro con in.',
    'Clasificar los gastos de tu proyecto.',
  ],
  lessons: [
    {
      id: 'comparar',
      title: 'Comparar: True o False',
      minutes: 6,
      blocks: [
        {
          kind: 'text',
          md: `Para decidir, primero hay que **preguntar**. En Python una pregunta es una **comparación**, y su respuesta es \`True\` (verdadero) o \`False\` (falso): el tipo \`bool\` que viste en el módulo 1.

| Operador | Significa | Ejemplo | Resultado |
|---|---|---|---|
| \`==\` | igual | \`3 == 3\` | \`True\` |
| \`!=\` | distinto | \`3 != 4\` | \`True\` |
| \`<\` \`>\` | menor, mayor | \`5 < 2\` | \`False\` |
| \`<=\` \`>=\` | menor o igual, mayor o igual | \`5 >= 5\` | \`True\` |

- **No confundas** \`=\` (guardar en una variable) con \`==\` (comparar).
- Los textos también se comparan: \`"hola" == "hola"\` es \`True\`, pero \`"Hola" == "hola"\` es \`False\`: las mayúsculas cuentan.
- Un número y un texto nunca son iguales: \`5 == "5"\` es \`False\`.`,
        },
        {
          kind: 'example',
          id: 'ej_comparar',
          code: 'edad = 17\nprint(edad >= 18)\nprint(edad == 17)\nprint("gato" == "Gato")\nmayor = edad >= 18\nprint("¿Es mayor de edad?", mayor)',
          note: 'Cambia la edad y mira cómo cambian los resultados.',
        },
        {
          kind: 'predict',
          id: 'p_comparar',
          code: 'a = 10\nb = "10"\nprint(a == 10)\nprint(a == b)\nprint(a != 7)',
          question: '¿Qué imprime?',
          options: ['True\nTrue\nTrue', 'True\nFalse\nTrue', 'True\nFalse\nFalse', 'False\nFalse\nTrue'],
          correct: 1,
          explanation: '`a == 10` es cierto. `a == b` compara el número 10 con el texto "10": son tipos distintos, así que es `False`. `10 != 7` es cierto.',
        },
        {
          kind: 'exercise',
          id: 'e_aprobado',
          title: '¿Ha aprobado?',
          prompt: `Guarda en \`nota\` el valor \`6.5\`. Después guarda en \`aprobado\` si la nota es **mayor o igual que 5** (una comparación, no escribas \`True\` a mano) y muéstralo:

\`\`\`
Aprobado: True
\`\`\``,
          starter: 'nota = 6.5\n# Guarda en aprobado la comparación\n\n# Muestra el resultado\n',
          solution: 'nota = 6.5\naprobado = nota >= 5\nprint("Aprobado:", aprobado)',
          tests: [
            { kind: 'output', label: 'Muestra «Aprobado: True»', expected: 'Aprobado: True' },
            { kind: 'assert', label: 'aprobado es el resultado de comparar la nota', code: 'assert aprobado is True' },
            { kind: 'source', label: 'Usa el operador >=', pattern: />=/ },
          ],
          hints: ['La comparación «mayor o igual» se escribe `>=`.', '`aprobado = nota >= 5` guarda `True` o `False`.', 'Para mostrarlo: `print("Aprobado:", aprobado)`.'],
        },
      ],
    },
    {
      id: 'if',
      title: 'if, elif y else',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `Con \`if\` el programa ejecuta unas líneas **solo si** la condición es cierta:

\`\`\`
if temperatura > 30:
    print("Hace calor")
    print("Bebe agua")
print("Fin")
\`\`\`

Fíjate en dos cosas:

- La línea del \`if\` termina en **dos puntos** \`:\`.
- Lo que depende del \`if\` va **sangrado**: 4 espacios a la derecha (el editor los pone solo al pulsar Intro tras los dos puntos). La sangría es lo que le dice a Python qué está dentro. \`print("Fin")\` no está sangrado, así que se ejecuta siempre.

## else: si no
\`else:\` recoge todo lo demás:

\`\`\`
if edad >= 18:
    print("Puedes votar")
else:
    print("Todavía no")
\`\`\`

## elif: si no, ¿y si...?
Para más de dos caminos, \`elif\` (de *else if*). Python mira las condiciones **en orden** y ejecuta **solo la primera** que se cumple:

\`\`\`
if nota >= 9:
    print("Sobresaliente")
elif nota >= 7:
    print("Notable")
elif nota >= 5:
    print("Aprobado")
else:
    print("Suspenso")
\`\`\``,
        },
        {
          kind: 'example',
          id: 'ej_if',
          code: 'nota = float(input("Nota: "))\nif nota >= 9:\n    print("Sobresaliente")\nelif nota >= 7:\n    print("Notable")\nelif nota >= 5:\n    print("Aprobado")\nelse:\n    print("Suspenso")\nprint("Nota revisada")',
          inputs: ['7.5'],
          note: 'Prueba con 9.5, 7.5, 5 y 3.',
        },
        {
          kind: 'predict',
          id: 'p_orden_elif',
          code: 'puntos = 95\nif puntos > 50:\n    print("Bien")\nelif puntos > 90:\n    print("Excelente")\nelse:\n    print("Sigue")',
          question: '¿Qué imprime?',
          options: ['Excelente', 'Bien', 'Bien\nExcelente', 'Sigue'],
          correct: 1,
          explanation: 'Python se queda con la **primera** condición que se cumple. 95 > 50 ya es cierto, así que imprime «Bien» y no mira el resto. Por eso las condiciones más estrictas van primero.',
        },
        {
          kind: 'predict',
          id: 'p_sangria',
          code: 'x = 3\nif x > 5:\n    print("A")\n    print("B")\nprint("C")',
          question: '¿Qué imprime?',
          options: ['A\nB\nC', 'B\nC', 'C', 'Nada'],
          correct: 2,
          explanation: '3 > 5 es falso, así que se saltan las dos líneas sangradas. `print("C")` no está sangrado: no depende del `if` y se ejecuta siempre.',
        },
        {
          kind: 'exercise',
          id: 'e_temperatura',
          title: '¿Qué ropa me pongo?',
          prompt: `Pide la temperatura con \`int(input("Temperatura: "))\` y muestra:

- \`Abrigo\` si es **menor que 10**.
- \`Chaqueta\` si está **entre 10 y 19** (ambos incluidos).
- \`Camiseta\` si es **20 o más**.

\`\`\`
Temperatura: 15
Chaqueta
\`\`\``,
          starter: 'temperatura = int(input("Temperatura: "))\n# Decide con if, elif y else\n',
          solution: 'temperatura = int(input("Temperatura: "))\nif temperatura < 10:\n    print("Abrigo")\nelif temperatura < 20:\n    print("Chaqueta")\nelse:\n    print("Camiseta")',
          sampleInputs: ['15'],
          tests: [
            { kind: 'output', label: 'Con 5 → Abrigo', expected: 'Temperatura: 5\nAbrigo', inputs: ['5'] },
            { kind: 'output', label: 'Con 10 → Chaqueta (frontera)', expected: 'Temperatura: 10\nChaqueta', inputs: ['10'] },
            { kind: 'output', label: 'Con 19 → Chaqueta (frontera)', expected: 'Temperatura: 19\nChaqueta', inputs: ['19'] },
            { kind: 'output', label: 'Con 20 → Camiseta', expected: 'Temperatura: 20\nCamiseta', inputs: ['20'] },
          ],
          hints: [
            'Tres caminos: `if`, `elif` y `else`.',
            'Empieza por el frío: `if temperatura < 10:`. Si no se cumple, ya sabes que es 10 o más.',
            'El segundo caso es `elif temperatura < 20:` y el resto va en `else:`. No olvides los dos puntos y la sangría.',
          ],
        },
      ],
    },
    {
      id: 'logica',
      title: 'and, or, not e in',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `A veces una sola comparación no basta. Las condiciones se combinan con:

- \`and\`: cierto si **las dos** son ciertas. \`edad >= 18 and tiene_carnet\`.
- \`or\`: cierto si **al menos una** es cierta. \`dia == "sábado" or dia == "domingo"\`.
- \`not\`: le da la vuelta. \`not lloviendo\` es cierto cuando \`lloviendo\` es falso.

Un rango se puede escribir de dos formas: \`edad >= 18 and edad <= 65\` o, más corto, \`18 <= edad <= 65\`.

## in: ¿está dentro?
\`in\` pregunta si un texto está **dentro** de otro:

\`\`\`
"bus" in "billete de bus"     # True
"tren" in "billete de bus"    # False
\`\`\`

**Error típico:** \`dia == "sábado" or "domingo"\` no hace lo que parece. Hay que repetir la comparación: \`dia == "sábado" or dia == "domingo"\`.`,
        },
        {
          kind: 'example',
          id: 'ej_logica',
          code: 'edad = 25\ntiene_carnet = True\nprint("¿Puede conducir?", edad >= 18 and tiene_carnet)\n\ndia = "domingo"\nprint("¿Fin de semana?", dia == "sábado" or dia == "domingo")\n\nlloviendo = False\nprint("¿Salgo sin paraguas?", not lloviendo)\n\nconcepto = "billete de bus"\nprint("¿Es transporte?", "bus" in concepto)',
        },
        {
          kind: 'predict',
          id: 'p_and_or',
          code: 'edad = 16\npermiso = True\nprint(edad >= 18 and permiso)\nprint(edad >= 18 or permiso)\nprint(not permiso)',
          question: '¿Qué imprime?',
          options: ['False\nTrue\nFalse', 'True\nTrue\nFalse', 'False\nFalse\nTrue', 'False\nTrue\nTrue'],
          correct: 0,
          explanation: '`16 >= 18` es falso, así que con `and` todo es falso; con `or` basta con que `permiso` sea cierto. `not True` es `False`.',
        },
        {
          kind: 'exercise',
          id: 'e_entrada',
          title: 'Entrada al concierto',
          prompt: `Pide la edad con \`int(input("Edad: "))\` y si va acompañado con \`input("¿Acompañado? (s/n): ")\`.

Puede entrar si tiene **18 o más**, o si tiene **14 o más y va acompañado** (\`"s"\`). Muestra \`Puede entrar\` o \`No puede entrar\`.

\`\`\`
Edad: 15
¿Acompañado? (s/n): s
Puede entrar
\`\`\``,
          starter: 'edad = int(input("Edad: "))\nacompanado = input("¿Acompañado? (s/n): ")\n# Decide si puede entrar\n',
          solution: 'edad = int(input("Edad: "))\nacompanado = input("¿Acompañado? (s/n): ")\nif edad >= 18 or (edad >= 14 and acompanado == "s"):\n    print("Puede entrar")\nelse:\n    print("No puede entrar")',
          sampleInputs: ['15', 's'],
          tests: [
            { kind: 'output', label: '20 años, solo → puede', expected: 'Edad: 20\n¿Acompañado? (s/n): n\nPuede entrar', inputs: ['20', 'n'] },
            { kind: 'output', label: '15 años, acompañado → puede', expected: 'Edad: 15\n¿Acompañado? (s/n): s\nPuede entrar', inputs: ['15', 's'] },
            { kind: 'output', label: '15 años, solo → no puede', expected: 'Edad: 15\n¿Acompañado? (s/n): n\nNo puede entrar', inputs: ['15', 'n'] },
            { kind: 'output', label: '12 años, acompañado → no puede', expected: 'Edad: 12\n¿Acompañado? (s/n): s\nNo puede entrar', inputs: ['12', 's'] },
          ],
          hints: [
            'Hay dos formas de entrar: únelas con `or`.',
            'La segunda forma tiene dos condiciones a la vez: `edad >= 14 and acompanado == "s"`.',
            'Con paréntesis queda claro: `if edad >= 18 or (edad >= 14 and acompanado == "s"):`.',
          ],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Tu proyecto: clasificar el gasto',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `Tu gestor ya apunta un gasto. Ahora va a **clasificarlo** según su concepto, y a **avisar** si es grande.

Las reglas (el concepto llega en minúsculas):

| Si el concepto contiene | Categoría |
|---|---|
| \`taxi\`, \`bus\` o \`metro\` | \`transporte\` |
| \`cine\` o \`concierto\` | \`ocio\` |
| \`super\` o \`café\` | \`comida\` |
| cualquier otra cosa | \`otros\` |

Y si el importe es **100 o más**, añade la línea \`Aviso: gasto grande\`.`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_categoria',
          title: 'Proyecto · Clasifica el gasto',
          project: true,
          prompt: `Escribe el programa que:

1. Pide \`input("Concepto: ")\` y \`input("Importe: ")\` (decimal).
2. Guarda en la variable \`categoria\` la categoría según la tabla.
3. Muestra \`Categoría: …\` y, si el importe es 100 o más, \`Aviso: gasto grande\`.

\`\`\`
Concepto: taxi al aeropuerto
Importe: 35
Categoría: transporte
\`\`\`

\`\`\`
Concepto: entradas concierto
Importe: 120
Categoría: ocio
Aviso: gasto grande
\`\`\``,
          starter: 'concepto = input("Concepto: ")\nimporte = float(input("Importe: "))\n# Decide la categoría\n\n# Muestra la categoría y, si hace falta, el aviso\n',
          solution:
            'concepto = input("Concepto: ")\nimporte = float(input("Importe: "))\nif "taxi" in concepto or "bus" in concepto or "metro" in concepto:\n    categoria = "transporte"\nelif "cine" in concepto or "concierto" in concepto:\n    categoria = "ocio"\nelif "super" in concepto or "café" in concepto:\n    categoria = "comida"\nelse:\n    categoria = "otros"\nprint(f"Categoría: {categoria}")\nif importe >= 100:\n    print("Aviso: gasto grande")',
          sampleInputs: ['taxi al aeropuerto', '35'],
          tests: [
            { kind: 'output', label: 'Taxi de 35 € → transporte, sin aviso', expected: 'Concepto: taxi al aeropuerto\nImporte: 35\nCategoría: transporte', inputs: ['taxi al aeropuerto', '35'] },
            { kind: 'output', label: 'Concierto de 120 € → ocio y aviso', expected: 'Concepto: entradas concierto\nImporte: 120\nCategoría: ocio\nAviso: gasto grande', inputs: ['entradas concierto', '120'] },
            { kind: 'output', label: 'Supermercado de 100 € → comida y aviso (frontera)', expected: 'Concepto: supermercado\nImporte: 100\nCategoría: comida\nAviso: gasto grande', inputs: ['supermercado', '100'] },
            { kind: 'output', label: 'Abono de metro → transporte', expected: 'Concepto: abono de metro\nImporte: 54.6\nCategoría: transporte', inputs: ['abono de metro', '54.6'] },
            { kind: 'output', label: 'Libro → otros', expected: 'Concepto: libro\nImporte: 18\nCategoría: otros', inputs: ['libro', '18'] },
            { kind: 'assert', label: 'La categoría queda en la variable categoria', code: 'assert categoria == "comida"', inputs: ['café con leche', '2.5'] },
          ],
          hints: [
            'Para mirar si una palabra está en el concepto: `"taxi" in concepto`.',
            'Une las palabras de una misma categoría con `or`, repitiendo `in concepto` en cada una.',
            'Primero un `if … elif … else` que guarda `categoria`; después, **aparte**, un `if importe >= 100:` para el aviso.',
          ],
        },
        {
          kind: 'text',
          md: `## Lo que has aprendido
- Las comparaciones (\`==\`, \`!=\`, \`<\`, \`>=\`…) dan \`True\` o \`False\`.
- \`if\`, \`elif\` y \`else\` eligen un camino; la sangría marca qué va dentro.
- \`and\`, \`or\` y \`not\` combinan condiciones, e \`in\` busca un texto dentro de otro.

En el módulo 3 tu gestor aprenderá a **repetir**: apuntar todos los gastos que quieras hasta escribir «fin».`,
        },
      ],
    },
  ],
}
