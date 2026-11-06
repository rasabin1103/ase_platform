import type { LessonModule } from '../../../learn/types'

/**
 * Curso 9: Python desde cero · Módulo 8 — Ordenar tu código.
 * import y la librería estándar (math, random), fechas con datetime, JSON y
 * módulos propios. Proyecto: el resumen mensual de los gastos en JSON.
 */

const GASTOS = `gastos = [
    {"fecha": "2026-02-27", "concepto": "super", "importe": 45.3},
    {"fecha": "2026-03-02", "concepto": "cine", "importe": 9.0},
    {"fecha": "2026-03-15", "concepto": "taxi", "importe": 12.0},
    {"fecha": "2026-03-28", "concepto": "café", "importe": 2.5},
]`

const MAIN = `# Programa principal (no lo cambies)
resumen = resumen_mensual(gastos)
with open("resumen.json", "w", encoding="utf-8") as f:
    json.dump(resumen, f, ensure_ascii=False, indent=2)
print(json.dumps(resumen, ensure_ascii=False, indent=2))`

export const m08OrdenarCodigo: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm08-ordenar-codigo',
  number: 8,
  lang: 'es',
  title: 'Ordenar tu código',
  subtitle: 'Usa la librería estándar de Python, trabaja con fechas y JSON, y reparte tu código en módulos.',
  goals: [
    'Importar módulos con import y from … import.',
    'Usar math y random de la librería estándar.',
    'Leer, calcular y escribir fechas con datetime.',
    'Guardar y leer datos en JSON.',
    'Crear tus propios módulos y preparar el resumen mensual de tu proyecto.',
  ],
  lessons: [
    {
      id: 'import',
      title: 'import y la librería estándar',
      minutes: 8,
      blocks: [
        {
          kind: 'text',
          md: `Python trae de serie una **librería estándar** enorme: módulos con funciones ya hechas para matemáticas, fechas, ficheros, azar, internet… Para usarlos, se **importan** al principio del programa:

\`\`\`
import math
print(math.sqrt(16))      # 4.0
print(math.pi)

from math import sqrt, ceil
print(ceil(4.2))          # 5

import random as rnd      # con otro nombre más corto
\`\`\`

- \`import math\`: usas sus funciones con el prefijo \`math.\`.
- \`from math import sqrt\`: traes solo \`sqrt\` y la usas sin prefijo.
- \`as\` le pone otro nombre.

## random
\`random\` genera valores al azar: \`random.randint(1, 6)\` (un dado), \`random.choice(lista)\` (uno de la lista), \`random.shuffle(lista)\` (desordena la lista).

Para que «el azar» salga siempre igual (muy útil para probar un programa), fija la **semilla** al principio: \`random.seed(42)\`.`,
        },
        {
          kind: 'example',
          id: 'ej_import',
          code: 'import math\nimport random\n\nprint("Raíz de 2:", round(math.sqrt(2), 3))\nprint("Redondeo hacia arriba de 4.1:", math.ceil(4.1))\n\nrandom.seed(7)\nprint("Dado:", random.randint(1, 6))\nprint("Hoy cenamos:", random.choice(["pasta", "pizza", "ensalada"]))',
          note: 'Quita la línea `random.seed(7)` y ejecuta varias veces: el resultado cambia.',
        },
        {
          kind: 'predict',
          id: 'p_import',
          code: 'from math import floor\nimport math\nprint(floor(7.9), math.ceil(7.1))',
          question: '¿Qué imprime?',
          options: ['7 8', '8 8', '7 7', '8 7'],
          correct: 0,
          explanation: '`floor` redondea hacia abajo (7) y `ceil` hacia arriba (8). La primera se importó sin prefijo; la segunda se usa con `math.`.',
        },
        {
          kind: 'exercise',
          id: 'e_dados',
          title: 'Tira dos dados 1000 veces',
          prompt: `Con \`random.seed(1)\` al principio, tira **dos dados** (\`random.randint(1, 6)\` cada uno) **1000 veces** y cuenta cuántas veces suman **7**. Muestra el número de sietes y el porcentaje con un decimal:

\`\`\`
Sietes: …
Porcentaje: … %
\`\`\`

Con esa semilla el azar sale siempre igual, así que el resultado es siempre el mismo (ronda el 16-17 %).`,
          starter: 'import random\n\nrandom.seed(1)\n# Tira dos dados 1000 veces y cuenta los sietes\n',
          solution: 'import random\n\nrandom.seed(1)\nsietes = 0\nfor i in range(1000):\n    if random.randint(1, 6) + random.randint(1, 6) == 7:\n        sietes += 1\nprint("Sietes:", sietes)\nprint(f"Porcentaje: {sietes / 1000 * 100:.1f} %")',
          tests: [
            {
              kind: 'assert',
              label: 'Cuenta los sietes de 1000 tiradas con la semilla 1',
              code: 'import random as _r\n_r.seed(1)\n_n = sum(1 for _ in range(1000) if _r.randint(1, 6) + _r.randint(1, 6) == 7)\nassert sietes == _n, f"sietes vale {sietes}"',
            },
            { kind: 'output', label: 'Muestra los sietes y el porcentaje con un decimal', expected: 'Sietes: 168\nPorcentaje: 16.8 %' },
            { kind: 'source', label: 'Usa random.randint', pattern: /random\.randint\s*\(\s*1\s*,\s*6\s*\)/ },
          ],
          hints: ['Un contador `sietes = 0` y un `for i in range(1000):`.', 'Dentro: `if random.randint(1, 6) + random.randint(1, 6) == 7: sietes += 1`.', 'El porcentaje: `sietes / 1000 * 100` con `:.1f`.'],
        },
      ],
    },
    {
      id: 'fechas_json',
      title: 'Fechas y JSON',
      minutes: 10,
      blocks: [
        {
          kind: 'text',
          md: `## Fechas con datetime
\`\`\`
from datetime import date, datetime, timedelta

d = date(2026, 3, 15)
print(d.year, d.month, d.day)
print(d + timedelta(days=30))          # 2026-04-14
\`\`\`

- **De texto a fecha**: \`datetime.strptime("15/03/2026", "%d/%m/%Y").date()\`.
- **De fecha a texto**: \`d.strftime("%d/%m/%Y")\` → \`"15/03/2026"\`, o \`d.strftime("%Y-%m")\` → \`"2026-03"\`.
- \`%Y\` año, \`%m\` mes, \`%d\` día. Las fechas en formato \`AAAA-MM-DD\` también se leen con \`date.fromisoformat("2026-03-15")\`.
- Restar dos fechas da los días entre ellas: \`(d2 - d1).days\`.
- \`date.today()\` es la fecha de hoy.

## JSON
**JSON** es el formato de texto más usado para intercambiar datos entre programas (por ejemplo, el de casi todas las API web). Se parece mucho a los diccionarios y listas de Python:

\`\`\`
import json
datos = {"nombre": "Ana", "gastos": [9.5, 12]}
texto = json.dumps(datos, indent=2)     # de Python a texto JSON
otra_vez = json.loads(texto)            # de texto JSON a Python
\`\`\`

Para ficheros: \`json.dump(datos, f)\` y \`json.load(f)\`. Con \`ensure_ascii=False\` las tildes se guardan tal cual.`,
        },
        {
          kind: 'example',
          id: 'ej_fechas_json',
          code: 'from datetime import date, datetime, timedelta\nimport json\n\nalta = datetime.strptime("28/02/2026", "%d/%m/%Y").date()\nprint("Alta:", alta)\nprint("Un mes después:", (alta + timedelta(days=30)).strftime("%d/%m/%Y"))\nprint("Días hasta fin de año:", (date(2026, 12, 31) - alta).days)\n\nficha = {"cliente": "Ana", "alta": alta.isoformat(), "compras": [12.5, 8]}\ntexto = json.dumps(ficha, indent=2)\nprint(texto)\nprint(json.loads(texto)["compras"][0])',
        },
        {
          kind: 'predict',
          id: 'p_fechas',
          code: 'from datetime import date\ninicio = date(2026, 1, 25)\nfin = date(2026, 2, 3)\nprint((fin - inicio).days)\nprint(fin.strftime("%d/%m"))',
          question: '¿Qué imprime?',
          options: ['9\n03/02', '8\n03/02', '9\n02/03', '-9\n03/02'],
          correct: 0,
          explanation: 'Del 25 de enero al 3 de febrero hay 9 días (6 que quedan de enero + 3). `%d/%m` pone el día primero: «03/02».',
        },
        {
          kind: 'exercise',
          id: 'e_vencimiento',
          title: 'Fecha de vencimiento',
          prompt: `Escribe la función \`vencimiento(fecha_texto, dias)\` que recibe una fecha como \`"15/03/2026"\` y un número de días, y **devuelve** la fecha de vencimiento como texto en el mismo formato.

- \`vencimiento("15/03/2026", 30)\` → \`"14/04/2026"\`
- \`vencimiento("20/12/2026", 15)\` → \`"04/01/2027"\``,
          starter: 'from datetime import datetime, timedelta\n\n\ndef vencimiento(fecha_texto, dias):\n    pass\n\n\nprint(vencimiento("15/03/2026", 30))\n',
          solution:
            'from datetime import datetime, timedelta\n\n\ndef vencimiento(fecha_texto, dias):\n    fecha = datetime.strptime(fecha_texto, "%d/%m/%Y")\n    return (fecha + timedelta(days=dias)).strftime("%d/%m/%Y")\n\n\nprint(vencimiento("15/03/2026", 30))',
          tests: [
            { kind: 'assert', label: '15/03/2026 + 30 días → 14/04/2026', code: 'assert vencimiento("15/03/2026", 30) == "14/04/2026"' },
            { kind: 'assert', label: 'Cambia de año: 20/12/2026 + 15 → 04/01/2027', code: 'assert vencimiento("20/12/2026", 15) == "04/01/2027"' },
            { kind: 'assert', label: 'Febrero: 28/02/2026 + 1 → 01/03/2026', code: 'assert vencimiento("28/02/2026", 1) == "01/03/2026"' },
          ],
          hints: ['De texto a fecha: `datetime.strptime(fecha_texto, "%d/%m/%Y")`.', 'Suma los días con `timedelta(days=dias)`.', 'De vuelta a texto: `.strftime("%d/%m/%Y")` y `return`.'],
        },
      ],
    },
    {
      id: 'modulos',
      title: 'Tus propios módulos',
      minutes: 9,
      blocks: [
        {
          kind: 'text',
          md: `Cuando un programa crece, se reparte en **varios ficheros**. Cada fichero \`.py\` es un **módulo** que otros pueden importar:

\`\`\`
# fichero gestor.py
def con_iva(importe):
    return round(importe * 1.21, 2)
\`\`\`

\`\`\`
# fichero main.py
from gestor import con_iva
print(con_iva(100))
\`\`\`

Así cada fichero tiene una responsabilidad: \`gestor.py\` la lógica, \`main.py\` lo que se ve.

## if __name__ == "__main__"
Al importar un módulo, Python **ejecuta todo su código**. Si el módulo tiene pruebas o \`print\` sueltos, saldrían al importarlo. Para que un código solo se ejecute cuando lanzas ese fichero directamente:

\`\`\`
if __name__ == "__main__":
    print(con_iva(100))   # solo al ejecutar gestor.py, no al importarlo
\`\`\`

En tu ordenador tendrías los dos ficheros en la misma carpeta. Aquí solo hay un editor, así que el primer ejercicio **crea** el fichero del módulo desde el código y luego lo importa.`,
        },
        {
          kind: 'example',
          id: 'ej_modulos',
          code: 'codigo_modulo = \'\'\'\ndef saludo(nombre):\n    return f"Hola, {nombre}"\n\nif __name__ == "__main__":\n    print("Esto solo sale si ejecutas saludos.py directamente")\n\'\'\'\nwith open("saludos.py", "w", encoding="utf-8") as f:\n    f.write(codigo_modulo)\n\nimport saludos\nprint(saludos.saludo("Ana"))\nprint("El módulo se llama:", saludos.__name__)',
          note: 'Fíjate en que el mensaje del `if __name__ == "__main__"` no sale: el módulo se ha importado, no ejecutado.',
        },
        {
          kind: 'predict',
          id: 'p_name',
          code: 'print(__name__)',
          question: 'Si ejecutas directamente este fichero, ¿qué imprime?',
          options: ['main', '__main__', 'El nombre del fichero', 'None'],
          correct: 1,
          explanation: 'El fichero que ejecutas directamente se llama `"__main__"`. Cuando se importa, `__name__` es el nombre del módulo.',
        },
        {
          kind: 'exercise',
          id: 'e_modulo_propio',
          title: 'Tu módulo de utilidades',
          prompt: `Completa el texto \`codigo_modulo\` para que el módulo \`utilidades.py\` tenga la función \`euros(importe)\`, que devuelve el importe como texto con 2 decimales y el símbolo del euro: \`euros(3.5)\` → \`"3.50 €"\`.

El resto del programa ya lo guarda, lo importa y muestra:

\`\`\`
12.00 €
0.99 €
\`\`\``,
          starter:
            "codigo_modulo = '''\n# Escribe aquí la función euros(importe)\n'''\nwith open(\"utilidades.py\", \"w\", encoding=\"utf-8\") as f:\n    f.write(codigo_modulo)\n\nfrom utilidades import euros\nprint(euros(12))\nprint(euros(0.99))\n",
          solution:
            "codigo_modulo = '''\ndef euros(importe):\n    return f\"{importe:.2f} €\"\n'''\nwith open(\"utilidades.py\", \"w\", encoding=\"utf-8\") as f:\n    f.write(codigo_modulo)\n\nfrom utilidades import euros\nprint(euros(12))\nprint(euros(0.99))",
          tests: [
            { kind: 'output', label: 'Muestra 12.00 € y 0.99 €', expected: '12.00 €\n0.99 €' },
            { kind: 'assert', label: 'euros(3.5) devuelve "3.50 €"', code: 'assert euros(3.5) == "3.50 €"' },
            { kind: 'assert', label: 'La función vive en el módulo utilidades', code: 'import utilidades\nassert utilidades.euros(1) == "1.00 €"' },
          ],
          hints: ['Dentro de las triples comillas escribe una función normal: `def euros(importe):`.', 'El cuerpo es un `return` con una f-string.', '`return f"{importe:.2f} €"`.'],
        },
      ],
    },
    {
      id: 'proyecto',
      title: 'Tu proyecto: resumen mensual',
      minutes: 12,
      blocks: [
        {
          kind: 'text',
          md: `Último paso del gestor antes del proyecto final: un **resumen por meses**. Cada gasto tiene ahora una \`fecha\` (\`"AAAA-MM-DD"\`), y el resumen dice, para cada mes, cuántos gastos hubo y cuánto sumaron. Se guarda en \`resumen.json\` para que otro programa (una hoja de cálculo, una web) pueda leerlo.`,
        },
        {
          kind: 'exercise',
          id: 'e_proyecto_json',
          title: 'Proyecto · Resumen mensual en JSON',
          project: true,
          prompt: `Escribe \`resumen_mensual(gastos)\`, que devuelve un diccionario con una clave por mes (\`"AAAA-MM"\`, en el orden en que aparecen) y, en cada una, \`{"gastos": número, "total": suma redondeada a 2 decimales}\`. Saca el mes con \`datetime\`.

El programa principal lo guarda en \`resumen.json\` y lo muestra:

\`\`\`
{
  "2026-02": {
    "gastos": 1,
    "total": 45.3
  },
  "2026-03": {
    "gastos": 3,
    "total": 23.5
  }
}
\`\`\``,
          starter: `import json\nfrom datetime import datetime\n\n${GASTOS}\n\n\ndef resumen_mensual(gastos):\n    pass\n\n\n${MAIN}\n`,
          solution: `import json\nfrom datetime import datetime\n\n${GASTOS}\n\n\ndef resumen_mensual(gastos):\n    resumen = {}\n    for g in gastos:\n        mes = datetime.strptime(g["fecha"], "%Y-%m-%d").strftime("%Y-%m")\n        if mes not in resumen:\n            resumen[mes] = {"gastos": 0, "total": 0}\n        resumen[mes]["gastos"] += 1\n        resumen[mes]["total"] = round(resumen[mes]["total"] + g["importe"], 2)\n    return resumen\n\n\n${MAIN}`,
          tests: [
            {
              kind: 'output',
              label: 'Muestra el resumen de febrero y marzo',
              expected: '{\n  "2026-02": {\n    "gastos": 1,\n    "total": 45.3\n  },\n  "2026-03": {\n    "gastos": 3,\n    "total": 23.5\n  }\n}',
            },
            {
              kind: 'assert',
              label: 'Funciona con otros gastos',
              code: 'r = resumen_mensual([{"fecha": "2025-12-31", "concepto": "a", "importe": 1.1}, {"fecha": "2026-01-01", "concepto": "b", "importe": 2.2}, {"fecha": "2025-12-01", "concepto": "c", "importe": 3.3}])\nassert r == {"2025-12": {"gastos": 2, "total": 4.4}, "2026-01": {"gastos": 1, "total": 2.2}}, r',
            },
            { kind: 'assert', label: 'Sin gastos, resumen vacío', code: 'assert resumen_mensual([]) == {}' },
            { kind: 'assert', label: 'Guarda resumen.json', code: 'import json as _j\nwith open("resumen.json", encoding="utf-8") as _f:\n    assert _j.load(_f)["2026-03"]["gastos"] == 3' },
            { kind: 'source', label: 'Usa datetime para sacar el mes', pattern: /strptime|fromisoformat/ },
          ],
          hints: [
            'El mes de un gasto: `datetime.strptime(g["fecha"], "%Y-%m-%d").strftime("%Y-%m")`.',
            'Si el mes aún no está en el resumen, créalo con `{"gastos": 0, "total": 0}`.',
            'Suma 1 a `gastos` y el importe a `total`, redondeando con `round(..., 2)`. Al final, `return resumen`.',
          ],
        },
        {
          kind: 'text',
          md: `## Lo que has aprendido
- \`import\` y \`from … import\` traen módulos de la librería estándar o tuyos.
- \`random\` con semilla, \`datetime\` para fechas y \`json\` para intercambiar datos.
- Un fichero \`.py\` es un módulo; \`if __name__ == "__main__"\` separa lo que solo se ejecuta al lanzarlo.

**Tu gestor de gastos ya está completo.** Solo queda el **examen práctico**: diez ejercicios sin pistas con todo lo que has aprendido. Apruebas con 70 de 100 y, después, el test final te da el certificado.`,
        },
      ],
    },
  ],
}
