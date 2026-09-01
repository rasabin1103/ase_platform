# MVP1 — Checklist de lanzamiento (estado real, verificado en base de datos)

Porcentajes estimados a partir de los datos reales de producción (Supabase),
no de lo que debería haber según el código — reflejan cuánto falta para
poder enseñar cada pieza sin que dé vergüenza o sin que prometa algo que
todavía no cumple.

Actualizado 2026-09-01, tras la última tanda de contenido subido.

## 1. Skills / Recursos — **90%** (antes 40%)

Hecho: los 6 recursos reales están publicados, con descripción real y
extensa (122-193 caracteres de resumen, 1.500-3.700 de descripción larga),
precio real (5,99 € - 17,99 €) e imagen — `QA Strategy Blueprint`,
`Evidencias QA PRO`, `ASE Quality Architecture`, `ASE Test Automation
Architect`, `ASE CI/CD Quality Architect`, `Shift Left PRO`.

Falta:
- [ ] Queda un ítem de prueba sin terminar: `pytest` (tipo producto, en
  borrador, descripción de 6 caracteres, precio 0 €). Termínalo o bórralo
  antes de lanzar.
- [ ] Revisión visual rápida de que las 6 imágenes/portadas están a nivel
  "vendible" (esto no lo puedo verificar por base de datos, solo que existen).

## 2. Libros — **sin dato / a confirmar**

El libro `el arte de qa` que aparecía en la revisión anterior **ya no
existe en el catálogo** — no hay ningún ítem de tipo libro en la base de
datos ahora mismo. ¿Lo borraste a propósito (lo dejas fuera del MVP1) o se
perdió por error? Dímelo y actualizo esta sección con el estado que
corresponda.

## 3. Compra individual (pago suelto de un producto) — **60%** (antes 50%)

Hecho: ya hay 6 recursos publicados con precio real — el bloqueo de "no
hay nada que comprar" está resuelto.

Falta — sigue siendo lo importante: las **5 compras que existen en la
base de datos son todas `admin_grant`** (concedidas a mano para pruebas),
ninguna pasó por Stripe. El flujo de pago real todavía no se ha probado de
principio a fin.

- [ ] Hacer una compra de prueba de extremo a extremo con Stripe (modo test).
- [ ] Confirmar que el webhook de Stripe concede el acceso automáticamente (no a mano).
- [ ] Repetir en modo real con un pago pequeño antes de anunciar el lanzamiento.

## 4. Plan Free / Associate — **20%** (sin cambios)

Hecho: el plan existe, activo, precio 0 €, con 5 líneas de funcionalidades.

Falta: sigue con **cero ítems de catálogo vinculados** — de hecho, la
tabla que conecta planes con recursos (`plan_catalog_items`) está
completamente vacía para los 5 planes, no solo para Associate.

- [ ] Decidir explícitamente qué 2-3 recursos entran gratis en Associate.
- [ ] Vincularlos de verdad (tabla `plan_catalog_items`).
- [ ] Reescribir las 5 frases de funcionalidades para que digan algo real y específico, no genérico.

## 5. Plan de pago (ej. "Professional") — **15%** (sin cambios)

Ningún plan de pago (Professional, Expert, Enterprise, Architect) tiene
`stripe_price_id` — hoy no se puede suscribir nadie de verdad aunque el
botón exista. Tampoco hay ítems de catálogo vinculados a ninguno.

- [ ] Crear el precio real en Stripe y guardar su ID (en los 4 planes de pago).
- [ ] Vincular qué entra en cada plan.
- [ ] El plan "Architect" sigue con el código roto — `arch-,mensual` — y 0
  funcionalidades cargadas. Decide si lo arreglas, lo ocultas o lo borras.

## 6. Blog — **60%** (sin cambios)

Sigue habiendo solo 1 artículo publicado.

- [ ] Escribir 3-5 artículos más antes de anunciar el lanzamiento.

## 7. Servicios — **90%** (sin cambios)

6 servicios activos, con descripciones reales, categorías y tipo de precio
definidos. Sin bloqueantes.

## 8. Login, navegación, notificaciones — **95%** (sin cambios)

Ya auditado, no requiere trabajo nuevo para MVP1.

---

## Resumen

| Elemento | % listo | Bloqueante principal |
|---|---|---|
| Skills/Recursos | 90% | Terminar o borrar el ítem "pytest" de prueba |
| Libros | — | Confirmar si se deja fuera del MVP1 o se perdió |
| Compra individual | 60% | Nunca probado con Stripe de verdad |
| Plan Free/Associate | 20% | 0 ítems vinculados |
| Plan de pago | 15% | Sin `stripe_price_id`, sin ítems, Architect roto |
| Blog | 60% | Solo 1 artículo |
| Servicios | 90% | Ninguno — listo para mostrar |
| Login/Nav/Notificaciones | 95% | Ninguno — ya validado |

**Media (excluyendo Libros, pendiente de confirmar): ~61%** — sube 11
puntos desde la última revisión, casi todo por el trabajo en Skills/Recursos.
Los tres bloqueantes reales que quedan para poder lanzar son: probar un
pago real con Stripe de principio a fin, vincular contenido a los planes,
y decidir qué pasa con el plan Architect roto.
