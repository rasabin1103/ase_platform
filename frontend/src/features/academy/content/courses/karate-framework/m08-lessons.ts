import type { Lesson } from '../../../engine/types'

/** Microlecciones de Sergio (curso de Karate · misión 9). */
export const m08Lessons: Lesson[] = [
  {
    id: 'runner',
    question: '¿Cómo hago que el pipeline falle si falla un test?',
    conceptId: 'runner',
    cost: 5,
    body: `Para CI se usa un runner JUnit 5 con \`Runner\`:
\`\`\`
Results results = Runner.path("classpath:openapi")
        .tags("~@ignore")
        .parallel(4);
assertEquals(0, results.getFailCount(), results.getErrorMessages());
\`\`\`
\`parallel(n)\` ejecuta y **devuelve** los resultados; no hace fallar nada por sí solo. Sin el \`assertEquals\`, el test JUnit pasa siempre y Maven dice **BUILD SUCCESS** aunque haya escenarios en rojo. Necesita \`import static org.junit.jupiter.api.Assertions.*;\`.`,
  },
  {
    id: 'tags',
    question: '¿Cómo elijo qué escenarios ejecuta cada job?',
    conceptId: 'runner',
    cost: 3,
    body: `Con **tags**: \`@smoke\` en la línea de antes de \`Scenario:\` (o de \`Feature:\`, para todo el fichero).
- \`.tags("@smoke")\`: solo los marcados.
- \`.tags("@smoke,@critico")\`: uno **u** otro (coma = O).
- \`.tags("@pagos", "~@lento")\`: con @pagos **y** sin @lento (cada argumento se suma).

El smoke de cada PR es corto: lo imprescindible (la API responde, una lectura, un error típico) y nada que espere segundos.`,
  },
  {
    id: 'paralelo',
    question: '¿Qué cambia al ejecutar en paralelo?',
    conceptId: 'paralelo',
    cost: 5,
    body: `Los escenarios se reparten entre hilos y se ejecutan **a la vez** contra la misma API, y el orden cambia en cada ejecución.

Un escenario que lee o cambia datos que otro también toca (el saldo de ACC-1001, «la última transferencia», un contador) pasará o fallará según quién llegue antes. La solución es que cada escenario **cree sus propios datos** (\`POST /sandbox/accounts\`) y compruebe solo lo suyo.`,
  },
  {
    id: 'flaky',
    question: '¿Qué hago con un test que falla «a veces»?',
    conceptId: 'flaky',
    cost: 5,
    body: `Un test inestable (*flaky*) tiene una causa. Las habituales:
- **Datos compartidos** o dependencia del orden → datos propios por escenario.
- **Esperas fijas** en procesos asíncronos → \`retry until\`.
- **La API** se comporta distinto con carga o concurrencia → es un **bug**: repórtalo.

Reintentar hasta que pase o marcarlo \`@ignore\` esconde las tres. Pista: si el escenario, ejecutado solo, pasa siempre, mira qué estaba pasando a la vez.`,
  },
  {
    id: 'informes',
    question: '¿Qué informes genera Karate?',
    conceptId: 'runner',
    cost: 3,
    body: `Siempre, el **HTML** en \`target/karate-reports/karate-summary.html\` (el que miras cuando algo falla).

Para otras herramientas, en el \`Runner\`:
- \`.outputCucumberJson(true)\`: JSON de Cucumber (Xray, Allure, plugins de Jenkins).
- \`.outputJunitXml(true)\`: XML de JUnit (lo que leen casi todos los CI).

Ve antes de \`.parallel(…)\`, que es lo que lanza la ejecución.`,
  },
]
