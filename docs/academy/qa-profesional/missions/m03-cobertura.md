# Misión 3: Dentro del código (QA Profesional)

> Contenido jugable: `frontend/src/features/academy/content/courses/qa-profesional/m03-*.ts`
> App: `frontend/src/features/academy/apps/kobalto-coverage/` (pestaña «Cobertura»)
> Ruta: `/academy/qa-profesional/m03-cobertura`
> CTFL v4.0: 4.3 (cobertura de sentencias y de ramas, valor de la caja blanca) y 2.2.1 (pruebas de componente)

## Premisa
Miércoles. Carmen recibe quejas: las facturas a empresas de autónomos veteranos llevan una retención de IRPF de risa. Tomás dice que el cálculo tiene «100 % de cobertura» y que el fallo estará en el PDF.

## Código bajo prueba (`totalFactura`)
- 11 sentencias y 3 decisiones (6 ramas).
- **B-RET** (alta): la rama «sino» de `añosDeAlta < 3` usa 0,015 en vez de 0,15.
- **B-REV** (media): `base > 3000`, cuando la especificación dice «3.000 € o más».

## Suite heredada de Tomás
| Caso | Qué hace | Ramas |
|---|---|---|
| #1 | Empresa, 1 año, 5.000 € (con aserción) | D1V · D2V · D3V |
| #2 | Particular, 4.000 € (con aserción) | D1F · D3V |
| #3 | Empresa, 5 años, 4.000 € (**sin aserción**) | D1V · D2F · D3V |

Resultado: 100 % de sentencias, 83 % de ramas (falta D3F) y todo en verde, con el bug dentro.

## Mecánicas
- **Visor de código:** líneas ejecutadas en verde y no ejecutadas en rojo; badges V/F por decisión; medidores de sentencias y de ramas.
- **Tabla de casos editable:** base, cliente, años de alta, «Comprueba», total esperado y revisión esperada. Añadir un caso cuesta 5 min y ejecutar la suite, otros 5.
- **Evaluación de cada caso** contra el código (bugs) y contra la especificación (oráculo):
  - pasa;
  - pasa sin comprobar nada;
  - falla por un bug real (activa el bug en el log);
  - falla con un esperado incorrecto;
  - pasa con el oráculo copiado del código (`cov.copied_oracle`).
- **Reporte:** los bugs se reportan en el Tablero con la ejecución como evidencia.
- **Corrección:** al aceptarse, Tomás despliega la corrección (45 y 30 min); el código del visor cambia y se puede verificar.

## Escenas
- **09:15 Tomás:** «100 % de cobertura» → cuestionarlo o perder una hora con el PDF.
- **11:30 Sofía:** tests sin aserciones para subir la cobertura.
- **15:30 Raúl:** umbral de cobertura en el pipeline (ramas como indicador frente a «90 % de sentencias»).
- **Reacciones:** Laura con B-RET y al llegar al 100 % de ramas; Carmen con B-REV.

## Recorrido óptimo
1. Ejecutar la suite: 100 % / 83 %.
2. Marcar «Comprueba» en el #3: esperado 4.240 € con revisión.
3. Añadir un caso con 3.000 € justos: particular, 3.630 €, revisión sí.
4. Ejecutar de nuevo: dos fallos reales y 100 % de ramas.
5. Reportar los dos bugs.
6. Verificar las correcciones.

## Verificación
- `engine/c2m03.test.ts` (4 tests):
  - cobertura de la suite heredada;
  - oráculo copiado;
  - recorrido óptimo con veredicto «good»;
  - «creerse el 100 %».
- E2E Playwright:
  - los dos bugs reportados y aceptados;
  - 100 % / 100 % tras la corrección;
  - veredicto «La cobertura bien leída»;
  - sin errores de consola.
