import type { ExerciseBlock, LessonModule } from '../../../learn/types'

/**
 * Curso 9: Python desde cero · Examen práctico (proyecto final).
 * Diez ejercicios sin pistas, uno o dos por módulo. Cada uno vale 10 puntos;
 * el módulo cuenta como terminado con 70/100. Después, el test teórico en el
 * servidor y el certificado.
 */

const ex = (e: Omit<ExerciseBlock, 'kind' | 'hints'>): ExerciseBlock => ({ kind: 'exercise', hints: [], ...e })

export const m09ProyectoFinal: LessonModule = {
  courseKey: 'python-desde-cero',
  id: 'm09-proyecto-final',
  number: 9,
  lang: 'es',
  title: 'Examen práctico',
  subtitle: 'Diez ejercicios sin pistas con todo lo que has aprendido. Cada uno vale 10 puntos y apruebas con 70.',
  goals: [
    'Resolver diez ejercicios sin pistas ni solución.',
    'Cada ejercicio superado suma 10 puntos; apruebas con 70 de 100.',
    'Puedes comprobar tantas veces como quieras y dejarlo para más tarde: tu nota se guarda.',
    'Al aprobar, haz el test final para conseguir el certificado.',
  ],
  exam: { passMark: 70, points: 10 },
  lessons: [
    {
      id: 'parte1',
      title: 'Parte 1 · Fundamentos',
      minutes: 25,
      blocks: [
        {
          kind: 'text',
          md: `En este examen no hay pistas ni solución. Escribe tu código, pulsa **Ejecutar** para probarlo y **Comprobar** cuando creas que está bien. Puedes comprobar tantas veces como quieras.

En los ejercicios que piden una **función**, la función tiene que **devolver** el resultado con \`return\` (no mostrarlo).`,
        },
        ex({
          id: 'x01_descuento',
          title: '1 · Precio con descuento',
          prompt: `Pide el precio con \`input("Precio: ")\` (decimal) y el descuento en % con \`input("Descuento: ")\` (entero). Muestra el precio final con 2 decimales:

\`\`\`
Precio: 80
Descuento: 15
Precio final: 68.00 €
\`\`\``,
          starter: '# Pide el precio y el descuento y muestra el precio final\n',
          solution: 'precio = float(input("Precio: "))\ndescuento = int(input("Descuento: "))\nfinal = precio * (1 - descuento / 100)\nprint(f"Precio final: {final:.2f} €")',
          sampleInputs: ['80', '15'],
          tests: [
            { kind: 'output', label: '80 € con un 15 % → 68.00 €', expected: 'Precio: 80\nDescuento: 15\nPrecio final: 68.00 €', inputs: ['80', '15'] },
            { kind: 'output', label: '19.99 € con un 0 % → 19.99 €', expected: 'Precio: 19.99\nDescuento: 0\nPrecio final: 19.99 €', inputs: ['19.99', '0'] },
            { kind: 'output', label: '250 € con un 30 % → 175.00 €', expected: 'Precio: 250\nDescuento: 30\nPrecio final: 175.00 €', inputs: ['250', '30'] },
          ],
        }),
        ex({
          id: 'x02_bisiesto',
          title: '2 · Año bisiesto',
          prompt: `Escribe la función \`es_bisiesto(anio)\` que devuelve \`True\` si el año es bisiesto y \`False\` si no.

Un año es bisiesto si es divisible entre 4, **excepto** los divisibles entre 100, que solo lo son si también son divisibles entre 400. (2024 sí, 1900 no, 2000 sí.)`,
          starter: 'def es_bisiesto(anio):\n    pass\n',
          solution: 'def es_bisiesto(anio):\n    return anio % 4 == 0 and (anio % 100 != 0 or anio % 400 == 0)',
          tests: [
            { kind: 'assert', label: '2024 es bisiesto', code: 'assert es_bisiesto(2024) is True' },
            { kind: 'assert', label: '2023 no es bisiesto', code: 'assert es_bisiesto(2023) is False' },
            { kind: 'assert', label: '1900 no es bisiesto', code: 'assert es_bisiesto(1900) is False' },
            { kind: 'assert', label: '2000 es bisiesto', code: 'assert es_bisiesto(2000) is True' },
          ],
        }),
        ex({
          id: 'x03_fizzbuzz',
          title: '3 · FizzBuzz',
          prompt: `Muestra los números del **1 al 15**, uno por línea, pero:

- si es múltiplo de 3 y de 5, escribe \`FizzBuzz\`;
- si solo es múltiplo de 3, \`Fizz\`;
- si solo es múltiplo de 5, \`Buzz\`.`,
          starter: '# Del 1 al 15\n',
          solution: 'for n in range(1, 16):\n    if n % 15 == 0:\n        print("FizzBuzz")\n    elif n % 3 == 0:\n        print("Fizz")\n    elif n % 5 == 0:\n        print("Buzz")\n    else:\n        print(n)',
          tests: [
            { kind: 'output', label: 'Del 1 al 15 con Fizz, Buzz y FizzBuzz', expected: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' },
            { kind: 'source', label: 'Usa un bucle', pattern: /\b(for|while)\b/ },
          ],
        }),
        ex({
          id: 'x04_digitos',
          title: '4 · Suma de cifras',
          prompt: `Escribe la función \`suma_cifras(n)\` que devuelve la suma de las cifras de un entero positivo **sin convertirlo a texto** (usa \`%\` y \`//\` en un bucle \`while\`).

\`suma_cifras(4721)\` → \`14\`. (\`//\` es la división entera: \`4721 // 10\` es \`472\`.)`,
          starter: 'def suma_cifras(n):\n    pass\n',
          solution: 'def suma_cifras(n):\n    total = 0\n    while n > 0:\n        total += n % 10\n        n = n // 10\n    return total',
          tests: [
            { kind: 'assert', label: 'suma_cifras(4721) → 14', code: 'assert suma_cifras(4721) == 14' },
            { kind: 'assert', label: 'suma_cifras(9) → 9', code: 'assert suma_cifras(9) == 9' },
            { kind: 'assert', label: 'suma_cifras(1000) → 1', code: 'assert suma_cifras(1000) == 1' },
            { kind: 'source', label: 'No convierte el número a texto', pattern: /\bstr\s*\(/, forbid: true },
          ],
        }),
      ],
    },
    {
      id: 'parte2',
      title: 'Parte 2 · Colecciones y funciones',
      minutes: 25,
      blocks: [
        ex({
          id: 'x05_pares',
          title: '5 · Solo los pares',
          prompt: 'Escribe la función `pares(numeros)` que recibe una lista de enteros y **devuelve una lista nueva** con los pares, en el mismo orden. `pares([3, 8, 1, 4])` → `[8, 4]`.',
          starter: 'def pares(numeros):\n    pass\n',
          solution: 'def pares(numeros):\n    resultado = []\n    for n in numeros:\n        if n % 2 == 0:\n            resultado.append(n)\n    return resultado',
          tests: [
            { kind: 'assert', label: '[3, 8, 1, 4] → [8, 4]', code: 'assert pares([3, 8, 1, 4]) == [8, 4]' },
            { kind: 'assert', label: 'Lista vacía → []', code: 'assert pares([]) == []' },
            { kind: 'assert', label: 'Con negativos y cero', code: 'assert pares([-2, 0, 5]) == [-2, 0]' },
            { kind: 'assert', label: 'No cambia la lista original', code: '_l = [1, 2, 3]\npares(_l)\nassert _l == [1, 2, 3]' },
          ],
        }),
        ex({
          id: 'x06_palabras',
          title: '6 · Palabras más repetidas',
          prompt: `Escribe la función \`frecuencias(texto)\` que devuelve un diccionario con cuántas veces aparece cada palabra del texto, **en minúsculas** y en el orden en que aparecen por primera vez.

\`frecuencias("El gato y el perro")\` → \`{"el": 2, "gato": 1, "y": 1, "perro": 1}\``,
          starter: 'def frecuencias(texto):\n    pass\n',
          solution: 'def frecuencias(texto):\n    cuenta = {}\n    for palabra in texto.lower().split():\n        cuenta[palabra] = cuenta.get(palabra, 0) + 1\n    return cuenta',
          tests: [
            { kind: 'assert', label: '«El gato y el perro»', code: 'assert frecuencias("El gato y el perro") == {"el": 2, "gato": 1, "y": 1, "perro": 1}' },
            { kind: 'assert', label: 'Respeta el orden de aparición', code: 'assert list(frecuencias("b a b c")) == ["b", "a", "c"]' },
            { kind: 'assert', label: 'Texto vacío → {}', code: 'assert frecuencias("") == {}' },
          ],
        }),
        ex({
          id: 'x07_descuentos',
          title: '7 · Rebajas',
          prompt: `Escribe la función \`rebajar(precios, descuento=10)\` que devuelve una lista nueva con cada precio rebajado en ese porcentaje y **redondeado a 2 decimales**.

- \`rebajar([100, 20])\` → \`[90.0, 18.0]\`
- \`rebajar([100, 20], 25)\` → \`[75.0, 15.0]\``,
          starter: 'def rebajar(precios, descuento=10):\n    pass\n',
          solution: 'def rebajar(precios, descuento=10):\n    rebajados = []\n    for p in precios:\n        rebajados.append(round(p * (1 - descuento / 100), 2))\n    return rebajados',
          tests: [
            { kind: 'assert', label: 'Con el 10 % por defecto', code: 'assert rebajar([100, 20]) == [90.0, 18.0]' },
            { kind: 'assert', label: 'Con el 25 %', code: 'assert rebajar([100, 20], 25) == [75.0, 15.0]' },
            { kind: 'assert', label: 'Redondea a 2 decimales', code: 'assert rebajar([9.99], 15) == [8.49]' },
            { kind: 'assert', label: 'Lista vacía → []', code: 'assert rebajar([]) == []' },
          ],
        }),
      ],
    },
    {
      id: 'parte3',
      title: 'Parte 3 · Textos, errores, ficheros y fechas',
      minutes: 30,
      blocks: [
        ex({
          id: 'x08_numero',
          title: '8 · ¿Es un número?',
          prompt: `Escribe la función \`a_numero(texto)\` que convierte un texto en número decimal y lo devuelve. Acepta espacios en los extremos y la **coma** decimal. Si no es un número, devuelve \`None\` (sin romperse).

- \`a_numero(" 3,5 ")\` → \`3.5\`
- \`a_numero("doce")\` → \`None\``,
          starter: 'def a_numero(texto):\n    pass\n\n\nprint(a_numero("12"))\n',
          solution: 'def a_numero(texto):\n    try:\n        return float(texto.strip().replace(",", "."))\n    except ValueError:\n        return None\n\n\nprint(a_numero("12"))',
          tests: [
            { kind: 'assert', label: '" 3,5 " → 3.5', code: 'assert a_numero(" 3,5 ") == 3.5' },
            { kind: 'assert', label: '"12" → 12.0', code: 'assert a_numero("12") == 12.0' },
            { kind: 'assert', label: '"doce" → None', code: 'assert a_numero("doce") is None' },
            { kind: 'assert', label: '"" → None', code: 'assert a_numero("") is None' },
          ],
        }),
        ex({
          id: 'x09_csv',
          title: '9 · Medias de un CSV',
          prompt: `El programa crea \`notas.csv\` con las columnas \`alumno\` y \`nota\` (un alumno puede tener varias filas). Escribe la función \`medias(fichero)\` que devuelve un diccionario con la **media de cada alumno**, redondeada a 1 decimal, en el orden en que aparecen.

Con el fichero de ejemplo: \`{"ana": 7.5, "luis": 6.0, "eva": 9.0}\`.`,
          starter:
            'import csv\n\nwith open("notas.csv", "w", newline="", encoding="utf-8") as f:\n    f.write("alumno,nota\\nana,7\\nluis,6\\nana,8\\neva,9\\n")\n\n\ndef medias(fichero):\n    pass\n\n\nprint(medias("notas.csv"))\n',
          solution:
            'import csv\n\nwith open("notas.csv", "w", newline="", encoding="utf-8") as f:\n    f.write("alumno,nota\\nana,7\\nluis,6\\nana,8\\neva,9\\n")\n\n\ndef medias(fichero):\n    suma = {}\n    cuenta = {}\n    with open(fichero, newline="", encoding="utf-8") as f:\n        for fila in csv.DictReader(f):\n            a = fila["alumno"]\n            suma[a] = suma.get(a, 0) + float(fila["nota"])\n            cuenta[a] = cuenta.get(a, 0) + 1\n    resultado = {}\n    for a in suma:\n        resultado[a] = round(suma[a] / cuenta[a], 1)\n    return resultado\n\n\nprint(medias("notas.csv"))',
          tests: [
            { kind: 'assert', label: 'Medias del fichero de ejemplo', code: 'assert medias("notas.csv") == {"ana": 7.5, "luis": 6.0, "eva": 9.0}' },
            {
              kind: 'assert',
              label: 'Funciona con otro fichero',
              code: 'with open("otras.csv", "w", newline="", encoding="utf-8") as _f:\n    _f.write("alumno,nota\\nzoe,5\\nzoe,6\\nzoe,6\\n")\nassert medias("otras.csv") == {"zoe": 5.7}',
            },
          ],
        }),
        ex({
          id: 'x10_edad',
          title: '10 · Edad exacta',
          prompt: `Escribe la función \`edad(nacimiento, hoy)\` que recibe dos fechas como texto \`"AAAA-MM-DD"\` y devuelve los **años cumplidos** en la fecha \`hoy\` (si aún no ha llegado el cumpleaños de ese año, un año menos).

- \`edad("1990-06-15", "2026-06-15")\` → \`36\`
- \`edad("1990-06-15", "2026-06-14")\` → \`35\``,
          starter: 'from datetime import date\n\n\ndef edad(nacimiento, hoy):\n    pass\n',
          solution:
            'from datetime import date\n\n\ndef edad(nacimiento, hoy):\n    n = date.fromisoformat(nacimiento)\n    h = date.fromisoformat(hoy)\n    anios = h.year - n.year\n    if (h.month, h.day) < (n.month, n.day):\n        anios -= 1\n    return anios',
          tests: [
            { kind: 'assert', label: 'El día del cumpleaños', code: 'assert edad("1990-06-15", "2026-06-15") == 36' },
            { kind: 'assert', label: 'Un día antes del cumpleaños', code: 'assert edad("1990-06-15", "2026-06-14") == 35' },
            { kind: 'assert', label: 'Mes anterior al del cumpleaños', code: 'assert edad("2000-12-01", "2026-03-01") == 25' },
            { kind: 'assert', label: 'Recién nacido', code: 'assert edad("2026-01-01", "2026-03-01") == 0' },
          ],
        }),
      ],
    },
  ],
}

/** Soluciones de referencia del examen (las usa el test E2E). */
export const M09_PY_ANSWERS: Record<string, string> = Object.fromEntries(
  m09ProyectoFinal.lessons.flatMap((l) => l.blocks.flatMap((b) => (b.kind === 'exercise' ? [[b.id, b.solution]] : []))),
)
