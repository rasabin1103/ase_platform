# Misión 2: El simulador de préstamos (Fundamentos de Testing)

> Contenido jugable: `frontend/src/features/academy/content/courses/testing-fundamentals/m02-*.ts`
> Ruta: `/academy/testing-fundamentals/m02-simulador-prestamos` · De pago si el curso tiene precio

## Premisa
Es miércoles en Kobalto. Llega a staging **KOB-163 · Simulador de préstamo personal**: edad, ingresos, importe y plazo devuelven una cuota, el TIN y una preaprobación. Hay cuatro variables y reglas que se combinan, así que probarlo todo es imposible. Diego ha lanzado 500 combinaciones aleatorias y no ha fallado nada. Carmen López (Riesgos y Compliance) quiere saber a las **16:00** qué se ha cubierto.

## Qué enseña
- **Varias variables:** una base válida y una variable cada vez en sus bordes; las reglas combinadas, aparte.
- **Valores límite combinados:** edad + plazo ≤ 75 años; endeudamiento ≤ 35 % de los ingresos; tramo de TIN a 10.000 €.
- **Oráculo de pruebas:** tabla de ejemplos validados por Riesgos y coherencia interna (total = cuota × plazo). La propia app nunca es el oráculo.
- **Probar cálculos:** al céntimo, con redondeo y en los cambios de tramo.
- **Aleatorio frente a sistemático:** el script de Diego nunca toca los bordes.
- **No funcional:** la lentitud de staging (una migración del entorno) se anota como riesgo y se mide; no se reporta sin aislar la causa.

## Reglas de la política (v2.1)
| Regla | Valor |
|---|---|
| Edad | 18–70 |
| Importe | 1.000–30.000 €, múltiplos de 100 |
| Plazo | 12–84 meses |
| TIN | 6,95 % por debajo de 10.000 €; 5,95 % desde 10.000 € |
| Endeudamiento | cuota ≤ 35 % de los ingresos netos |
| Edad al terminar | ≤ 75 años |
| Cuota | sistema francés, redondeo al céntimo |

## Bugs (variantes por semilla en `LOAN_BUG_SLOTS`)
| Id | Bug | Severidad | Técnica |
|---|---|---|---|
| L1 / L1b | Acepta 17 años / rechaza 70 | Crítica / media | Límites 17-18 y 70-71 |
| L2 / L2b | Acepta no múltiplos de 100 / rechaza 30.000 € | Baja / media | Particiones / límite superior |
| L3 / L3b | Acepta 6 meses / rechaza 84 | Media | Límites de plazo |
| L4 / L4b | Tramo de TIN a 10.000 € mal (alto en 10.000 o bajo desde 9.000) | Alta | Límites alrededor del umbral |
| L5 / L5b | Endeudamiento al 40 % / sin comprobar | Crítica | Ratio entre 35 % y 40 % |
| L6 | Regla edad + plazo no implementada | Alta | 68 + 84 m frente a 70 + 84 m |
| L7 | Cuota truncada (1 céntimo menos) | Media | Oráculo al céntimo |
| L-R1 | Regresión tras el fix del tramo: total ≠ cuota × plazo | Alta | Regresión con el oráculo |

## Línea temporal
| Hora | Escena | Decisión clave |
|---|---|---|
| 09:00 | Correos de Laura y Carmen (tabla de ejemplos en la wiki) | — |
| 09:30 | Diego: «500 combinaciones aleatorias, todo verde» | Explicar los bordes / pedir el script para ver qué cubre / «poco más que probar» |
| 11:00 | Iván: staging va lento | Anotar como riesgo no funcional y medir / ignorar / abrir bug sin aislar |
| Al comparar cuotas | Diego: «un céntimo no es un bug» | Defender con el oráculo / dejarlo pasar |
| 14:00 | Pistas de Laura según el avance | — |
| 16:00 | Reunión con Riesgos | Cobertura con datos / «bugs, pero no sé qué cubrimos» / «el aleatorio no falló» |
| 17:00 | Charla con Laura | Lección de combinatoria y oráculo |

## Resto de piezas
- **Matriz de riesgos** (7 zonas): el endeudamiento y la regla edad + plazo son las prioritarias.
- **Diseño de pruebas** (30 particiones clave): edad, importe, plazo, ingresos, tramo de interés, endeudamiento, edad + plazo y cálculo de la cuota. Cada caso se abre en staging con sus datos.
- **Nueva app bajo prueba:** `apps/kobalto-loans` (`loanLogic`: `specQuote` como oráculo y `simulate` con los bugs activos).
- **Pregúntale a Laura:** microlecciones de combinatoria, oráculo, cálculos, límites combinados, aleatorio frente a sistemático y no funcional.
- **Test antes y después:** 6 + 6 preguntas.
- **Debrief:** bugs, cobertura del diseño por grupo, qué caso encontró cada bug, priorización frente a la de un QA senior, decisiones y «qué habría hecho un QA senior».
