# Auditoría de nivel premium — Plataforma ASE

Fecha: 26 de agosto de 2026
Alcance: backend (FastAPI/SQLAlchemy, 45 módulos) y frontend (React 19/Vite, 54 páginas) tal como están hoy en el repositorio, sin cambios de código realizados durante esta auditoría.

Metodología: inventario factual del código (Stripe/billing, seguridad, rendimiento, testing, SEO/accesibilidad, DevOps, funcionalidades, calidad, diseño), contrastado con los autoinformes ya existentes en el repo (`ASE_Auditoria_Lanzamiento_Publico.md`, `ASE_Auditoria_Accesibilidad.md`). Cada categoría se puntúa 0–10 según evidencia verificada, no percepción.

## Puntuación objetiva

| Categoría | Peso | Nota /10 | Evidencia clave |
|---|---|---|---|
| Monetización y pagos | 15% | 8 | Stripe real (checkout, portal de facturación, webhooks firmados), fidelización con tiers y descuentos automáticos. Sin facturación propia (depende 100% del portal de Stripe) y sin medio de pago alternativo. |
| Seguridad | 15% | 8 | JWT + refresh, 2FA TOTP real, rate limiting, CORS con allowlist, cabeceras de seguridad (CSP, HSTS, X-Frame-Options), audit log, cifrado en reposo de credenciales. Sin política de complejidad de contraseña ni protección anti-bot en formularios públicos. |
| Funcionalidades "premium" | 15% | 8 | Notificaciones + email transaccional propio, búsqueda en catálogo, dashboard con analítica real (no mock), blog con comentarios/reacciones, ejecución de tests QA como diferenciador de negocio, i18n ES/EN al 100%. Sin exportación a PDF/Excel de informes ni integración de calendario para consultoría. |
| Rendimiento frontend | 10% | 5.5 | Lazy-loading por ruta ya implementado, pero bundle principal de 660 KB y visores (Docx 488 KB, Xlsx 328 KB) sin `manualChunks`; sin PWA/service worker, sin `staleTime` afinado en TanStack Query, sin lazy-loading de imágenes. |
| Testing | 10% | 4 | 24 archivos/59 tests en backend (razonable), pero solo 6 archivos de test en frontend frente a 54 páginas, y **no hay CI** que los ejecute automáticamente — los tests dependen de que alguien los lance a mano. |
| SEO y accesibilidad | 10% | 5 | Meta tags, OG, robots.txt y sitemap.xml presentes; título/descripción dinámicos por página. Pero 0 de 117 `<label>` usan `htmlFor`, no hay `lang` sincronizado al cambiar idioma, contraste insuficiente en `ase-muted`, sin JSON-LD ni enlace "saltar al contenido". |
| Observabilidad/DevOps | 10% | 5 | Sentry integrado en ambos lados pero con DSN vacío en las plantillas de entorno (no confirmable si está activo en producción); registro propio de errores como respaldo. Sin CI/CD, sin Dockerfile de producción versionado, carpeta `supabase/` que parece residual junto a Alembic. |
| Calidad de código | 5% | 7 | Prácticamente cero TODOs/FIXMEs pendientes; evolución iterativa demostrable (el hallazgo de "sin pasarela de pago" del informe del 12/08 ya está resuelto por commits del 20/08). La brecha de testing frontend pesa en contra. |
| Diseño visual / identidad premium | 10% | 7 | Sistema de diseño propio y deliberado (tipografía variable, paleta reducida, sin plantilla genérica "gradiente morado"). Coherente pero austero: sin glassmorphism ni microinteracciones fuera del panel admin recién rediseñado. |

**Puntuación global ponderada: 6.6 / 10 (66 / 100).**

Lectura: el núcleo transaccional y de seguridad (pagos, auth, RBAC) está en un nivel genuinamente premium/production-grade. Lo que retiene la puntuación global es todo lo que rodea a ese núcleo — testing frontend, CI, accesibilidad de formularios, SEO técnico y pulido visual fuera del dashboard admin — que hoy es funcional pero no está al mismo nivel de acabado.

## Fortalezas ya al nivel premium (no tocar, mantener)

- Pagos con Stripe end-to-end (checkout, portal, webhooks) — no es una simulación.
- 2FA TOTP, rate limiting, CSP y audit log: nivel de seguridad por encima de la media de un SaaS en esta fase.
- Analítica de dashboard con datos reales, no placeholders.
- Identidad visual propia (tipografía Fraunces/Public Sans, paleta cian + acento dorado) en vez de plantilla genérica.
- Diferenciador de negocio real: ejecución de suites de test QA por cuenta del cliente vía GitHub Actions, alineado con el posicionamiento de consultoría.

## Listado de mejoras priorizadas para maximizar el nivel premium

### Quick wins (alto impacto, bajo esfuerzo)

1. Enlazar `<label htmlFor>` con su input en los 117 formularios afectados — accesibilidad básica que además reduce errores de usuario en checkout/registro.
2. Sincronizar `document.documentElement.lang` al cambiar de idioma (hoy queda fijo en `es`).
3. Subir el contraste del color `ase-muted` a ratio AA (≥4.5:1).
4. Añadir datos estructurados JSON-LD (Organization, Product, BlogPosting) — impacto directo en SEO y en cómo se ve el sitio en resultados de búsqueda.
5. Añadir enlace "saltar al contenido" para navegación por teclado.
6. Activar Sentry en producción rellenando `SENTRY_DSN`/`VITE_SENTRY_DSN` — la integración ya existe en el código, solo falta configurarla.
7. Añadir `loading="lazy"` a imágenes y afinar `staleTime` en TanStack Query para reducir refetches innecesarios.

### Impacto medio (mejora estructural, esfuerzo moderado)

8. Configurar CI (GitHub Actions) que ejecute `pytest` y `vitest` en cada push/PR — hoy los 59 tests de backend no se ejecutan solos, lo cual es un riesgo real de regresión silenciosa.
9. Elevar la cobertura de tests frontend, priorizando los flujos críticos de negocio: checkout Stripe, login/2FA, gating de acceso a catálogo (justo lo que se tocó en la última sesión).
10. Exigir complejidad mínima de contraseña (mayúscula + dígito) y añadir un captcha (Turnstile/hCaptcha) en registro/contacto para frenar abuso.
11. `manualChunks` en Vite para separar los visores pesados (DocxViewer, XlsxViewer, gráficos) del bundle principal.
12. Exportación a PDF/Excel de informes admin (purchases, auditoría, analítica) — expectativa habitual en un producto "premium" B2B.
13. Aclarar y, si procede, retirar la carpeta `supabase/` residual para no generar confusión con Alembic como fuente única de migraciones.
14. Versionar un Dockerfile de producción para el backend en vez de depender de detección automática de Railway.

### Estratégico (mayor esfuerzo, mayor diferenciación premium)

15. Extender el lenguaje visual "premium" que ya se construyó para el mapa de aplicación del admin (glow, profundidad, microanimaciones) a Home, Precios y Blog, manteniendo la identidad minimalista pero añadiendo ese acabado en los puntos de primer contacto con el cliente.
16. Vista de facturación propia dentro de la app (histórico de recibos con la marca ASE) aunque el cobro siga en Stripe, para dar continuidad de marca en vez de reenviar siempre al portal externo.
17. Integrar calendario/reserva de sesiones (tipo Calendly) para la parte de consultoría QA — encaja con el negocio y es una función que los clientes esperan de un servicio premium.
18. PWA real (manifest + service worker) para que el dashboard se sienta "app", no solo web.
19. Métricas/APM más allá del healthcheck actual (Prometheus/Grafana o el panel nativo de Railway) para observabilidad de producción real.

## Conclusión

La base técnica (pagos, seguridad, RBAC, analítica) ya compite con productos SaaS establecidos. El salto a "nivel premium máximo" no requiere rehacer nada — requiere cerrar la distancia entre ese núcleo sólido y el resto de la superficie (accesibilidad de formularios, SEO técnico, testing automatizado en CI, y extender el acabado visual ya logrado en el panel admin al resto del sitio público). Los puntos 1–7 son ejecutables en una sola sesión de trabajo y moverían la puntuación de accesibilidad/SEO de forma notable sin ningún riesgo.
