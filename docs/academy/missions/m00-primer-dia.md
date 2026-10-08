# Misión 0 — Primer día (Fundamentos de Testing)

> Contenido jugable: `frontend/src/features/academy/content/courses/testing-fundamentals/m00-primer-dia.ts`
> Ruta: `/academy/testing-fundamentals/m00-primer-dia` · Gratis (demo)

## Premisa
Recién graduado/a, primer día como **QA Junior en Kobalto** (neobanco ficticio, Madrid, 80 personas). El equipo de Pagos prepara la demo con inversores del viernes: **Transferencias (KOB-142)**. Jornada de 09:00 a 17:00; cada acción consume tiempo.

## Personajes
| NPC | Rol | Tensión que aporta |
|---|---|---|
| Laura Méndez | QA Lead, mentora | Exige un estado claro a las 17:00 |
| Diego Ruiz | Backend dev | "Lo probé en local"; pide no abrir tickets |
| Marta Sanz | Product Owner | Presión por la demo; tiene las reglas reales |
| Óscar Gil | IT | Accesos |
| Iván Torres | DevOps | Imprevisto: staging caído |

## Línea temporal
| Hora | Escena | Decisión clave | Lección |
|---|---|---|---|
| 09:00 | Correos de RR. HH. y Laura; chat de Óscar | Pedir accesos completos o estándar | Preparar el entorno (sin staging: 40 min perdidos) |
| 09:30 | Daily (reunión) | Presentarse y pedir hablar con la PO / prometer "todo" / callar | Comunicación, "probar todo es imposible" |
| tras daily o desde el ticket | Chat con Marta | Preguntar qué es "importe válido" y "límites" o darlo por claro | Testing estático; sin reglas, B1 y B6 se discuten |
| 11:00 (60 %) | Staging caído | Preparar casos / probar en producción / esperar | Entornos; diseñar antes de ejecutar |
| 13:00 | Diego: "no abras tickets" | Avisar y registrar / ocultar / chocar | Trazabilidad sin romper la relación |
| 14:00 (si 0 bugs) | Pista de Laura | — | Valores límite |
| 15:00 | Marta: "¿está lista?" | Avisar de críticos / no sé / "sí, todo bien" | Riesgo; principio 1 |
| 17:00 | Charla con Laura | Estado profesional / vago / "no me dio tiempo" | Comunicar estado y recomendación |

## Trampas de realismo
- La **especificación de la wiki está desactualizada** (3.000 €/4.000 €). Quien la siga sin hablar con la PO reportará falsos positivos.
- El ticket tiene criterios ambiguos a propósito.
- El dev afirma haberlo probado "en local".

## Bugs sembrados en la app de staging
| Id | Bug | Severidad | Cómo se encuentra |
|---|---|---|---|
| B1 | Acepta 5.000,01–5.000,99 € | Alta (requiere conocer las reglas) | Valores límite |
| B2 | Acepta negativos y suma saldo | Crítica | Partición de negativos |
| B3 | "10,50" → 1.050 € | Crítica | Formato coma/punto |
| B4 | IBAN con dígitos de control erróneos | Media | Cambiar un dígito de un IBAN válido |
| B5 | Doble clic duplica la transferencia | Crítica | Doble clic en "Confirmar" |
| B6 | Sin límite diario acumulado (6.000 €) | Alta (requiere reglas) | Varias operaciones seguidas |

## Evaluación
- Bug report: título, pasos, esperado, obtenido, severidad y **evidencia** (operación de la app). Estados: aceptado, necesita info, en discusión, duplicado, rechazado.
- Competencias: rigor, comunicación, gestión del riesgo, gestión del tiempo (0–5 estrellas).
- Debrief: veredicto, bugs encontrados/provocados/no encontrados con su técnica, diario de decisiones, conceptos y "qué haría un QA senior".

## Diseño de pruebas (herramienta «Diseño»)
| Zona | Particiones clave | Técnica |
|---|---|---|
| Importe | válido, 0, negativo, 0,01, 5.000,00, 5.000,01, coma decimal | Particiones de equivalencia, valores límite, formato |
| IBAN | válido, dígitos de control erróneos, formato incorrecto | Datos inválidos con formato válido |
| Beneficiario | con nombre, vacío | Particiones |
| Concepto | 140 y 141 caracteres | Valores límite |
| Límite diario | acumulado < 6.000, = 6.000, > 6.000 (p. ej. «4000 + 2500») | Secuencia y valores límite |
| Doble envío | doble clic | Comportamiento real del usuario |

- Añadir un caso: 2 min. Revisión de Laura: 10 min (1.ª revisión con pistas, después con detalle).
- Sin preguntar a Marta, los casos de límites no se pueden «acertar»: la revisión y el debrief lo señalan.

## Ciclo de vida del bug
| Bug | Fix | Resultado |
|---|---|---|
| B1, B2, B4, B6 | 40–60 min tras aceptarlo | Funciona |
| B3 | 50 min | Funciona, pero introduce la **regresión R1**: «10.50» con punto → 1.050 € |
| B5 | 45 min | **No funciona** (solo cambia el texto del botón). Si se reabre con evidencia, el segundo fix sí funciona |

Verificar cuesta 5 min. Para cerrar o reabrir hay que adjuntar ejecuciones del build nuevo.

## Variantes de bugs (una por hueco y partida)
| Hueco | Variante A | Variante B |
|---|---|---|
| Límite por operación | B1: acepta 5.000,01–5.000,99 € | B1b: rechaza exactamente 5.000,00 € |
| Cero / negativos | B2: acepta negativos | B2b: acepta 0 € |
| Formato decimal | B3: «10,50» → 1.050 € | B3b: «10,50» → 10 € |
| IBAN | B4: no valida dígitos de control | B4b: rechaza IBAN válido con espacios |
| Doble envío | B5 (siempre) | — |
| Límite diario | B6: no aplica el acumulado | B6b: rechaza el acumulado exacto de 6.000 € |

## Otras piezas didácticas
- **Pregúntale a Laura:** 8 microlecciones (por dónde empezar, particiones, valores límite, bug report, severidad/prioridad, riesgo, re-test/regresión, entornos).
- **Riesgos:** referencia senior — Importe 3×3, Doble envío 2×3, Límite diario 2×3, IBAN 2×2, Beneficiario 1×1, Concepto 1×1.
- **Test antes/después:** 6 + 6 preguntas sobre particiones, límites, testing estático, bug report, re-test/regresión y riesgo.
- **Revisión con IA** del bug report (opcional, requiere sesión y `GROQ_API_KEY`).
