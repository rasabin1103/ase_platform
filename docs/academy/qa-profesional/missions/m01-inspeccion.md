# Misión 1: La inspección (QA Profesional)

> Contenido jugable: `frontend/src/features/academy/content/courses/qa-profesional/m01-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-inspection/`
> Ruta: `/academy/qa-profesional/m01-inspeccion`
> CTFL v4.0: 3.1 y 3.2 (3.2.2 proceso, 3.2.3 roles, 3.2.4 tipos, 3.2.5 factores de éxito)

## Premisa
Primer lunes en el squad Empresas. Elena (PO) ha escrito con prisa la spec KOB-E-12 «Facturación recurrente». Carmen (Compliance) necesita evidencia para auditoría. A las 16:00 la spec pasa a desarrollo: lo que no se encuentre antes se convierte en bug.

## Qué enseña
- **Testing estático:** encontrar defectos en un documento cuesta una frase; en producción, facturas mal emitidas.
- **Tipos de revisión:** informal, walkthrough, técnica e inspección. Se elige según el objetivo; Carmen pide evidencia, así que toca inspección.
- **Roles:**
  - la autora no modera;
  - el jefe (Raúl) fuera de la sala;
  - hace falta escriba;
  - los revisores aportan perspectivas distintas (técnica, normativa, junior).
- **Proceso:** planificación, revisión individual con checklist, reunión, corrección y seguimiento.
- **Factores de éxito:** feedback sobre el producto y no sobre la persona, y seguimiento de las correcciones.

## Mecánicas
1. **Daily (09:00):** defender una revisión formal y proporcionada frente a «me la leo yo en diez minutos».
2. **Sala, planificación** (una sola convocatoria, 15 min):
   - tipo de revisión;
   - rol de cada persona;
   - checklist sí o no.
   
   Laura reacciona a los errores de planificación: manager en la sala, sin escriba, moderación por la autora.
3. **Revisión individual:** el jugador marca fragmentos (ambiguo, incompleto, contradictorio, no verificable).
4. **Reunión** («Celebrar la reunión de revisión»):
   - el resto del equipo aporta sus hallazgos según la planificación (`teamFindings`):
     - Carmen: numeración, rectificativa y normativa (esta última solo con checklist);
     - Tomás: IVA y reintentos;
     - Sofía: prorrateo, solo en inspección y sin el jefe delante.
   - El jugador debe encontrar por sí mismo la contradicción de fechas y el «rápido» no verificable.
   - Elena se pone a la defensiva y el jugador elige cómo reconducirlo.
5. **Corrección y seguimiento:** Elena sube la v2. «Verificar las correcciones» detecta que el ejemplo del IVA sigue mal. Sin seguimiento aparece E-FU.
6. **16:00, paso a desarrollo:** los defectos no aclarados se convierten en bugs (`preventBugs`). Informe de cierre para Carmen.

## Bugs (todos con `preventedBy`)
E-FECHA, E-NUM, E-IVA, E-PLAN, E-REINT, E-BORRAR, E-RAPIDO, E-NORMA, E-FU.

## Verificación
- `engine/c2m01.test.ts`:
  - una inspección bien planificada evita todo;
  - un walkthrough con el jefe en la sala solo encuentra el IVA.
- E2E Playwright con el recorrido óptimo:
  - 8/8 defectos y 9 bugs evitados;
  - decisiones todas en verde;
  - sin errores de consola.
