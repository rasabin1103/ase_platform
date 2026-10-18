import type { Lesson } from '../../../engine/types'

/** Microlecciones de Sergio (curso de Karate · misión 7). */
export const m06Lessons: Lesson[] = [
  {
    id: 'negativos',
    question: '¿Qué casos negativos merece la pena automatizar?',
    conceptId: 'negativos',
    cost: 5,
    body: `Los que un partner puede provocar de verdad, uno por regla:
- **Formato** (400): ids mal formados, campos obligatorios que faltan, tipos equivocados.
- **No existe** (404): cuenta o transferencia inexistente.
- **No se puede** (405, 409, 422): método no permitido, confirmar dos veces, sin fondos.
- **Seguridad** (401, 403): sin token, sin scope.

Son muchos y se parecen: van en un **Scenario Outline** con columnas \`status\` y \`code\`. Y siempre se comprueba el **code**, no solo el status: dos errores distintos pueden compartir 404.`,
  },
  {
    id: 'esquema',
    question: '¿Cómo valido el formato de todos los errores a la vez?',
    conceptId: 'errores',
    cost: 5,
    body: `Con un esquema reutilizable en el Background:
\`\`\`
* def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' }
\`\`\`
y en cada caso negativo:
\`\`\`
And match response == errorSchema
\`\`\`
\`##string\` es **opcional**: solo las validaciones traen \`field\`. Un error con otro formato (un 404 genérico del framework, una traza de Java) rompe a los partners que leen \`code\`: es un bug de contrato aunque el status sea el correcto.`,
  },
  {
    id: 'retry',
    question: '¿Cómo espero a algo que termina «más tarde»?',
    conceptId: 'retry',
    cost: 5,
    body: `Con **retry until** justo antes de \`method\`:
\`\`\`
Given path 'transfers', id
And retry until response.status == 'COMPLETED'
When method get
\`\`\`
Karate repite la petición hasta que la condición se cumple (puede usar \`response\`, \`responseStatus\`, \`responseHeaders\`). Si se agotan los intentos, el paso falla con **too many retry attempts**.

Nada de sleeps fijos: siempre esperan de más, y un día que tarde un poco más fallan igual.`,
  },
  {
    id: 'configure',
    question: '¿Cuántas veces reintenta Karate?',
    conceptId: 'retry',
    cost: 3,
    body: `Por defecto, **3 intentos cada 3000 ms** (unos 6 s). Se cambia con:
\`\`\`
* configure retry = { count: 10, interval: 1000 }
\`\`\`
Elige según lo que diga el contrato: si procesar puede tardar hasta 8 s, consultar cada segundo con 10 intentos lo cubre con margen. No pongas 100 intentos «por si acaso»: un test que tarda minutos en fallar también es un problema.`,
  },
  {
    id: 'cabeceras',
    question: '¿Cómo compruebo una cabecera de la respuesta?',
    conceptId: 'errores',
    cost: 3,
    body: `Con **responseHeaders**: cada cabecera es una **lista** de valores.
\`\`\`
And match responseHeaders['Retry-After'][0] == '#regex [0-9]+'
\`\`\`
En los errores 5xx importa tanto el cuerpo como las cabeceras: \`Retry-After\` le dice al partner cuándo puede reintentar sin saturarnos.`,
  },
]
