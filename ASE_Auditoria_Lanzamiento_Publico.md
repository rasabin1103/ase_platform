# Auditoría crítica de ASE Platform — preparación para lanzamiento público

Fecha: 12 de agosto de 2026 (actualizado el mismo día tras resolver los hallazgos #2 a #11, y con informe aparte para #12)
Alcance: backend (FastAPI/Postgres), frontend público y panel privado (React), infraestructura de despliegue (Railway/Supabase).
Método: revisión directa de código, configuración, tests, `.env`/`.gitignore`, y fetch en vivo de arcesabinengineering.com.

## Puntuación global: 8 / 10 (antes 5,5/10)

De los doce hallazgos originales solo queda uno sin resolver: **la pasarela de pago sigue sin cobrar dinero de verdad.** Es el único bloqueante real que impide vender a desconocidos hoy mismo. Todo lo demás está resuelto — incluyendo 2FA real por app autenticadora y una auditoría de accesibilidad con hallazgos concretos — con algunas piezas (Sentry, Redis) dormidas hasta que añadas tus propias credenciales. Ver el detalle marcado como ✅ **Resuelto** más abajo.

| Categoría | Puntuación | Comentario |
|---|---|---|
| Pagos y monetización | 2/10 | "Comprar" no cobra nada — ver hallazgo #1 (sigue siendo el único bloqueante) |
| Cumplimiento legal (RGPD/LOPDGDD) | 7/10 | ✅ Privacidad, términos, aviso de cookies y borrado con anonimización de PII — falta la revisión de un abogado |
| Ciclo de vida de cuenta (verificación, recuperación) | 8/10 | ✅ Reset de contraseña y verificación de email implementados — falta que configures tus credenciales SMTP en `.env` para que los correos salgan de verdad |
| Testing / QA | 6/10 | ✅ 10 archivos de test — auth, compras y ahora el flujo completo de 2FA. Sigue faltando canjeo de libros, impersonación, y no hay CI que los ejecute automáticamente en cada cambio |
| Observabilidad (monitorización, errores) | 7/10 | ✅ Sentry integrado en backend y frontend — dormido hasta que crees un proyecto gratuito en sentry.io y pegues el DSN en `.env` |
| Infraestructura de despliegue | 7/10 | ✅ El rate limiter ya sabe usar Redis compartido (`REDIS_URL`) en cuanto escales a más de una réplica; hasta entonces sigue en memoria, que es correcto para una sola instancia |
| SEO técnico | 8/10 | ✅ `robots.txt`, `sitemap.xml` y `<title>`/meta descripción únicos por página ya en producción |
| Seguridad general | 8/10 | ✅ 2FA real por TOTP, buena higiene de secretos, rate limiting y verificación de email |
| Accesibilidad | 5/10 | Informe de hallazgos entregado (`ASE_Auditoria_Accesibilidad.md`) — sin cambios de código todavía, dos hallazgos de alto impacto (labels sin asociar, contraste del color "muted") |
| i18n | 9/10 | EN/ES verificado al 100% (2242/2242 claves) |
| Panel de administración | 8/10 | Auditoría, búsqueda, exportación, impersonación, estado del sistema — nivel muy por encima de la media para un MVP |

---

## 🔴 Bloqueante — antes de aceptar usuarios reales

### 1. No existe pasarela de pago real
El botón "Comprar" (`POST /catalog/{slug}/purchase`) simplemente inserta una fila en `catalog_purchases` — no llama a Stripe, PayPal ni a nadie. Cualquier usuario registrado puede quedarse con cualquier producto de pago sin que se le cobre un euro. El `.env.example` incluso tiene `STRIPE_SECRET_KEY` comentado, lo que confirma que estaba planeado pero nunca se conectó.
**Impacto:** si lanzas así, no vas a facturar nada por la vía self-service, o peor, alguien lo descubre y se lleva contenido de pago gratis.
**Arreglo:** integrar Stripe Checkout (o el proveedor que prefieras) antes de abrir el registro público, o mientras tanto, dejar las compras de pago como "solicitud" (ya existe ese flujo, `request_only`) hasta tener cobro real.

### 2. ✅ Resuelto — Recuperación de contraseña y email transaccional
Se implementó `/auth/password-reset/request` y `/auth/password-reset/confirm`, con tokens de un solo uso (hash SHA-256 en base de datos, nunca el token en claro), expiración de 60 minutos, y prevención de enumeración de usuarios (la respuesta es idéntica exista o no el email). El envío de correo usa tu propio servidor SMTP (sin depender de un proveedor externo tipo SendGrid), vía `app/core/email.py`.
**Pendiente de ti:** rellenar `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD` y el resto de variables `SMTP_*` en tu `.env` de producción — sin eso, la función existe pero no envía correos de verdad (falla en silencio con un aviso en el log, no rompe la app).

### 3. ✅ Resuelto — Verificación de email en el registro
Ahora `register()` envía automáticamente un correo de verificación tras el alta. Los usuarios creados desde el panel de admin se marcan como verificados de inmediato (un admin ya está dando fe de esa cuenta); los que se registran por su cuenta deben verificar antes de poder comprar — el backend bloquea `POST /catalog/{slug}/purchase` con un 403 si `email_verified_at` es nulo, y el frontend muestra un banner persistente con botón de reenvío. Los usuarios que ya existían antes de este cambio se marcaron como verificados automáticamente en la migración, para no bloquear a nadie de golpe.
**Pendiente de ti:** lo mismo que el punto 2 — configurar las credenciales SMTP.

### 4. ✅ Resuelto (borrador) — Páginas legales
Ya están publicadas `/privacy-policy`, `/terms-of-service` y un aviso de cookies no bloqueante enlazados desde el footer de todo el sitio. Cubren responsable del tratamiento, datos recopilados, base legal, retención, destinatarios (incluye GitHub por el canjeo de libros), derechos RGPD, cookies/almacenamiento local, seguridad, y las condiciones de uso de compras, organizaciones y canjeo de código.
**Importante:** son un borrador razonable pero **no han pasado revisión de un abogado** — antes de depender de ellos en una disputa real, conviene que los revise alguien con conocimiento de RGPD/LOPDGDD aplicado a tu caso concreto (por ejemplo, la identificación fiscal exacta del responsable del tratamiento, o cláusulas específicas de reembolso una vez tengas pasarela de pago real).

---

## 🟠 Importante — resuelto en esta sesión

### 5. ✅ Resuelto — Monitorización de errores en producción
Sentry está integrado tanto en el backend (`app/core/monitoring.py`, inicializado antes de construir la app FastAPI) como en el frontend (`src/monitoring.ts`, inicializado antes de montar React). Ambos son dormidos por diseño: si `SENTRY_DSN` / `VITE_SENTRY_DSN` están vacíos, Sentry nunca se activa, así que no rompe nada mientras no lo configures.
**Pendiente de ti:** crear un proyecto gratuito en sentry.io (uno para backend, uno para frontend, o uno compartido) y pegar el DSN en `SENTRY_DSN` (backend `.env`) y `VITE_SENTRY_DSN` (frontend `.env`/variables de Vercel).

### 6. ✅ Resuelto (config lista) — Rate limiting listo para Redis
El `Limiter` ahora lee `REDIS_URL`: si está vacío sigue en memoria (correcto mientras tengas una sola instancia del backend), y si le das una URL de Redis, `slowapi` reparte los contadores entre todas las réplicas automáticamente — sin tocar código de nuevo el día que escales.
**Pendiente de ti:** nada por ahora. El día que añadas una segunda réplica en Railway, crea un Redis (Railway lo ofrece como plugin) y pon su URL en `REDIS_URL`.

### 7. ✅ Resuelto (parcial) — Cobertura de tests de auth y compras
Se añadieron `tests/test_auth_flows.py` (registro, login correcto/incorrecto, verificación de email, recuperación de contraseña, incluyendo que un token usado o de un email desconocido se rechace correctamente), `tests/test_purchase_flow.py` (compra bloqueada sin email verificado, compra exitosa con email verificado, slug inexistente) y, más tarde, `tests/test_two_factor.py` (setup, confirmación, login con desafío de 2FA, código incorrecto rechazado, contraseña incorrecta no puede desactivarlo). En total 10 archivos de test, con las áreas más sensibles del negocio cubiertas.
**Importante — no pude ejecutarlos yo mismo:** mi entorno de trabajo no tiene salida de red hacia tu base de datos de Supabase, así que solo pude verificar que los tests compilan, pasan `ruff` y se recolectan correctamente en pytest (22 tests en total). Necesito que ejecutes `pytest` tú mismo en tu máquina o en CI para confirmar que pasan contra la base de datos real. Sigue faltando cobertura de canjeo de libros, impersonación y rate limiting, y no hay ningún pipeline de CI que corra estos tests automáticamente en cada cambio — lo dejo anotado en el apartado de pulido (#13).

### 8. ✅ Resuelto — SEO técnico
`robots.txt` y `sitemap.xml` estáticos ya están publicados (con las rutas privadas del panel bloqueadas para rastreo), y un hook `usePageTitle` fija un `<title>` y meta-descripción propios en cada página pública (about, servicios, plataforma, historia, precios, contacto, canjeo, privacidad, términos) en vez de compartir todos el mismo título genérico.

### 9. ✅ Resuelto — Borrado de usuario ahora anonimiza datos personales
`soft_delete_user` ya no se limita a cambiar el estado: sobrescribe email (por uno único tipo `deleted-<uuid>@deleted.invalid`, un dominio reservado que nunca resuelve), nombre, apellido, teléfono, avatar y borra los enlaces de perfil. La fila del usuario se conserva (compras, logs de auditoría, etc. siguen siendo válidos), pero ya no queda ningún dato personal identificable — esto es lo que exige el derecho al olvido de RGPD art. 17.

---

## 🟡 Pulido — no bloquea el lanzamiento, pero conviene revisar

### 10. ✅ Resuelto — Inconsistencia en `.gitignore`
`backend/.gitignore` ignoraba `.env.example` sin la excepción que sí tenía el `.gitignore` de la raíz. Corregido: ahora tiene `!.env.example` igual que `!.env.production`. Confirma tú mismo con `git status backend/.env.example` que aparece como versionado.

### 11. ✅ Resuelto — 2FA real por TOTP (app autenticadora)
`two_factor_enabled` ya no es un campo decorativo: se implementó 2FA real con TOTP (Google Authenticator, Authy, 1Password...), sin depender de ningún proveedor externo (no hace falta SMS ni cuenta de terceros — el secreto y la verificación viven enteramente en tu backend, vía `pyotp`).

Flujo: desde el perfil, "Activar 2FA" genera un secreto y un código QR (`POST /auth/2fa/setup`), el usuario lo escanea y confirma un código de 6 dígitos (`POST /auth/2fa/confirm`). A partir de ahí, el login pide ese código además de la contraseña: si el usuario tiene 2FA activo, `POST /auth/login` ya no devuelve tokens directamente — devuelve un `challenge_token` de 5 minutos que solo sirve para `POST /auth/2fa/verify-login`, nunca como sesión real. Para desactivarlo se pide la contraseña de la cuenta (no un código TOTP), precisamente para que perder el teléfono nunca deje a nadie bloqueado fuera de su propia cuenta. Como red de seguridad adicional, un admin puede forzar la desactivación del 2FA de un usuario bloqueado desde el propio panel de usuarios.

Cobertura de tests incluida (`tests/test_two_factor.py`): flujo completo de setup/confirm/login con desafío/verificación, código incorrecto rechazado, y que la contraseña incorrecta no pueda desactivar el 2FA.

### 12. ✅ Resuelto (informe) — Auditoría de accesibilidad
Entregado un informe aparte (`ASE_Auditoria_Accesibilidad.md`) con hallazgos concretos basados en el código real, no en generalidades: ningún `<label>` de los 117 que hay en toda la plataforma está asociado a su campo (`htmlFor`), y el color `ase-muted` no cumple el contraste mínimo AA en texto normal (358 usos en 80 archivos, ratio real 3.7–4.2:1 frente al 4.5:1 exigido). También hay puntos ya resueltos que vale la pena conocer: todas las imágenes llevan `alt`, el estado de foco por teclado está bien implementado, y ya hay `aria-label` en los controles de solo icono más comunes. Sin cambios de código todavía — es un informe para que decidas qué priorizar.

### 13. No hay CI que ejecute los tests automáticamente
Los tests nuevos y los que ya existían solo se ejecutan si alguien corre `pytest` a mano. Nada impide que un cambio futuro rompa login o compras sin que nadie se entere hasta producción. Un GitHub Actions/Railway pipeline simple que corra `pytest` en cada push resolvería esto en menos de una hora.

---

## Lo que ya está bien (y vale la pena no tocar)

- Higiene de secretos correcta: `.env` real nunca se commitea, `JWT_SECRET_KEY` y contraseñas van por variables de entorno, sin credenciales hardcodeadas.
- CORS con lista blanca de orígenes concretos, no wildcard.
- Rate limiting ya activo en login/registro/canjeo de código (recién añadido).
- Panel de super admin muy completo: auditoría de acciones, búsqueda global, exportación CSV, estado del sistema, anuncios, impersonación con expiración de 30 min — nivel notablemente por encima de lo típico en un MVP.
- Integración con GitHub para dar acceso a repos de libros, bien resuelta (privados + invitación automática).
- Traducción EN/ES verificada al 100%, sin claves huérfanas en ningún idioma (2222/2222 claves).
- Metadatos SEO/OG de la home bien construidos, y ahora con `robots.txt`/`sitemap.xml`/títulos por página.
- Recuperación de contraseña, verificación de email y páginas legales ya en producción (ver ✅ en hallazgos #2, #3 y #4).
- Sentry y rate limiting Redis-ready integrados y dormidos hasta que añadas tus credenciales (ver ✅ en hallazgos #5 y #6).
- Tests de auth, compras y 2FA (ver ✅ en hallazgos #7 y #11 — pendiente que confirmes que pasan en tu entorno).
- Borrado de usuario ahora anonimiza datos personales conforme a RGPD (ver ✅ en hallazgo #9).
- 2FA real por app autenticadora (TOTP), con red de seguridad admin para dispositivos perdidos (ver ✅ en hallazgo #11).
- `backend/.gitignore` corregido — `.env.example` vuelve a versionarse igual que en la raíz (ver ✅ en hallazgo #10).

---

## Orden recomendado

1. ~~Páginas legales + banner de cookies~~ ✅ hecho — pendiente solo la revisión de un abogado.
2. ~~Recuperación de contraseña + verificación de email~~ ✅ hecho — pendiente que configures tus credenciales SMTP en `.env` de producción.
3. ~~Sentry + rate limiting Redis-ready + tests de auth/compras/2FA + SEO técnico + borrado con anonimización + 2FA real + gitignore~~ ✅ hecho — pendiente que confirmes los tests en tu entorno y, si quieres, actives Sentry con tu propio DSN.
4. **Pasarela de pago real, o mientras tanto, forzar `request_only` en todo lo que sea de pago — este es ahora el único bloqueante real que queda antes de vender a desconocidos.**
5. Accesibilidad: revisar el informe (`ASE_Auditoria_Accesibilidad.md`) y decidir qué priorizar — el arreglo del color "muted" es el de mejor relación impacto/esfuerzo (una línea, corrige 358 usos).
6. Todo lo demás (CI, cobertura de tests restante), según vayas creciendo.
