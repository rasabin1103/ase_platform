Feature: Kobalto Open API · cuentas

  Background:
    * url baseUrl
    * def auth = callonce read('auth/login.feature')
    * configure headers = { Authorization: '#("Bearer " + auth.token)' }

  @smoke
  Scenario: la API está levantada
    Given path 'health'
    When method get
    Then status 200
    And match response.status == 'UP'

  @smoke
  Scenario: detalle de una cuenta
    Given path 'accounts', accountId
    When method get
    Then status 200
    And match response contains { id: '#(accountId)', status: 'ACTIVE' }

  @smoke
  Scenario: lista de cuentas activas
    Given path 'accounts'
    And param status = 'ACTIVE'
    When method get
    Then status 200
    And match each response.items contains { status: 'ACTIVE' }
