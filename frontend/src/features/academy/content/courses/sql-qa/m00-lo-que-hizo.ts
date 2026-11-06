import type { Mission } from '../../../engine/types'
import { kobaltoQaDbSql } from '../../../sql/kobaltoQaDb'
import { COMUN } from './shared'

const RUN = "WHERE e.ejecucion = 'R-0306'"

/**
 * Curso 8: SQL para QA · Misión 0 — Lo que hizo la app (demo abierta).
 *
 * Una ejecución de pruebas de la app (R-0306) dice que todo fue bien. El
 * alumno comprueba en la base de datos lo que de verdad quedó: las
 * transferencias, sus importes, la partida doble de los apuntes, la
 * auditoría y los saldos. Trampas: dar por buena una prueba porque la fila
 * existe y mezclar los datos de otra ejecución.
 */
export const m00LoQueHizo: Mission = {
  ...COMUN,
  id: 'm00-lo-que-hizo',
  number: 0,
  title: 'Lo que hizo la app',
  subtitle: 'Verificar en la base de datos lo que una prueba de la app dio por bueno.',
  dayLabel: 'Lunes · mes 4',
  verdicts: {
    good: {
      title: 'La base de datos no miente',
      body: 'La app dijo «todo bien» y tú encontraste un importe multiplicado por diez, un apunte sin su pareja, una transferencia hecha aunque la app dio error, otra sin auditoría y una cuenta con 250 € de más. Y no te despistó la ejecución del día anterior.',
    },
    ok: {
      title: 'Verificación a medias',
      body: 'Ya miras la base de datos después de una prueba, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'La prueba pasó… y no debía',
      body: 'Varios encargos se quedaron sin hacer y los defectos llegaron a producción. Repite la misión con la chuleta a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Lo que hizo la app',
    paragraphs: [
      'Lunes. Empiezas en el equipo de QA con Laura. Esta mañana se ha lanzado la ejecución de pruebas **R-0306** contra la app: siete transferencias. La app dice que cinco fueron bien y dos dieron error.',
      'Tu trabajo: comprobar en la base de datos lo que **de verdad** pasó. Cada encargo se cumple cuando la consulta devuelve exactamente las filas y columnas pedidas.',
    ],
    goals: [
      'Encuentra en la base de datos lo que creó una ejecución de pruebas.',
      'Compara los valores que pidió la app con los que se guardaron.',
      'Comprueba que cada transferencia tiene sus dos apuntes y suman cero.',
      'Busca lo que se hizo aunque la app diera error.',
      'Comprueba los efectos secundarios: auditoría y saldos.',
      'Quédate solo con los datos de tu ejecución.',
    ],
  },

  docs: [
    {
      id: 'chuleta_verificar',
      title: 'Chuleta: verificar lo que hizo la app',
      updatedLabel: 'Laura Méndez · QA',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'verificar_bd' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Tablas de la prueba
| tabla | qué tiene |
|---|---|
| \`ejecuciones\` | lo que hizo la prueba: \`ejecucion\` (R-0305, R-0306), \`caso\`, \`referencia\`, cuentas, \`importe\` pedido y \`resultado_ui\` (ok / error) |
| \`transferencias\` | lo que guardó la app; el \`concepto\` es la referencia de la prueba |
| \`apuntes\` | partida doble: cada transferencia completada deja **dos** apuntes, uno negativo en el origen y uno positivo en el destino |
| \`saldos_antes\` | foto de los saldos tomada a las 09:55, antes de R-0306 |
| \`auditoria\` | una fila por cada alta (\`tabla\`, \`registro_id\`) |

## Qué comprobar después de una prueba
1. **Que existe**: la fila que la app dice haber creado.
2. **Que los valores son los pedidos**: importe, cuentas, estado.
3. **Que se cumplen las invariantes**: los apuntes suman cero, el saldo cuadra.
4. **Que no hay efectos de más**: lo que dio error no debería haber dejado nada.
5. **Que están los efectos secundarios**: auditoría, avisos…

## Para quedarte con tu ejecución
\`\`\`
FROM ejecuciones e
JOIN transferencias t ON t.concepto = e.referencia
WHERE e.ejecucion = 'R-0306'
\`\`\``,
    },
  ],

  sqlLab: {
    setup: kobaltoQaDbSql(),
    readOnly: true,
    runCost: 2,
    starter: "-- Lo que hizo la ejecución de pruebas R-0306, según la propia prueba\nSELECT caso, referencia, cuenta_origen_id, cuenta_destino_id, importe, resultado_ui\nFROM ejecuciones\nWHERE ejecucion = 'R-0306'\nORDER BY caso;",
    retos: [
      {
        id: 'transferencias_prueba',
        from: 'laura',
        title: 'Las transferencias que dejó R-0306',
        description: 'Las transferencias que hay en la base de datos con la **referencia** de alguna operación de la ejecución **R-0306** como concepto: `id`, `concepto`, `importe` y `estado`.',
        hint: "`FROM transferencias WHERE concepto IN (SELECT referencia FROM ejecuciones WHERE ejecucion = 'R-0306')`.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: "SELECT id, concepto, importe, estado FROM transferencias WHERE concepto IN (SELECT referencia FROM ejecuciones WHERE ejecucion = 'R-0306')",
        columns: ['id', 'concepto', 'importe', 'estado'],
      },
      {
        id: 'importes_distintos',
        from: 'marta',
        title: 'Importes que no son los pedidos',
        description: 'Las operaciones de **R-0306** cuya transferencia se guardó con un **importe distinto** del que pidió la prueba: `referencia`, `importe_app` y `importe_bd`.',
        hint: "`FROM ejecuciones e JOIN transferencias t ON t.concepto = e.referencia WHERE e.ejecucion = 'R-0306' AND t.importe <> e.importe`.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: `SELECT e.referencia, e.importe AS importe_app, t.importe AS importe_bd FROM ejecuciones e JOIN transferencias t ON t.concepto = e.referencia ${RUN} AND t.importe <> e.importe`,
        columns: ['referencia', 'importe_app', 'importe_bd'],
      },
      {
        id: 'partida_doble',
        from: 'carmen',
        title: 'Transferencias sin su partida doble',
        description: 'Las transferencias de **R-0306** que **no** tienen exactamente **dos apuntes** que **sumen cero**: `transferencia_id`, `apuntes` (cuántos tiene) y `suma`.',
        hint: '`LEFT JOIN apuntes a ON a.transferencia_id = t.id`, `GROUP BY t.id` y `HAVING COUNT(a.id) <> 2 OR COALESCE(SUM(a.importe), 0) <> 0`.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: `SELECT t.id AS transferencia_id, COUNT(a.id) AS apuntes, COALESCE(SUM(a.importe), 0) AS suma FROM ejecuciones e JOIN transferencias t ON t.concepto = e.referencia LEFT JOIN apuntes a ON a.transferencia_id = t.id ${RUN} GROUP BY t.id HAVING COUNT(a.id) <> 2 OR COALESCE(SUM(a.importe), 0) <> 0`,
        columns: ['transferencia_id', 'apuntes', 'suma'],
      },
      {
        id: 'error_pero_hecha',
        from: 'nuria',
        title: 'Dio error en la app, pero se hizo',
        description: 'Las operaciones de **R-0306** que la app marcó como **error** pero que **sí** dejaron una transferencia: `referencia`, `id` (de la transferencia) y `estado`.',
        hint: "`… WHERE e.ejecucion = 'R-0306' AND e.resultado_ui = 'error'` con el JOIN a transferencias.",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: `SELECT e.referencia, t.id, t.estado FROM ejecuciones e JOIN transferencias t ON t.concepto = e.referencia ${RUN} AND e.resultado_ui = 'error'`,
        columns: ['referencia', 'id', 'estado'],
      },
      {
        id: 'sin_auditoria',
        from: 'diego',
        title: 'Transferencias sin auditoría',
        description: "Las transferencias de **R-0306** que **no** tienen su fila en `auditoria` (`tabla = 'transferencias'` y `registro_id` = el id): una columna `id`.",
        hint: "`AND NOT EXISTS (SELECT 1 FROM auditoria au WHERE au.tabla = 'transferencias' AND au.registro_id = t.id)`.",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: `SELECT t.id FROM ejecuciones e JOIN transferencias t ON t.concepto = e.referencia ${RUN} AND NOT EXISTS (SELECT 1 FROM auditoria au WHERE au.tabla = 'transferencias' AND au.registro_id = t.id)`,
        columns: ['id'],
      },
      {
        id: 'saldos_descuadrados',
        from: 'ines',
        title: 'Saldos que no cuadran con los apuntes',
        description: 'Para las cuentas con apuntes de **R-0306**: las que su **cambio de saldo** (saldo actual − `saldos_antes`) **no coincide** con la **suma de sus apuntes de R-0306**: `cuenta_id`, `cambio_saldo` y `suma_apuntes`.',
        hint: "Primero la suma de apuntes por cuenta, solo de R-0306 (`apuntes → transferencias → ejecuciones`), y luego el JOIN con `cuentas` y `saldos_antes`.",
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: `WITH run AS (SELECT a.cuenta_id, SUM(a.importe) AS suma FROM apuntes a JOIN transferencias t ON t.id = a.transferencia_id JOIN ejecuciones e ON e.referencia = t.concepto ${RUN} GROUP BY a.cuenta_id) SELECT c.id AS cuenta_id, c.saldo - s.saldo AS cambio_saldo, r.suma AS suma_apuntes FROM run r JOIN cuentas c ON c.id = r.cuenta_id JOIN saldos_antes s ON s.cuenta_id = c.id WHERE c.saldo - s.saldo <> r.suma`,
        columns: ['cuenta_id', 'cambio_saldo', 'suma_apuntes'],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Un cliente ve 300 € en una transferencia de 30 €', severity: 'high', explanation: 'La prueba solo miró que la transferencia existía, no su importe.', technique: 'Comparar el valor pedido con el guardado.', preventedBy: 'reto.importes_distintos' },
    { id: 'C-CARMEN', title: '75,50 € salen de una cuenta y no llegan a ninguna', severity: 'high', explanation: 'Una transferencia quedó con un solo apunte.', technique: 'Invariante: dos apuntes que suman cero.', preventedBy: 'reto.partida_doble' },
    { id: 'C-NURIA', title: 'Un cliente repite una transferencia que «falló» y la paga dos veces', severity: 'high', explanation: 'La app dio error, pero la operación se hizo.', technique: 'Buscar efectos de las operaciones con error.', preventedBy: 'reto.error_pero_hecha' },
    { id: 'C-DIEGO', title: 'Auditoría interna no encuentra el rastro de una transferencia', severity: 'medium', explanation: 'Una transferencia se guardó sin su fila de auditoría.', technique: 'NOT EXISTS sobre la tabla de auditoría.', preventedBy: 'reto.sin_auditoria' },
    { id: 'C-INES', title: 'La cuenta 9 tiene 250 € que no le corresponden', severity: 'high', explanation: 'El saldo se actualizó dos veces para la misma transferencia.', technique: 'Saldo después = saldo antes + apuntes.', preventedBy: 'reto.saldos_descuadrados' },
    { id: 'C-EXISTE', title: 'Las pruebas automáticas siguen en verde con datos mal guardados', severity: 'medium', explanation: 'Las comprobaciones solo miraban que la fila existiera.', technique: 'Comprobar valores, no solo existencia.', preventedBy: 'practice.valores' },
    { id: 'C-MEZCLA', title: 'Un informe de pruebas marca cuatro cuentas descuadradas que estaban bien', severity: 'low', explanation: 'Se sumaron los apuntes de otra ejecución.', technique: 'Filtrar por la ejecución (referencias o ventana de tiempo).', preventedBy: 'practice.aislar' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con la ejecución R-0306.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.importes_distintos', label: 'Importes de Marta', explanation: 'Valor pedido = valor guardado.' },
      { flag: 'reto.partida_doble', label: 'Apuntes de Carmen', explanation: 'Dos apuntes que suman cero.' },
      { flag: 'reto.error_pero_hecha', label: 'Clientes de Nuria', explanation: 'Lo que dio error no dejó nada.' },
      { flag: 'reto.sin_auditoria', label: 'Auditoría de Diego', explanation: 'Cada alta con su rastro.' },
      { flag: 'reto.saldos_descuadrados', label: 'Saldos de Inés', explanation: 'Saldo después = antes + apuntes.' },
      { flag: 'practice.valores', label: 'Valores, no solo filas', explanation: 'Comprobar lo que se guardó.' },
      { flag: 'practice.aislar', label: 'Solo mi ejecución', explanation: 'Sin mezclar otras pruebas.' },
    ],
  },

  concepts: [
    { id: 'verificar_bd', title: 'Verificar en la base de datos', summary: 'La pantalla dice lo que la app cree; la base de datos, lo que quedó. Una prueba compara las dos.' },
    { id: 'valores', title: 'Valores, no solo existencia', summary: 'Que la fila exista no basta: importe, cuentas y estado tienen que ser los pedidos.' },
    { id: 'invariantes', title: 'Invariantes', summary: 'Reglas que siempre se cumplen: los apuntes de una transferencia suman cero, el saldo es el anterior más los movimientos.' },
    { id: 'efectos_error', title: 'Efectos de lo que falló', summary: 'Una operación con error no debería dejar nada; si deja algo, el usuario la repetirá.' },
    { id: 'efectos_secundarios', title: 'Efectos secundarios', summary: 'Auditoría, avisos, saldos: lo que tiene que pasar además de la fila principal.' },
    { id: 'foto_antes', title: 'La foto de antes', summary: 'Para medir un cambio hace falta el estado de antes: una copia de los saldos al empezar la prueba.' },
    { id: 'aislar', title: 'Aislar tu ejecución', summary: 'Filtra por los identificadores o la ventana de tiempo de tu prueba para no mezclar otras.' },
  ],
  debriefConcepts: ['verificar_bd', 'valores', 'invariantes', 'efectos_error', 'efectos_secundarios', 'foto_antes', 'aislar'],
  seniorTips: [
    'Lee la chuleta de verificar lo que hizo la app en la wiki.',
    "Laura: transferencias WHERE concepto IN (SELECT referencia FROM ejecuciones WHERE ejecucion = 'R-0306').",
    'Marta: JOIN ejecuciones–transferencias por la referencia y t.importe <> e.importe.',
    'Carmen: LEFT JOIN apuntes, GROUP BY t.id, HAVING COUNT(a.id) <> 2 OR SUM <> 0.',
    "Nuria: el mismo JOIN con e.resultado_ui = 'error'.",
    "Diego: NOT EXISTS en auditoria con tabla = 'transferencias' y registro_id = t.id.",
    'Inés: suma de apuntes por cuenta solo de R-0306 y compárala con saldo − saldos_antes.',
    'Con Laura: comprobar valores y no solo existencia, y filtrar siempre por tu ejecución.',
  ],

  lessons: [
    {
      id: 'verificar_bd',
      question: '¿Por qué mirar la base de datos si la app ya dice «ok»?',
      conceptId: 'verificar_bd',
      cost: 5,
      body: `La pantalla enseña lo que la app **cree** que pasó: una respuesta del servidor, un mensaje. La base de datos guarda lo que **de verdad** quedó.

Una prueba de extremo a extremo se cierra en los dos sitios:

- **Pantalla**: el usuario ve lo que tiene que ver.
- **Base de datos**: quedó lo que tenía que quedar, ni más ni menos.

Hoy la app dijo «ok» en cinco operaciones y la base de datos tenía problemas en tres.`,
    },
    {
      id: 'valores',
      question: '¿No basta con comprobar que la transferencia existe?',
      conceptId: 'valores',
      cost: 5,
      body: `\`SELECT COUNT(*) … WHERE concepto = 'REF-1007'\` da 1 y la prueba pasa… con 300 € guardados en vez de 30.

Compara con lo que pidió la prueba:

\`\`\`
SELECT e.referencia, e.importe AS importe_app, t.importe AS importe_bd
FROM ejecuciones e
JOIN transferencias t ON t.concepto = e.referencia
WHERE e.ejecucion = 'R-0306' AND t.importe <> e.importe;
\`\`\`

Cero filas = todo cuadra. Cada fila es un defecto con su referencia.`,
    },
    {
      id: 'invariantes',
      question: '¿Qué es una invariante y por qué ayuda?',
      conceptId: 'invariantes',
      cost: 5,
      body: `Una regla que tiene que cumplirse **siempre**, pase lo que pase en la app:

- Cada transferencia completada tiene **dos apuntes** y **suman cero**.
- El saldo de una cuenta = saldo de antes + sus apuntes.

No necesitas saber qué hizo cada prueba: si una invariante falla, algo se rompió.

\`\`\`
… GROUP BY t.id
HAVING COUNT(a.id) <> 2 OR COALESCE(SUM(a.importe), 0) <> 0
\`\`\`

El \`LEFT JOIN\` es importante: con un JOIN normal, una transferencia **sin ningún** apunte desaparecería del resultado.`,
    },
    {
      id: 'efectos_error',
      question: '¿Qué hay que mirar cuando la app da error?',
      conceptId: 'efectos_error',
      cost: 5,
      body: `Que **no** haya quedado nada. Si la app dice «error» (por un tiempo de espera, por ejemplo) pero el servidor terminó la operación, el usuario lo intentará otra vez y la hará **dos veces**.

\`\`\`
… WHERE e.ejecucion = 'R-0306' AND e.resultado_ui = 'error'
\`\`\`

con el JOIN a transferencias: cada fila es una operación «fallida» que sí se hizo. Es el tipo de defecto que solo se ve en la base de datos.`,
    },
    {
      id: 'efectos_secundarios',
      question: '¿Qué son los efectos secundarios de una operación?',
      conceptId: 'efectos_secundarios',
      cost: 5,
      body: `Todo lo que tiene que pasar **además** de la fila principal: la fila de auditoría, el apunte, el aviso al cliente, el cambio de saldo…

Se buscan con \`NOT EXISTS\`:

\`\`\`
WHERE NOT EXISTS (
  SELECT 1 FROM auditoria au
  WHERE au.tabla = 'transferencias' AND au.registro_id = t.id
)
\`\`\`

Una prueba que solo mira la transferencia no ve que falta la auditoría.`,
    },
    {
      id: 'foto_antes',
      question: '¿Cómo compruebo un cambio de saldo?',
      conceptId: 'foto_antes',
      cost: 5,
      body: `Necesitas el saldo **de antes**. Por eso las pruebas buenas toman una foto al empezar (\`saldos_antes\`, a las 09:55):

\`\`\`
cambio = cuentas.saldo − saldos_antes.saldo
\`\`\`

y lo comparan con lo que **debería** haber cambiado: la suma de los apuntes de la prueba. Si no coinciden, el saldo se actualizó de más (o de menos).`,
    },
    {
      id: 'aislar',
      question: '¿Por qué filtrar por la ejecución?',
      conceptId: 'aislar',
      cost: 5,
      body: `En la base de datos de pruebas conviven datos de muchas ejecuciones. Ayer se lanzó **R-0305** sobre las mismas cuentas.

Si sumas **todos** los apuntes de la cuenta 3, metes los de ayer, que ya estaban en la foto de antes, y la cuenta sale descuadrada cuando está bien.

Filtra siempre por algo que identifique tu prueba: sus **referencias**, sus **ids** o su **ventana de tiempo**.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'q0pre_ui', conceptId: 'verificar_bd', question: 'La app muestra «Transferencia realizada». ¿Qué te dice eso de la base de datos?', options: ['Que todo se guardó bien', 'Nada seguro: hay que comprobarlo en la base de datos', 'Que el importe es correcto', 'Que hay auditoría'], correct: 1, explanation: 'La pantalla dice lo que la app cree.' },
      { id: 'q0pre_valores', conceptId: 'valores', question: 'Tu comprobación es `SELECT COUNT(*) … WHERE concepto = \'REF-1007\'` y da 1. ¿Qué has probado?', options: ['Que la transferencia es correcta', 'Solo que existe', 'Que tiene auditoría', 'Nada'], correct: 1, explanation: 'Faltan los valores.' },
      { id: 'q0pre_inv', conceptId: 'invariantes', question: '¿Qué es una invariante?', options: ['Un valor que nunca cambia', 'Una regla que tiene que cumplirse siempre, como «los apuntes suman cero»', 'Una columna NOT NULL', 'Un test de rendimiento'], correct: 1, explanation: 'Sirve para todas las pruebas a la vez.' },
      { id: 'q0pre_error', conceptId: 'efectos_error', question: 'La app da error en una transferencia. ¿Qué compruebas en la base de datos?', options: ['Nada: dio error', 'Que no se haya hecho de todas formas', 'Que el error esté en los logs', 'Que el saldo sea 0'], correct: 1, explanation: 'Si se hizo, el usuario la repetirá.' },
      { id: 'q0pre_sec', conceptId: 'efectos_secundarios', question: '¿Con qué buscas transferencias sin fila de auditoría?', options: ['JOIN auditoria', 'NOT EXISTS (SELECT 1 FROM auditoria …)', 'COUNT(*)', 'ORDER BY'], correct: 1, explanation: 'O LEFT JOIN … WHERE au.id IS NULL.' },
      { id: 'q0pre_aislar', conceptId: 'aislar', question: 'Ayer se lanzó otra ejecución sobre las mismas cuentas. ¿Qué haces?', options: ['Nada', 'Filtrar por los identificadores de tu ejecución', 'Borrar lo de ayer', 'Repetir la prueba'], correct: 1, explanation: 'Sin borrar nada: filtrando.' },
    ],
    post: [
      { id: 'q0post_left', conceptId: 'invariantes', question: 'Para encontrar transferencias sin ningún apunte, ¿qué JOIN usas?', options: ['JOIN apuntes', 'LEFT JOIN apuntes', 'CROSS JOIN apuntes', 'Da igual'], correct: 1, explanation: 'Con JOIN, la transferencia sin apuntes desaparece.' },
      { id: 'q0post_foto', conceptId: 'foto_antes', question: '¿Qué necesitas para saber cuánto cambió un saldo con la prueba?', options: ['Solo el saldo actual', 'El saldo de antes de la prueba', 'La auditoría', 'Los logs de la app'], correct: 1, explanation: 'Cambio = después − antes.' },
      { id: 'q0post_mezcla', conceptId: 'aislar', question: 'Sumas todos los apuntes de la cuenta 3 y no cuadra con el cambio de saldo. ¿Qué miras primero?', options: ['Que haya un defecto', 'Que no estés sumando apuntes de otra ejecución', 'Que falte un índice', 'Que el saldo sea negativo'], correct: 1, explanation: 'Primero descarta mezclar datos.' },
      { id: 'q0post_valor', conceptId: 'valores', question: 'La app pidió 30 € y se guardaron 300 €. ¿Cuál es la consulta que lo encuentra?', options: ['COUNT(*) de la referencia', 'JOIN por la referencia y t.importe <> e.importe', 'MAX(importe)', 'SUM(importe)'], correct: 1, explanation: 'Valor pedido frente a valor guardado.' },
      { id: 'q0post_error', conceptId: 'efectos_error', question: '¿Qué defecto produce una operación que da error en pantalla pero se hace en el servidor?', options: ['Ninguno', 'El usuario la repite y la paga dos veces', 'Que la app va lenta', 'Que falta un índice'], correct: 1, explanation: 'Y solo se ve en la base de datos.' },
      { id: 'q0post_cero', conceptId: 'verificar_bd', question: 'Tu consulta de comprobación devuelve cero filas. ¿Qué significa?', options: ['Que la consulta está mal', 'Que no hay ningún caso que incumpla la comprobación', 'Que la tabla está vacía', 'Que falta un permiso'], correct: 1, explanation: 'Cada fila sería un defecto.' },
    ],
  },

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Bienvenida a QA: R-0306',
      body: 'Buenos días y bienvenida al equipo.\n\nLlevas tres meses con Inés aprendiendo SQL. Ahora toca usarlo para **probar**. Esta mañana se ha lanzado la ejecución de pruebas **R-0306** contra la app: siete transferencias (tabla `ejecuciones`). La app dice que cinco fueron bien y dos dieron error.\n\nLo que la app dice no basta: hay que mirar qué quedó en la base de datos. Para empezar:\n\n- Las transferencias que hay en la base de datos con la **referencia** de alguna operación de **R-0306** como concepto: `id`, `concepto`, `importe` y `estado`.\n\nLaura',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'verificar_bd' }],
    },
    {
      id: 'laura_ok',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.transferencias_prueba' },
      body: 'Seis transferencias para siete operaciones. La REF-1005 dio error y no dejó nada, bien. Pero cuenta las que dieron error: ¿solo una no está?',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_importes',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! Estoy probando el cambio del teclado numérico de la app y me da miedo que se cuele algún cero. ¿Me sacas las operaciones de **R-0306** cuya transferencia se guardó con un **importe distinto** del que pidió la prueba? `referencia`, `importe_app` e `importe_bd`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'valores' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.importes_distintos' },
      body: 'REF-1007: 30 € en la app, 300 € guardados. ¡Ahí está el cero! Abro el defecto ahora mismo. Gracias.',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_apuntes',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Para Riesgos, la regla de oro: cada transferencia completada deja **dos apuntes** (uno negativo en el origen y otro positivo en el destino) que **suman cero**. ¿Me dices qué transferencias de **R-0306** no la cumplen? `transferencia_id`, `apuntes` y `suma`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'invariantes' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.partida_doble' },
      body: 'La 1003: un solo apunte de −75,50. El dinero sale de la cuenta 3 y no llega a la 12. Eso en producción es un problema serio. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'laura_existe',
      channel: 'meeting',
      from: 'laura',
      at: 120,
      subject: '11:00 · Laura: «la prueba automática está en verde»',
      body: '**Laura:** Rubén tiene una prueba automática para las transferencias. Después de cada operación «ok» lanza:\n\n`SELECT COUNT(*) FROM transferencias WHERE concepto = :referencia` y comprueba que da 1.\n\nCon R-0306 ha salido todo en verde. ¿Qué le dices?',
      onDeliver: [],
      choices: [
        {
          id: 'valores',
          text: 'Que solo comprueba que la fila **existe**. La REF-1007 existe… con 300 € en vez de 30. Una prueba tiene que comparar los **valores** que se pidieron (importe, cuentas, estado) con los guardados, y además las invariantes, como los apuntes.',
          cost: 10,
          reply: 'Exacto. «Existe» es la comprobación más débil que hay. Lo que el cliente ve es el importe.',
          effects: [
            { kind: 'flag', key: 'practice.valores' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Una comprobación compara valores, no solo que la fila exista.' },
          ],
        },
        {
          id: 'ok',
          text: 'Que está bien: si la transferencia se creó, la prueba ha pasado.',
          cost: 10,
          reply: '¿Y si se creó con otro importe, o en otra cuenta? La REF-1007 pasaría su prueba con un cero de más.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Diste por buena una prueba que solo mira si la fila existe.' }],
        },
        {
          id: 'ui',
          text: 'Que mejor compruebe el mensaje de la pantalla, que es lo que ve el cliente.',
          cost: 10,
          reply: 'La pantalla dijo «ok» en la REF-1007. Lo que guardó la base de datos es otra cosa.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Pusiste la pantalla por encima de lo que guarda la base de datos.' }],
        },
      ],
    },
    {
      id: 'nuria_error',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Cada semana me llama algún cliente: «la app me dio error, lo volví a intentar y me lo ha cobrado dos veces». ¿Puedes mirar si en **R-0306** pasa? Las operaciones que la app marcó como **error** pero que **sí** dejaron transferencia: `referencia`, `id` y `estado`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'efectos_error' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.error_pero_hecha' },
      body: 'REF-1004: error en la app y completada en la base de datos. Ya tengo con qué ir a Diego. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_auditoria',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. Cada alta de transferencia tiene que dejar su fila en `auditoria` (`tabla = \'transferencias\'`, `registro_id` = el id). He tocado ese código esta semana… ¿me dices qué transferencias de **R-0306** no la tienen? Una columna `id`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'efectos_secundarios' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.sin_auditoria' },
      body: 'La 1006. Es la única que sale de una cuenta de ahorro: se me olvidó ese camino. Lo arreglo. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_saldos',
      channel: 'chat',
      from: 'ines',
      at: 270,
      body: 'Hola, soy Inés, ¡qué bien verte en QA! A las 09:55, antes de R-0306, guardamos los saldos en `saldos_antes`. Para las cuentas con apuntes de **R-0306**, ¿cuáles tienen un **cambio de saldo** (saldo actual − saldo de antes) que **no coincide** con la **suma de sus apuntes de R-0306**? `cuenta_id`, `cambio_saldo` y `suma_apuntes`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'foto_antes' }, { kind: 'unlock', conceptId: 'aislar' }],
    },
    {
      id: 'ines_thanks',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.saldos_descuadrados' },
      body: 'Cuenta 9: el saldo subió 560 € y sus apuntes dicen 310. La 1002 se sumó dos veces. Bien visto.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_mezcla',
      channel: 'meeting',
      from: 'laura',
      at: 360,
      subject: '15:00 · Laura: «cuatro cuentas descuadradas»',
      body: '**Laura:** Rubén ha repetido lo de Inés a su manera, sumando **todos** los apuntes de cada cuenta:\n\n`SELECT a.cuenta_id, SUM(a.importe) … FROM apuntes a JOIN cuentas c … JOIN saldos_antes s … GROUP BY a.cuenta_id`\n\nY le salen descuadradas la 3, la 5, la 7 y la 9. Tú solo encontraste la 9. ¿Quién tiene razón?',
      onDeliver: [],
      choices: [
        {
          id: 'aislar',
          text: 'Que Rubén está sumando también los apuntes de **R-0305**, la ejecución de ayer sobre las mismas cuentas. Esos ya estaban en la foto de las 09:55, así que no deben contar. Hay que filtrar por la ejecución (sus referencias) o por la ventana de tiempo. Así, solo la 9 está mal.',
          cost: 10,
          reply: 'Eso es. En un entorno de pruebas compartido, lo primero es aislar tus datos. Si no, persigues fantasmas.',
          effects: [
            { kind: 'flag', key: 'practice.aislar' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Filtra siempre por los datos de tu ejecución.' },
          ],
        },
        {
          id: 'ruben',
          text: 'Que Rubén: si los saldos no cuadran con los apuntes, están mal.',
          cost: 10,
          reply: 'Los apuntes de ayer ya estaban en el saldo de antes. Contarlos otra vez crea descuadres que no existen.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Diste por defectos los efectos de otra ejecución.' }],
        },
        {
          id: 'repeat',
          text: 'Que hay que borrar la base de datos de pruebas y repetir R-0306.',
          cost: 10,
          reply: 'Perderíamos la evidencia de los defectos y no se arregla nada. Basta con filtrar.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Propusiste borrar en vez de aislar tus datos.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Cierre del día con Laura',
      body: '**Laura:** Primer día en QA y cinco defectos encontrados en una ejecución «en verde». ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que la pantalla no es el oráculo: hay que mirar la base de datos. Comprobar valores y no solo existencia, las invariantes (apuntes que suman cero, saldos que cuadran), que lo que falla no deje nada y que estén los efectos secundarios como la auditoría. Y siempre con los datos de mi ejecución.',
          reply: 'Muy bien. Mañana, los casos que nadie prueba: los bordes.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'ui',
          text: 'Que si la app dice «ok» y la fila existe, la prueba está bien.',
          reply: 'Hoy eso habría dejado pasar cinco defectos. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con que basta la pantalla y que la fila exista.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
