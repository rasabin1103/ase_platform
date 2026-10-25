# Misión 11: La estrategia (Gestión de equipos QA · rol Head of QA)

> Contenido jugable: `frontend/src/features/academy/content/courses/gestion-equipos-qa/m11-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-strategy/` (pestaña «Estrategia»)
> Ruta: `/academy/gestion-equipos-qa/m11-estrategia`
> Tests: `apps/kobalto-strategy/strategyLogic.test.ts`, `engine/c4m11.test.ts`, el recorrido completo de `engine/coursePlaythrough.test.ts` y el E2E hasta el certificado

## Premisa
Año 8, la última misión de la carrera. La jugadora, Head of QA, presenta al comité de dirección la estrategia de calidad a tres años. Héctor y Sergio son ahora QA Managers y dudan del cambio; Raúl (CTO) cree que «la calidad es cosa de QA». Irene (CEO) ensaya con ella antes del comité.

En la wiki: la ficha del rol Head of QA (compartida con la misión 10) y «Cómo presentar al comité de dirección».

**Eco de toda la carrera:** el cierre con Laura repasa los ocho años, de firmar el primer release a cambiar cómo trabaja la empresa.

## App «Estrategia»

**Situación en cifras:**

- 2,1 M€ de coste de la no calidad;
- 4 incidentes graves al año, el 60 % riesgos conocidos;
- 12 días del código a producción, 5 de ellos esperando a QA;
- 70 QA, la mitad en un equipo central;
- 22 QA sobre todo manuales;
- 14.000 tests y una cobertura del 78 %.

**Métricas para el comité (4).** Las buenas son coste de la no calidad, incidentes graves, tiempo a producción y defectos escapados. Las trampas son número de tests, cobertura, bugs encontrados y ratio QA/desarrollo.

**Cuatro decisiones:**

| Sección | Buena opción | Malas opciones |
|---|---|---|
| Modelo | Híbrido: QA embebidos, plataforma de calidad común, equipo pequeño de estándares y riesgos aceptados por su dueño | Centralizado; todo embebido sin nada común; sin QA |
| Inversión | Por fases, ligada a métricas, revisión semestral | Todo el primer año; sin inversión |
| Hoja de ruta | Piloto en pagos y política de riesgos para todos; Banca diaria; el resto | Toda la empresa a la vez; sin fechas |
| Personas | Plan de transición: formación, carrera y nadie se queda atrás | Sustituir a los QA manuales; no mencionarlo |

«Guardar» (30 min, una vez) da:

- `strat.saved` y `strat.metrics`;
- `strat.model`, `strat.invest`, `strat.roadmap` y `strat.people`;
- `strat.ok` (todo bien).

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correos de Irene y Laura | Leer la ficha | — |
| 09:30 | Héctor y Sergio (QA Managers): «perdemos el control» | El riesgo es real; cada uno lidera una pieza del cambio (`managers.aligned`) | «Es la decisión»; «no va a cambiar nada» |
| 11:00 | Raúl (chat): «la calidad es cosa de QA» | Su propia métrica (5 de 12 días esperando a QA) y un piloto medible con sus equipos (`cto.won`) | «Lo decide Irene»; ceder |
| — | Laura, si la estrategia está completa | `strat.ok` | — |
| 16:00 | Ensayo con Irene | Problema en su idioma, propuesta, petición concreta (requiere `strat.ok`; `pitch.ok`) | Tests y cobertura; cuarenta diapositivas |
| 16:30 | Irene: «¿y si no hacemos nada?» | Coste de no actuar y objetivo medible (`committee.ok` si `pitch.ok`) | «El regulador nos sancionará seguro»; «no lo sé» |
| 17:00 | El último café con Laura | Cierre y `preventBugs` | «Ahora tengo poder para que me hagan caso» |

## Consecuencias (un año después)

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-METRICAS · el comité no ve el valor | `strat.metrics` | alta |
| C-MODELO · QA vuelve a ser la puerta, o desaparece | `strat.model` | crítica |
| C-PERSONAS · se van los mejores QA manuales | `strat.people` | alta |
| C-MANAGERS · los QA Managers frenan el cambio | `managers.aligned` | alta |
| C-CTO · desarrollo no asume su parte | `cto.won` | media |
| C-COMITE · el comité aplaza la decisión | `committee.ok` | alta |

## Conceptos
`quality_metrics`, `quality_model`, `exec_pitch` y `lead_change` (más `role_head_of_qa`). Seis microlecciones de Laura y un test de 6 + 6 preguntas.

## Después de la misión
Con las 12 misiones terminadas se desbloquea la **evaluación situacional final** (ver PLAN §6): 30 casos, 5 por rol, 45 minutos, aprobado con 21, informe por rol y certificado `GEQ`.
