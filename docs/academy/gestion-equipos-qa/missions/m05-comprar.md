# Misión 5: Construir o comprar (Gestión de equipos QA · rol QA Architect)

> Contenido jugable: `frontend/src/features/academy/content/courses/gestion-equipos-qa/m05-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-vendor/` (pestaña «Evaluación»)
> Ruta: `/academy/gestion-equipos-qa/m05-comprar`
> Tests: `apps/kobalto-vendor/vendorLogic.test.ts`, `engine/c4m05.test.ts` y el recorrido completo de `engine/coursePlaythrough.test.ts`

## Premisa
Año 3, la jugadora sigue de QA Architect. Montar un entorno de pruebas tarda tres días y varios squads copian datos de producción para probar. Hay que elegir una plataforma de entornos efímeros y datos de prueba:

- un proveedor (Sandbloq, ficticio) presiona con un descuento;
- Plataforma quiere construirla;
- Raúl pide el coste a tres años para el comité.

En la wiki: la ficha del rol QA Architect (compartida con la misión 4) y «Cómo evaluamos herramientas en Plataforma».

## App «Evaluación»
Cuatro pestañas:
- **Necesidades:** el problema y diez criterios posibles. Seis son buenos (anonimización, plazo de un trimestre, pipeline, coste total, salida y mantenimiento) y cuatro no (la mejor demo, el descuento, lo que usa el sector, lo que apetece construir). «Guardar los criterios» (10 min) da `criteria.set` y `criteria.ok` si se eligen los seis buenos sin ninguno malo.
- **Opciones:** comparación de comprar, construir y open source: plazo, anonimización, pipeline, dependencia y carga para Plataforma.
- **Coste a 3 años:** se elige qué partidas se cuentan. «Guardar la comparativa» (15 min) da `tco.saved` y `tco.ok` (las cinco partidas) o `tco.partial`. Se puede rehacer.
- **Recomendación** (requiere criterios y comparativa): opción, diseño del piloto y condiciones. «Enviar la recomendación» (20 min) da:
  - `rec.sent` y `rec.<opción>`;
  - `pilot.ok`: piloto acotado con criterios y «firmar solo si cumple»;
  - `exit.ok`: cláusula de salida sin contrato cerrado, o no comprar;
  - `rec.good`: comprar, con criterios y coste completos, piloto, salida y revisión a los 12 meses.

| Partida (k€, 3 años) | Comprar | Construir | Open source |
|---|---|---|---|
| Licencias | 270 | 0 | 0 |
| Puesta en marcha | 25 | 150 | 90 |
| Personas | 54 | 210 | 210 |
| Infraestructura | 0 | 75 | 90 |
| Salida | 30 | 0 | 0 |
| **Total** | **379** | **435** | **390** |

Solo con licencias, comprar parece lo más caro y lo demás gratis. Con el coste total, comprar sale lo más barato y es lo único que llega en un trimestre.

## Escenas y decisiones

| Hora | Escena | Buena decisión (flag) | Malas decisiones |
|---|---|---|---|
| 09:00 | Correos de Raúl y Laura | Leer la guía de evaluación | — |
| 09:20 | Llamada de Olga: 30 % si firmáis tres años antes del viernes | Piloto con vuestro pipeline y datos anonimizados, y cláusula de salida (`vendor.pilot`) | «Prepárame el contrato» (`vendor.rushed`); «lo miro» |
| 10:30 | Iván (chat): «lo hacemos en dos sprints» | Su opción entra con los mismos criterios y una estimación con mantenimiento (`build.fair`) | «No tenéis tiempo»; «construidlo» |
| — | Laura reacciona a criterios y comparativa | `criteria.ok`, `tco.partial` (aviso) o `tco.ok` | — |
| 13:00 | Carmen (Riesgos): «¿saldrán datos de clientes?» | Sintéticos o anonimizados, contrato de tratamiento y comprobación en el piloto (`privacy.ok`) | «Son datos de prueba»; «después de firmar» |
| — | Raúl reacciona a la recomendación | `rec.good` | — |
| 16:00 | Raúl prepara el comité | Recomendación, criterios, coste total, riesgos, piloto y revisión (requiere `rec.sent`; `committee.ok` solo si `rec.good`) | «Lo más barato en licencias es construir»; «decide tú» |
| 17:00 | Café con Laura | Cierre y `preventBugs` | «Gana lo más barato» |

## Consecuencias (un año después)

| Consecuencia | Flag | Severidad |
|---|---|---|
| C-SORPRESA · el primer año cuesta el doble: nadie contó las personas | `tco.ok` | alta |
| C-ATADOS · el proveedor sube un 40 % y no podéis salir | `exit.ok` | alta |
| C-DATOS · datos reales de clientes en la plataforma de pruebas | `privacy.ok` | crítica |
| C-DEMO · no encaja con el pipeline | `pilot.ok` | media |
| C-SOMBRA · Plataforma construye su propia herramienta | `build.fair` | media |
| C-COMITE · el comité devuelve la propuesta | `committee.ok` | media |

## Conceptos
`eval_criteria`, `tco`, `build_vs_buy`, `pilot_success`, `vendor_lockin` y `test_data_privacy` (más `role_qa_architect`). Seis microlecciones de Laura y un test de 6 + 6 preguntas.

## Ecos en el curso
- **Misión 9:** como QA Manager, el coste de herramientas y personas vuelve en el plan de capacidad y los recortes.
