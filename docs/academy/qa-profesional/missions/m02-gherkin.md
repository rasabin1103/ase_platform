# Misión 2: Dado, cuando, entonces (QA Profesional)

> Contenido jugable: `frontend/src/features/academy/content/courses/qa-profesional/m02-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-gherkin/` (pestaña «Escenarios»)
> Ruta: `/academy/qa-profesional/m02-gherkin`
> CTFL v4.0: 2.1.3 (TDD, ATDD, BDD) y 4.5 (historias y 3C, criterios de aceptación, ATDD)

## Premisa
Martes. Historia KOB-E-21 «Cobro por enlace de pago»: el autónomo crea un enlace de 1 a 5.000 € y su cliente paga con tarjeta. Raúl prueba ATDD: los escenarios acordados son la especificación, el criterio de aceptación y el test automatizado. A las 15:00 Tomás programa a partir de ellos; lo que no esté en un escenario correcto, lo decide él.

## Mecánicas
1. **Tres amigos (09:10).** Elena quiere «el caso feliz y listo».
   - **Mapeo de ejemplos:** desbloquea las reglas ocultas (caducidad a 7 días, pago único, anulación mientras no esté pagado) y sus pasos en el editor.
   - **Caso feliz:** solo quedan disponibles el importe y el pago.
   - **«Lo pruebo al final»:** es test-last; también penaliza.
2. **Editor Gherkin** (app «Escenarios»):
   - Escenarios construidos con pasos de una biblioteca (Dado / Cuando / Entonces).
   - Esquema del escenario con tabla de ejemplos (importe y resultado).
   - Nuevo escenario: 5 min. Editar es gratis.
   - Evaluador determinista (`gherkinLogic.ts`):
     - malos olores: pasos de interfaz, varios Cuando, «todo funciona correctamente», varios contextos, falta Cuando o Entonces;
     - resultados esperados incorrectos;
     - reglas cubiertas.
   - Bordes del importe: hacen falta 0,99 (rechaza), 1,00 (acepta), 5.000,00 (acepta) y 5.000,01 (rechaza).
3. **Revisión de Laura** (10 min): señala malos olores y cuántas reglas faltan, sin dar la solución.
4. **Acordar con Elena y Tomás** (15 min, una sola vez): activa los flags `gk.*`; Tomás y Elena reaccionan según la calidad.
5. **TDD con Sofía** (desde las 10:30, pestaña «TDD con Sofía»):
   - acciones: escribir test, ejecutar, código mínimo, «todo el código», refactor;
   - `tdd.min`: hay test del mínimo y está en verde;
   - `tdd.cycle`: rojo antes del código, verde y refactor seguido de ejecución;
   - penalizaciones: código antes del test y refactor en rojo.
6. **15:00, desarrollo:** `preventBugs`. **16:30, demo:** si falta el escenario del doble pago, Elena paga dos veces. Hay que explicar que «escenarios en verde» no significa «sin defectos».

## Bugs (`preventedBy`)

| Bug | Flag | Severidad |
|---|---|---|
| G-MIN · enlaces de 0,50 € | `gk.r1min` | media |
| G-MAX · 5.000,00 € se rechaza | `gk.r1max` | alta |
| G-CAD · caducado se puede pagar | `gk.r2` | alta |
| G-DOBLE · doble pago | `gk.r3` | crítica |
| G-ANUL · anulado se puede pagar | `gk.r4` | alta |
| G-ANUL-PAG · anular un pagado | `gk.r5` | alta |
| G-COM · sin comisión mínima | `tdd.min` | media |
| G-UI · suite frágil | `gk.style` | media |

## Debrief
Nuevo bloque genérico `Mission.prevention`: reglas cubiertas (✓/✗) y bugs evitados o nacidos. Es reutilizable en misiones sin revisión de requisitos.

## Verificación
- `engine/c2m02.test.ts`:
  - parseo de importes y malos olores;
  - recorrido óptimo: 0 bugs y veredicto «good»;
  - recorrido malo: nacen los 8 bugs.
- E2E Playwright del recorrido óptimo:
  - 10/10 reglas;
  - 8 bugs evitados;
  - veredicto «Especificación por ejemplos»;
  - sin errores de consola.
