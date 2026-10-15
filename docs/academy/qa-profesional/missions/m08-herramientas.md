# Misión 8: Herramientas (QA Profesional)

> Contenido jugable: `frontend/src/features/academy/content/courses/qa-profesional/m08-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-tools/` (pestaña «Herramientas»)
> Ruta: `/academy/qa-profesional/m08-herramientas`
> CTFL v4.0: 6.1 (tipos de herramientas) y 6.2 (beneficios y riesgos de la automatización). El piloto se presenta como buena práctica, no examinable en v4.0.

## Premisa
Jueves. Dirección aprueba 20.000 € al año para herramientas del squad Empresas y se decide a las 15:00. Tres proveedores han hecho demo y Sergio (QA Automation) está entusiasmado con TestForge Pro. Es la última misión del curso: termina con la retro del squad.

## Mecánicas (app «Herramientas», 3 pestañas)
- **Necesidades:** 7 necesidades de la retro, cada una en su categoría (gestión, estáticas, diseño e implementación, ejecución y cobertura, no funcionales, DevOps, colaboración).
- **Candidatas:** tres fichas ficticias con su letra pequeña. Hay que marcar los riesgos de cada una y elegir la del piloto.
  - **TestForge Pro:** grabar y reproducir, 18.000 €/año a 3 años. Riesgos: expectativas irreales y mantenimiento.
  - **QualiCloud:** SaaS, 9.000 €/año, formato propietario y sin CI. Riesgos: dependencia del proveedor y CI.
  - **Kestrel:** código abierto, API y BDD en el repo, plugin de CI. Riesgo: curva de aprendizaje. Es la candidata correcta.
- **Piloto:** alcance (piloto de 4 semanas en la API de facturas) y criterios de éxito: CI en menos de 10 min, menos del 5 % de pruebas inestables y equipo autónomo. Trampas: 100 % en un mes, «que le guste a Sergio» y eliminar las exploratorias.
- **Laura (10 min):** revisa sin dar la solución.
- **Envío (15 min):** flags `proposal.sent`, `needs.ok`, `eval.ok`, `choice.ok` y `pilot.ok` (alcance más criterios).

## Escenas
- **9:00** correo de Raúl. **9:20** Sergio («automatizamos todo en un mes»). **9:40** pista de Laura.
- **Condicional:** Laura felicita si la propuesta llega con necesidades, riesgos y piloto correctos.
- **12:00 café con Sergio:** «un 30 % de descuento si firmamos hoy». Opciones: frenar y sumarlo al piloto (`sergio.aligned`, requiere la propuesta enviada), firmar (`tool.rushed`) o no automatizar nada.
- **15:00 comité:** piloto con Kestrel (`proposal.defended`, requiere `choice.ok` y `pilot.ok`), comprar dos herramientas (se pasa del presupuesto) o prometer el 100 % en un mes (`promise.unrealistic`).
- **17:00 retro del squad:** cierre del curso con todo el equipo. Ejecuta `preventBugs` al entregarse.

## Problemas (`preventedBy`)

| Problema | Flag | Severidad |
|---|---|---|
| P-CATEGORIA | `needs.ok` | media |
| P-RIESGOS | `eval.ok` | media |
| P-FRAGIL | `choice.ok` | alta |
| P-PILOTO | `pilot.ok` | alta |
| P-PRISA | `sergio.aligned` | alta |
| P-EXPECTATIVAS | `proposal.defended` | crítica |

## Verificación
- `frontend/src/features/academy/engine/c2m08.test.ts`: evaluación de la app, recorrido óptimo sin problemas y veredicto bueno, y recorrido por impulso con problemas.
- `frontend/src/features/academy/apps/kobalto-tools/KobaltoToolsApp.test.tsx`: render, cambio de pestaña y envío.
