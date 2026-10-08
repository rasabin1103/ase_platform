# Misión 6: La pirámide (Fundamentos de Testing)

> Contenido jugable: `frontend/src/features/academy/content/courses/testing-fundamentals/m06-*.ts`
> Ruta: `/academy/testing-fundamentals/m06-piramide` · De pago si el curso tiene precio

## Premisa
Es martes. Empieza el sprint de **KOB-190 «Dividir un gasto»**: el cliente reparte un movimiento entre 1 y 20 amigos y les envía solicitudes de pago. Laura quiere que QA defina **dónde vive cada prueba**.

En el **planificador de pruebas** hay 16 comprobaciones. Para cada una, el jugador elige nivel (unitaria, API, E2E, manual o rendimiento) y la escribe. El nivel decide:
- el coste en tiempo de la jornada;
- lo que tarda la suite en CI y su tasa de fallos intermitentes;
- qué bugs puede ver.

Sergio (QA Automation de Tarjetas, personaje nuevo) defiende automatizarlo todo por la interfaz.

## Qué enseña
- **Pirámide de pruebas:** muchas unitarias, bastantes de API, pocos E2E. Invertida es un «cono de helado».
- **Niveles:** cada comprobación en el nivel más bajo que pueda ver el problema.
- **Mocks y contratos:** las unitarias con mocks no ven el desacuerdo euros frente a céntimos; el test de contrato, sí.
- **Tipos de prueba:** el rendimiento con 20 amigos y la seguridad necesitan su propia prueba.
- **Qué no automatizar:** textos, usabilidad y accesibilidad, con pruebas exploratorias.
- **Tiempo simulado:** el recordatorio a los 3 días se prueba con un reloj simulado, no esperando.

## Qué ve cada nivel
| Comprobación | Nivel ideal | Bug | Lo ven | Lo que pasa en otros niveles |
|---|---|---|---|---|
| C01 reparto 10 € / 3 | Unitaria | P1 / P1b | Unitaria, API, E2E | — |
| C05 recordatorio a los 3 días | Unitaria | P5 | Unitaria, API | E2E/manual no pueden esperar 3 días |
| C07 cancelar reparto ajeno | API | P2 | API | La interfaz esconde el botón: «pasa» |
| C08 listado de otro usuario | API | P2b | API | La interfaz siempre pide los propios |
| C09 contrato en céntimos | API | P3 | API, E2E | Con mocks, cada parte «cumple» |
| C11 flujo completo | E2E | P3 | E2E | — |
| C15 20 amigos < 2 s | Rendimiento | P4 | Rendimiento | Con 3 amigos de prueba va rápido |

**Plan ideal:** 5 unitarias, 5 de API, 2 E2E, 3 manuales y 1 de rendimiento. Cuesta unos 230 minutos y la suite tarda 7,8 minutos con un 4,9 % de fallos intermitentes. Todo por E2E cuesta 480 minutos, tarda 48 minutos y un 28 % de sus ejecuciones fallan sin motivo.

## Mecánicas nuevas
- **App `kobalto-pyramid`:** al escribir o ejecutar una comprobación se genera un evento (pasa, falla o «pasa a ciegas», con el motivo).
- **Indicadores:** gráfico de la forma de la suite, minutos de CI y tasa de fallos intermitentes.
- **Enviar el plan a revisión:** activa flags (`AppEvent.flags`, nuevo en el motor): `plan.good`, `plan.shape.ice_cream`, `plan.no_perf`, `plan.automated_exploratory` y `plan.slow_ci`. Cada flag dispara la respuesta de Laura o de Iván, y `plan.good` habilita la mejor estrategia ante Raúl.

## Línea temporal
| Hora | Escena | Decisión clave |
|---|---|---|
| 09:00 | Correos de Laura y Diego (arquitectura) | — |
| 09:30 | Daily con Sergio: «todo E2E» | Pirámide / todo E2E / todo manual |
| 10:30 | Iván: la suite E2E de Tarjetas tarda 50 min y falla 1 de cada 5 | — |
| 12:00 | Marta: Compliance pregunta por la seguridad | Probar en la API / «la app no muestra el botón» |
| 14:00 | Pista de Laura si no ha enviado el plan | — |
| Al enviar el plan | Revisión según la forma del plan | — |
| 16:00 | Estrategia ante Raúl | Pirámide (requiere `plan.good`) / plan con ajustes / todo E2E |
| 17:00 | Charla con Laura | — |

## Bugs (variantes por semilla en `PYRAMID_BUG_SLOTS`, 5 por partida)
P1/P1b (cálculo), P2/P2b (seguridad, críticos), P3 (contrato), P4 (rendimiento) y P5 (tiempo).

## Resto de piezas
- **Wiki:** arquitectura de KOB-190 y guía de automatización del equipo.
- **Aprendizaje:** 6 microlecciones, test antes/después (6 + 6) y veredicto propio.
