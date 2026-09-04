# MVP1 — Checklist de lanzamiento (estado real, verificado en base de datos)

Porcentajes estimados a partir de los datos reales de producción (Supabase)
y del estado real de despliegue en Railway — no de lo que debería haber
según el código local, sino de lo que de verdad está funcionando hoy si
alguien entra a comprar ahora mismo.

Actualizado 2026-09-04, tras la sesión de hoy (arreglos de Stripe, planes,
dashboard de admin).

## ⚠️ Aviso importante antes de leer el resto

Todo lo arreglado hoy (los bugs de Stripe, la compresión de imágenes, el
plan Professional vinculado) **está probado en local, no en producción**.
El último despliegue en Railway es del 2 de septiembre ("compress img"),
dos días antes de esta sesión. Eso significa que ahora mismo, si un cliente
real entra a comprar en la web real:
- El webhook de Stripe sigue teniendo el bug `.get()` que rompía la
  concesión automática de acceso — el mismo que hemos pasado hoy arreglando
  y probando en local.
- El plan Professional, aunque ya funciona de principio a fin en local, no
  es comprable de verdad en producción todavía.

Antes de anunciar nada, hay que desplegar. Es el bloqueante número uno,
por encima de cualquier porcentaje de abajo.

## 1. Skills / Recursos — **90%** (sin cambios)

Sigue igual que la última revisión: 6 recursos reales publicados. El ítem
de prueba `pytest` (borrador, precio 0€) sigue sin terminar ni borrar.

- [ ] Terminar o borrar el ítem "pytest".

## 2. Libros — **0%** (antes "sin dato")

Confirmado de forma definitiva: no existe ningún ítem de tipo `book` ni
`course` en el catálogo. El libro "el arte de qa" no está en ningún sitio.
Esto ya no es una duda, es un hueco vacío del todo.

- [ ] Decidir: ¿libros fuera del MVP1, o hay que subir contenido antes de lanzar?

## 3. Compra individual (pago suelto de un producto) — **70%** (antes 60%)

Hecho hoy: la primera compra real con Stripe de la historia de la
plataforma se completó de principio a fin — pago, checkout, webhook,
concesión de acceso, todo correcto (`catalog_purchases` id=8, vía Stripe
test mode). Antes de hoy, las 5 compras que existían eran todas
`admin_grant` a mano; ahora hay una compra real vía Stripe confirmada.

Falta — y es el motivo de que no suba más: esa prueba se hizo contra
`localhost`, no contra el backend real de Railway, que sigue con el bug
que impedía que el webhook funcionase. Hasta que no se despliegue, un
cliente real comprando hoy se quedaría sin acceso a pesar de pagar.

- [x] ~~Hacer una compra de prueba de extremo a extremo con Stripe (modo test)~~ — hecho hoy, en local.
- [ ] **Desplegar los arreglos de `billing/service.py` a Railway.**
- [ ] Repetir la prueba contra producción (no localhost) antes de anunciar.
- [ ] Repetir en modo real con un pago pequeño antes del lanzamiento.

## 4. Plan Free / Associate — **20%** (sin cambios)

Sin cambios desde la última revisión: `plan_catalog_items` sigue vacío
para este plan — 0 recursos vinculados.

- [ ] Decidir qué 2-3 recursos entran gratis en Associate y vincularlos.
- [ ] Reescribir las 5 frases de funcionalidades para que sean específicas.

## 5. Plan de pago (Professional / Expert / Enterprise / Architect) — **45%** (antes 15%)

Hecho hoy: el plan **Professional** ya tiene `stripe_price_id` real, 6
recursos vinculados en `plan_catalog_items`, y una suscripción real de
Stripe se completó de principio a fin (pago → webhook → acceso concedido a
los 6 recursos automáticamente). Es la primera suscripción de pago real de
la plataforma.

Falta:
- [ ] **Desplegar a producción** — misma razón que en compra individual, la
  prueba fue en local.
- [ ] Expert y Enterprise siguen sin `stripe_price_id` ni ítems vinculados
  — no se pueden contratar de verdad todavía.
- [ ] El plan **Architect sigue roto** exactamente igual que antes: código
  `arch-,mensual`, 0 funcionalidades, sin `stripe_price_id`. Decide si lo
  arreglas, lo ocultas o lo borras — sigue sin decidirse.

## 6. Blog — **60%** (sin cambios)

Sigue habiendo solo 1 artículo publicado.

- [ ] Escribir 3-5 artículos más antes de anunciar el lanzamiento.

## 7. Servicios — **90%** (sin cambios)

6 servicios activos, con descripciones reales. Sin bloqueantes.

## 8. Login, navegación, notificaciones — **95%** (sin cambios)

Ya auditado, no requiere trabajo nuevo para MVP1.

---

## Extra (fuera del checklist de MVP1, pero relevante)

El dashboard de super admin se rehízo hoy: ahora distingue compras
individuales de suscripciones a planes (antes se mezclaban y "Total de
compras" contaba de más), tiene gráficas de tendencia con comparativa mes
actual vs. mes anterior/6 meses, y la pestaña de Organizaciones ya no
muestra los workspaces personales de cada usuario individual como si fueran
organizaciones reales. Útil para presentar a socios, pero no es parte del
checklist de cara al cliente.

---

## Resumen

| Elemento | % listo | Bloqueante principal |
|---|---|---|
| Skills/Recursos | 90% | Terminar o borrar el ítem "pytest" de prueba |
| Libros | 0% | Catálogo vacío — decidir si entra en el MVP1 |
| Compra individual | 70% | Probado en local, falta desplegar a producción |
| Plan Free/Associate | 20% | 0 ítems vinculados |
| Plan de pago | 45% | Professional funciona en local, falta desplegar; Expert/Enterprise sin precio; Architect roto |
| Blog | 60% | Solo 1 artículo |
| Servicios | 90% | Ninguno — listo para mostrar |
| Login/Nav/Notificaciones | 95% | Ninguno — ya validado |

**Media (excluyendo Libros): ~68%** — sube 7 puntos desde la última
revisión (excluyendo Libros, que baja porque ahora es un hueco confirmado
en vez de una duda). La mayor parte de la subida es en Compra individual y
Plan de pago, pero ojo: **ese progreso vive en local, no en producción
todavía.** El bloqueante real número uno para lanzar ya no es "no hemos
probado Stripe" — es "desplegar lo que ya hemos probado".
