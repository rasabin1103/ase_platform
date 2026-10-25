# Curso 4 · Gestión de equipos QA: de QA manual a Head of QA

> Nivel: Gestión · Simulador · 12 misiones (2 por rol) + evaluación final propia de ASE
> Clave del curso: `gestion-equipos-qa` · Mundo: Kobalto, de scale-up a banco digital (ocho años de carrera)

Sin certificación externa: el curso termina con una **evaluación situacional propia de ASE** (ver §6) y el certificado de finalización de ASE Academy.

## 1. Posicionamiento

| | Cursos 1–3 | Curso 4 · Gestión de equipos QA |
|---|---|---|
| Qué se aprende | Técnica: diseñar, ejecutar, automatizar pruebas | Personas y decisiones: qué te toca en cada rol y cómo manejar las situaciones de equipo |
| Rol del jugador | QA de un squad | Seis roles, uno detrás de otro: QA manual → QA Engineer → QA Architect → QA Lead → QA Manager → Head of QA |
| Herramientas | Staging, IDE, revisión, métricas | Correo, chat, reuniones, tickets, wiki y, más adelante, herramientas de gestión (1:1, plan de capacidad, contratación, presupuesto, organigrama) |
| Para quién | Quien quiere ser QA o mejorar como QA | QA que quieren crecer, QA Leads nuevos, managers que heredan un equipo de QA, y Heads que montan el área |

Idea central: **cada rol tiene responsabilidades distintas ante la misma situación**. Un release con riesgo lo vive el QA manual (¿firmo?), el QA Lead (¿respaldo a mi QA?), el QA Manager (¿qué política de release tenemos?) y el Head of QA (¿por qué QA sigue siendo la puerta?). El curso hace que el alumno lo viva desde todos esos ángulos.

## 2. Historia y personajes

**Una carrera, un curso.** El jugador entra en Kobalto como QA manual cuando la empresa tiene 6 squads y termina ocho años después como Head of QA de un banco digital con 40 squads. Cada rol empieza con un salto en el tiempo y un correo de «ascenso» que explica qué cambia.

| Año | Rol del jugador | Tamaño de Kobalto | Equipo que tiene a cargo |
|---|---|---|---|
| 1 | QA manual · squad Tarjetas | 6 squads | Nadie (responde a Laura) |
| 2–3 | QA Engineer · squad Tarjetas | 10 squads | Nadie; mentoriza a un junior |
| 3–4 | QA Architect · plataforma | 16 squads | Nadie; influye en 16 squads sin autoridad |
| 4–5 | QA Lead · Pagos | 20 squads | 5 QA (dos eran sus compañeros) |
| 5–7 | QA Manager · Banca diaria | 30 squads | 3 QA Leads, 18 QA |
| 7–8 | Head of QA | 40 squads | 4 QA Managers, 70 QA, presupuesto propio |

Personajes recurrentes (los nuevos se añaden en `worlds/kobaltoTeams.ts`, que extiende el mundo Kobalto):

| Personaje | Rol | Papel en el curso |
|---|---|---|
| **Laura Méndez** | QA Lead → QA Manager → VP Engineering | Mentora a lo largo de la carrera; más tarde, tu jefa directa |
| **Marta Sanz** | Product Owner · Pagos → Directora de Producto | La presión de negocio: plazos, demos, «márcalo como probado» |
| **Diego Ruiz** | Backend developer → Tech Lead | Conflicto con desarrollo al principio; aliado después |
| **Sergio Navas** | QA Automation → compañero de QA Engineer → QA Lead a tu cargo | Compañero que pasa a reportarte (amistad y jerarquía) |
| **Lucía Campos** (nueva) | QA junior | La mentorizas como QA Engineer; reaparece como QA con bajo rendimiento cuando eres Lead |
| **Héctor Bravo** (nuevo) | QA del equipo de Pagos | Quiere bloquear un release (el espejo de la misión 0) |
| **Raúl Ortega** | Engineering Manager → CTO | Presupuesto, contratación, prioridades de dirección |
| **Andrea Gil** (nueva) | People Partner (RR. HH.) | Evaluaciones de desempeño, planes de mejora, reorganizaciones |
| **Carmen López** | Riesgos y Compliance | Auditoría y regulador en las crisis |
| **Irene Sáez** (nueva) | CEO | Comité de dirección y crisis pública |
| **Iván Torres** | Plataforma / DevOps → Lead de Plataforma | Quiere construir las herramientas en casa (misión 5) |
| **Olga Vera** (nueva) | Ventas de Sandbloq, proveedor ficticio | Presiona con descuentos y plazos (misión 5) |

## 3. Responsabilidades de cada rol

El eje del curso. Cada misión tiene en la wiki la **ficha del rol** (qué posee, qué decide, qué escala y cómo se le mide) y el debrief compara las decisiones del jugador con ella.

| Rol | Posee | Decide | Escala | Se le mide por |
|---|---|---|---|---|
| **QA manual** | Sus pruebas: análisis, ejecución, evidencias, bug reports | Cómo probar lo asignado y cuándo pedir ayuda | Bloqueos, riesgos que no puede cubrir, presión para firmar sin probar | Defectos útiles encontrados, honestidad del estado, fiabilidad |
| **QA Engineer** | Automatización del squad, pipeline de pruebas, datos y entornos de prueba | Qué automatizar y cómo, deuda de la suite | Tiempo de sprint para calidad, problemas de plataforma | Suite fiable y útil, feedback rápido al equipo, ayuda a otros |
| **QA Architect** | Estándares, herramientas y arquitectura de pruebas transversales | Decisiones técnicas comunes (ADR), sin autoridad directa sobre los squads | Inversión, conflictos entre squads, riesgos técnicos sistémicos | Adopción real de los estándares, coste y velocidad de las pruebas en la organización |
| **QA Lead** | Las personas de su equipo: reparto de trabajo, 1:1, feedback, crecimiento | Asignación, prioridades del equipo, cómo se trabaja | Bajo rendimiento persistente, conflictos que no resuelve, falta de headcount | Entrega del equipo, salud y crecimiento de las personas, calidad del producto |
| **QA Manager** | Varios equipos y sus leads: contratación, capacidad, presupuesto, carreras | Headcount, estructura de equipos, procesos comunes, evaluaciones | Recortes, cambios de estrategia, riesgos de negocio | Capacidad y retención, métricas de calidad del área, desarrollo de leads |
| **Head of QA** | La estrategia de calidad de la empresa, el modelo organizativo y la cultura | Visión, inversión, modelo (centralizado / embebido / plataforma), políticas | Riesgos de negocio y regulatorios ante el comité de dirección | Coste de la no calidad, incidentes, velocidad de entrega, confianza de dirección |

Regla que se repite en todo el curso: **QA informa del riesgo; quien es dueño del negocio decide asumirlo**, y cada rol sube un escalón en lo que puede decidir.

## 4. Las misiones

Formato común (heredado de los cursos anteriores):
- Jornada con escenas, reuniones y decisiones.
- Microlecciones de Laura («Pregúntale a Laura»).
- Test antes y después: 6 + 6 preguntas situacionales.
- Debrief con el diario de decisiones, las consecuencias evitadas o no y «qué haría un profesional senior».

Novedades de este curso:
- **Ficha del rol** en la wiki de cada misión: es la referencia contra la que se juzga.
- **Consecuencias diferidas**: las decisiones se pagan «la semana siguiente» (debrief de prevención, como el curso 2).
- **Ecos**: situaciones que reaparecen desde otro rol. El debrief recuerda qué hiciste cuando estabas al otro lado (flags de continuidad cuando las misiones previas están jugadas).

### Rol 1 · QA manual

**Misión 0 · La firma (gratuita)** ✅ jugable (guion: `missions/m00-la-firma.md`)
- **Situación:** jueves, víspera de la demo de tarjetas virtuales con un banco socio. Marta pide que marques la historia como probada aunque no hayas terminado; Diego rechaza tu bug «porque en su máquina funciona»; Sergio te pide ayuda a la vez; a las 17:30 hay go/no-go.
- **Responsabilidades en juego:** estado honesto, bugs con evidencia, priorizar tu trabajo y negociarlo, pedir ayuda a tiempo, no firmar lo que no has probado, separar «informar del riesgo» de «decidir asumirlo».
- **Trampas:** firmar para quedar bien, «todo bien» en la daily, cerrar el bug para evitar el conflicto, decir sí a todo.

**Misión 1 · El cuello de botella** ✅ jugable (guion: `missions/m01-cuello-botella.md`)
- **Situación:** sprint con todo el trabajo de QA al final. Tres devs te pasan historias el último día, el EM pregunta por qué QA «retrasa» el sprint, y recibes feedback duro en la retro.
- **Responsabilidades:** hacer visible el flujo de trabajo, proponer mejoras sin culpar (shift-left, criterios de aceptación antes de desarrollar), recibir feedback y actuar.
- **Mecánica nueva · app «Sprint»:** tablero del sprint con la cola de QA (elegir 3 de 6 historias por riesgo), análisis del flujo con datos y propuestas de acuerdos para la retro.

### Rol 2 · QA Engineer

**Misión 2 · La suite que nadie mira** ✅ jugable (guion: `missions/m02-suite.md`)
- **Situación:** el pipeline está en rojo el 40 % de las veces por tests inestables; los devs ya lo ignoran. Tienes un sprint para recuperar la confianza.
- **Responsabilidades:** priorizar la deuda de la suite, negociar tiempo de sprint con la PO, hacer a los devs dueños de sus tests, comunicar con datos.
- **Trampas:** reescribirlo todo, desactivar tests en silencio, pedir un sprint entero sin datos.
- **Mecánica nueva · app «Suite»:** investigar la causa de los ocho tests que causan los rojos y decidir (arreglar, cuarentena, borrar o reportar un bug); uno de ellos esconde un bug real intermitente. Informe con el squad dueño de cada test.

**Misión 3 · El junior** ✅ jugable (guion: `missions/m03-junior.md`)
- **Situación:** llega Lucía, QA junior. Le haces el onboarding, revisas su primer PR de tests y se equivoca en producción.
- **Responsabilidades:** mentorizar sin hacer su trabajo, revisar código con tacto, error sin culpa, decir al Lead lo que necesita sin pasar a ser su jefe.
- **Eco:** Lucía reaparece en la misión 7.
- **Mecánica nueva · app «Revisión»:** el primer PR de Lucía; en cada bloque se elige el comentario (bloqueante con el porqué, «nit» opcional, reconocer, comentario seco o arreglarlo tú).

### Rol 3 · QA Architect

**Misión 4 · Cinco squads, cinco frameworks** ✅ jugable (guion: `missions/m04-estandar.md`)
- **Situación:** cada squad automatiza con una herramienta distinta y nadie puede reutilizar nada. Dirección quiere «un estándar».
- **Responsabilidades:** influir sin autoridad, decidir con los equipos (RFC, ADR, piloto), estándar mínimo frente a imposición total, plan de migración realista.
- **Mecánica nueva · app «RFC»:** mapa de cómo automatiza cada squad, RFC por secciones (alcance, elección de herramienta, migración y excepciones), respuesta a los comentarios de tres squads y publicación del ADR; la adopción depende de cómo los incluyas.

**Misión 5 · Construir o comprar** ✅ jugable (guion: `missions/m05-comprar.md`)
- **Situación:** hay que elegir plataforma de entornos efímeros y datos de prueba. Un proveedor presiona, el equipo quiere construirla y Raúl pide coste a tres años.
- **Responsabilidades:** criterios de evaluación, coste total, riesgos, piloto, presentar una recomendación a dirección.
- **Mecánica nueva · app «Evaluación»:** criterios de evaluación, comparación de tres opciones (comprar, construir, open source), coste a tres años eligiendo qué partidas cuentas y recomendación con piloto y condiciones del contrato.

### Rol 4 · QA Lead

**Misión 6 · Tu primer equipo** ✅ jugable (guion: `missions/m06-primer-equipo.md`)
- **Situación:** primer día como QA Lead de Pagos; dos de tus QA eran compañeros. Héctor quiere bloquear un release y Marta te pide que «le pares los pies».
- **Responsabilidades:** primeros 1:1, expectativas claras, respaldar a tu QA con criterio, llevar la decisión de riesgo a quien la tiene, proteger al equipo sin aislarlo.
- **Eco de la misión 0:** ahora eres tú quien recibe la presión desde arriba y el QA que dice «no está listo».
- **Mecánica nueva · app «Equipo»:** perfiles del equipo, reparto del sprint (fortalezas, crecimiento y carga) y preparación del primer 1:1 con Sergio.

**Misión 7 · La conversación difícil** ✅ jugable (guion: `missions/m07-conversacion.md`)
- **Situación:** Lucía lleva tres meses por debajo de lo esperado y otro QA se queja de ella. Andrea, de Personas, pregunta si hay que abrir un plan de mejora.
- **Responsabilidades:** feedback específico (situación, comportamiento, impacto), buscar la causa, plan con objetivos medibles, documentar, mediar en el conflicto, cuidar la confidencialidad.
- **Mecánica nueva · app «1:1»:** lo que se espera de Lucía y lo que sabes, elegir tres ejemplos (hechos frente a juicios u opiniones de otros) y el guion de la conversación (apertura, causa, plan y registro). La conversación se ramifica según la preparación.

### Rol 5 · QA Manager

**Misión 8 · Contratar** ✅ jugable (guion: `missions/m08-contratar.md`)
- **Situación:** tienes 3 vacantes, un proceso lento y un candidato recomendado por el CTO que no encaja.
- **Responsabilidades:** definir el perfil por necesidades del equipo, entrevistas estructuradas, evitar sesgos, decir que no con datos, oferta y onboarding.
- **Mecánica nueva · app «Contratación»:** perfil desde lo que le falta al área, formato de entrevista y proceso; tarjeta del panel con cinco finalistas (puntuación por criterio y evidencias) y decisión para tres vacantes. Debate de contratación sobre una candidata «fuera del perfil de siempre».

**Misión 9 · Recortes** ✅ jugable (guion: `missions/m09-recortes.md`)
- **Situación:** presupuesto un 20 % menor. Hay que elegir entre no reponer bajas, externalizar regresión o reducir alcance, y comunicarlo.
- **Responsabilidades:** priorizar por riesgo, proteger a las personas clave, comunicar con honestidad, gestionar el impacto en la moral y en la retención.
- **Mecánica nueva · app «Capacidad»:** plan con nueve palancas de ahorro (bajas sin reponer, externalizar, reducir alcance, herramientas, automatizar, pero también externalizar pagos, prescindir de senior, cerrar rendimiento o quitar formación), cada una con su ahorro y su impacto; objetivo de 400 k€.

### Rol 6 · Head of QA

**Misión 10 · El gran incidente** ✅ jugable (guion: `missions/m10-incidente.md`)
- **Situación:** un fallo en transferencias llega a prensa y al regulador. En el comité de crisis alguien dice «¿dónde estaba QA?».
- **Responsabilidades:** gestionar la crisis con Compliance, postmortem sin culpables, defender a las personas sin esconder los fallos de sistema, convertirlo en cambios de organización.
- **Eco de las misiones 0 y 6:** la cultura «QA es la puerta» es la causa; ahora te toca cambiarla.
- **Mecánica nueva · app «Postmortem»:** cronología del incidente, causas (cinco de sistema frente a tres que señalan a personas) y acciones (cinco de sistema frente a doble firma, sanción o congelar releases).

**Misión 11 · La estrategia** ✅ jugable (guion: `missions/m11-estrategia.md`)
- **Situación:** presentar al comité de dirección la estrategia de calidad a tres años: modelo organizativo, inversión, métricas de negocio y el plan para el área.
- **Responsabilidades:** visión, modelo (centralizado, embebido o plataforma), métricas que entiende dirección (coste de la no calidad, incidentes, velocidad de entrega), alinear a los QA Managers y ganarte a los escépticos.
- **Mecánica nueva · app «Estrategia»:** situación en cifras, cuatro métricas para el comité (de negocio frente a tests, cobertura, bugs o ratio) y cuatro decisiones (modelo, inversión, hoja de ruta y personas).

### Final · Evaluación situacional ASE ✅

Ver §6.

## 5. Qué hay que construir

| Pieza | Misiones | Reutiliza | Nuevo |
|---|---|---|---|
| Ficha del rol y ecos | Todas | Wiki, flags, debrief de prevención | Bloque «Si estuvieras en otro rol» en el debrief (más adelante) |
| Mundo ampliado | Todas | Kobalto | `worlds/kobaltoTeams.ts` con personajes nuevos y cargos que evolucionan |
| Tablero del sprint ✅ | 1 | Patrón de apps (`kobalto-process`) | App `kobalto-sprint`: cola por riesgo, análisis del flujo y acuerdos de retro |
| Salud de la suite ✅ | 2 | Patrón de apps | App `kobalto-suite`: triaje de tests inestables por causa e informe con dueños |
| RFC y ADR ✅ | 4 | Patrón de apps | App `kobalto-rfc`: mapa de squads, RFC por secciones, comentarios por squad y ADR |
| Evaluación de proveedores ✅ | 5 | Patrón de apps | App `kobalto-vendor`: criterios, opciones, coste total a tres años y recomendación |
| Preparación del 1:1 ✅ | 6, 7 | Escenas y flags | Misión 6: app `kobalto-team` (temas del 1:1 y reparto del sprint). Misión 7: app `kobalto-oneonone` (ejemplos y guion de la conversación difícil) |
| Tarjeta de candidatos ✅ | 8 | Patrón de apps | App `kobalto-hiring`: perfil, proceso, tarjeta del panel y decisión |
| Plan de capacidad ✅ | 9 | Patrón de apps | App `kobalto-capacity`: palancas con ahorro, riesgo e impacto en las personas |
| Organigrama y estrategia ✅ | 11 | Patrón de apps | App `kobalto-strategy`: métricas para el comité, modelo, inversión, hoja de ruta y personas |
| Evaluación final ✅ | Final | Sistema de intentos y certificado de los cursos 1–3 | Banco situacional `exam_bank/gestion.py` (60 casos, bloques 21–26) |

La misión 0 no necesita piezas nuevas: usa correo, chat, reuniones, tickets con acciones y wiki.

## 6. Evaluación final y certificado ✅

- **Evaluación situacional** (situational judgment test): 30 casos cortos, 5 por rol, cada uno con 4 respuestas posibles. Ejemplo: «Tu QA quiere bloquear el release y la PO te pide que lo convenzas. ¿Qué haces primero?».
- 45 minutos; se aprueba con 21 aciertos (70 %).
- Corrección en servidor con el mismo sistema de intentos que el simulacro de los cursos 1 y 2. Prefijo de certificado `GEQ`.
- Informe por rol: en qué rol fallas más y qué misión repasar.
- Certificado de finalización de ASE Academy al aprobar la evaluación y terminar las 12 misiones. No es una certificación oficial de ninguna entidad.

**Implementación (2026-10-23):**
- Banco en `backend/app/modules/academy/exam_bank/gestion.py`: 60 casos originales, 10 por rol y 5 por misión (bloques 21–26, que se muestran como 1–6 con `chapter_offset=20`). La correcta va primera en el banco y el servidor baraja las opciones; las respuestas no llegan al navegador antes de entregar.
- `exam_config.py`: 30 casos (5 por bloque), 45 min (56 con tiempo ampliado), aprobado con 21, prefijo `GEQ` y las 12 misiones obligatorias.
- Informe por rol: el resultado agrupa los aciertos por bloque (rol) y enlaza la misión que repasar de cada sección (`exam/studyMap.ts`).
- Aviso propio en la página del examen, el resultado, la página del certificado y el PDF (sin mención a ISTQB®).
- Textos propios de la evaluación (no de «simulacro CTFL»): «casos», «reparto por rol», «informe por rol», «nueva evaluación» (`withExamCopy` en `exam/studyMap.ts`).
- Pendiente de traducción: en inglés se sirve en español (`PENDING_EN_CHAPTERS`).
- Tests: `tests/test_academy_exam_bank.py` (reparto por rol), `tests/test_academy_exam.py` (intento, informe por rol y certificado) y el E2E `e2e/academy.spec.ts`, que ya incluye este curso en español: las 12 misiones, la evaluación y el certificado.

## 7. Orden de construcción propuesto

1. ~~Plan del curso~~ ✅ y ~~Misión 0 · La firma~~ ✅ (2026-10-22). Curso registrado en el código como pendiente de traducción; aún sin ficha en el catálogo.
2. ~~Misión 1 · El cuello de botella~~ ✅ (2026-10-22, con la app «Sprint») y ~~Misión 6 · Tu primer equipo~~ ✅ (2026-10-22, con la app «Equipo»): el formato de los ecos funciona. ~~Misión 2 · La suite que nadie mira~~ ✅ (2026-10-22, con la app «Suite») y ~~Misión 3 · El junior~~ ✅ (2026-10-22, con la app «Revisión»). ~~Misión 4 · Cinco squads, cinco frameworks~~ ✅ (2026-10-22, con la app «RFC»). ~~Misión 5 · Construir o comprar~~ ✅ (2026-10-23, con la app «Evaluación») y ~~Misión 7 · La conversación difícil~~ ✅ (2026-10-23, con la app «1:1») y ~~Misión 8 · Contratar~~ ✅ (2026-10-23, con la app «Contratación») y ~~Misión 9 · Recortes~~ ✅ (2026-10-23, con la app «Capacidad»).
3. ~~Misión 10 · El gran incidente~~ ✅ (2026-10-23, con la app «Postmortem») y ~~Misión 11 · La estrategia~~ ✅ (2026-10-23, con la app «Estrategia»). **Las 12 misiones están jugables.**
4. ~~Evaluación final y certificado~~ ✅ (2026-10-23, ver §6).
5. Versión en inglés.
6. Ficha en el catálogo (`academy_course_key = gestion-equipos-qa`), tráiler épico y datos de YouTube.
