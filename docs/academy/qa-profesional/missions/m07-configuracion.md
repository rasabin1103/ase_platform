# Misión 7: ¿Qué versión es? (QA Profesional)

> Contenido jugable: `frontend/src/features/academy/content/courses/qa-profesional/m07-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-config/` (pestaña «Configuración»)
> Ruta: `/academy/qa-profesional/m07-configuracion`
> CTFL v4.0: 5.4 (gestión de la configuración), 2.3 (pruebas de mantenimiento, disparadores y análisis de impacto), 5.5 (informe de defecto, repaso) y 2.2.3 (confirmación y regresión)

## Premisa
Martes. Elena ve en staging que una factura recurrente de 33,33 € lleva 6,99 € de IVA en lugar de 7,00 €. Tomás no lo reproduce en su local y pide cerrar EMP-231 porque «ya está subido». Raúl avisa de que el proveedor de facturación electrónica migra a su API v2 el lunes y solo hay tres días para probar.

## Mecánicas (app «Configuración», 4 pestañas)
- **Entornos:** comparador local / staging / producción de 6 elementos (app web, API, esquema, flag, billing.yml, datos). Hay que elegir la causa de la diferencia y el elemento sin control de versiones: en los dos casos, `billing.yml` (`round: down` en staging, editado a mano).
- **Builds:** historial #405–#412. EMP-231 entra en la #412 y staging tiene la #409: hay que desplegar la #412 y verificar sobre ella.
- **Defecto:** título, entorno con versiones y resultado esperado frente al real, cada uno entre 3 redacciones.
- **Mantenimiento:** disparador (migración o actualización del entorno operativo) y análisis de impacto sobre 8 suites de TestHub con su duración. Las afectadas son emisión, recurrentes, rectificativas y PDF (3 días); todas suman 5,5 días.
- **Laura (10 min):** revisa sin dar la solución.
- **Envío (15 min):** flags `analysis.sent`, `config.found`, `config.unversioned`, `build.ok`, `report.ok`, `trigger.ok`, `impact.ok` y, si se seleccionan todas las suites, `regression.fear`.

## Escenas
- **9:00** correos de Elena y Raúl. **9:20** Tomás («en mi local no pasa», «cierra EMP-231»). **9:40** pista de Laura. **10:30** Iván: staging sigue en la #409.
- **11:30 ¿Cerramos EMP-231?:** desplegar la #412 y verificar (`fix.verified`, requiere `build.ok`), cerrar a ciegas o reabrir probando en la build equivocada.
- **Condicional:** Laura felicita si el análisis llega con la causa, el informe y el impacto correctos.
- **14:00 el billing.yml:** versionarlo y desplegarlo con el pipeline (`config.controlled`, requiere `config.found`), editarlo a mano otra vez o forzarlo en el código.
- **15:00 regresión de la migración:** por impacto (`regression.impact`, requiere `impact.ok`), completa por miedo o ninguna.
- **17:00 café con Laura:** ejecuta `preventBugs` al entregarse y cierra la misión.

## Problemas (`preventedBy`)

| Problema | Flag | Severidad |
|---|---|---|
| P-CAUSA | `config.found` | media |
| P-FIX | `fix.verified` | crítica |
| P-INFORME | `report.ok` | media |
| P-CONFIG | `config.controlled` | alta |
| P-IMPACTO | `impact.ok` | alta |
| P-REGRESION | `regression.impact` | alta |

## Verificación
- `frontend/src/features/academy/engine/c2m07.test.ts`: evaluación de la app, recorrido óptimo sin problemas y veredicto bueno, y recorrido a ciegas con problemas.
- `frontend/src/features/academy/apps/kobalto-config/KobaltoConfigApp.test.tsx`: render del comparador, cambio de pestaña y envío.
