# Observabilidad de producción

ASE no depende de ninguna herramienta de pago (Prometheus/Grafana, Datadog,
New Relic...) para observar el backend en producción. En su lugar combina
dos piezas, ambas ya incluidas sin coste adicional:

1. **El panel nativo de Railway** — métricas de infraestructura (CPU,
   memoria, red, logs en vivo) del servicio ya desplegado.
2. **El endpoint de diagnóstico propio** (`GET /api/v1/admin/system-status`,
   consumido por la pestaña "Estado del sistema" del panel de administración)
   — métricas de aplicación (latencia de BD, tareas programadas, adopción,
   errores) que Railway no puede ver porque son internas a la app.

Ninguna de las dos requiere configuración adicional ni una cuenta de pago.

## 1. Panel nativo de Railway

Cada servicio desplegado en Railway (`ase-backend`, y la base de datos si
también se gestiona ahí) tiene, sin instalar nada, una pestaña **Metrics**
con:

- **CPU y memoria** — uso en tiempo real y su histórico (últimas 24h / 7
  días / 30 días, según el plan).
- **Red** — tráfico de entrada/salida del contenedor.
- **Réplicas** — si el servicio escala a más de una instancia.

Cómo acceder:

1. Entra en [railway.app](https://railway.app) y abre el proyecto de ASE.
2. Selecciona el servicio del backend (`ase-backend` o el nombre que se le
   haya dado al desplegarlo).
3. Pestaña **Metrics** — gráficas de CPU/memoria/red del contenedor.
4. Pestaña **Deployments** → abre el deployment activo → pestaña **Logs**
   para el stream de logs en vivo (stdout/stderr del proceso Python,
   incluyendo los `logger.exception(...)` de los jobs de APScheduler).
5. Pestaña **Observability** (si el plan de Railway la incluye) agrega
   métricas y logs de todos los servicios del proyecto en una sola vista.

No hace falta instrumentar nada en el código para esto — Railway lo obtiene
directamente del contenedor. Es la explicación de por qué el Bloque 5 de este
trabajo no necesitó levantar Prometheus/Grafana: para un solo servicio en
Railway, su panel nativo ya cubre la capa de infraestructura sin coste ni
mantenimiento extra.

## 2. Diagnóstico de aplicación — `/api/v1/admin/system-status`

Railway ve CPU y memoria, pero no sabe si la base de datos responde rápido,
si las tareas programadas (recordatorios de newsletter, sondeo de
ejecuciones de test, barridos de ciclo de vida de cuentas...) siguen vivas,
o cuánto lleva el proceso arrancado sin reiniciarse. Esa capa vive en un
endpoint propio, protegido por permiso (`platform.read`, solo super_admin en
el modo MVP actual), consumido por **Admin → Sistema → Estado del sistema**
en el panel:

| Campo | Qué mide |
|---|---|
| `api_status` | El proceso responde. |
| `uptime_seconds` | Tiempo desde el último arranque del proceso (`app/core/uptime.py`). Un valor bajo e inesperado indica un reinicio/crash reciente. |
| `database.status` / `database.latency_ms` | `SELECT 1` cronometrado contra Postgres — degradación de latencia visible antes de que se convierta en timeouts. |
| `scheduler_running` / `scheduler_jobs[]` | Si el `BackgroundScheduler` de APScheduler está vivo y qué tareas tiene registradas, con su próxima ejecución (`account_lifecycle_sweep`, `anniversary_sweep`, `loyalty_sweep`, `weekly_newsletter`, `test_run_polling_sweep`). Si una tarea debería estar activa (según su flag `*_SWEEP_ENABLED`) y no aparece en la lista, algo falló al arrancar el proceso. |
| `email_verified_pct` / `two_factor_adoption_pct` | Salud de la base de usuarios, no infraestructura, pero vive en el mismo panel por comodidad. |
| `counts.*` | Volumen (usuarios, catálogo, solicitudes pendientes). |
| `github_integration_configured`, `smtp_configured`, `sentry_configured`, `redis_configured` | Qué integraciones externas están realmente configuradas en este entorno — evita depurar "por qué no llega el email" sin saber primero si SMTP está siquiera configurado. |

El panel del admin refresca estos datos automáticamente cada 30 segundos
mientras la pestaña está abierta.

### Health checks sin autenticación

Aparte de lo anterior, dos endpoints públicos sin prefijo `/api/v1` sirven
como health check de infraestructura (los que usaría, por ejemplo, un
balanceador de carga o el propio Railway para saber si el contenedor está
sano):

- `GET /health` — responde `{"status": "ok"}` si el proceso está vivo.
- `GET /health/db` — ejecuta `SELECT 1` contra la base de datos y devuelve
  503 si falla.

Estos se mantienen deliberadamente mínimos y sin autenticación: su único
trabajo es contestar rápido para un chequeo automatizado, no sustituir al
panel de diagnóstico del admin.

## Por qué no Prometheus/Grafana

Se evaluó como alternativa (el usuario preguntó explícitamente por ello),
pero para una plataforma con un único servicio backend en Railway, montar
Prometheus + Grafana habría significado:

- Un servicio adicional que mantener, actualizar y proteger.
- Persistencia adicional (Prometheus necesita su propio almacenamiento de
  series temporales) — coste extra en Railway.
- Duplicar métricas que Railway ya expone de fábrica (CPU/memoria/red).

El endpoint de diagnóstico propio cubre lo que Prometheus/Grafana no
solaparía con Railway (estado de la aplicación, no del contenedor) sin
añadir infraestructura de pago ni piezas nuevas que operar — alineado con el
requisito de "que las cosas no sean de pago".
