import type { LessonModule } from '../../../learn/types'

/**
 * Curso 9: Python desde cero · Módulo 5 — Funciones.
 * def, llamar, parámetros, return, valores por defecto y ámbito. Proyecto: la
 * lógica del gestor en funciones reutilizables (IVA, categoría y totales).
 */
export const m05Funciones: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm05-funciones',
  number: 5,
  lang: 'es',
  title: 'Funciones',
  subtitle: 'Pon nombre a un trozo de código y úsalo tantas veces como quieras.',
  goals: [
    'Definir funciones con def y llamarlas.',
    'Pasar datos con parámetros y devolver resultados con return.',
    'Distinguir entre mostrar un valor (print) y devolverlo (return).',
    'Usar valores por defecto y entender qué variables ve cada función.',
    'Reorganizar tu proyecto en funciones.',
  ],
  lessons: [
    {
      id: 'definir',
      title: 'Definir y llamar',
      minutes: 7,
      blocks: [
        {
          kind: 'text',
          md: `Una **función** es un bloque de código con nombre. Ya has usado muchas: \`print()\`, \`len()\`, \`input()\`. Ahora vas a crear las tuyas con \`def\`:

\`\`\`
def saludar():
    print("¡Hola!")
    print("Bienvenido")
\`\`\`

Esto **define** la función, pero no la ejecuta. Para ejecutarla hay que **llamarla** por su nombre con paréntesis:

\`\`\`
saludar()
saludar()
\`\`\`

Cada llamada ejecuta su bloque entero. Ventajas:

- **No repites código**: lo escribes una vez y lo llamas cuando quieras.
- **Le das nombre** a lo que hace: \`calcular_iva()\` se entiende mejor que tres líneas de cuentas.
- **Lo cambias en un solo sitio.**

La función tiene que estar **definida antes** de llamarla (más arriba en el programa).`,
        },
        {
          kind: 'example',
          id: 'ej_definir',
          code: 'def linea():\n    print("-" * 20)\n\ndef cabecera():\n    linea()\n    print("  MI GESTOR DE GASTOS")\n    linea()\n\ncabecera()\nprint("Hoy no hay gastos")\nlinea()',
        },
        {
          kind: 'predict',
          id: 'p_definir',
          code: 'def mensaje():\n    print("B")\n\nprint("A")\nmensaje()\nprint("C")\nmensaje()',
          question: '¿Qué imprime?',
          options: ['B\nA\nC\nB', 'A\nB\nC\nB', 'A\nC', 'A\nB\nC'],
          correct: 1,
          explanation: 'El `def` solo define la función; no imprime nada. Después el programa sigue en orden: «A», la llamada imprime «B», «C» y otra llamada imprime «B».',
        },
        {
          kind: 'exercise',
          id: 'e_marco',
          title: 'Un marco de asteriscos',
          prompt: `Define una función \`marco()\` que muestre una línea de **10 asteriscos**. Después llámala, muestra \`Python\` y vuelve a llamarla:

\`\`\`
**********
Python
**********
\`\`\``,
          starter: '# Define la función marco\n\n# Llámala, muestra Python y llámala otra vez\n',
          solution: 'def marco():\n    print("*" * 10)\n\nmarco()\nprint("Python")\nmarco()',
          tests: [
            { kind: 'output', label: 'Marco, texto y marco', expected: '**********\nPython\n**********' },
            { kind: 'assert', label: 'Existe la función marco', code: 'assert callable(marco)' },
          ],
          hints: ['`def marco():` y dentro, sangrado, el `print`.', 'Un texto por un número se repite: `"*" * 10`.', 'Para llamarla: `marco()` (sin sangría, fuera de la función).'],
        },
      ],
    },
    {
      id: 'return',
      title: 'Parámetros y return',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `Las funciones son mucho más útiles cuando **reciben datos** y **devuelven un resultado**.

Los **parámetros** van entre los paréntesis del \`def\`. Al llamar, les das valores (los **argumentos**):

\`\`\`
def saludar(nombre):
    print(f"Hola, {nombre}")

saludar("Ana")     # Hola, Ana
\`\`\`

\`return\` **devuelve** un valor a quien llamó, para que lo guarde o lo use:

\`\`\`
def con_iva(precio):
    return precio * 1.21

total = con_iva(100)          # total vale 121.0
print(con_iva(50) + 10)       # 70.5
\`\`\`

## print o return
Es la confusión más habitual:

- \`print\` **muestra** el valor en pantalla, pero la función no da nada a quien la llama.
- \`return\` **entrega** el valor; no muestra nada por sí mismo.

Una función sin \`return\` devuelve \`None\` («nada»). Si haces \`x = saludar("Ana")\`, \`x\` vale \`None\`.

Al llegar a un \`return\` la función **termina**: lo que haya debajo no se ejecuta.`,
        },
        {
          kind: 'example',
          id: 'ej_return',
          code: 'def area_rectangulo(base, altura):\n    return base * altura\n\ndef es_par(n):\n    return n % 2 == 0\n\na = area_rectangulo(3, 4)\nprint("Área:", a)\nprint("Doble del área:", area_rectangulo(3, 4) * 2)\nprint("¿8 es par?", es_par(8))\nprint("¿7 es par?", es_par(7))',
        },
        {
          kind: 'predict',
          id: 'p_print_return',
          code: 'def doble(n):\n    print(n * 2)\n\nresultado = doble(5)\nprint(resultado)',
          question: '¿Qué imprime?',
          options: ['10\n10', '10\nNone', 'None\n10', '10'],
          correct: 1,
          explanation: 'La función **muestra** 10 con `print`, pero no tiene `return`, así que devuelve `None`. Por eso `resultado` vale `None`.',
        },
        {
          kind: 'exercise',
          id: 'e_mayor',
          title: 'El mayor de tres',
          prompt: `Escribe la función \`mayor(a, b, c)\` que **devuelva** (con \`return\`) el mayor de los tres números, **sin usar** \`max()\`.

Por ejemplo, \`mayor(3, 9, 5)\` devuelve \`9\`. La función no tiene que mostrar nada.`,
          starter: 'def mayor(a, b, c):\n    # Devuelve el mayor de los tres\n    pass\n\nprint(mayor(3, 9, 5))\n',
          solution: 'def mayor(a, b, c):\n    if a >= b and a >= c:\n        return a\n    elif b >= c:\n        return b\n    else:\n        return c\n\nprint(mayor(3, 9, 5))',
          tests: [
            { kind: 'assert', label: 'mayor(3, 9, 5) devuelve 9', code: 'assert mayor(3, 9, 5) == 9' },
            { kind: 'assert', label: 'mayor(10, 2, 7) devuelve 10', code: 'assert mayor(10, 2, 7) == 10' },
            { kind: 'assert', label: 'mayor(1, 4, 8) devuelve 8', code: 'assert mayor(1, 4, 8) == 8' },
            { kind: 'assert', label: 'Funciona con empates: mayor(5, 5, 2) devuelve 5', code: 'assert mayor(5, 5, 2) == 5' },
            { kind: 'assert', label: 'Funciona con negativos', code: 'assert mayor(-3, -1, -7) == -1' },
            { kind: 'source', label: 'No usa max()', pattern: /\bmax\s*\(/, forbid: true },
          ],
          hints: [
            'Compara: si `a` es mayor o igual que los otros dos, devuelve `a`.',
            'Si no es `a`, el mayor está entre `b` y `c`: otra comparación.',
            'Usa `return` en cada caso (no `print`). Quita el `pass` cuando escribas el cuerpo.',
          ],
        },
      ],
    },
    {
      id: 'defecto',
      title: 'Valores por defecto y ámbito',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `## Valores por defecto
Un parámetro puede tener un valor **por defecto**, que se usa si al llamar no le das otro:

\`\`\`
def con_iva(precio, tipo=21):
    return precio * (1 + tipo / 100)

con_iva(100)       # 121.0  (usa tipo=21)
con_iva(100, 10)   # 110.0
\`\`\`

Los parámetros con valor por defecto van **al final**. Al llamar también puedes nombrarlos: \`con_iva(100, tipo=4)\`.

## Ámbito: qué variables ve cada función
Las variables que creas **dentro** de una función son **locales**: solo existen mientras la función se ejecuta y no se ven desde fuera.

\`\`\`
def calcular():
    resultado = 42
    return resultado

calcular()
print(resultado)   # NameError: fuera no existe
\`\`\`

La forma correcta de sacar un valor de una función es devolverlo: \`r = calcular()\`.

Una función sí puede **leer** variables de fuera, pero es mejor pasarle lo que necesita como parámetro: así se entiende y se reutiliza mejor.`,
        },
        {
          kind: 'example',
          id: 'ej_defecto',
          code: 'def precio_final(precio, descuento=0, tipo_iva=21):\n    con_descuento = precio * (1 - descuento / 100)\n    return round(con_descuento * (1 + tipo_iva / 100), 2)\n\nprint(precio_final(100))\nprint(precio_final(100, 10))\nprint(precio_final(100, tipo_iva=4))\nprint(precio_final(100, descuento=20, tipo_iva=10))',
        },
        {
          kind: 'predict',
          id: 'p_ambito',
          code: 'def sumar_uno(x):\n    x = x + 1\n    return x\n\nn = 5\nsumar_uno(n)\nprint(n)',
          question: '¿Qué imprime?',
          options: ['6', '5', 'None', 'Un error'],
          correct: 1,
          explanation: 'Dentro de la función, `x` es una variable local: cambiarla no cambia `n`. Además, el valor que devuelve la función no se guarda en ningún sitio. `n` sigue valiendo 5.',
        },
        {
          kind: 'exercise',
          id: 'e_propina',
          title: 'La propina',
          prompt: `Escribe la función \`cuenta_con_propina(importe, propina=10)\` que devuelva el importe más el porcentaje de propina, **redondeado a 2 decimales**.

- \`cuenta_con_propina(50)\` → \`55.0\`
- \`cuenta_con_propina(50, 15)\` → \`57.5\`
- \`cuenta_con_propina(33.3, 0)\` → \`33.3\``,
          starter: '# Define cuenta_con_propina con propina=10 por defecto\n',
          solution: 'def cuenta_con_propina(importe, propina=10):\n    return round(importe * (1 + propina / 100), 2)',
          tests: [
            { kind: 'assert', label: 'Sin propina indicada usa el 10 %: 50 → 55.0', code: 'assert cuenta_con_propina(50) == 55.0' },
            { kind: 'assert', label: 'Con el 15 %: 50 → 57.5', code: 'assert cuenta_con_propina(50, 15) == 57.5' },
            { kind: 'assert', label: 'Con el 0 %: 33.3 → 33.3', code: 'assert cuenta_con_propina(33.3, 0) == 33.3' },
            { kind: 'assert', label: 'Redondea a 2 decimales: 19.99 → 21.99', code: 'assert cuenta_con_propina(19.99) == 21.99' },
          ],
          hints: ['La cabecera es `def cuenta_con_propina(importe, propina=10):`.', 'El importe más un X % es `importe * (1 + propina / 100)`.', 'Devuelve el resultado redondeado: `return round(..., 2)`.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Tu proyecto: funciones del gestor',
      minutes: 12,
      blocks: [
        {
          kind: 'text',
          md: `Tu gestor ya hace muchas cosas, pero todo está mezclado. Vas a separar la lógica en **tres funciones** con nombre. Así podrás usarlas desde cualquier parte del programa (y en los próximos módulos, desde otros ficheros).

Las funciones **devuelven** valores; no muestran nada. El \`print\` lo hace el programa principal, al final.`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_funciones',
          title: 'Proyecto · Las funciones del gestor',
          project: true,
          prompt: `Escribe estas funciones:

1. \`con_iva(importe, tipo=21)\`: devuelve el importe con IVA, redondeado a 2 decimales.
2. \`categoria(concepto)\`: devuelve \`"transporte"\`, \`"ocio"\`, \`"comida"\` u \`"otros"\` con las reglas del módulo 2 (taxi/bus/metro, cine/concierto, super/café).
3. \`totales(gastos)\`: recibe una lista de gastos (diccionarios con \`importe\` y \`categoria\`) y devuelve un diccionario con el total de cada categoría.

El programa principal ya está escrito al final: no lo cambies.`,
          starter:
            'def con_iva(importe, tipo=21):\n    pass\n\n\ndef categoria(concepto):\n    pass\n\n\ndef totales(gastos):\n    pass\n\n\n# Programa principal (no lo cambies)\ngastos = []\nfor concepto, importe in [("super", 40), ("taxi", 15), ("café", 2)]:\n    gastos.append({"concepto": concepto, "importe": con_iva(importe), "categoria": categoria(concepto)})\nprint(totales(gastos))\n',
          solution:
            'def con_iva(importe, tipo=21):\n    return round(importe * (1 + tipo / 100), 2)\n\n\ndef categoria(concepto):\n    if "taxi" in concepto or "bus" in concepto or "metro" in concepto:\n        return "transporte"\n    elif "cine" in concepto or "concierto" in concepto:\n        return "ocio"\n    elif "super" in concepto or "café" in concepto:\n        return "comida"\n    return "otros"\n\n\ndef totales(gastos):\n    resultado = {}\n    for g in gastos:\n        cat = g["categoria"]\n        resultado[cat] = round(resultado.get(cat, 0) + g["importe"], 2)\n    return resultado\n\n\n# Programa principal (no lo cambies)\ngastos = []\nfor concepto, importe in [("super", 40), ("taxi", 15), ("café", 2)]:\n    gastos.append({"concepto": concepto, "importe": con_iva(importe), "categoria": categoria(concepto)})\nprint(totales(gastos))',
          tests: [
            { kind: 'assert', label: 'con_iva(100) devuelve 121.0', code: 'assert con_iva(100) == 121.0' },
            { kind: 'assert', label: 'con_iva(100, 10) devuelve 110.0', code: 'assert con_iva(100, 10) == 110.0' },
            { kind: 'assert', label: 'con_iva(9.99) redondea a 12.09', code: 'assert con_iva(9.99) == 12.09' },
            { kind: 'assert', label: 'categoria clasifica transporte, ocio y comida', code: 'assert categoria("abono metro") == "transporte"\nassert categoria("cine") == "ocio"\nassert categoria("super del barrio") == "comida"' },
            { kind: 'assert', label: 'categoria devuelve "otros" si no encaja', code: 'assert categoria("libro") == "otros"' },
            { kind: 'assert', label: 'totales agrupa por categoría', code: 'r = totales([{"importe": 10, "categoria": "ocio"}, {"importe": 5.5, "categoria": "comida"}, {"importe": 2, "categoria": "ocio"}])\nassert r == {"ocio": 12, "comida": 5.5}, r' },
            { kind: 'assert', label: 'totales de una lista vacía es un diccionario vacío', code: 'assert totales([]) == {}' },
            { kind: 'output', label: 'El programa principal muestra los totales', expected: "{'comida': 50.82, 'transporte': 18.15}" },
          ],
          hints: [
            '`con_iva` es una línea: `return round(importe * (1 + tipo / 100), 2)`.',
            'En `categoria`, usa `return` en cada caso del `if`/`elif`, y `return "otros"` al final.',
            '`totales` es el agrupado del módulo 4 dentro de una función: crea `resultado = {}`, acumula con `.get(cat, 0)` y `return resultado`.',
          ],
        },
        {
          kind: 'text',
          md: `## Lo que has aprendido
- \`def\` define una función y se ejecuta al llamarla.
- Los parámetros reciben datos y \`return\` devuelve el resultado (\`print\` solo lo muestra).
- Los valores por defecto hacen opcionales algunos parámetros.
- Las variables de dentro de una función son locales.

En el módulo 6 vas a trabajar con **textos** y a hacer que tu programa no se rompa cuando el usuario escribe algo inesperado.`,
        },
      ],
    },
  ],
}
