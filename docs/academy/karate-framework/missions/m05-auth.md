# Misión 6 · Tokens y reutilización (lunes, semana 2)

Código: `frontend/src/features/academy/content/courses/karate-framework/m05-*.ts`

## Historia
Tras la auditoría de seguridad, la Open API 1.6 exige un token OAuth2 (client credentials) en /accounts y /transfers. Los tokens tienen scopes y el endpoint de tokens admite 5 peticiones por minuto por cliente. Sergio adaptó la suite deprisa copiando el login en cada escenario: con más escenarios, la suite choca con el límite (429).

## Novedades del motor
- `call read('x.feature')` y `callonce read('x.feature')`, con argumentos (`{ scope: 'accounts:read' }`), asignados (`def auth = call …`) o en ámbito compartido (`* call …` deja las variables en el escenario).
- `callonce` guarda el resultado por feature y ejecución; las peticiones del feature llamado aparecen en el log del que llama.
- `karate.get(nombre, porDefecto)` para argumentos opcionales; `configure headers` resuelve expresiones embebidas.
- Un feature con `@ignore` no corre suelto, pero se puede llamar.
- La API (opción `auth`): `POST /auth/token` (límite 5/min por cliente, 429 con Retry-After), `POST /auth/revoke`, scopes `accounts:read` y `transfers:write`.

## Guion (minuto desde las 09:00)
| Minuto | Escena | Qué pasa |
| --- | --- | --- |
| 0 | Correo de Iván, chat de Sergio | OAuth2 desde hoy; el login está copiado en cada escenario |
| 20 | Stand-up | Cómo se autentica la suite (login reutilizable / token fijo de larga duración / un login por escenario) |
| 90 | Sergio | Si la suite ya ha chocado con el límite (429) |
| 150 | Chat de Carmen | Mínimo privilegio (activa el reto «scope») |
| 240 | Chat de Alba | Revocación al desconectar (activa el reto «revoke») |
| 450 | Decisión | ¿Acceso para el agregador? (la opción buena requiere haber reportado KA-SCOPE) |
| 480 | Cierre con Sergio | Qué te llevas |

## Retos
1. **login** — `auth/login.feature` pide el token y deja `token`.
2. **call** — el login copiado se sustituye por `call read('auth/login.feature')`; al menos 2 escenarios autenticados.
3. **ignore** — `@ignore` en el login: no corre suelto.
4. **callonce** — 3 o más escenarios autenticados con 3 tokens como mucho y ningún 429.
5. **scope** — token con `accounts:read` → `POST /transfers` → 403 INSUFFICIENT_SCOPE.
6. **revoke** — token propio, revocarlo y usarlo → 401 TOKEN_REVOKED.

## Bugs
- **KA-SCOPE** (crítico): un token de solo lectura puede crear transferencias.
- **KA-REVOKE** (alto): un token revocado sigue funcionando.
- **KA-AUTH500** (medio): credenciales incorrectas devuelven 500 con una traza interna.

## Solución de referencia
Ver `M05_SOLUTION_LOGIN` y `M05_SOLUTION_FEATURE` en `m05-lab.ts`.
