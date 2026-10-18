# Misión 1 · Hola, Karate (lunes)

Código: `frontend/src/features/academy/content/courses/karate-framework/m00-*.ts`

## Historia
Primer día en el squad de Open API. El jueves empieza la beta privada con partners y no hay tests automáticos. Sergio (QA Automation Lead) es el mentor; Alba (PO), Nico (backend) y Carmen (Compliance) completan el reparto.

## Guion (minuto desde las 09:00)
| Minuto | Escena | Qué pasa |
| --- | --- | --- |
| 0 | Correo de Alba, chat de Sergio | Contexto y proyecto en el IDE |
| 30 | Daily | Elegir cómo saber en cada despliegue que la API funciona (suite automática / Postman a mano / que avisen los partners) |
| 75 | Chat de Carmen | ACC-1003 bloqueada por Compliance: debe salir BLOCKED (activa el reto 5) |
| — | Sergio | Comenta malos olores (sin aserciones, solo status, URL completa, print sin match), el primer verde y el primer test que revela un bug |
| 240 | Chat de Alba | ¿Salen bien las cuentas en dólares? (pista del bug KA-DIVISA) |
| 450 | Demo | Contar qué cubre la suite y qué no |
| 480 | Cierre con Sergio | Qué te llevas |

## Retos (flags `reto.*`)
1. **smoke** — GET /health, status 200, match de `status == 'UP'`.
2. **cuenta** — GET /accounts/ACC-1001 con match de id y currency.
3. **noexiste** — 404 y `code == 'ACCOUNT_NOT_FOUND'`.
4. **background** — dos o más escenarios con `url baseUrl` solo en el Background.
5. **bloqueada** — match de `'BLOCKED'` sobre ACC-1003; cuenta como hecho si pasa o si falla solo por el bug.

## Bugs
- **KA-BLOQ** (crítico): ACC-1003 sale ACTIVE. Lo revela el reto 5. Fix a los 60 min del report aceptado.
- **KA-DIVISA** (alto): ACC-1004 sale en EUR. Solo lo encuentra quien prueba más de un dato. Fix a los 90 min.

## Solución de referencia
```
Feature: smoke de cuentas
  Background:
    * url baseUrl
  Scenario: la API está levantada
    Given path 'health'
    When method get
    Then status 200
    And match response.status == 'UP'
  Scenario: detalle de una cuenta
    Given path 'accounts', 'ACC-1001'
    When method get
    Then status 200
    And match response.id == 'ACC-1001'
    And match response.currency == 'EUR'
  Scenario: cuenta inexistente
    Given path 'accounts', 'ACC-9999'
    When method get
    Then status 404
    And match response.code == 'ACCOUNT_NOT_FOUND'
  Scenario: cuenta bloqueada
    Given path 'accounts', 'ACC-1003'
    When method get
    Then status 200
    And match response.status == 'BLOCKED'
```
