# Misión 2 · Match, tu superpoder (martes)

Código: `frontend/src/features/academy/content/courses/karate-framework/m01-*.ts`

## Historia
Dos días para la beta. A un partner se le rompió una integración con otra API por un cambio de tipo. Alba quiere tests de contrato. A las 13:00 Nico despliega la 1.5: añade `alias` (opcional, documentado: compatible) y renombra `holder` a `holderName` sin avisar (incompatible: bug).

## Guion (minuto desde las 09:00)
| Minuto | Escena | Qué pasa |
| --- | --- | --- |
| 0 | Correo de Alba, chat de Sergio | Contexto y chuleta de match |
| 20 | Refinamiento | Qué es un test de contrato (forma completa / pocos campos / respuesta exacta guardada) |
| 240 | Chat de Nico | Despliegue de la 1.5 (flag `api.v15`, changelog visible en la wiki) |
| 270 | Chat de Alba | Finvo lee `holder`: ¿la 1.5 es compatible? |
| 330 | Sergio | Recordatorio de volver a ejecutar contra la 1.5 |
| 450 | Reunión | Qué contestar a Finvo (la opción buena requiere haber reportado KA-CONTRATO) |
| 480 | Cierre con Sergio | Qué te llevas |

## Retos
1. **esquema** — `match response == { … }` con los ocho campos y al menos cuatro marcadores.
2. **reutiliza** — esquema en una variable con `def` y match contra la variable.
3. **formato** — `#regex` (IBAN) y un predicado (`#number? _ >= 0`).
4. **lista** — `param status = 'ACTIVE'` y `match each … contains { status: 'ACTIVE' }`.
5. **tipos** — `match each response.items == account`.
6. **evolucion** (tras la 1.5) — esquema con `alias: '##string'`; el fallo restante es el bug.

## Bugs
- **KA-FILTRO** (alto): el filtro ACTIVE incluye ACC-1005 (cerrada).
- **KA-TIPO** (alto): ACC-1002 tiene `balance: "0.00"` (string).
- **KA-CONTRATO** (crítico, solo en la 1.5): falta `holder`, aparece `holderName`.

Un esquema estricto sin `alias` también falla en la 1.5, pero ese fallo no es un bug (el motor no lo marca como revelado y el report se rechaza).

## Solución de referencia
```
Feature: contrato de cuentas
  Background:
    * url baseUrl
    * def account = { id: '#regex ACC-\\d{4}', iban: '#regex ES\\d{22}', holder: '#string', type: '#string', currency: '#string', balance: '#number? _ >= 0', status: '#string', createdAt: '#string', alias: '##string' }
  Scenario: contrato del detalle
    Given path 'accounts', 'ACC-1001'
    When method get
    Then status 200
    And match response == account
  Scenario: cuentas activas
    Given path 'accounts'
    And param status = 'ACTIVE'
    When method get
    Then status 200
    And match each response.items contains { status: 'ACTIVE' }
  Scenario: contrato de la lista
    Given path 'accounts'
    When method get
    Then status 200
    And match each response.items == account
```
