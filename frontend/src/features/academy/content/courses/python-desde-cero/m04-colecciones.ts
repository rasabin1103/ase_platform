import type { LessonModule } from '../../../learn/types'

/**
 * Curso 9: Python desde cero · Módulo 4 — Colecciones.
 * Listas, tuplas y sets, diccionarios. Proyecto: los gastos como lista de
 * diccionarios y los totales por categoría.
 */

const GASTOS = `gastos = [
    {"concepto": "super", "importe": 45.3, "categoria": "comida"},
    {"concepto": "cine", "importe": 9.0, "categoria": "ocio"},
    {"concepto": "café", "importe": 2.5, "categoria": "comida"},
    {"concepto": "taxi", "importe": 12.0, "categoria": "transporte"},
]`

export const m04Colecciones: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm04-colecciones',
  number: 4,
  lang: 'es',
  title: 'Colecciones',
  subtitle: 'Guarda muchos datos juntos: listas, tuplas, conjuntos y diccionarios.',
  goals: [
    'Crear listas, leer sus elementos por posición y añadir nuevos.',
    'Recorrer una lista y calcular con sum(), min(), max() y len().',
    'Saber cuándo usar una tupla o un conjunto.',
    'Guardar datos con nombre en diccionarios y recorrerlos.',
    'Agrupar los gastos de tu proyecto por categoría.',
  ],
  lessons: [
    {
      id: 'listas',
      title: 'Listas',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `Una **lista** guarda varios valores en orden, entre corchetes y separados por comas:

\`\`\`
compras = ["pan", "leche", "huevos"]
precios = [1.2, 0.95, 2.4]
\`\`\`

- **Leer por posición:** \`compras[0]\` es \`"pan"\`. Las posiciones (**índices**) empiezan en **0**. \`compras[-1]\` es el último.
- **Cuántos hay:** \`len(compras)\` → 3.
- **Añadir al final:** \`compras.append("fruta")\`.
- **Cambiar uno:** \`compras[1] = "yogur"\`.
- **¿Está?:** \`"pan" in compras\` → \`True\`.
- **Recorrer:** \`for producto in compras:\` da cada elemento por turno.
- Con números: \`sum(precios)\`, \`min(precios)\`, \`max(precios)\`.

Pedir una posición que no existe (\`compras[10]\`) da un \`IndexError\`.`,
        },
        {
          kind: 'example',
          id: 'ej_listas',
          code: 'compras = ["pan", "leche", "huevos"]\nprint(compras[0], "y", compras[-1])\ncompras.append("fruta")\nprint(len(compras), "productos:", compras)\n\nprecios = [1.2, 0.95, 2.4, 3.1]\nprint("Total:", sum(precios))\nprint("Más caro:", max(precios))\nfor p in precios:\n    print("-", p)',
        },
        {
          kind: 'predict',
          id: 'p_indices',
          code: 'colores = ["rojo", "verde", "azul"]\ncolores.append("negro")\nprint(colores[1])\nprint(len(colores))',
          question: '¿Qué imprime?',
          options: ['rojo\n3', 'verde\n4', 'verde\n3', 'rojo\n4'],
          correct: 1,
          explanation: 'El índice 1 es el **segundo** elemento: "verde". Tras el `append` hay 4 colores.',
        },
        {
          kind: 'exercise',
          id: 'e_temperaturas',
          title: 'Temperaturas de la semana',
          prompt: `Tienes la lista \`temps\` con las temperaturas de 7 días. Calcula y muestra:

\`\`\`
Máxima: 24
Mínima: 15
Media: 19.6
Días de más de 20: 3
\`\`\`

La media con un decimal. Para los días de más de 20, recorre la lista con un contador.`,
          starter: 'temps = [18, 22, 15, 24, 19, 21, 18]\n# Calcula máxima, mínima, media y días de más de 20\n',
          solution:
            'temps = [18, 22, 15, 24, 19, 21, 18]\nprint("Máxima:", max(temps))\nprint("Mínima:", min(temps))\nprint(f"Media: {sum(temps) / len(temps):.1f}")\ncalurosos = 0\nfor t in temps:\n    if t > 20:\n        calurosos += 1\nprint("Días de más de 20:", calurosos)',
          tests: [
            { kind: 'output', label: 'Máxima, mínima, media y días de calor', expected: 'Máxima: 24\nMínima: 15\nMedia: 19.6\nDías de más de 20: 3' },
            { kind: 'source', label: 'Usa max(), min() y len()', pattern: /max\s*\([\s\S]*min\s*\([\s\S]*len\s*\(|max\s*\([\s\S]*len\s*\([\s\S]*min\s*\(|min\s*\([\s\S]*max\s*\([\s\S]*len\s*\(/ },
            { kind: 'source', label: 'Recorre la lista con un for', pattern: /for\s+\w+\s+in\s+temps/ },
          ],
          hints: ['`max(temps)` y `min(temps)` te dan la máxima y la mínima.', 'La media es `sum(temps) / len(temps)`; con `:.1f` sale con un decimal.', 'Para contar: `calurosos = 0`, `for t in temps:` y `if t > 20: calurosos += 1`.'],
        },
      ],
    },
    {
      id: 'tuplas_sets',
      title: 'Tuplas y conjuntos',
      minutes: 6,
      blocks: [
        {
          kind: 'text',
          md: `Dos colecciones más, para casos concretos:

**Tupla**: como una lista, pero con paréntesis y **no se puede cambiar**. Sirve para datos que van juntos y fijos, como unas coordenadas o una fecha:

\`\`\`
punto = (3, 7)
x, y = punto      # desempaquetar: x vale 3, y vale 7
\`\`\`

**Conjunto** (\`set\`): entre llaves, **sin repetidos** y sin orden. Ideal para quitar duplicados o saber qué valores distintos hay:

\`\`\`
visitas = ["ana", "luis", "ana", "eva", "luis"]
distintos = set(visitas)      # {"ana", "luis", "eva"} (en cualquier orden)
print(len(distintos))         # 3
\`\`\`

Como un conjunto no tiene orden, si lo quieres mostrar ordenado usa \`sorted(conjunto)\`, que devuelve una lista ordenada.`,
        },
        {
          kind: 'example',
          id: 'ej_tuplas_sets',
          code: 'fecha = (2026, 3, 15)\nanio, mes, dia = fecha\nprint(f"Día {dia} del mes {mes} de {anio}")\n\nvisitas = ["ana", "luis", "ana", "eva", "luis"]\nprint("Visitas:", len(visitas))\nprint("Personas distintas:", len(set(visitas)))\nprint("Quiénes:", sorted(set(visitas)))',
        },
        {
          kind: 'predict',
          id: 'p_set',
          code: 'numeros = [3, 1, 3, 2, 1, 3]\nprint(len(set(numeros)))\nprint(sorted(set(numeros)))',
          question: '¿Qué imprime?',
          options: ['6\n[1, 1, 2, 3, 3, 3]', '3\n[1, 2, 3]', '3\n[3, 1, 2]', '6\n[1, 2, 3]'],
          correct: 1,
          explanation: 'El conjunto quita los repetidos: quedan 1, 2 y 3. `sorted()` lo devuelve como lista ordenada.',
        },
        {
          kind: 'exercise',
          id: 'e_etiquetas',
          title: 'Etiquetas sin repetir',
          prompt: `La lista \`etiquetas\` tiene repetidos. Muestra cuántas etiquetas **distintas** hay y la lista de etiquetas distintas **ordenada**:

\`\`\`
Distintas: 4
['ocio', 'super', 'transporte', 'viaje']
\`\`\``,
          starter: 'etiquetas = ["super", "ocio", "super", "viaje", "transporte", "ocio", "super"]\n# Muestra cuántas distintas hay y cuáles, ordenadas\n',
          solution: 'etiquetas = ["super", "ocio", "super", "viaje", "transporte", "ocio", "super"]\ndistintas = set(etiquetas)\nprint("Distintas:", len(distintas))\nprint(sorted(distintas))',
          tests: [
            { kind: 'output', label: '4 distintas y la lista ordenada', expected: "Distintas: 4\n['ocio', 'super', 'transporte', 'viaje']" },
            { kind: 'source', label: 'Usa set()', pattern: /set\s*\(/ },
          ],
          hints: ['`set(etiquetas)` quita los repetidos.', '`len(...)` te dice cuántos quedan.', '`print(sorted(distintas))` muestra la lista ordenada.'],
        },
      ],
    },
    {
      id: 'diccionarios',
      title: 'Diccionarios',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `Un **diccionario** guarda pares **clave: valor**. En vez de acceder por posición, accedes por **nombre**:

\`\`\`
gasto = {"concepto": "cine", "importe": 9.0}
print(gasto["concepto"])      # cine
gasto["categoria"] = "ocio"   # añade una clave nueva (o cambia la que hay)
\`\`\`

- \`len(gasto)\` → cuántas claves tiene.
- \`"importe" in gasto\` → ¿existe esa clave?
- Una clave que no existe da \`KeyError\`. Con \`gasto.get("nota", 0)\` obtienes 0 en vez del error.
- **Recorrer**: \`for clave, valor in gasto.items():\`.
- Las claves se guardan en el **orden en que las añades**.

## Contar con un diccionario
Un uso muy habitual: acumular por clave.

\`\`\`
cuenta = {}
for palabra in ["sí", "no", "sí"]:
    cuenta[palabra] = cuenta.get(palabra, 0) + 1
# {"sí": 2, "no": 1}
\`\`\`

## Listas de diccionarios
Para muchos registros con la misma forma, una **lista de diccionarios**: cada elemento es un diccionario.`,
        },
        {
          kind: 'example',
          id: 'ej_diccionarios',
          code: 'precios = {"pan": 1.2, "leche": 0.95, "huevos": 2.4}\nprint(precios["leche"])\nprecios["fruta"] = 3.1\nfor producto, precio in precios.items():\n    print(f"{producto}: {precio:.2f} €")\n\nvotos = ["sí", "no", "sí", "sí"]\ncuenta = {}\nfor v in votos:\n    cuenta[v] = cuenta.get(v, 0) + 1\nprint(cuenta)',
        },
        {
          kind: 'predict',
          id: 'p_dict',
          code: 'stock = {"manzanas": 5, "peras": 2}\nstock["peras"] = stock["peras"] + 3\nstock["uvas"] = 1\nprint(stock)',
          question: '¿Qué imprime?',
          options: ["{'manzanas': 5, 'peras': 2, 'uvas': 1}", "{'manzanas': 5, 'peras': 5, 'uvas': 1}", "{'manzanas': 5, 'peras': 5}", 'Un KeyError'],
          correct: 1,
          explanation: 'Las peras pasan de 2 a 5. Asignar a una clave nueva (`"uvas"`) la añade al final.',
        },
        {
          kind: 'predict',
          id: 'p_keyerror',
          code: 'notas = {"ana": 8}\nprint(notas["luis"])',
          question: '¿Qué pasa?',
          options: ['Imprime 0', 'Imprime None', 'Error KeyError: la clave no existe', 'Imprime 8'],
          correct: 2,
          explanation: 'Leer con corchetes una clave que no existe da `KeyError`. Para un valor por defecto: `notas.get("luis", 0)`.',
        },
        {
          kind: 'exercise',
          id: 'e_contar_letras',
          title: 'Cuenta las vocales',
          prompt: `Recorre la palabra de \`palabra\` y cuenta cuántas veces aparece cada **vocal** en un diccionario \`cuenta\` (solo las vocales que aparezcan, en el orden en que aparecen). Muéstralo:

\`\`\`
{'e': 1, 'a': 3, 'i': 1}
\`\`\``,
          starter: 'palabra = "esparadrapi"\ncuenta = {}\n# Recorre las letras y cuenta solo las vocales\n\nprint(cuenta)\n',
          solution: 'palabra = "esparadrapi"\ncuenta = {}\nfor letra in palabra:\n    if letra in "aeiou":\n        cuenta[letra] = cuenta.get(letra, 0) + 1\nprint(cuenta)',
          tests: [
            { kind: 'output', label: "Muestra {'e': 1, 'a': 3, 'i': 1}", expected: "{'e': 1, 'a': 3, 'i': 1}" },
            { kind: 'assert', label: 'cuenta tiene las vocales contadas', code: 'assert cuenta == {"e": 1, "a": 3, "i": 1}' },
            { kind: 'source', label: 'Usa un bucle for', pattern: /\bfor\b/ },
          ],
          hints: ['`for letra in palabra:` recorre cada letra.', 'Para saber si es vocal: `if letra in "aeiou":`.', 'Para contar: `cuenta[letra] = cuenta.get(letra, 0) + 1`.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Tu proyecto: gastos por categoría',
      minutes: 12,
      blocks: [
        {
          kind: 'text',
          md: `Tu gestor ya pide gastos, pero los olvida en cuanto suma el total. A partir de ahora cada gasto será un **diccionario** con \`concepto\`, \`importe\` y \`categoria\`, y todos irán en una **lista** \`gastos\`.

Con esa lista podrás calcular lo que quieras. Hoy: el **total de cada categoría**, el total general y el **gasto más grande**.

Para no tener que escribir los gastos cada vez, en este ejercicio la lista ya viene hecha.`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_categorias',
          title: 'Proyecto · Totales por categoría',
          project: true,
          prompt: `Con la lista \`gastos\`:

1. Calcula en el diccionario \`por_categoria\` el total de cada categoría (en el orden en que aparecen).
2. Muestra cada categoría con su total, el total general y el gasto mayor:

\`\`\`
comida: 47.80 €
ocio: 9.00 €
transporte: 12.00 €
Total: 68.80 €
Gasto mayor: super (45.30 €)
\`\`\``,
          starter: `${GASTOS}\npor_categoria = {}\n# 1. Acumula el importe de cada categoría\n\n# 2. Muestra los totales, el total general y el gasto mayor\n`,
          solution: `${GASTOS}\npor_categoria = {}\nfor g in gastos:\n    cat = g["categoria"]\n    por_categoria[cat] = por_categoria.get(cat, 0) + g["importe"]\nfor cat, importe in por_categoria.items():\n    print(f"{cat}: {importe:.2f} €")\ntotal = sum(por_categoria.values())\nprint(f"Total: {total:.2f} €")\nmayor = gastos[0]\nfor g in gastos:\n    if g["importe"] > mayor["importe"]:\n        mayor = g\nprint(f"Gasto mayor: {mayor['concepto']} ({mayor['importe']:.2f} €)")`,
          tests: [
            { kind: 'output', label: 'Totales por categoría, total y gasto mayor', expected: 'comida: 47.80 €\nocio: 9.00 €\ntransporte: 12.00 €\nTotal: 68.80 €\nGasto mayor: super (45.30 €)' },
            {
              kind: 'assert',
              label: 'por_categoria tiene el total de cada categoría',
              code: 'assert list(por_categoria) == ["comida", "ocio", "transporte"]\nassert abs(por_categoria["comida"] - 47.8) < 0.001 and por_categoria["ocio"] == 9 and por_categoria["transporte"] == 12',
            },
            { kind: 'source', label: 'Calcula los totales recorriendo la lista (no los escribas a mano)', pattern: /for\s+\w+\s+in\s+gastos/ },
            { kind: 'source', label: 'No escribe el total a mano', pattern: /47\.8|68\.8/, forbid: true },
          ],
          hints: [
            'Recorre los gastos: `for g in gastos:`; la categoría es `g["categoria"]` y el importe `g["importe"]`.',
            'Para acumular: `por_categoria[cat] = por_categoria.get(cat, 0) + g["importe"]`. Luego recórrelo con `.items()`.',
            'Para el mayor, empieza con `mayor = gastos[0]` y cámbialo cuando encuentres uno con más importe. Dentro de una f-string con comillas dobles, usa comillas simples para las claves: `{mayor[\'concepto\']}`.',
          ],
        },
        {
          kind: 'text',
          md: `## Lo que has aprendido
- Las listas guardan valores en orden; los índices empiezan en 0.
- Las tuplas son fijas y los conjuntos no tienen repetidos.
- Los diccionarios guardan pares clave: valor, y sirven para contar y agrupar.
- Una lista de diccionarios es la forma natural de guardar registros.

En el módulo 5 vas a ordenar este código en **funciones**, piezas con nombre que puedes reutilizar.`,
        },
      ],
    },
  ],
}
