import type { LessonModule } from '../../../learn/types'

/**
 * Curso 9: Python desde cero · Módulo 7 — Ficheros.
 * open y with, leer y escribir texto, modos w/a/r, CSV con el módulo csv.
 * Proyecto: guardar y cargar los gastos en un CSV.
 *
 * En el navegador los ficheros viven en la memoria de Python: duran mientras
 * la página está abierta.
 */
export const m07Ficheros: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm07-ficheros',
  number: 7,
  lang: 'es',
  title: 'Ficheros',
  subtitle: 'Guarda datos en ficheros para que no se pierdan al cerrar el programa, y vuelve a leerlos.',
  goals: [
    'Abrir ficheros con open() y with.',
    'Escribir, añadir y leer texto línea a línea.',
    'Leer y escribir CSV con el módulo csv.',
    'Guardar y cargar los gastos de tu proyecto.',
  ],
  lessons: [
    {
      id: 'texto',
      title: 'Leer y escribir texto',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `Todo lo que guarda tu programa en variables se pierde al terminar. Para que dure, se guarda en un **fichero**.

\`\`\`
with open("notas.txt", "w", encoding="utf-8") as f:
    f.write("Primera línea\\n")
    f.write("Segunda línea\\n")
\`\`\`

- \`open(nombre, modo)\` abre el fichero. \`f\` es el fichero abierto.
- \`with\` lo **cierra solo** al acabar el bloque, aunque haya un error. Úsalo siempre.
- \`encoding="utf-8"\` para que las tildes y la «ñ» se guarden bien.
- \`write()\` no añade el salto de línea: lo pones tú con \`\\n\`.

| Modo | Para qué |
|---|---|
| \`"w"\` | Escribir. **Borra** lo que hubiera. |
| \`"a"\` | Añadir al final, sin borrar. |
| \`"r"\` | Leer (el modo por defecto). Si el fichero no existe: \`FileNotFoundError\`. |

## Leer
\`\`\`
with open("notas.txt", encoding="utf-8") as f:
    for linea in f:
        print(linea.strip())
\`\`\`

Recorrer el fichero da sus líneas **con el \`\\n\` final**: \`strip()\` lo quita. También existe \`f.read()\`, que devuelve todo el texto de una vez.

(En esta página los ficheros se guardan en la memoria del navegador mientras la tengas abierta.)`,
        },
        {
          kind: 'example',
          id: 'ej_texto',
          code: 'with open("compra.txt", "w", encoding="utf-8") as f:\n    f.write("pan\\n")\n    f.write("leche\\n")\n\nwith open("compra.txt", "a", encoding="utf-8") as f:\n    f.write("huevos\\n")\n\nwith open("compra.txt", encoding="utf-8") as f:\n    for numero, linea in enumerate(f, start=1):\n        print(numero, linea.strip())',
          note: '`enumerate` numera los elementos mientras los recorres.',
        },
        {
          kind: 'predict',
          id: 'p_modo_w',
          code: 'with open("a.txt", "w", encoding="utf-8") as f:\n    f.write("uno\\n")\nwith open("a.txt", "w", encoding="utf-8") as f:\n    f.write("dos\\n")\nwith open("a.txt", encoding="utf-8") as f:\n    print(f.read().strip())',
          question: '¿Qué imprime?',
          options: ['uno\ndos', 'dos', 'uno', 'Un error: el fichero ya existe'],
          correct: 1,
          explanation: 'El modo `"w"` **vacía** el fichero al abrirlo. La segunda escritura borra «uno». Para añadir sin borrar se usa `"a"`.',
        },
        {
          kind: 'exercise',
          id: 'e_diario',
          title: 'Cuenta líneas y palabras',
          prompt: `El programa ya crea el fichero \`diario.txt\`. Léelo y muestra cuántas **líneas** y cuántas **palabras** tiene:

\`\`\`
Líneas: 3
Palabras: 12
\`\`\``,
          starter:
            'with open("diario.txt", "w", encoding="utf-8") as f:\n    f.write("Hoy he empezado con Python\\n")\n    f.write("Ya sé usar bucles\\n")\n    f.write("Mañana ficheros CSV\\n")\n\n# Lee diario.txt y cuenta líneas y palabras\n',
          solution:
            'with open("diario.txt", "w", encoding="utf-8") as f:\n    f.write("Hoy he empezado con Python\\n")\n    f.write("Ya sé usar bucles\\n")\n    f.write("Mañana ficheros CSV\\n")\n\nlineas = 0\npalabras = 0\nwith open("diario.txt", encoding="utf-8") as f:\n    for linea in f:\n        lineas += 1\n        palabras += len(linea.split())\nprint("Líneas:", lineas)\nprint("Palabras:", palabras)',
          tests: [
            { kind: 'output', label: '3 líneas y 12 palabras', expected: 'Líneas: 3\nPalabras: 12' },
            { kind: 'source', label: 'Abre el fichero con with para leerlo', pattern: /with\s+open\s*\(\s*["']diario\.txt["']\s*(,\s*encoding[^)]*)?\)/ },
          ],
          hints: ['Ábrelo para leer: `with open("diario.txt", encoding="utf-8") as f:`.', 'Recorre `for linea in f:` con dos contadores.', 'Las palabras de una línea: `len(linea.split())`.'],
        },
      ],
    },
    {
      id: 'csv',
      title: 'Ficheros CSV',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `Un **CSV** es una tabla en texto: una fila por línea y las columnas separadas por comas. La primera fila suele ser la **cabecera**:

\`\`\`
concepto,importe,categoria
super,45.3,comida
cine,9,ocio
\`\`\`

Se abre con cualquier hoja de cálculo. Python trae el módulo \`csv\` para leerlo y escribirlo sin preocuparte de comas dentro de los textos ni de comillas. Se carga con \`import csv\` al principio del programa (en el módulo 8 verás \`import\` a fondo).

## Escribir con DictWriter
\`\`\`
import csv
with open("gastos.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["concepto", "importe"])
    w.writeheader()
    w.writerow({"concepto": "cine", "importe": 9})
\`\`\`

## Leer con DictReader
Cada fila llega como un **diccionario** con las claves de la cabecera:

\`\`\`
with open("gastos.csv", newline="", encoding="utf-8") as f:
    for fila in csv.DictReader(f):
        print(fila["concepto"], fila["importe"])
\`\`\`

**Ojo:** todo lo que se lee de un CSV es **texto**. Para sumar importes hay que convertirlos: \`float(fila["importe"])\`.

\`newline=""\` evita líneas en blanco de más en algunos sistemas: ponlo siempre al abrir un CSV.`,
        },
        {
          kind: 'example',
          id: 'ej_csv',
          code: 'import csv\n\nalumnos = [{"nombre": "Ana", "nota": 8.5}, {"nombre": "Luis", "nota": 6}, {"nombre": "Eva", "nota": 9.2}]\nwith open("notas.csv", "w", newline="", encoding="utf-8") as f:\n    w = csv.DictWriter(f, fieldnames=["nombre", "nota"])\n    w.writeheader()\n    for a in alumnos:\n        w.writerow(a)\n\nwith open("notas.csv", encoding="utf-8") as f:\n    print(f.read())\n\nwith open("notas.csv", newline="", encoding="utf-8") as f:\n    for fila in csv.DictReader(f):\n        print(fila["nombre"], "->", float(fila["nota"]) + 1)',
        },
        {
          kind: 'predict',
          id: 'p_csv_texto',
          code: 'import csv\nwith open("p.csv", "w", newline="", encoding="utf-8") as f:\n    f.write("x\\n2\\n3\\n")\nwith open("p.csv", newline="", encoding="utf-8") as f:\n    filas = list(csv.DictReader(f))\nprint(filas[0]["x"] + filas[1]["x"])',
          question: '¿Qué imprime?',
          options: ['5', '23', "['2', '3']", 'Un error'],
          correct: 1,
          explanation: 'Los valores de un CSV se leen como **texto**: `"2" + "3"` es `"23"`. Para sumar, `int(...)` o `float(...)`.',
        },
        {
          kind: 'exercise',
          id: 'e_csv_ventas',
          title: 'Suma un CSV',
          prompt: `El programa ya crea \`ventas.csv\` con las columnas \`producto\` y \`unidades\`. Léelo con \`csv.DictReader\` y muestra el total de unidades y el producto que más ha vendido:

\`\`\`
Total de unidades: 42
Más vendido: café
\`\`\``,
          starter:
            'import csv\n\nwith open("ventas.csv", "w", newline="", encoding="utf-8") as f:\n    f.write("producto,unidades\\ntostada,12\\ncafé,20\\nzumo,10\\n")\n\n# Lee ventas.csv y calcula el total y el más vendido\n',
          solution:
            'import csv\n\nwith open("ventas.csv", "w", newline="", encoding="utf-8") as f:\n    f.write("producto,unidades\\ntostada,12\\ncafé,20\\nzumo,10\\n")\n\ntotal = 0\nmejor = None\nmejor_unidades = -1\nwith open("ventas.csv", newline="", encoding="utf-8") as f:\n    for fila in csv.DictReader(f):\n        unidades = int(fila["unidades"])\n        total += unidades\n        if unidades > mejor_unidades:\n            mejor = fila["producto"]\n            mejor_unidades = unidades\nprint("Total de unidades:", total)\nprint("Más vendido:", mejor)',
          tests: [
            { kind: 'output', label: 'Total 42 y el más vendido es café', expected: 'Total de unidades: 42\nMás vendido: café' },
            { kind: 'source', label: 'Usa csv.DictReader', pattern: /csv\.DictReader/ },
          ],
          hints: ['`for fila in csv.DictReader(f):` te da cada fila como diccionario.', 'Las unidades son texto: `int(fila["unidades"])`.', 'Para el más vendido, guarda el mejor hasta ahora y cámbialo si encuentras uno mayor.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Tu proyecto: guardar y cargar',
      minutes: 12,
      blocks: [
        {
          kind: 'text',
          md: `Tu gestor por fin va a **recordar**: guardará la lista de gastos en \`gastos.csv\` y la cargará al empezar. Dos funciones:

- \`guardar(gastos, fichero)\`: escribe la lista en un CSV con la cabecera \`concepto,importe,categoria\`.
- \`cargar(fichero)\`: lee el CSV y devuelve la lista de gastos, con el **importe como número**. Si el fichero no existe, devuelve una lista vacía (captura \`FileNotFoundError\`).`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_csv',
          title: 'Proyecto · Guarda y carga los gastos',
          project: true,
          prompt: `Escribe \`guardar(gastos, fichero)\` y \`cargar(fichero)\`. El programa principal (al final, no lo cambies) guarda dos gastos, los carga y muestra:

\`\`\`
Cargados: 2
super · 45.30 € · comida
cine · 9.00 € · ocio
Total: 54.30 €
\`\`\``,
          starter:
            'import csv\n\n\ndef guardar(gastos, fichero):\n    pass\n\n\ndef cargar(fichero):\n    pass\n\n\n# Programa principal (no lo cambies)\nguardar([{"concepto": "super", "importe": 45.3, "categoria": "comida"}, {"concepto": "cine", "importe": 9, "categoria": "ocio"}], "gastos.csv")\ngastos = cargar("gastos.csv")\nprint("Cargados:", len(gastos))\nfor g in gastos:\n    print(f"{g[\'concepto\']} · {g[\'importe\']:.2f} € · {g[\'categoria\']}")\nprint(f"Total: {sum(g[\'importe\'] for g in gastos):.2f} €")\n',
          solution:
            'import csv\n\n\ndef guardar(gastos, fichero):\n    with open(fichero, "w", newline="", encoding="utf-8") as f:\n        w = csv.DictWriter(f, fieldnames=["concepto", "importe", "categoria"])\n        w.writeheader()\n        for g in gastos:\n            w.writerow(g)\n\n\ndef cargar(fichero):\n    gastos = []\n    try:\n        with open(fichero, newline="", encoding="utf-8") as f:\n            for fila in csv.DictReader(f):\n                gastos.append({"concepto": fila["concepto"], "importe": float(fila["importe"]), "categoria": fila["categoria"]})\n    except FileNotFoundError:\n        return []\n    return gastos\n\n\n# Programa principal (no lo cambies)\nguardar([{"concepto": "super", "importe": 45.3, "categoria": "comida"}, {"concepto": "cine", "importe": 9, "categoria": "ocio"}], "gastos.csv")\ngastos = cargar("gastos.csv")\nprint("Cargados:", len(gastos))\nfor g in gastos:\n    print(f"{g[\'concepto\']} · {g[\'importe\']:.2f} € · {g[\'categoria\']}")\nprint(f"Total: {sum(g[\'importe\'] for g in gastos):.2f} €")',
          tests: [
            { kind: 'output', label: 'Guarda, carga y muestra los dos gastos', expected: 'Cargados: 2\nsuper · 45.30 € · comida\ncine · 9.00 € · ocio\nTotal: 54.30 €' },
            {
              kind: 'assert',
              label: 'guardar escribe la cabecera concepto,importe,categoria',
              code: 'guardar([{"concepto": "bus", "importe": 1.5, "categoria": "transporte"}], "prueba.csv")\nwith open("prueba.csv", encoding="utf-8") as _f:\n    _lineas = _f.read().splitlines()\nassert _lineas == ["concepto,importe,categoria", "bus,1.5,transporte"], _lineas',
            },
            { kind: 'assert', label: 'cargar devuelve el importe como número', code: 'assert isinstance(cargar("gastos.csv")[0]["importe"], float)' },
            { kind: 'assert', label: 'cargar devuelve [] si el fichero no existe', code: 'assert cargar("no_existe_123.csv") == []' },
          ],
          hints: [
            '`guardar` es el ejemplo de `DictWriter` con `fieldnames=["concepto", "importe", "categoria"]`, `writeheader()` y un `writerow` por gasto.',
            'En `cargar`, crea `gastos = []` y añade un diccionario por fila con `"importe": float(fila["importe"])`.',
            'Rodea el `with open(...)` con `try:` y `except FileNotFoundError: return []`. Al final, `return gastos`.',
          ],
        },
        {
          kind: 'text',
          md: `## Lo que has aprendido
- \`with open(...)\` abre un fichero y lo cierra solo; los modos \`w\`, \`a\` y \`r\`.
- Recorrer un fichero da sus líneas; \`strip()\` quita el salto final.
- El módulo \`csv\` lee y escribe tablas; lo que se lee es texto.

En el módulo 8, el último antes del proyecto final, vas a **ordenar tu código en módulos** y a usar fechas y JSON para el resumen mensual.`,
        },
      ],
    },
  ],
}
