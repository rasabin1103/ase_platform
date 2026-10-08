# ASE Academy — Plan del curso-juego de simulación

> Estado: borrador v0.3 · Autor: Roberto Arce Sabín · Fecha: 2026-10-05
> Decisión de arquitectura asociada: [ADR 0012](../adr/0012-academy-simulation-game-inside-platform.md)

## 1. Visión

Cursos que se **viven** en lugar de leerse. El alumno entra a trabajar en una empresa ficticia y aprende tomando decisiones reales de su oficio. Cada decisión tiene consecuencias, unas inmediatas y otras que aparecen semanas (de juego) después. Al terminar cada misión, un debrief conecta lo que pasó con la teoría.

El primer curso es **Fundamentos de Testing**. El motor es genérico: un curso nuevo (automatización, QA management, agile, etc.) es **contenido nuevo, no código nuevo**.

## 2. Principios de diseño

1. **Decisiones antes que gráficos.** El valor está en elegir bajo presión, no en el entorno visual. Nada de 3D en el MVP (ver ADR 0012).
2. **Consecuencias diferidas.** Lo que se salta hoy vuelve mañana. Es lo que más enseña y lo que un curso tradicional no puede simular.
3. **Realismo de oficio.** El jugador usa herramientas que imitan las reales (tickets, chat, correo, la app a probar), con requisitos ambiguos, prisas y personas con intereses distintos.
4. **No hay una sola respuesta correcta.** Se evalúan competencias (rigor, comunicación, gestión de riesgo), no aciertos de test.
5. **Aprender haciendo y luego nombrarlo.** Primero el jugador lo vive y después el debrief le da el nombre técnico (valores límite, testing basado en riesgos, etc.).
6. **Rejugable.** Repetir una misión con otras decisiones muestra otros caminos, y eso refuerza el aprendizaje.

## 3. Modelo de plataforma: muchos cursos, varios niveles

ASE Academy es una **plataforma de cursos-juego**, no un juego único. El curso de testing es solo el primer contenido. Desde el diseño del motor y de los datos tiene que permitir añadir cursos de cualquier tema y nivel sin tocar el motor.

### 3.1 Jerarquía de contenido

```
Área (track)          p. ej. Quality Engineering, Desarrollo, Agile, Gestión
└── Ruta (path)       p. ej. "De QA Junior a QA Lead"
    └── Curso         p. ej. Fundamentos de Testing · nivel principiante
        └── Misión    unidad jugable de 20–40 min
            └── Escena    decisión o interacción concreta
```

- Un **curso** pertenece a un área, tiene un **nivel** y puede formar parte de una o varias **rutas**.
- Se reutilizan campos que ya existen en `CatalogItem`: `level` (`beginner` / `intermediate` / `advanced`), `category` (área) y `series_name` + `series_order` (ruta y orden). No hacen falta tablas nuevas para eso.

### 3.2 Niveles

| Nivel | Rol del jugador | Tipo de decisiones | Ejemplos de cursos |
|---|---|---|---|
| **Principiante** | QA junior | Técnicas básicas, con ayudas y pistas | Fundamentos de Testing, Testing de APIs desde cero |
| **Intermedio** | QA / SDET | Diseño de estrategia en un feature, automatización, menos ayudas | Automatización UI con Playwright, Testing de APIs con Karate, Testing en CI/CD |
| **Avanzado** | QA Lead / Arquitecto | Estrategia de equipo, arquitectura de pruebas, presupuesto, conflicto entre áreas | Estrategia QA para microservicios, Quality gates y release governance |
| **Experto / gestión** | QA Manager / Head | Organización, métricas, personas, negociación con negocio | QA Management, Transformación de QA |

Los niveles se notan en el juego:

- **Ayudas:** pistas y explicaciones inmediatas en principiante; ninguna en avanzado.
- **Ambigüedad y presión:** más NPCs con intereses en conflicto y menos tiempo cuanto más alto el nivel.
- **Alcance de las decisiones:** de un caso de prueba a la estrategia de toda una organización.
- **Evaluación:** más peso a las competencias de gestión y comunicación en niveles altos.

Además, dentro de un mismo curso se puede ofrecer un **modo de dificultad** (guiado o realista) como parámetro del motor, sin duplicar contenido.

### 3.3 Prerrequisitos y progresión

- Un curso puede declarar **prerrequisitos** (otros cursos o una prueba de nivel). Son recomendaciones, no bloqueos duros: un usuario con experiencia puede saltar con una **prueba de nivel** corta.
- **Progresión de carrera transversal:** el perfil del alumno sube de rango (Junior → QA → Senior → Lead → Manager) al completar cursos de una ruta.
- **Mundo compartido:** los cursos de una misma ruta pueden ocurrir en la misma empresa ficticia con los mismos personajes, y el jugador "asciende" de un curso al siguiente. Cada curso sigue funcionando por sí solo para quien entre directamente en él.

### 3.4 Motor genérico y herramientas como módulos

Cada curso declara en su `course.yaml` qué **herramientas** del escritorio usa. El motor solo carga esas (lazy loading).

| Herramienta | Cursos que la usan |
|---|---|
| Tickets, chat, correo, bug report | Prácticamente todos |
| App bajo prueba con bugs sembrados | Testing manual y funcional |
| Editor de casos de prueba | Fundamentos, diseño de pruebas |
| Cliente de API (tipo Postman) | Testing de APIs |
| Editor de código con ejecución simulada | Automatización |
| Pipeline CI/CD simulado | CI/CD, quality gates |
| Dashboard de métricas | Gestión, avanzado |
| Hoja de presupuesto / planificación | Gestión |

- Añadir un curso de un tema ya cubierto = **solo contenido**.
- Añadir un tema nuevo puede necesitar **una herramienta nueva**: se programa una vez como módulo con un contrato común (`ToolModule`: estado, acciones, eventos que emite al motor) y queda disponible para todos los cursos siguientes.
- Las **apps bajo prueba** también son módulos reutilizables (SkyRoute, una tienda online, un banco…), con bugs que se activan según el curso y el nivel.

### 3.5 Formato de un curso

```yaml
# content/academy/testing-fundamentals/course.yaml
key: testing-fundamentals
version: 1.0.0
track: quality-engineering
level: beginner
paths: [qa-junior-to-lead]
order_in_path: 1
prerequisites: []
estimated_hours: 6
world: skyroute            # pack de mundo intercambiable
realism: { events: medium, noise: low }   # intensidad de imprevistos y ruido
player_role: qa-junior
tools: [tickets, chat, email, test-case-editor, bug-report, release-panel]
apps_under_test: [skyroute-booking]
competencies: [rigor, communication, risk, efficiency]
difficulty_modes: [guided, realistic]
languages: [es, en]
missions:
  - m00-first-day
  - m01-ambiguous-story
  # …
final_exam: server   # preguntas y puntuación solo en backend
```

Un **validador de contenido** (zod y un script de CI) comprueba en cada build que referencias, herramientas, condiciones y misiones de todos los cursos sean coherentes.

### 3.6 Publicación de cursos

- **MVP:** los cursos viven en el repositorio (`content/academy/`) y se publican con el despliegue normal. Es lo más simple y deja el contenido bajo control de versiones.
- **Más adelante:** paquetes de curso versionados que un admin puede subir y publicar desde el panel (borrador → revisión → publicado), sin redeploy. Esto permitiría también autores externos.
- En ambos casos, cada partida guarda la **versión de contenido** con la que empezó.

### 3.7 Catálogo inicial propuesto

| Área | Principiante | Intermedio | Avanzado / gestión |
|---|---|---|---|
| Quality Engineering | **Fundamentos de Testing** (curso 1) · Testing de APIs desde cero | Automatización UI · APIs con Karate · Testing en CI/CD | Estrategia QA para microservicios · QA Management |
| Desarrollo | Git y trabajo en equipo | Code review y deuda técnica | Arquitectura y decisiones técnicas |
| Agile / Producto | Scrum en la práctica | Refinamiento e historias de usuario | Gestión de releases y stakeholders |

Es orientativo. El orden real dependerá de la demanda medida con el primer curso.

### 3.8 Capa de realismo

Lo que hace que el alumno sienta que está trabajando y no haciendo un test es el **contexto real** alrededor de cada decisión. Esa capa también es contenido configurable y reutilizable, no código.

**Qué se puede añadir**

| Elemento | Ejemplos |
|---|---|
| **Mundo y empresa** | Sector (aerolínea, banca, e-commerce, salud), tamaño, cultura (startup caótica o corporación con procesos), organigrama, normativa del sector (PCI-DSS en pagos, RGPD, accesibilidad) |
| **Personajes con personalidad** | Objetivos propios, tono, humor, memoria de lo que el jugador les hizo, disponibilidad (vacaciones, otra zona horaria) |
| **Rutina del día a día** | Dailies, refinamientos, retros, reuniones que se alargan, interrupciones por chat, cambios de prioridad a mitad de sprint |
| **Imprevistos** | Entorno de pruebas caído, datos de prueba corruptos, un dev de baja, el cliente adelanta la fecha, dependencia de otro equipo bloqueada |
| **Artefactos realistas** | Logs, stack traces, respuestas HTTP, capturas, actas de reunión, correos largos con la información importante escondida, documentación desactualizada |
| **Factor humano** | Cansancio y estrés del jugador, presión del manager, reconocimiento o críticas del equipo, conflictos entre compañeros |
| **Casos inspirados en hechos reales** | Incidentes y situaciones basados en experiencia real de proyectos, anonimizados y con empresas ficticias |
| **Tiempo y calendario** | Días de la semana, festivos, fin de trimestre, cierre de release el viernes por la tarde |

**Cómo se implementa**

- **Packs de mundo** (`content/academy/worlds/`): empresa, sector, personajes, normativa y estilo de artefactos. Un mismo curso se puede jugar en otro mundo (por ejemplo, Fundamentos de Testing en una aerolínea o en un banco) para dar variedad o adaptarlo al sector de un cliente B2B.
- **Barajas de eventos** (`events/`): imprevistos con condiciones de aparición, probabilidad y efectos. El motor saca eventos durante la misión con la semilla de la partida, así que dos partidas no son iguales pero cada una es reproducible.
- **Plantillas de artefactos**: logs, correos o stack traces generados a partir de plantillas con datos del mundo, para no escribirlos a mano uno por uno.
- **Nivel de realismo configurable** por curso y por modo de dificultad: en principiante hay pocos imprevistos y señales claras; en avanzado hay ruido, información contradictoria y varias crisis a la vez.
- **Guía de autor de realismo**: checklist para que cada misión incluya al menos una interrupción, un artefacto real y una tensión entre personajes.
- **Más adelante:** NPCs con diálogo generado por IA dentro de límites definidos (personalidad, lo que saben, lo que no pueden revelar), para conversaciones más naturales sin perder el control del guion.

Ejemplo de evento:

```yaml
# content/academy/worlds/skyroute/events/env-down.yaml
id: env.staging_down
when: { mission_phase: execution, not_flag: env.backup_known }
probability: 0.3
tool: chat
speaker: devops
text: "Staging está caído, lo levantamos en ~2 h. Perdón 🙏"
effects:
  - { metric: time_left, add: -2 }
choices:
  - id: wait
    text: "Espero y aprovecho para preparar casos."
    effects: [{ score: efficiency, add: 1 }]
  - id: test_in_dev
    text: "Pruebo en el entorno de desarrollo mientras tanto."
    effects: [{ score: risk, add: -1 }, { schedule: bug.env_mismatch, in_missions: 1 }]
```

## 4. Concepto del juego

**Premisa (curso 1):** el jugador es QA junior en *SkyRoute*, una startup ficticia que desarrolla una app de reserva de vuelos. Tiene un sprint, un equipo y una release que salir.

### Bucle principal (por misión)

```
Briefing → Trabajo en el "escritorio" → Decisiones → Consecuencias → Debrief → Progreso
              ▲                                                  │
              └──────── eventos diferidos de misiones previas ◄──┘
```

### Sistemas de juego

| Sistema | Qué representa | Ejemplo |
|---|---|---|
| **Tiempo** | Horas disponibles en el sprint; cada acción consume horas | Probar a fondo el pago cuesta 6 h de un total de 20 |
| **Métricas del proyecto** | Calidad, deuda técnica, bugs escapados, velocidad | Saltarse la regresión sube la velocidad y aumenta el riesgo de bugs escapados |
| **Relaciones** | Confianza de PO, devs y manager | Un bug report vago baja la confianza del dev |
| **Conocimiento** | Técnicas desbloqueadas que abren nuevas opciones | Aprender valores límite desbloquea la acción "probar límites" |
| **Eventos diferidos** | Consecuencias programadas para misiones futuras | Incidente en producción dos sprints después |
| **Evaluación** | Puntuación por competencia, visible en el debrief | Rigor 4/5 · Comunicación 2/5 · Riesgo 3/5 |

Unas métricas son visibles (tiempo, estado de la release) y otras ocultas (riesgo real), igual que en la vida real.

## 5. El "escritorio": herramientas simuladas

| Herramienta | Uso en el juego |
|---|---|
| **Tablero de tickets** (tipo Jira) | Historias de usuario, criterios de aceptación y bugs reportados |
| **Chat de equipo** | Conversaciones con NPCs (PO, devs, manager) con respuestas por elección |
| **Correo** | Peticiones, escalados, comunicaciones de incidentes |
| **App bajo prueba** | Mini app real e interactiva (reserva de vuelos) con **bugs sembrados** que el jugador debe encontrar usándola |
| **Editor de casos de prueba** | El jugador diseña casos (entradas y resultado esperado); el motor evalúa su cobertura |
| **Formulario de bug report** | Título, pasos, esperado/obtenido, severidad y prioridad; se evalúa la calidad |
| **Panel de release** | Decisión go/no-go con la información disponible |

La **app bajo prueba** es lo que diferencia el producto: el jugador encuentra los bugs de verdad en vez de elegirlos de una lista.

## 6. Currículo del curso 1: Fundamentos de Testing

Alineado de forma orientativa con el temario ISTQB Foundation, sin pretender ser una preparación oficial.

| # | Misión | Lo que aprende | Mecánica principal | Consecuencia típica |
|---|---|---|---|---|
| 0 | **Primer día** | Qué es testing, los 7 principios, rol de QA | Onboarding guiado por el escritorio | — |
| 1 | **La historia ambigua** | Testing estático, revisión de requisitos | Detectar ambigüedades y preguntar al PO antes del desarrollo | Si no pregunta, el feature se construye mal y hay rework en la misión 3 |
| 2 | **El formulario de pasajeros** | Particiones de equivalencia, valores límite | Diseñar casos en el editor y ejecutarlos en la app | Bugs de límites no detectados reaparecen en producción |
| 3 | **Estados de un pago** | Tablas de decisión, transición de estados | Probar transiciones válidas e inválidas de un cobro en la consola de operaciones y la tabla de comisiones | Devoluciones de dinero no cobrado o duplicadas si no se prueban las inválidas |
| 4 | **Reportar como un profesional** | Bug reports, severidad vs prioridad | Escribir reports que el dev pueda reproducir | Reports vagos: bug cerrado como "no reproducible" y menos confianza |
| 5 | **Viernes de release** | Testing basado en riesgos, regresión, go/no-go | Poco tiempo: priorizar qué probar y defender la decisión ante el manager | Release con riesgo: incidente en la misión 7 |
| 6 | **La pirámide** | Niveles y tipos de prueba, unit/API/UI, no funcional básico | Repartir el esfuerzo de pruebas de un nuevo feature | Pirámide invertida: suite lenta y frágil en sprints siguientes |
| 7 | **Incidente en producción** | Gestión de incidentes, postmortem, shift-left y shift-right | Investigar logs, reproducir y proponer mejoras | El resultado depende de todo lo anterior |
| F | **Evaluación final** | Integración de todo | Escenario completo con puntuación en servidor | Certificado de finalización ASE |

La **misión 0 y la misión 1 son gratuitas** como demo y captación. El resto requiere comprar el curso en el catálogo.

## 7. Evaluación y certificado

- Cada decisión puntúa en una o varias **competencias**: rigor técnico, comunicación, gestión del riesgo, eficiencia.
- El debrief muestra qué pasó, por qué, qué habría hecho un QA senior y el concepto teórico con enlaces a recursos.
- Un mini cuestionario antes y después del curso mide la mejora real (también es una métrica de producto).
- El **certificado** se emite solo si la evaluación final se puntúa **en servidor** (ver §8.4).

## 8. Arquitectura (integrada en ase_platform)

### 8.1 Estructura de código

```
frontend/src/features/academy/
├── engine/            # Motor puro TS, sin React: estado, reglas, eventos diferidos
│   ├── types.ts       # Course, Mission, Scene, Choice, Effect, Condition…
│   ├── reducer.ts     # (state, action) → state, determinista
│   ├── conditions.ts  # Evaluador de condiciones (métricas, flags, conocimiento)
│   ├── effects.ts     # Aplicación de efectos (métricas, relaciones, eventos)
│   ├── scheduler.ts   # Eventos diferidos entre misiones
│   ├── registry.ts    # Registro de herramientas y apps por curso (ToolModule)
│   └── scoring.ts     # Puntuación por competencias
├── content/           # Loader y validación de contenido (zod)
├── desktop/           # Shell del escritorio simulado (ventanas, notificaciones)
├── tools/             # Un módulo por herramienta (tickets, chat, api-client, code-editor…)
├── apps/              # Apps bajo prueba reutilizables entre cursos (skyroute/, shop/…)
├── debrief/           # Pantallas de debrief y teoría
└── pages/             # AcademyHomePage, CoursePlayerPage (lazy, ADR 0009)

content/academy/
├── worlds/            # Packs de mundo: empresa, sector, personajes, eventos, plantillas de artefactos
├── paths/             # Rutas de aprendizaje (qa-junior-to-lead.yaml…)
└── testing-fundamentals/   # Un directorio por curso
├── course.yaml        # Metadatos, misiones, competencias
├── missions/          # m00-first-day.yaml, m01-ambiguous-story.yaml, …
├── npcs.yaml          # Personajes y su tono
└── i18n/              # es / en

backend/app/modules/academy/
├── router.py · schemas.py · service.py · repository.py
└── scoring/           # Evaluación final en servidor
```

### 8.2 Motor basado en datos

- El motor es una **máquina de estados determinista** con un generador aleatorio con semilla, así que una partida se puede reproducir a partir de su log de decisiones. Eso sirve para depurar, para analíticas y para validar en servidor.
- El contenido se escribe en YAML y se valida con **zod** al cargar y en CI. Un error de contenido rompe el build, no la partida del alumno.
- Ejemplo de escena:

```yaml
id: m05.release-call
tool: chat
speaker: manager
text: "Necesitamos salir hoy. ¿Lo damos por bueno?"
choices:
  - id: ship
    text: "Sí, lo crítico está probado."
    requires: { flag: m05.payment_tested }
    effects:
      - { metric: velocity, add: 2 }
  - id: ship_blind
    text: "Sí, adelante."
    effects:
      - { metric: velocity, add: 3 }
      - { relation: manager, add: 1 }
      - { schedule: incident.payment_double_charge, in_missions: 2 }
      - { score: risk, add: -2 }
  - id: hold
    text: "No sin probar el pago. Te explico el riesgo."
    effects:
      - { relation: manager, add: -1 }
      - { score: risk, add: 2 }
      - { score: communication, add: 1 }
```

### 8.3 Backend: módulo `academy`

Reutiliza lo que ya existe: `CatalogItem` (tipo `course`) para vender, `catalog_purchase` y Stripe para pagar, `Course`/`CourseEnrollment` para la inscripción y la auth JWT existente.

Tablas nuevas (migración Alembic escrita a mano, como el resto):

| Tabla | Contenido |
|---|---|
| `academy_courses` | Vincula un `CatalogItem`/`course` con su contenido: `content_key`, versión publicada, herramientas, prerrequisitos. Área, nivel y ruta salen del catálogo (`category`, `level`, `series_name`) |
| `academy_profiles` | Perfil de jugador transversal: rango de carrera, competencias acumuladas entre cursos |
| `academy_runs` | Partidas: usuario, curso, misión, versión del contenido, semilla, estado, timestamps |
| `academy_run_events` | Log de decisiones (JSONB) para reanudar, analizar y validar |
| `academy_progress` | Progreso agregado por usuario/curso: misiones completadas, puntuaciones por competencia |
| `academy_certificates` | Certificados emitidos (código verificable públicamente) |

Endpoints (`/api/v1/academy/...`):

- `GET  /courses?track=&level=`: catálogo de cursos-juego filtrable por área y nivel.
- `GET  /paths/{slug}`: ruta con sus cursos y el progreso del alumno.
- `GET  /courses/{slug}`: metadatos, prerrequisitos y acceso del usuario (demo o completo).
- `POST /placement/{course_slug}`: prueba de nivel para saltar prerrequisitos.
- `POST /runs`: iniciar partida; `PATCH /runs/{id}` para guardar estado y decisiones (autosave).
- `GET  /progress/{course_slug}`: progreso del alumno.
- `POST /final-exam/{course_slug}/submit`: evaluación final puntuada en servidor.
- `GET  /certificates/{code}`: verificación pública del certificado.
- Admin: estadísticas de embudo y abandono por misión.

### 8.4 Integridad y anti-trampas (pragmático)

El contenido de las misiones viaja al navegador, así que un usuario técnico podría verlo. Lo aceptamos: hacer trampas en un curso solo engaña al que lo hace. Lo único que se protege es lo que tiene valor externo, **el certificado**: las preguntas y la puntuación de la evaluación final viven solo en el servidor.

### 8.5 Integración con la plataforma

- **Rutas:** `/academy` (escaparate filtrable por área y nivel), `/academy/paths/:pathSlug` y `/academy/:courseSlug/play` (reproductor), con lazy loading según ADR 0009.
- **Diseño:** tokens de `DESIGN.md`. La estética oscura y técnica encaja con el escritorio simulado.
- **i18n:** ES primero y EN después, usando la infraestructura existente.
- **Observabilidad:** Sentry y `error_logs` existentes; errores de contenido etiquetados por misión y escena.
- **Despliegue:** sin infraestructura nueva. El frontend sigue en Vercel y el backend en Railway, con la misma base de datos PostgreSQL.
- **B2B (más adelante):** las `organizations` ya existentes permiten vender licencias a equipos con un panel de progreso para el responsable.

## 9. Roadmap

Las estimaciones son orientativas (una persona con asistencia de IA, dedicación parcial).

| Fase | Objetivo | Entregables | Duración |
|---|---|---|---|
| **0. Diseño** | Validar la idea sin código | Guion de las misiones 0–2, prototipo en papel o Figma, 3–5 testers que lo prueben | 1–2 semanas |
| **1. Vertical slice** | Una misión completa y jugable | Motor multi-curso desde el inicio (registro de herramientas, `course.yaml`, validador), escritorio con chat y tickets, app SkyRoute con 3 bugs, misión 1 completa, autosave en backend | 3–4 semanas |
| **2. MVP vendible** | Curso completo publicado | Misiones 0–7, editor de casos, bug report, panel de release, debriefs, evaluación final, certificado, alta en el catálogo con demo gratuita | 6–8 semanas |
| **3. Medir y pulir** | Aprender de usuarios reales | Analíticas de embudo, cuestionario antes/después, ajustes de dificultad, EN | 3–4 semanas |
| **4. Escalar** | Más cursos, niveles y B2B | Curso 2 de nivel intermedio (p. ej. Testing de APIs) para probar que el motor escala con una herramienta nueva, rutas y rango de carrera, pruebas de nivel, licencias para organizaciones | continuo |
| **4b. Autoría** | Publicar sin programar | Paquetes de curso subidos desde el admin, flujo borrador → revisión → publicado, posibles autores externos | según volumen de cursos |
| **5. Opcional** | Mejoras de experiencia | NPCs con respuestas generadas por IA (con guardarraíles), capa visual 2D o isométrica de oficina | según tracción |

## 10. Métricas de éxito

- % que completa la misión 1 (demo). Objetivo inicial: más del 60 %.
- Conversión de demo a compra.
- % que termina el curso tras comprarlo.
- Mejora media entre el cuestionario de antes y el de después.
- Valoración del curso (las valoraciones del catálogo ya existen).

## 11. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Escribir contenido cuesta más que programar | Plantillas de misión, motor basado en datos, uso de IA para borradores revisados por un experto |
| Que se perciba como "un test con dibujos" | Consecuencias diferidas, capa de realismo (imprevistos, artefactos, personajes) y una app real con bugs desde la primera misión |
| El motor se diseña solo para el curso 1 y luego no escala | Definir desde la fase 1 `course.yaml`, el registro de herramientas y el validador; construir el curso 2 con otra herramienta lo antes posible |
| Alcance excesivo | Vertical slice primero; no pasar a la fase 2 sin validar la 1 con usuarios |
| El contenido se desincroniza con partidas en curso | Versionado del contenido en `academy_runs`; las partidas terminan con su versión original |
| Rendimiento del bundle | Feature aislada con lazy loading; las apps bajo prueba se cargan solo cuando se usan |

## 12. Decisiones abiertas

1. Nombre comercial: "ASE Academy", "QA Life Simulator"…
2. Precio del curso 1 y si entra en algún plan o suscripción existente.
3. ¿Se reutiliza `Course`/`CourseEnrollment` tal cual o solo `CatalogItem` y compras? Hay que revisar cómo convive hoy el catálogo con `courses`.
4. Idioma de lanzamiento: solo ES o ES+EN.
5. Áreas y rutas iniciales a comprometer después del curso 1.
6. ¿Certificado con nombre y verificación pública desde el MVP o en la fase 3?

## 13. Hoja de ruta de formación: de simulación a curso completo

Objetivo: pasar de «vivir un día» a **practicar, medir y repetir**. Bloques por prioridad.

### Bloque 1 — Núcleo didáctico (imprescindible)
| Pieza | Qué es | Por qué |
|---|---|---|
| Diseño de pruebas con feedback | Pantalla para crear particiones, valores límite, tablas de decisión y estados **antes** de probar; el motor indica qué falta cubrir | Es la habilidad central del testing; hoy no se practica |
| Mentor con microlecciones | «Pregúntale a Laura»: explicaciones de ~1 min en contexto; pistas por niveles con coste de tiempo | Teoría en el momento justo, no solo en el debrief |
| Ciclo de vida del bug | El dev corrige, el alumno vuelve a probar; alguna corrección rompe otra cosa (regresión) o se reabre | Hoy el bug muere al reportarlo |
| Priorización por riesgo | Matriz probabilidad × impacto con tiempo limitado, defendida ante el manager | «Probar todo es imposible» aplicado |
| Variedad y repaso | Bugs distintos por semilla, test antes/después, 3 preguntas de repaso al iniciar la misión siguiente | Evita memorizar; mide el aprendizaje real |

### Bloque 2 — Herramientas reales del oficio
- **DevTools simulado** (consola y red): códigos HTTP, distinguir bug de frontend y de backend.
- **Cliente de API** tipo Postman: descubrir validaciones que solo existen en el formulario.
- **SQL contra staging** para verificar datos (cargos duplicados, saldos).
- **Gestor de casos de prueba** con ejecuciones (pasa, falla, bloqueado) y trazabilidad requisito → caso → bug.
- **Informe de pruebas** de fin de sprint con métricas y recomendación de salida.

### Bloque 3 — Más allá de lo funcional
Seguridad básica (IDOR, entradas maliciosas), accesibilidad (contraste, teclado; obligatoria en la UE para la banca), rendimiento bajo carga, compatibilidad móvil/navegador, localización (fechas, monedas).

### Bloque 4 — Proceso y soft skills
Refinamiento (shift-left), planning, retro, 1:1 con la mentora; sprint de varias jornadas con incidente en producción y postmortem sin culpas; negociar alcance y dar malas noticias; normativa del sector (PSD2, RGPD) y mundos intercambiables (aerolínea, e-commerce, salud).

### Bloque 5 — Evaluación y valor para el alumno
- Evaluación de bug reports **con IA** (reproducibilidad y claridad reales, no longitud).
- NPCs que entienden texto libre, con límites sobre lo que sabe cada personaje.
- Examen final puntuado en servidor y **certificado verificable**; temario mapeado a ISTQB Foundation.
- **Portfolio exportable** (bug reports, plan e informe de pruebas) para entrevistas.

### Bloque 6 — Motivación y B2B
Progresión de carrera, logros, modo desafío sin pistas, «bug del día»; panel para empresas y formadores (progreso del equipo, debilidades por competencia, misiones adaptadas a su dominio); analíticas de aprendizaje para mejorar el contenido.

### Orden de ejecución
1. Cerrar la misión 0 como unidad formativa con el bloque 1 y la evaluación con IA del bloque 5.
2. Bloque 2 (herramientas del oficio).
3. Misiones 1–7 incorporando los bloques 3 y 4.
4. Certificado, portfolio y panel B2B.

## 14. Estado y próximos pasos

**Hecho (2026-10-05):** misión 0 «Primer día» jugable en `/academy` (guion en [missions/m00-primer-dia.md](missions/m00-primer-dia.md)). Incluye motor determinista con tests, escritorio simulado (correo, chat, tablero, wiki, app de staging con 6 bugs sembrados, logs), reuniones, imprevistos, evaluación de bug reports y debrief. El progreso se guarda en el navegador (`{seed, actions}`).

Decisión de implementación: de momento el contenido se escribe en **módulos TypeScript tipados** en lugar de YAML. El compilador valida el contenido sin añadir dependencias. Pasar a YAML con zod cuando lo escriban personas sin perfil técnico.

**Hecho (2026-10-05, segunda parte):**
- Vínculo catálogo ↔ simulador: campo `academy_course_key` en `catalog_items` (migración `c3e9a7d1f5b2`), selector «Curso interactivo» en el admin del catálogo (solo tipo curso) y bloque «Curso interactivo · ASE Academy» en la ficha pública y privada.
- Acceso: `GET /api/v1/academy/courses/{clave}/access`. Las misiones gratuitas están abiertas a todos; las de pago requieren el ítem comprado o incluido en un plan, o que el ítem sea gratuito. El super admin tiene acceso a todo.
- Progreso en base de datos: tabla `academy_runs` (migración `d7f2b4c8e6a1`) con `{seed, actions}` por usuario y misión, y endpoints `GET/PUT /api/v1/academy/runs/...`. Se guarda tras cada acción; sin sesión, solo en el navegador.

### Cómo publicar un curso del simulador
1. **Contenido (desarrollo):** crear `frontend/src/features/academy/content/courses/<clave>/` con `course.ts` y sus misiones, añadir el curso en `content/courseList.ts` y las misiones en `content/registry.ts`, y desplegar.
2. **Venta (admin, sin código):** Admin → Catálogo → Nuevo ítem de tipo **Curso**. En «Curso interactivo (simulador ASE Academy)» se elige el curso, se fija el precio y se publica.
3. Resultado: la ficha muestra «Jugar el curso» o «Probar la misión gratuita», y `/academy/<clave>` muestra el precio y el botón de desbloqueo.

**Hecho (2026-10-05, tercera parte) — Diseño de pruebas con feedback (bloque 1):**
- Nueva herramienta **Diseño** en el escritorio: el alumno crea casos (zona, valor, resultado esperado) para KOB-142; cada caso muestra la partición o técnica que cubre.
- **Revisión de Laura** (10 min): la primera da pistas sin revelar valores y las siguientes dicen exactamente qué falta. También avisa de resultados esperados incorrectos y de cuándo hacía falta preguntar a la PO.
- ▶ en cada caso abre staging con los datos precargados; el alumno marca el resultado (pasa, falla o bloqueado).
- Debrief: cobertura por zona (18 particiones clave), casos que encontraban bugs, errores de resultado esperado o de marcado, y si diseñó antes de ejecutar. La cobertura suma a la nota de rigor.
- Modelo genérico (`TestDesignModel`): cada misión define sus zonas, particiones, reglas y precarga; motor en `engine/design.ts`, contenido en `m00-design.ts`.

**Hecho (2026-10-05, cuarta parte) — Ciclo de vida del bug (bloque 1):**
- Al aceptar un bug, Diego despliega el fix en staging tras un tiempo de jornada (40–60 min); el build sube (rc4, rc5…) y el bug pasa a «Resuelto · verificar».
- En el tablero, el alumno **verifica** con evidencia del build nuevo: «Funciona: verificar y cerrar» o «Sigue fallando: reabrir». Cerrar sin re-probar penaliza; reabrir sin evidencia, también.
- **Fix fallido:** el primer fix del doble clic (B5) no funciona; si se reabre con evidencia, llega un segundo fix.
- **Regresión:** el fix de la coma (B3) rompe los decimales con punto (R1). Solo aparece si se repiten casos que antes pasaban.
- Laura explica re-test y regresión con el primer despliegue; en Diseño, los casos ejecutados antes de un build nuevo muestran «⟳ re-ejecutar».
- Debrief: «Verificación de correcciones» y la regresión dentro de la lista de bugs.

**Regla de precio (2026-10-05):** el precio del ítem del catálogo decide el acceso. **Precio 0** y publicado → curso completo gratis para todos, también sin sesión (el progreso solo se guarda en la cuenta si inicia sesión). **Con precio** → la primera misión es siempre gratis como demo y el resto requiere comprarlo (o tenerlo en un plan). La regla vive en `AcademyService.get_access` (backend) e `isFreeMission` (frontend); ya no hay misiones marcadas como gratis en el contenido.

**Hecho (2026-10-05, quinta parte) — Misión 0 completa como unidad formativa:**
- **Bugs variables:** cada partida activa una variante por hueco según la semilla (B1/B1b, B2/B2b, B3/B3b, B4/B4b, B5, B6/B6b); el debrief solo muestra los de esa partida.
- **Mentor con microlecciones:** botón «Pregúntale a Laura» con 8 lecciones de ~1 min (5 min de jornada cada una). Los ejemplos no son de Kobalto para no regalar los bugs.
- **Priorización por riesgo:** pestaña «Riesgos» en Diseño (probabilidad × impacto), feedback de Laura y comparación con la referencia de un QA senior en el debrief.
- **Test antes y después:** diagnóstico de 6 preguntas antes de empezar y comprobación de 6 al terminar (mismos conceptos, otros contextos); el debrief muestra la mejora y explica cada respuesta.
- **Revisión de bug reports con IA:** `POST /api/v1/academy/report-review` (Groq, misma clave `GROQ_API_KEY` que el análisis de CV, 30/hora por IP). Sin clave responde 503 y el botón se oculta. El resultado se guarda dentro de la acción para que la partida siga siendo reproducible.
- **Evidencia a granel penalizada:** adjuntar toda la evidencia para «acertar» deja el report en «necesita info».
- **Enlace a ASE Academy** en el pie de la web pública (no en la cabecera, que solo cabe verificada a 1440 px).

**Hecho (2026-10-05, sexta parte) — Misión 1 «La historia ambigua» jugable** (guion en [missions/m01-historia-ambigua.md](missions/m01-historia-ambigua.md)):
- Nueva herramienta **Revisión** (testing estático): marcar fragmentos como ambiguo/incompleto/contradictorio/no verificable y enviarlos a la PO.
- **Prevención de bugs:** lo aclarado antes de que empiece el desarrollo no llega al prototipo (`BugDef.preventedBy` + efecto `preventBugs`); el debrief muestra bugs evitados frente a bugs nacidos de dudas sin aclarar.
- Nueva app bajo prueba **Transferencias programadas** (`apps/kobalto-scheduled`) y registro de apps por misión (`Mission.appId`).
- Escenas del martes (refinamiento, inicio del desarrollo, cambio de alcance, prototipo, presión de release), diseño de pruebas, 7 microlecciones, test antes/después, fixes y veredicto propio.
- Pendiente: continuidad entre misiones (que lo que hiciste el lunes tenga consecuencias el martes).

**Hecho (2026-10-05, séptima parte): Misión 2 «El simulador de préstamos» jugable** (guion en [missions/m02-simulador-prestamos.md](missions/m02-simulador-prestamos.md)):
- Nueva app bajo prueba **Simulador de préstamo** (`apps/kobalto-loans`) con 4 variables, reglas combinadas (edad + plazo ≤ 75, endeudamiento ≤ 35 %), tramo de TIN y cálculo de la cuota con oráculo (`specQuote`).
- 12 bugs posibles (7 por partida según la semilla) más una regresión tras el fix del tramo.
- Oráculo en la wiki (tabla de ejemplos de Riesgos) y nuevo personaje: Carmen López (Riesgos y Compliance).
- Escenas del miércoles: script aleatorio de Diego, lentitud de staging (no funcional), «un céntimo no es un bug», reunión de cobertura con Riesgos.
- Diseño de 30 particiones, matriz de 7 riesgos, microlecciones, test antes/después y veredicto propio.
- Verificado: 32 tests del motor + 35 de apps, tsc y eslint limpios, partida completa en navegador sin errores de consola.

**Hecho (2026-10-05, octava parte): Misión 3 «Estados de un pago» jugable** (guion en [missions/m03-estados-pago.md](missions/m03-estados-pago.md)):
- Nueva app bajo prueba **Consola de operaciones de Kobalto Pay** (`apps/kobalto-payments`): 8 estados, 8 acciones, devoluciones con importe, disputas y generador de datos de prueba.
- Técnicas: transición de estados (válidas, inválidas, secuencias) y tabla de decisión (comisión por devolución con límite de 30 días).
- 13 bugs posibles (7 por partida según la semilla) más una regresión tras el fix de las devoluciones acumuladas.
- Escenas del jueves: camino feliz de Diego, incidencia de producción de Carmen, «es interpretación de la tabla», decisión de activar devoluciones.
- Motor: textos del esperado por zona (`expectedLabels`) e introducción propia del diseño (`intro`).
- Verificado: 38 tests del motor + 46 de apps, tsc y eslint limpios, partida completa en navegador sin errores de consola.

**Hecho (2026-10-06): Misión 4 «Reportar como un profesional» jugable** (guion en [missions/m04-reportar.md](missions/m04-reportar.md)):
- Nueva app bajo prueba **Tarjetas** (`apps/kobalto-cards`) con laboratorio de dispositivos: los bugs solo aparecen en ciertas condiciones (dispositivo, idioma, cuenta, secuencia o datos).
- Motor: prioridad en el report, condiciones de reproducción (`BugDef.repro`), completar y reenviar reports devueltos (`amendReport`) y tabla «Calidad de tus reports» en el debrief.
- Personaje nuevo: Nuria Vidal (Atención al cliente). Escenas: reports irreproducibles, errata del anuncio (severidad frente a prioridad), triaje y la queja que no es un bug.
- Verificado: 42 tests del motor + 56 de apps, tsc y eslint limpios, partida completa en navegador (report devuelto, completado y aceptado) sin errores de consola.

**Hecho (2026-10-06): Misión 5 «Viernes de release» jugable** (guion en [missions/m05-release.md](missions/m05-release.md)):
- Nueva app **TestHub** (`apps/kobalto-release`): regresión manual de 22 casos que no cabe en la jornada; cada caso consume su tiempo real. Incluye un panel de integración continua con un test inestable.
- Motor: coste variable por acción (`AppEvent.cost`), condición `bugVerified` y matriz de riesgos sin diseño de casos.
- Personaje nuevo: Raúl Ortega (Engineering Manager). Decisión GO/NO-GO con cuatro salidas según lo encontrado y verificado.
- Verificado: 45 tests del motor + 61 de apps, tsc y eslint limpios, partida completa en navegador sin errores de consola.

**Hecho (2026-10-06): Misión 6 «La pirámide» jugable** (guion en [missions/m06-piramide.md](missions/m06-piramide.md)):
- Nueva app **Planificador de pruebas** (`apps/kobalto-pyramid`): 16 comprobaciones de KOB-190 que el jugador coloca en un nivel. El nivel decide el coste, la duración y estabilidad de la suite, y qué bugs se ven (mocks ciegos al contrato, interfaz ciega a la seguridad, E2E ciego al rendimiento).
- Motor: `AppEvent.flags` (una acción en la app activa flags que leen las escenas).
- Personaje nuevo: Sergio Navas (QA Automation). Revisión del plan por flags y estrategia ante Raúl.
- Verificado: 47 tests del motor + 65 de apps, tsc y eslint limpios, partida completa en navegador con el plan ideal aprobado por Laura.

**Hecho (2026-10-06): Misión 7 «Incidente en producción» jugable** (guion en [missions/m07-incidente.md](missions/m07-incidente.md)). **Las 8 misiones del curso 1 son jugables.**
- Nueva app **Observabilidad** (`apps/kobalto-incident`): desglose de errores con filtros encadenados, flags y rollback, reproducción en staging y contador de clientes afectados.
- Causa variable por semilla (formato de importe en Android o datos de cuentas antiguas), con condiciones de reproducción en el report.
- Escenas: alerta, sala de crisis, comunicación a clientes, pista falsa de CPU, mitigación rápida o lenta, presión para reactivar el flag y postmortem sin culpables. Cierre del curso.
- Verificado: 49 tests del motor + 70 de apps, tsc y eslint limpios, partida completa en navegador sin errores de consola.

**Siguiente:**
1. Probar la misión 0 con 3–5 personas y ajustar tiempos, dificultad y textos.
2. Versión en inglés de la misión 0 (cuando los textos estén validados con usuarios).
3. Evaluación final (puntuada en servidor) y continuidad entre misiones (las decisiones de un día afectan al siguiente).
4. Cerrar las decisiones abiertas de §12.
5. Skill de autor de misiones para crear cursos sin depender de esta sesión.
