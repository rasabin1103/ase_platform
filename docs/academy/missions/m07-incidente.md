# Misión 7: Incidente en producción (Fundamentos de Testing)

> Contenido jugable: `frontend/src/features/academy/content/courses/testing-fundamentals/m07-*.ts`
> Ruta: `/academy/testing-fundamentals/m07-incidente` · De pago si el curso tiene precio

## Premisa
Es miércoles. La 5.1 lleva dos días en producción y a las 08:55 se activó al 100 % el flag `instant_fees_v2` para la campaña de instantáneas. A las 09:00 salta una alerta: la API de pagos falla muy por encima del 0,3 % habitual.

Raúl coordina el incidente. QA acota con datos, mitiga, reproduce la causa en staging y la reporta. A las 15:00 hay postmortem. Cada minuto sin mitigar suma clientes afectados.

## Qué enseña
- **Respuesta a incidentes:** mitigar, comunicar, diagnosticar, corregir y aprender, con roles claros.
- **Observabilidad:** desglosar la tasa de error por dimensiones (operación, sistema, versión, importe, antigüedad de la cuenta), filtrar y volver a desglosar. Correlación en el tiempo frente a pistas falsas.
- **Mitigación:** el flag correcto en minutos frente al rollback (40 min y retira lo bueno). Apagar flags a ciegas penaliza.
- **Comunicación:** mensaje honesto a Atención al cliente, sin culpar a terceros.
- **Postmortem sin culpables:** causa reproducida, factores del sistema y acciones de shift-left y shift-right.

## Causa (variante por semilla en `INCIDENT_BUG_SLOTS`)
| Id | Causa | Cómo se acota | Error en staging |
|---|---|---|---|
| I1 | Instantáneas de más de 1.000 € desde Android 5.1 | Operación → sistema → versión → importe | NumberFormatException «1.250,00» |
| I1b | Instantáneas de cuentas abiertas antes de 2024 | Operación → antigüedad de la cuenta | NullPointerException iban_country |

El report exige nombrar la condición (`BugDef.repro`); si no, Diego lo devuelve.

## Mecánicas
- **App `kobalto-incident`:**
  - **Datos:** sintéticos y deterministas, generados por combinación de dimensiones.
  - **Desglose:** filtros encadenados.
  - **Mitigación:** tres flags y rollback.
  - **Reproducción:** en staging, donde el flag sigue activo.
  - **Banner:** estado del incidente y clientes afectados estimados.
- **Flags de la mitigación:** `mitigated`, `mitigated.flag`, `mitigated.rollback`, `mitigated.fast` (≤ 60 min) y `flag.wrong`. Disparan escenas de Raúl y Marta.

## Línea temporal
| Hora | Escena | Decisión clave |
|---|---|---|
| 09:00 | Alerta de Iván + correo de Laura | Abrir incidente / esperar 30 min |
| 09:10 | Sala de crisis con Raúl | Acotar con datos / revisar código / rollback ya |
| 09:30 | Nuria: centralita a tope | Mensaje honesto / culpar al banco / nada |
| 09:45 | Sergio: CPU de notificaciones al 95 % | Comprobar correlación / reiniciar (pista falsa) |
| Al mitigar | Raúl (rápido o lento) · Marta: ¿cuándo reactivamos? | Tras el fix verificado / ya |
| 11:00 | Pista de Laura si no hay mitigación | — |
| Al reportar la causa | Diego prepara el fix; verificar antes de reactivar | — |
| 15:00 | Postmortem | Sin culpables con acciones / culpar a Diego / culparse / «mala suerte» |
| 17:00 | Cierre del curso con Laura | — |

## Resto de piezas
- **Wiki:** guía de incidentes y registro de cambios de la semana (clave para descartar la CPU y ver el flag de las 08:55).
- **Aprendizaje:** 6 microlecciones, test antes/después (6 + 6) y veredicto propio.
- **Continuidad (pendiente):** leer `release.go_blind` de la misión 5 para cambiar el origen del incidente.
