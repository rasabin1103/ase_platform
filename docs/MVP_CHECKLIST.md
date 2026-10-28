# Checklist MVP1 / MVP2 / MVP3 (reconstruida)

> Reconstruida desde el repo y el historial de trabajo; no es el plan original. Ajustar cuando se confirme.

## MVP1 — Marketplace y base de negocio

- [x] Catálogo público y privado (skills, libros, cursos, productos)
- [x] Ficha pública con precio y vista previa
- [x] Compra individual y favoritos
- [x] Solicitudes de acceso
- [x] RBAC (super admin, org owner, org admin)
- [x] Blog con autoría
- [x] Formulario de contacto al buzón
- [x] Planes: cuota de descargas, fidelidad, descuentos por plan
- [x] Cambio de plan con prorrateo
- [x] Recompensas con caducidad (60 días)
- [x] Descuento anual 10% (recomendado) / 7% (resto)
- [x] Tarjetas de plan modernas con hover
- [x] Stripe
- [x] Métricas: ingresos cobrados vs compras concedidas
- [x] SEO (HTML por ruta, sitemap, robots, datos estructurados)
- [x] Accesibilidad (auditorías y correcciones)
- [x] Revisión de idioma ES/EN
- [ ] Precio Contract Guard (29–39 €)
- [ ] Tope de descargas del plan Expert
- [ ] Valor definitivo del plan Architect

## MVP2 — Empleo y comunicación

- [x] Ofertas laborales (admin + consumidor)
- [x] Traducción automática EN de ofertas
- [x] Analizador de CV (keywords)
- [x] Análisis semántico con IA (persistido)
- [x] Notificaciones (categorías, preferencias, email, resumen)
- [x] Activación de usuario con plazo de 2FA
- [x] Reenvío de email de confirmación desde admin (código)
- [x] Desplegar commits `eeef731` y `9f71cd7`
- [x] Verificar dominio y remitente en Resend
- [x] Validar envío real en producción (emails llegan en pro)
- [ ] Guardar fallos de envío en `error_logs`

## MVP3 — Ejecución, Academy y operación

- [x] «Probar mis productos» (workflow GitHub / visor propio)
- [x] Contract Guard: comparar y validar esquema
- [x] Tarjeta de resultado clara + detección de servers
- [x] Academy SQL EN (m00–m10)
- [x] Academy Gestión QA EN (m00–m11, 11 apps)
- [x] Limpieza de código muerto y tests
- [x] Repo y workspace sincronizados
- [x] `git push origin mvp3` y merge del PR
- [x] Subir `ase_run.py` y workflow a `rasabin1103/api_contract_guard` (funcionando en pro)
- [ ] Valorar repo `api_contract_guard` privado
- [ ] Producto 32: `repo_path` real en ASE-Catalog
- [ ] Resolver traducciones `PENDING_TRANSLATION`
