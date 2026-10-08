# Misión 1 — La historia ambigua (Fundamentos de Testing)

> Contenido jugable: `frontend/src/features/academy/content/courses/testing-fundamentals/m01-*.ts`
> Ruta: `/academy/testing-fundamentals/m01-historia-ambigua` · De pago si el curso tiene precio

## Premisa
Martes en Kobalto. El equipo refina **KOB-151 · Transferencias programadas**, la petición nº 1 de los clientes. Todavía no hay código. QA revisa la historia **antes** de que se desarrolle: lo que aclare antes de las **11:30** (cuando Diego empieza) no se convertirá en bug; lo que no, aparecerá en el prototipo que llega a staging a las **14:30**.

## Mecánica nueva: revisión de requisitos (herramienta «Revisión»)
El alumno marca fragmentos de la historia como **ambiguo, incompleto, contradictorio o no verificable** y los envía a Marta (10 min). Ella responde punto por punto y la aclaración queda en el ticket. Los falsos positivos reciben «está claro» y restan rigor si son varios.

| Fragmento | Defecto | Aclaración de la PO | Bug si no se aclara a tiempo |
|---|---|---|---|
| Descripción «entre sus propias cuentas» + criterio 7 «alquiler al casero» | Contradictorio | A cualquier cuenta | M1-B5: solo cuentas propias |
| 1. «El cliente elige la fecha» | Incompleto | Desde mañana hasta 365 días; fin de semana → lunes | M1-B1: acepta hoy y fechas pasadas |
| 2. «Una vez, semanal o mensual» | Incompleto (días 29–31) | Último día del mes | M1-B2: se salta los meses cortos |
| 3. «Los mismos límites» | Ambiguo | 5.000 € al programar; 6.000 €/día al ejecutar | M1-B3: acepta más de 5.000 € |
| 5. «Puede cancelar» | Incompleto | Elegir «solo la próxima» o «toda la serie» | M1-B4: borra toda la serie |
| 6. «Rápido y fácil» | No verificable | < 2 s; validación con 5 clientes | — |
| 8. «Sin saldo no se ejecuta» | Incompleto | Reintento a las 18:00 y aviso | — |
| 10. «Se notifica» | Incompleto | Email el día anterior y al ejecutar | — |
| 4. Fecha de fin | **Correcto** (distractor) | — | M1-B6 existe igualmente: error de código |
| 9. Dos decimales | **Correcto** (distractor) | — | — |

Si el alumno reporta un bug de requisito sin haberlo aclarado, Diego lo discute («¿dónde pone eso?»).

## Línea temporal
| Hora | Escena | Decisión clave |
|---|---|---|
| 09:00 | Correos de Laura y Marta | — |
| 09:30 | Refinamiento | Defender aclarar antes de estimar / pedir tiempo / «está clara» / opinar sobre la estimación |
| 10:45 | Pista de Laura (si no ha enviado dudas) | — |
| 11:30 | Diego empieza a desarrollar (`preventBugs`) | — |
| 12:30 (50 %) | Cambio de alcance de Compliance | Registrar y valorar / atajo a Diego / «no es cosa mía» |
| 14:30 | Prototipo en staging | — |
| 15:30 | Marta: ¿release el viernes? | Estado con evidencia / no lo sé / «sí, está casi» |
| 17:00 | Charla con Laura | Lección de shift-left / culpar al dev / «día tranquilo» |

## Resto de piezas
- **Diseño de pruebas** (22 particiones): fecha de ejecución, día del mes en mensuales, importe, fecha de fin, destino y cancelación.
- **Ciclo de vida:** cada bug aceptado recibe fix en 40–50 min y hay que verificarlo.
- **Pregúntale a Laura:** 7 microlecciones (revisar una historia, tipos de defectos, criterios verificables, Dado/Cuando/Entonces, shift-left, cambios de alcance, fechas).
- **Test antes y después:** 6 + 6 preguntas.
- **Debrief:** defectos detectados en la revisión, **bugs evitados** frente a **bugs que nacieron de dudas sin aclarar**, bugs del prototipo, diseño y decisiones.
