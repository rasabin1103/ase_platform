# Misión 10: El gran incidente (Gestión de equipos QA · rol Head of QA)

> Contenido jugable: `frontend/src/features/academy/content/courses/gestion-equipos-qa/m10-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-postmortem/` (pestaña «Postmortem»)
> Ruta: `/academy/gestion-equipos-qa/m10-incidente`
> Tests: `apps/kobalto-postmortem/postmortemLogic.test.ts`, `engine/c4m10.test.ts` y el recorrido completo de `engine/coursePlaythrough.test.ts`

## Premisa
Año 7. La jugadora es Head of QA de un banco digital con 40 squads y 70 QA. El fin de semana se duplicaron 3.200 transferencias instantáneas; sale en prensa y el regulador pide un informe en 72 horas. Pablo (QA de Pagos) había avisado del riesgo en PAG-412 y firmó el release «con riesgo conocido» porque Producto pedía salir el viernes. En el comité de crisis, Raúl pregunta: «¿dónde estaba QA?».

En la wiki: la ficha del rol Head of QA (`FICHA_HEAD_OF_QA` en `shared.ts`, compartida con la misión 11) y «Postmortems sin culpables».

**Eco de las misiones 0 y 6:** la firma bajo presión que vivió la jugadora como QA manual, y que respaldó como Lead, es ahora la causa de fondo: QA como única puerta.

## App «Postmortem»
- **Cronología:** del ticket del martes al requerimiento del regulador del lunes.
- **Causas:**
  - cinco de sistema: QA como única puerta, sin entorno de reintentos, sin alerta de duplicados, release completo en viernes y sin idempotencia;
  - tres que señalan a personas: Pablo firmó, Producto presionó, el desarrollador se equivocó.
- **Acciones:**
  - cinco de sistema: riesgos aceptados por su dueño, simulador de reintentos, alerta, despliegue gradual e idempotencia obligatoria;
  - tres que no cambian el sistema: doble firma, sanción y congelar releases.

«Guardar el borrador» (30 min, una vez) da `pm.saved`, `pm.causes`, `pm.actions`, `pm.blame` (si señala a alguien) y `pm.ok` (todo de sistema).

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correo de Irene (CEO) | Leer la ficha | — |
| 09:10 | Carmen: «necesito los hechos» | La cronología hoy, con lo que se sabe y lo que no, incluido PAG-412 (`compliance.ok`) | «Caso aislado»; «en unas semanas» |
| 10:00 | Comité de crisis: «¿dónde estaba QA?» | Asumir la parte de QA y llevarlo al sistema; clientes hoy, postmortem esta tarde (`crisis.ok`) | Culpar a Producto (`blame.marta`); culpar a Pablo (`blame.pablo`) |
| 11:00 | Pablo: «¿me van a echar?» | Nadie te va a señalar; cambia el sistema (requiere no haberle señalado; `pablo.supported`) | «Lo veremos»; «firmaste tú» |
| — | Laura, si el borrador es bueno | `pm.ok` | — |
| 14:00 | Postmortem | Sin culpables: cronología de Pablo, causas y acciones con dueño (requiere `pm.ok`; `pm.shared`) | «Quién firmó»; no hacerlo |
| 15:30 | Irene: «¿doblamos QA y doble firma?» | Más firmas no lo habrían evitado: riesgos aceptados por su dueño y calidad en el sistema (requiere `pm.ok`; `org.change`) | Más QA y doble firma; «mala suerte» |
| 16:30 | Carmen: el informe dice «error humano de un QA» | Corregirlo con causas y acciones (`report.accurate`) | Dejarlo |
| 17:00 | Café con Laura | Cierre y `preventBugs` | «Más control» |

## Consecuencias (tres meses después)

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-REGULADOR · expediente por falta de transparencia | `compliance.ok` | crítica |
| C-REPITE · otro riesgo conocido llega a producción | `org.change` | crítica |
| C-CHIVO · Pablo se va y el equipo aprende a no avisar | `pablo.supported` | alta |
| C-CULPA · el postmortem acaba en culpables | `pm.shared` | alta |
| C-INFORME · el informe culpa a un QA | `report.accurate` | alta |
| C-GUERRA · QA y Producto se culpan durante meses | `crisis.ok` | media |

## Conceptos
`crisis_transparency`, `blameless_culture`, `system_causes`, `protect_people` y `org_change` (más `role_head_of_qa`). Seis microlecciones de Laura y un test de 6 + 6 preguntas.

## Ecos en el curso
- **Misión 11:** la estrategia a tres años formaliza el cambio: QA deja de ser la única puerta.
