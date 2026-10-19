Feature: Kobalto Open API · transferencias

  Background:
    * url baseUrl
    * def auth = callonce read('auth/login.feature')
    * configure headers = { Authorization: '#("Bearer " + auth.token)' }
    * configure retry = { count: 10, interval: 1000 }

  Scenario Outline: transferencia <caso>
    Given path 'transfers'
    And request { fromAccount: '#(accountId)', toIban: '<iban>', amount: <amount>, currency: 'EUR', concept: '<concepto>' }
    When method post
    Then status 201
    * def id = response.id
    Given path 'transfers', id, 'confirm'
    When method post
    Then status 202
    Given path 'transfers', id
    And retry until response.status == 'COMPLETED'
    When method get
    Then status 200
    And match response contains { id: '#(id)', amount: <amount>, toIban: '<iban>' }

    Examples:
      | caso              | iban                     | amount | concepto |
      | a Kobalto         | ES9121000418450200051333 | 25.5   | Cena     |
      | a otro banco      | ES1420805801101234567891 | 40     | Alquiler |
      | con céntimos      | ES9121000418450200051333 | 0.99   | Café     |
      | importe redondo   | ES1420805801101234567891 | 100    | Regalo   |

  Scenario: el saldo baja al confirmar (cuenta propia)
    Given path 'sandbox', 'accounts'
    And request { balance: 100, currency: 'EUR' }
    When method post
    Then status 201
    * def cuenta = response
    Given path 'transfers'
    And request { fromAccount: '#(cuenta.id)', toIban: 'ES9121000418450200051333', amount: 10, currency: 'EUR', concept: 'Saldo' }
    When method post
    Then status 201
    Given path 'transfers', response.id, 'confirm'
    When method post
    Then status 202
    Given path 'accounts', cuenta.id, 'balance'
    When method get
    Then status 200
    And match response.available == 90

  Scenario: dos pendientes no pueden gastar el mismo saldo
    Given path 'sandbox', 'accounts'
    And request { balance: 100, currency: 'EUR' }
    When method post
    Then status 201
    * def cuenta = response
    * def pago = { fromAccount: '#(cuenta.id)', toIban: 'ES9121000418450200051333', amount: 80, currency: 'EUR' }
    Given path 'transfers'
    And request pago
    When method post
    Then status 201
    * def primera = response.id
    Given path 'transfers'
    And request pago
    When method post
    Then status 201
    * def segunda = response.id
    Given path 'transfers', primera, 'confirm'
    When method post
    Then status 202
    Given path 'transfers', segunda, 'confirm'
    When method post
    Then status 422
    And match response.code == 'INSUFFICIENT_FUNDS'
