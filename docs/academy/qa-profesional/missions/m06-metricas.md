# Misión 6: Números que cuentan (QA Profesional)

> Contenido jugable: `frontend/src/features/academy/content/courses/qa-profesional/m06-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-metrics/` (pestaña «Métricas»)
> Ruta: `/academy/qa-profesional/m06-metricas`
> CTFL v4.0: 5.3 (métricas, informes de progreso y de cierre, comunicación del estado, seguimiento y control) y 1.4.1 (cierre de pruebas)

## Premisa
Miércoles, día 5 de 10 del sprint 3 de Kobalto Empresas. El comité aprobó el plan de la M5 y ahora toca demostrar si se cumple: el sprint va por detrás (40 % ejecutado frente al 50 % previsto). Raúl necesita un informe de progreso para dirección a las 12:00 y, al final del día, el informe de cierre de las pruebas del sprint. Tomás avisa de que cerró 5 bugs como «no reproducible» «para que el gráfico quede bonito».

## Mecánicas (app «Métricas», 6 pestañas)
- **Panel:** datos del sprint (solo lectura). 48/120 casos ejecutados (previsto 60), 100 % pasados, 8/20 requisitos con pruebas, 2/5 riesgos altos probados, defectos abiertos 1/3/6/4, 12 cerrados (5 «no reproducible» sin verificar), 0 defectos en tarjetas con 0 casos ejecutados.
- **Métricas:** elegir las que van al informe. Correctas: avance frente al plan, cobertura de requisitos, defectos por severidad y estado, riesgo residual. Trampas: volumen de casos, % de pasados sin contexto, líneas de código, defectos por persona.
- **Lecturas:** 5 frases, fiables o engañosas. Engañosas: el 100 % de pasados, los 12 cerrados y «tarjetas, 0 defectos». Fiables: 40 % frente al 50 % y el crítico en facturas.
- **Informes:** borrador para dirección (detalle técnico / verde maquillado / ámbar con riesgo y decisión) y para el equipo (semáforo / detalle accionable / ranking por persona).
- **Control:** 7 acciones; las buenas son repriorizar, reabrir los «no reproducible», renegociar el alcance o el criterio de salida y pedir entorno y apoyo. Las malas esconden datos o queman al equipo.
- **Cierre:** se desbloquea tras enviar el progreso. Buenas: criterios de salida y desviaciones, pendientes registrados, testware archivado, lecciones aprendidas. Malas: borrar casos fallidos, cerrar callando los riesgos.
- **Laura (10 min):** revisa sin dar la solución.
- **Envío del progreso (15 min):** flags `progress.sent`, `metrics.ok`, `misleading.ok`, `report.mgmt`, `report.team`, `report.audience`, `control.ok` y, si se eligió el verde, `report.makeup`.
- **Envío del cierre (15 min):** flags `closure.sent` y `closure.ok`.

## Escenas
- **9:00** correo de Raúl. **9:20** chat de Tomás (los «no reproducible»). **9:40** pista de Laura.
- **Condicional:** Laura felicita si el progreso se envió con métricas, lecturas y audiencias correctas.
- **12:00 estado con dirección:** ámbar con datos (`status.honest`, requiere `report.mgmt`), verde maquillado (`report.makeup`) o volumen («48 casos y 26 defectos»).
- **15:00 seguimiento:** acciones de control (`control.defended`, requiere el progreso enviado), horas extra o esconder los riesgos (`report.makeup`).
- **17:00 café con Laura:** ejecuta `preventBugs` al entregarse y cierra la misión. El cierre del sprint debe enviarse antes.

## Problemas (`preventedBy`)

| Problema | Flag | Severidad |
|---|---|---|
| P-VOLUMEN | `metrics.ok` | media |
| P-VERDE | `misleading.ok` | alta |
| P-NOREPRO | `control.ok` | alta |
| P-AUDIENCIA | `report.audience` | media |
| P-ESTADO | `status.honest` | crítica |
| P-TARJETAS | `control.defended` | crítica |
| P-CIERRE | `closure.ok` | media |

## Verificación
- `frontend/src/features/academy/engine/c2m06.test.ts`: evaluación de la app, recorrido óptimo sin problemas y veredicto bueno, y recorrido maquillado con problemas.
- `frontend/src/features/academy/apps/kobalto-metrics/KobaltoMetricsApp.test.tsx`: render del panel, cambio de pestaña y envío del informe.
