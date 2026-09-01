# Auditoría de nivel premium — Plataforma ASE (seguimiento)

Fecha: 26 de agosto de 2026
Alcance: mismo backend (FastAPI/SQLAlchemy) y frontend (React 19/Vite) auditados el 26/08 en `ASE_Auditoria_Nivel_Premium.md` (puntuación 6.6/10), tras la sesión de trabajo que implementó los 19 puntos de mejora ahí listados.

Metodología: idéntica a la auditoría anterior — inventario factual del código (grep, conteo de archivos, lectura de módulos clave), mismas 9 categorías y mismos pesos, puntuación 0–10 por evidencia verificada, no por percepción. No se reutiliza ninguna nota anterior sin re-verificar la evidencia en el código actual.

## Puntuación objetiva

| Categoría | Peso | Nota anterior | Nota actual | Evidencia clave del cambio |
|---|---|---|---|---|
| Monetización y pagos | 15% | 8 | **8.5** | Se mantiene Stripe end-to-end (checkout, portal, webhooks firmados). Se añade `InvoiceHistoryCard` — histórico de facturas con marca ASE dentro de la app (`GET /billing/invoices`) en vez de reenviar siempre al portal externo. Sigue sin medio de pago alternativo a Stripe (no penaliza — es una decisión de producto razonable, no una carencia técnica). |
| Seguridad | 15% | 8 | **9** | Los dos huecos señalados están cerrados: `backend/app/core/password_policy.py` exige mayúscula+minúscula+dígito+símbolo en todo punto de entrada de contraseña; Turnstile (`TurnstileWidget.tsx` + `backend/app/core/turnstile.py`) protege el registro. Se mantiene 2FA TOTP, rate limiting, CSP/HSTS, audit log y cifrado de credenciales. |
| Funcionalidades "premium" | 15% | 8 | **9** | Los dos huecos señalados están cerrados: exportación PDF/Excel de informes admin con marca corporativa real (logo, colores, gráficas de barra/donut vectoriales en el PDF — `exportAnalyticsPdf.ts`, `exportExcel.ts`) y calendario propio de reserva de sesiones QA (`app/modules/booking`, sin dependencia externa tipo Calendly). Se mantiene notificaciones, email transaccional, búsqueda, analítica real, blog con engagement, ejecución de tests QA, i18n ES/EN. |
| Rendimiento frontend | 10% | 5.5 | **7.5** | `manualChunks` en `vite.config.ts` separa los visores pesados (Docx/Xlsx/PDF/ExcelJS/editor) en chunks propios cargados solo bajo demanda — confirmado por build (`vendor-docx`, `vendor-xlsx`, `vendor-pdf`, `vendor-exceljs` no forman parte del bundle inicial). PWA real con service worker (`public/sw.js`) y manifest completo con iconos 192/512 + maskable. `staleTime` afinado en 22 puntos de `useQuery`. `loading="lazy"` en 10 puntos. Resta: algunos vendor chunks individuales siguen superando 500 KB (aceptable al ser lazy, pero un split más fino los reduciría más). |
| Testing | 10% | 4 | **5.5** | Frontend pasa de 6 a 10 archivos de test (checkout/gating de catálogo, login + 2FA, utilidades de export). Backend se mantiene en 24 archivos / 59 tests — **no se añadieron tests nuevos para los módulos nuevos** (`booking`, `pwa`, diagnósticos del scheduler). Sigue sin existir CI (`.github/workflows` no existe): los 59+59 tests combinados siguen dependiendo de que alguien los ejecute a mano. Este es el punto que menos ha avanzado respecto al resto. |
| SEO y accesibilidad | 10% | 5 | **8.5** | Los cuatro huecos señalados están cerrados: 117 pares `<label htmlFor>`↔input (coincide exactamente con el hallazgo original), `document.documentElement.lang` sincronizado en `i18n/index.ts`, contraste de `ase-muted` corregido a ≥5.7:1 (comentario explícito en `tailwind.config.ts`), JSON-LD (`components/seo/JsonLd.tsx`) presente en Home, Pricing y entradas de blog, y `SkipLink.tsx` para navegación por teclado. |
| Observabilidad/DevOps | 10% | 5 | **6.5** | Se añade Dockerfile de producción versionado (`backend/Dockerfile`), se confirma que la carpeta `supabase/` residual ya no existe, y se enriquece `/admin/system-status` con estado del scheduler de APScheduler (tareas registradas + próxima ejecución) documentado en `docs/OBSERVABILITY.md` junto al uso del panel nativo de Railway. Resta: sigue sin CI/CD (ningún workflow en `.github/`), y `SENTRY_DSN`/`VITE_SENTRY_DSN` siguen vacíos en las plantillas — no verificable desde el repo si está activo en producción real (depende de que Roberto lo configure en Railway/Vercel, no de código). |
| Calidad de código | 5% | 7 | **8** | Cada bloque de esta sesión se verificó con `py_compile`, `tsc --noEmit`, `eslint` y `alembic heads` (head único confirmado: `c1a8f3d29b6e`) antes de darse por cerrado — sin regresiones detectadas. Convenciones de módulo, migraciones a mano y patrones RBAC se mantienen consistentes en el código nuevo (`booking`, diagnósticos). |
| Diseño visual / identidad premium | 10% | 7 | **9** | El lenguaje "premium" del mapa de aplicación del admin (glow radial, grid sutil, `fade-in-up`/`glow-pulse`, hover con profundidad) se extendió deliberadamente a Home, Precios y Blog, y se reutilizó en el nuevo módulo de reservas y en la tarjeta de facturación — ya no es exclusivo del panel admin. Identidad tipográfica y paleta se mantienen sin plantilla genérica. |

**Puntuación global ponderada: 8.1 / 10 (81 / 100).** (anterior: 6.6/10 — 66/100)

## Qué movió la aguja

De los 19 puntos de mejora listados en la auditoría anterior, **17 están implementados y verificados en el código actual**. Los dos que quedan pendientes son exactamente los que más pesan sobre "Testing" y "Observabilidad/DevOps":

- **CI/CD (punto 8 de la lista anterior)**: sigue sin existir un workflow de GitHub Actions que ejecute `pytest`/`vitest` en cada push. Es la carencia individual con más impacto restante — los 118 tests combinados (59 backend + ~59 frontend) son un activo real que hoy no se aprovecha automáticamente.
- **Activar Sentry en producción (punto 6)**: no es una tarea de código — la integración ya existe en ambos lados, solo falta que las variables `SENTRY_DSN`/`VITE_SENTRY_DSN` se rellenen en Railway/Vercel. No se puede verificar ni resolver desde el repositorio.

Todo lo demás — accesibilidad de formularios, SEO técnico, rendimiento del bundle, PWA, seguridad de contraseñas/captcha, exportación de informes, facturación in-app, calendario de consultoría, y la extensión del acabado visual premium a todo el sitio público — pasó de "pendiente" a "hecho y verificado".

## Fortalezas ya al nivel premium (ampliado respecto a la auditoría anterior)

- Todo lo ya reconocido antes: Stripe end-to-end, 2FA/rate limiting/CSP/audit log, analítica real, identidad visual propia, ejecución de tests QA como diferenciador de negocio.
- Exportación de informes con marca corporativa real y gráficas vectoriales — nivel de acabado propio de un producto B2B maduro, no un genérico "export to CSV".
- Calendario de reservas propio construido sobre la misma base de auth/permisos/email que el resto de la plataforma, sin coste recurrente de un SaaS de terceros.
- PWA instalable de verdad (manifest + service worker), no solo una etiqueta `<meta>` suelta.
- El lenguaje visual "premium" ya no vive solo en el panel admin: aparece en los puntos de primer contacto con el cliente (Home, Precios, Blog).

## Lo que queda para seguir subiendo la nota

1. **CI en GitHub Actions** — ejecutar `pytest` y `vitest` en cada push/PR. Es lo único que movería "Testing" de forma notable sin escribir un solo test nuevo.
2. **Tests para los módulos añadidos en esta sesión** (`booking`, diagnóstico del scheduler) — el conteo de tests backend no creció pese a añadir un módulo completo nuevo con lógica de estado (reservar/cancelar franjas).
3. **Confirmar `SENTRY_DSN` relleno en producción** (Railway) y `VITE_SENTRY_DSN` en Vercel — puramente de configuración, cero código.
4. Opcional, bajo impacto: dividir aún más los vendor chunks más pesados (`vendor-exceljs` a 930 KB, `vendor-pdf` a 600 KB) si en el futuro se accede a ellos con más frecuencia de la actual (hoy son lazy y no afectan la carga inicial).

## Conclusión

La plataforma pasó de "núcleo sólido con una superficie desigual" (6.6/10) a un producto coherente de punta a punta (8.1/10): el mismo núcleo transaccional y de seguridad que ya destacaba en la auditoría anterior ahora está acompañado de accesibilidad, SEO técnico, rendimiento y acabado visual al mismo nivel, más dos funcionalidades nuevas (facturación in-app y calendario de consultoría) que cierran huecos de producto reales. El único frente que no avanzó al ritmo del resto es la automatización de calidad (CI) — es, además, la mejora más barata de las que quedan: no requiere escribir código nuevo, solo conectar lo que ya existe.
