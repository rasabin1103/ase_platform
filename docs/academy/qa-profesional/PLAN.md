# Curso 2 · QA Profesional: del testing a la calidad del equipo

> Preparación ISTQB® CTFL v4.0 · Nivel intermedio · Simulador · 9 misiones + simulacro de examen
> Clave del curso: `qa-profesional` · Mundo: Kobalto (seis meses después del curso 1)

ISTQB® y Certified Tester son marcas registradas. Este curso es una **preparación para el examen** alineada con el temario CTFL v4.0; no es formación oficial acreditada.

## 1. Posicionamiento

| | Curso 1 · Fundamentos de Testing | Curso 2 · QA Profesional |
|---|---|---|
| Nivel | Principiante | Intermedio |
| Rol del jugador | QA Junior que ejecuta y reporta | QA del squad que monta y dirige el proceso de calidad |
| Foco | Técnicas de caja negra, riesgo, defectos, release, incidente | Proceso, revisiones, test-first, caja blanca, experiencia, planificación, métricas, configuración, herramientas |
| Cierre | Postmortem del incidente | Simulacro de examen CTFL puntuado en servidor |

Juntos cubren el temario CTFL completo (ver §5). El curso 2 se puede jugar sin el 1, pero repasa sus técnicas en las misiones y en el simulacro.

## 2. Historia y personajes

Seis meses después, Kobalto lanza **Kobalto Empresas** (cuentas para autónomos y pymes: facturas, cobros y tarjetas de equipo). El jugador ya no es junior: le asignan el squad nuevo, donde no hay proceso de QA, y tiene que montarlo.

| Personaje | Rol | Papel en el curso |
|---|---|---|
| **Elena Prieto** (nueva) | Product Owner · Empresas | Historias, criterios de aceptación, presión de plazos |
| **Tomás Ferrer** (nuevo) | Desarrollador senior | Código, revisiones, «mis tests ya cubren todo» |
| **Sofía Reyes** (nueva) | Desarrolladora junior | Escribe sus primeros tests unitarios; aliada en TDD |
| **Raúl Ortega** | Engineering Manager | Plan, estimación, informes, presupuesto de herramientas |
| **Laura Méndez** | QA Lead (ahora compañera) | Mentora puntual: microlecciones y revisión |
| **Iván Torres** | Plataforma / DevOps | Entornos, versiones, CI |
| **Carmen López** | Riesgos y Compliance | Auditoría de la trazabilidad y de las revisiones |

## 3. Las misiones

Formato común (heredado del curso 1):
- Jornada de 8 horas con escenas y decisiones.
- Herramientas del escritorio.
- Microlecciones de Laura.
- Test antes y después (6 + 6, ahora con preguntas de estilo examen).
- Debrief con «qué habría hecho un QA senior».
- Cada pregunta y cada concepto se etiqueta con su sección del temario (p. ej. `CTFL 4.3`).

### Misión 0 · Equipo nuevo (gratuita)
- **Temario:** 1.4 actividades, testware y roles · 1.5 habilidades, *whole team*, independencia · 2.1 testing en el SDLC.
- **Premisa:** primer día en el squad Empresas. Cada uno prueba a su manera y nadie sabe qué está probado. Raúl pide en una semana una propuesta de proceso.
- **Mecánica nueva · Mapa del proceso:** arrastrar las 7 actividades (planificación, seguimiento y control, análisis, diseño, implementación, ejecución, cierre) a su orden y asignar a cada una su **testware** (plan, condiciones, casos, procedimientos, datos, informes) y su **rol** (gestión de pruebas o tester).
- **Trazabilidad:** enlazar historias, condiciones, casos y defectos. Más tarde Carmen pide un informe que solo sale si la trazabilidad está bien.
- **Trampas:**
  - Tomás propone «el dev prueba su propio código y ya»; hay que defender la independencia sin romper el *whole team*;
  - una actividad olvidada (el cierre) hace que no se aprenda nada del sprint anterior.
- **Consecuencia:** el proceso que montes se reutiliza como contexto en las misiones siguientes (flag de continuidad).

### Misión 1 · La inspección
- **Temario:** 3.1 fundamentos de testing estático · 3.2 feedback temprano, proceso de revisión, tipos y roles, factores de éxito.
- **Premisa:** la especificación de «Facturación recurrente» va a desarrollo el lunes. Carmen exige una revisión formal por cumplimiento normativo.
- **Mecánica nueva · Sala de revisión:**
  - elegir el **tipo de revisión** adecuado (informal, walkthrough, técnica o inspección) según el objetivo;
  - asignar **roles** (autor, moderador, escriba, revisores, líder de revisión);
  - preparar con checklist;
  - marcar defectos en el documento, que reutiliza el motor de revisión del curso 1 ampliado con severidad y página;
  - registrar y hacer seguimiento.
- **Trampas:**
  - Tomás, autor del documento, se pone a la defensiva («esto no es un defecto»);
  - elegir walkthrough para un documento regulatorio no satisface a Carmen;
  - revisar sin preparación individual deja defectos sin encontrar.
- **Consecuencia:** los defectos no encontrados aparecen como bugs en la misión 2.

### Misión 2 · Dado, cuando, entonces
- **Temario:** 2.1 enfoques test-first (TDD, ATDD, BDD) · 4.5 historias de usuario (3C), criterios de aceptación, ATDD.
- **Premisa:** sesión de **tres amigos** (PO, dev, QA) para «Cobro por enlace de pago». Lo que se acuerde hoy es lo que se automatiza.
- **Mecánica nueva · Editor de escenarios Gherkin:**
  - escribir criterios de aceptación y escenarios (Dado/Cuando/Entonces, Esquema de escenario con ejemplos);
  - el motor evalúa si son verificables, si cubren las reglas y los casos negativos y si los ejemplos tocan los bordes.
- **Paralelo TDD:** ayudar a Sofía a escribir el test antes del código de una regla (ciclo rojo, verde, refactor).
- **Trampas:**
  - escenarios con varios Cuando, pasos de interfaz («hago clic en…») en lugar de comportamiento, criterios no verificables;
  - Elena quiere «el caso feliz y ya».
- **Consecuencia:** el prototipo se construye a partir de tus escenarios: lo que no especificaste, se implementa mal (bugs sembrados que dependen de la calidad de los escenarios).

### Misión 3 · Dentro del código
- **Temario:** 4.3 caja blanca: cobertura de sentencias y de ramas, valor de la caja blanca · 2.2 nivel de componente.
- **Premisa:** Tomás asegura que «los tests unitarios cubren todo». El módulo de cálculo de IVA e IRPF de las facturas tiene un bug en producción que nadie encuentra.
- **Mecánica nueva · Visor de código con cobertura:**
  - pseudo-código legible con sentencias y ramas resaltadas (verde ejecutada, rojo no);
  - el jugador añade casos (entradas) y ve cómo cambian la **cobertura de sentencias** y la **de ramas**;
  - el bug vive en la rama `else` de una condición que ningún test ejecuta.
- **Aprendizajes clave:**
  - 100 % de sentencias no implica 100 % de ramas;
  - la cobertura mide lo ejecutado, no lo comprobado (un test sin aserción también «cubre»).
- **Trampas:**
  - Tomás enseña «92 % de cobertura» como prueba de calidad;
  - un test que cubre la rama pero no comprueba el resultado.

### Misión 4 · Intuición experta
- **Temario:** 4.4 técnicas basadas en la experiencia: predicción de errores (*error guessing*), pruebas exploratorias (sesiones, *charters*) y basadas en listas de comprobación.
- **Premisa:** la app de tarjetas de equipo llega con poca documentación y hay que probarla hoy.
- **Mecánica nueva · Sesión exploratoria:**
  - escribir un *charter* (misión, áreas, tiempo);
  - explorar la app bajo prueba con tiempo limitado;
  - tomar notas;
  - cerrar con un informe de sesión.
- **Error guessing:** un catálogo de ataques típicos (campos vacíos, doble clic, volver atrás, sesión caducada, caracteres especiales…). Los ataques bien elegidos encuentran los bugs sembrados.
- **Checklist:** usar y mejorar la checklist del equipo (que se queda corta).
- **Trampas:**
  - explorar sin *charter* gasta el tiempo sin cobertura;
  - una checklist seguida a ciegas no ve lo nuevo.

### Misión 5 · El plan
- **Temario:** 5.1 plan de pruebas, contribución a la planificación de release e iteración, criterios de entrada y salida, estimación (por ratios, extrapolación, Wideband Delphi y tres puntos), priorización de casos, pirámide y cuadrantes de testing · 5.2 riesgos de producto y de proyecto, análisis y control del riesgo.
- **Premisa:** Raúl necesita el plan de pruebas de la release de Empresas y una estimación defendible para el comité.
- **Mecánica nueva · Planificador:**
  - redactar el plan por secciones (alcance, enfoque, criterios de entrada y salida, riesgos, calendario);
  - estimar con **tres puntos** (optimista, probable, pesimista) y con datos históricos;
  - sesión de **Wideband Delphi** con el equipo;
  - priorizar casos por riesgo y dependencias;
  - colocar las pruebas en los **cuadrantes de testing**.
- **Trampas:**
  - Raúl recorta la estimación a la mitad: aceptar sin cambiar el alcance frente a negociar alcance o riesgo;
  - confundir riesgo de proyecto (el proveedor de firma electrónica llega tarde) con riesgo de producto.
- **Consecuencia:** si la estimación no se defiende, el sprint se desborda en la misión 6.

### Misión 6 · Números que cuentan
- **Temario:** 5.3 seguimiento, control y cierre: métricas, informes de progreso y de cierre, comunicación del estado · 1.4 cierre de pruebas.
- **Premisa:** mitad del sprint. Raúl quiere un informe de progreso para dirección; al final del día, el informe de cierre.
- **Mecánica nueva · Panel de métricas:**
  - elegir qué métricas reportar (avance de ejecución, defectos por severidad y estado, cobertura de requisitos, riesgo residual);
  - detectar las engañosas: 100 % de casos pasados con solo el 40 % de requisitos cubiertos, o defectos «cerrados» como no reproducibles;
  - redactar el informe para su audiencia (dirección frente a equipo).
- **Control:** decidir acciones correctoras (repriorizar, añadir recursos, renegociar criterios).
- **Trampas:** maquillar los números; reportar volumen en lugar de riesgo.

### Misión 7 · ¿Qué versión es?
- **Temario:** 5.4 gestión de la configuración · 2.3 pruebas de mantenimiento: disparadores, análisis de impacto · 5.5 gestión de defectos (repaso del informe de defecto).
- **Premisa:** un bug «imposible»: Elena lo ve en staging, Tomás no lo reproduce y el fix «ya estaba subido». Además, una migración del proveedor de facturación electrónica obliga a hacer mantenimiento.
- **Mecánica nueva · Trazador de configuración:**
  - comparar entornos (versión de app, API, esquema de base de datos, flags, datos);
  - encontrar el elemento sin control de versiones (un fichero de configuración tocado a mano);
  - identificar qué build hay que probar.
- **Mantenimiento:** análisis de impacto de la migración para decidir qué regresión ejecutar (reutiliza TestHub del curso 1).
- **Trampas:**
  - probar el build equivocado y cerrar un fix que no estaba desplegado;
  - regresión completa por miedo en lugar de por impacto.

### Misión 8 · Herramientas
- **Temario:** 6.1 soporte de herramientas (gestión, estático, diseño e implementación, ejecución y cobertura, no funcional, DevOps, colaboración) · 6.2 beneficios y riesgos de la automatización.
- **Premisa:** Raúl tiene presupuesto para herramientas del squad. Tres proveedores hacen demos y Sergio (QA Automation) empuja por la suya.
- **Mecánica nueva · Selección de herramientas:**
  - clasificar las necesidades del squad por categoría;
  - evaluar candidatas (encaje, coste total, curva de aprendizaje, integración, soporte);
  - proponer un piloto con criterios de éxito.
- **Trampas:**
  - expectativas irreales («automatizamos todo en un mes»);
  - ignorar el coste de mantenimiento de los scripts;
  - dependencia de un proveedor;
  - herramienta que no se integra con el CI.
- **Cierre del curso:** retro con el squad sobre lo construido en las 9 misiones.

### Final · Simulacro de examen CTFL
- **Formato del examen real** (CTFL v4.0): 40 preguntas de opción múltiple, 60 minutos (75 si no es tu idioma nativo), aprobado con 26 (65 %).
- **Banco de preguntas propio:**
  - **Origen:** escritas para el curso, nunca copiadas de exámenes oficiales.
  - **Etiquetas:** cada pregunta lleva capítulo, sección y nivel K (K1 recordar, K2 entender, K3 aplicar).
  - **Reparto por capítulo**, como el examen: 1 → 8 · 2 → 6 · 3 → 4 · 4 → 11 · 5 → 9 · 6 → 2.
- **Puntuación en servidor:** las respuestas correctas no viajan al navegador. Al acabar hay un informe por capítulo con las secciones a repasar, que enlaza a la misión y a la microlección correspondientes.
- **Varios simulacros distintos** generados del banco, con reintentos.
- **Certificado de finalización ASE** (no oficial ISTQB) al aprobar el simulacro y completar las misiones.
- **Uso en el curso 1:** sirve también como «evaluación final» del curso 1 (con su propio filtro de capítulos).

## 4. Qué hay que construir

| Pieza | Misiones | Reutiliza | Nuevo |
|---|---|---|---|
| Mapa del proceso (actividades, testware, roles, trazabilidad) | 0 | Motor de escenas y flags | Herramienta de arrastrar y enlazar |
| Sala de revisión | 1 | Revisión de requisitos del curso 1 | Tipos y roles de revisión, registro de defectos con seguimiento |
| Editor Gherkin | 2 | Diseño de pruebas | Evaluador de escenarios y prototipo que depende de ellos |
| Visor de cobertura | 3 | App bajo prueba | Intérprete de pseudo-código con cobertura de sentencias y ramas |
| Sesión exploratoria | 4 | Apps de Kobalto, TestHub | *Charter*, temporizador, catálogo de ataques |
| Planificador y estimación | 5 | Matriz de riesgos | Plan por secciones, tres puntos, Wideband Delphi, cuadrantes |
| Panel de métricas | 6 | Debrief y TestHub | Métricas, informes por audiencia |
| Trazador de configuración | 7 | Observabilidad, TestHub | Comparador de entornos |
| Selección de herramientas | 8 | — | Matriz de evaluación y piloto |
| Simulacro de examen | Final | Test antes y después | Banco de preguntas en servidor, informe por capítulo, certificado |

Backend: tablas de banco de preguntas e intentos de examen, endpoint de corrección y emisión de certificado. El resto (progreso, acceso, opiniones) ya existe.

## 5. Cobertura del temario CTFL v4.0 (cursos 1 + 2)

| Sección | Curso 1 | Curso 2 |
|---|---|---|
| 1.1–1.3 Qué es, por qué, principios | M0 | Repaso en M0 y simulacro |
| 1.4 Actividades, testware y roles | Parcial | **M0**, M6 |
| 1.5 Habilidades, *whole team*, independencia | Parcial | **M0** |
| 2.1 SDLC, test-first, DevOps, shift-left, retros | Parcial | **M0, M2** |
| 2.2 Niveles y tipos | M6 | M3 (componente) |
| 2.3 Mantenimiento | Parcial | **M7** |
| 3.1 Estático | M1 | M1 |
| 3.2 Proceso de revisión | Parcial | **M1** |
| 4.1–4.2 Técnicas y caja negra | M0–M3 | Repaso en M2 y simulacro |
| 4.3 Caja blanca | — | **M3** |
| 4.4 Basadas en la experiencia | Parcial | **M4** |
| 4.5 Basadas en colaboración | Parcial | **M2** |
| 5.1 Planificación | Parcial | **M5** |
| 5.2 Riesgo | M0–M5 | M5 |
| 5.3 Seguimiento, control y cierre | Parcial | **M6** |
| 5.4 Configuración | — | **M7** |
| 5.5 Defectos | M4 | M7 |
| 6.1–6.2 Herramientas y automatización | Parcial | **M8** |

## 6. Orden de construcción propuesto

1. **Simulacro de examen y banco de preguntas** (sirve a los dos cursos y es lo que más vende a quien prepara el CTFL).
2. ~~M3 Dentro del código~~ ✅ (hecha: `missions/m03-cobertura.md`) y ~~M2 Dado, cuando, entonces~~ ✅ (hecha: `missions/m02-gherkin.md`) (las más diferenciales).
3. ~~M0 Equipo nuevo~~ ✅ (hecha: `missions/m00-equipo.md`, demo gratuita), ~~M1~~ ✅ (hecha: `missions/m01-inspeccion.md`), ~~M4~~ ✅ (hecha: `missions/m04-exploratoria.md`).
4. ~~M5~~ ✅ (hecha: `missions/m05-plan.md`), **M6, M7, M8.**
5. Registro del curso en el catálogo (`academy_course_key = qa-profesional`) cuando haya al menos M0 y el simulacro jugables.
