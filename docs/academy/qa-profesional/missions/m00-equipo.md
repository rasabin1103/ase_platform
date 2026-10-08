# Misión 0: Equipo nuevo (QA Profesional) · demo gratuita

> Contenido jugable: `frontend/src/features/academy/content/courses/qa-profesional/m00-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-process/` (pestaña «Proceso»)
> Ruta: `/academy/qa-profesional/m00-equipo`
> CTFL v4.0: 1.4 (actividades, testware, trazabilidad, roles), 1.5 (equipo completo, independencia), 2.1 (pruebas en el ciclo de vida)

Es la primera misión del curso, así que es la demo gratuita cuando el curso tiene precio (`isFreeMission`).

## Premisa
Lunes, primer día como responsable de calidad del squad Kobalto Empresas, donde cada uno prueba a su manera.
- Raúl quiere una propuesta de proceso para el comité de las 15:00.
- Carmen necesita para auditoría, a las 14:00, la trazabilidad de «Tarjetas de equipo».

## Mecánicas
1. **Daily (09:15).** Tomás propone que cada dev pruebe lo suyo. Tres opciones:
   - equipo completo con independencia (`team.indep`);
   - aceptar;
   - «solo QA prueba».
2. **App «Proceso» · Mapa del proceso.** Hay que:
   - ordenar las 7 actividades (salen desordenadas);
   - elegir el testware de cada una (también desordenado);
   - elegir su responsable (gestión de pruebas o tester).

   Reglas del orden: planificación la primera, cierre el último y análisis → diseño → implementación → ejecución; seguimiento y control puede ir en cualquier posición. «Enviar la propuesta» (15 min, una vez) activa `proc.submitted`, `proc.order`, `proc.testware`, `proc.roles` y `proc.all`.
3. **App «Proceso» · Trazabilidad.** 11 enlaces:
   - condición → historia;
   - caso → condición;
   - defecto → caso.

   «Enviar la matriz a Carmen» (10 min, una vez) activa `trace.ok` si todos son correctos.
4. **Revisión de Laura (10 min).** Pistas sin solución.
5. **Café con Tomás (11:30).** Quiere quitar el cierre por «papeleo» (`proc.drop_closure`).
6. **Carmen (14:00).** La respuesta con la cadena completa solo se puede elegir con `trace.ok`.
7. **Comité (15:00).**
   - Activa `proc.closure` si hubo propuesta y no se quitó el cierre.
   - Ejecuta `preventBugs`.
   - Pregunta cuándo entra QA en cada historia: desde el refinamiento (`sdlc.early`) o al final.

## Problemas (`preventedBy`)

| Problema | Flag | Severidad |
|---|---|---|
| P-ORDEN · casos sin condiciones | `proc.order` | media |
| P-TESTWARE · testware que se pierde | `proc.testware` | media |
| P-ROLES · nadie decide cuándo parar | `proc.roles` | alta |
| P-CIERRE · errores repetidos entre sprints | `proc.closure` | media |
| P-TRAZA · auditoría sin evidencia | `trace.ok` | alta |
| P-INDEP · defectos de integración en producción | `team.indep` | crítica |

El debrief usa `Mission.prevention`: 7 reglas, que incluyen `sdlc.early`.

## Verificación
- `engine/c2m00.test.ts`:
  - reglas de orden;
  - recorrido óptimo: 0 problemas y veredicto «good»;
  - recorrido malo: aparecen P-INDEP, P-TRAZA y P-CIERRE.
- E2E Playwright del recorrido óptimo:
  - 7/7;
  - veredicto «Un proceso con sentido» con 4 estrellas en todo;
  - sin errores de consola.
