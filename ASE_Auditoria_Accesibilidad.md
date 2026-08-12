# Auditoría de accesibilidad — ASE Platform

Fecha: 12 de agosto de 2026
Alcance: frontend completo (sitio público + panel privado), React 19 + Tailwind.
Método: revisión estática del código fuente (JSX/TSX, `tailwind.config.ts`, `index.css`) — conteos exactos vía búsqueda en todo el repositorio y cálculo real de ratios de contraste WCAG a partir de los colores definidos en el theme. No pude ejecutar una herramienta automatizada en navegador (axe-core/Lighthouse) porque mi entorno de trabajo no tiene salida de red para descargar Chromium — lo dejo anotado como paso siguiente recomendado, no reemplaza esta revisión pero la complementa.

Sin cambios de código en esta pasada — es solo el informe, tal como pediste.

## Resumen

El sitio tiene una base bastante mejor de lo habitual (todas las imágenes llevan `alt`, el estado de foco por teclado está bien resuelto, ya hay `aria-label` en los controles de solo icono más comunes). Pero hay un problema estructural que afecta a **absolutamente todos los formularios de la plataforma**: ninguna etiqueta está asociada a su campo. Y el color "muted" que se usa para textos pequeños en 80 archivos no cumple el contraste mínimo para texto normal.

---

## 🔴 Importante — afecta a todo el sitio

### 1. Ninguna etiqueta `<label>` está asociada a su campo
Hay 117 elementos `<label>` en el código, y **ninguno usa `htmlFor`** (0/117). Esto afecta a login, registro, recuperación de contraseña, perfil, canjeo de código, formulario de contacto, y prácticamente todos los formularios del panel de admin (anuncios, auditoría, catálogo, etc.).

**Por qué importa:** un lector de pantalla no puede anunciar "Email, campo de texto" si el `<label>` no está enlazado al `<input>` — solo lee el campo como "campo de texto" sin más contexto. Además, sin esa asociación, hacer clic en la etiqueta no enfoca el campo (una ayuda importante para gente con movilidad reducida).

**Ejemplos concretos:**
- `pages/LoginPage.tsx` — `<label>Email</label>` / `<label>Password</label>` sin `htmlFor`.
- `pages/independent/ProfilePage.tsx`, `components/creator/CreatorApplicationModal.tsx`, `pages/admin/AdminAnnouncementsPage.tsx`, `pages/admin/AdminAuditLogPage.tsx`, `components/catalog/RedeemCodeForm.tsx` — mismo patrón.

**Arreglo (cuando lo abordemos):** añadir un `id` único a cada `<Input>`/`<select>`/`<textarea>` y su `htmlFor` correspondiente en el `<label>`. Es mecánico pero hay que tocar 117 sitios — candidato ideal para hacerlo por lotes, módulo por módulo.

### 2. El color "muted" no cumple el contraste mínimo en texto normal
`ase-muted` (`#64748B`) se usa en **358 sitios de 80 archivos** — sobre todo en textos pequeños (`text-xs`) tipo ayudas, leyendas y etiquetas secundarias.

| Combinación | Ratio real | Mínimo WCAG AA (texto normal) | Resultado |
|---|---|---|---|
| `ase-muted` sobre `ase-bg` (fondo principal) | 4.24:1 | 4.5:1 | 🔴 No cumple |
| `ase-muted` sobre `ase-surface` (tarjetas) | 3.73:1 | 4.5:1 | 🔴 No cumple |
| `ase-muted` sobre `ase-bg2` | 3.75:1 | 4.5:1 | 🔴 No cumple |

Cumple el umbral más bajo de "texto grande" (3:1), pero casi todos sus usos son `text-xs` (12px), muy por debajo del tamaño que activa ese umbral reducido (18pt / ~24px, o 14pt negrita / ~18.6px). Para alguien con baja visión, esas etiquetas y textos de ayuda son difíciles de leer en la mayoría de fondos de la plataforma.

**Arreglo (cuando lo abordemos):** aclarar `ase-muted` unos puntos (por ejemplo, moverlo de `#64748B` hacia algo más cercano a `#94A3B8`/`#A1A9BC`, cerca de 4.6–5:1) es un cambio de una sola línea en `tailwind.config.ts` que arregla los 358 usos de golpe — mucho más barato que tocarlos uno por uno.

---

## 🟠 Medio

### 3. No hay enlace "saltar al contenido"
No encontré ningún patrón de "skip to content" en el código. Alguien que navega solo con teclado tiene que tabular por todo el header/sidebar en cada página antes de llegar al contenido principal.

**Lo bueno:** los tres layouts (`AppLayout`, `PublicLayout`, `AuthPublicLayout`) ya usan la etiqueta semántica `<main>`, así que el destino del enlace ya existe — solo falta el enlace en sí (un `<a href="#main-content">` visualmente oculto que aparece al enfocarlo con Tab).

### 4. El idioma del documento no cambia al cambiar EN/ES
`index.html` fija `<html lang="es">` de forma estática, y el selector de idioma (`i18n/index.ts`) nunca actualiza `document.documentElement.lang` al cambiar a inglés.

**Por qué importa:** un lector de pantalla usa el atributo `lang` para elegir las reglas de pronunciación. Si el usuario cambia la web a inglés pero `lang` sigue en `"es"`, el lector de pantalla pronunciará el texto en inglés con fonética española — resulta ininteligible.

**Arreglo (cuando lo abordemos):** una línea en el `I18nProvider` (`document.documentElement.lang = language`) cada vez que cambia el idioma.

---

## 🟡 Menor — a vigilar, no bloquea nada

### 5. El color de borde estándar tiene muy poco contraste
`ase-border` (`#334155`) sobre el fondo principal da apenas 1.95:1. Mientras sea puramente decorativo (separadores, tarjetas) no es un problema — WCAG solo exige 3:1 cuando ese borde es la *única* forma de percibir el límite de un control interactivo (por ejemplo, un campo de formulario sin ningún otro indicio visual). Vale la pena revisarlo puntualmente en los campos de formulario más sobrios, donde el borde es literalmente lo único que delimita el campo.

---

## ✅ Ya está bien

- **Las 14 etiquetas `<img>` del proyecto llevan `alt`** (0 casos sin atributo) — incluidas las que forman parte del contenido informativo, no solo decorativo.
- **El estado de foco por teclado está bien resuelto y es consistente**: `:focus { outline: none }` solo suprime el contorno del navegador para clics de ratón; `:focus-visible` sigue mostrando un contorno cian de 2px con separación — el patrón moderno recomendado, no un fallo.
- **Los controles de solo icono que revisé ya tienen `aria-label`**: favoritos (`CatalogItemCard`, `CatalogPremiumCard`, `CatalogDetailPage`), campana de notificaciones, menú móvil (`PublicHeader`), flechas del carrusel de imágenes.
- **Buen contraste en el texto principal**: `ase-text` sobre fondo da 19.3:1 y `ase-text2` da 13.6:1 — muy por encima del mínimo AA (4.5:1), incluso superan el nivel AAA (7:1).
- **Landmark `<main>` presente** en los tres layouts de la aplicación (público, auth, panel privado).

---

## Próximos pasos recomendados (sin tocar nada todavía)

1. Aclarar `ase-muted` en `tailwind.config.ts` — un cambio de una línea que arregla 358 usos de golpe. El más barato de los cuatro.
2. Asociar `<label>`/`htmlFor` en los formularios más usados primero (login, registro, perfil, contacto) y extender al resto del panel admin después.
3. Añadir el enlace "saltar al contenido" — bajo esfuerzo, el destino (`<main>`) ya existe en los tres layouts.
4. Sincronizar `document.documentElement.lang` con el idioma activo — una línea en `I18nProvider`.
5. Cuando quieras ir más allá de esta revisión estática: una pasada real con lector de pantalla (VoiceOver/NVDA) y la extensión axe DevTools en Chrome, que sí detecta cosas que el código por sí solo no muestra (orden de lectura real, anuncios dinámicos de `aria-live`, etc.).

Dime cuáles quieres que aborde primero y los implemento.
