# ASE Design System

Guía de diseño para **Arce Sabin Engineering (ASE)**. Usar estos tokens y patrones antes de introducir estilos ad hoc.

## Identidad

| Atributo | Valor |
|----------|-------|
| Sector | Ingeniería de software, QA automation, arquitectura de plataformas |
| Personalidad | Precisa, técnica, confiable, sobria |
| Tono visual | Oscuro, alto contraste, acento azul/violeta de marca |

## Tipografía

| Rol | Familia | Uso |
|-----|---------|-----|
| Display | Fraunces Variable | Titulares (`font-display`) |
| Body | Public Sans Variable | Texto, UI (`font-sans`) |
| Mono | IBM Plex Mono | Código, datos (`font-mono`) |

**No usar** Inter ni CDNs de Google Fonts. Las fuentes se cargan desde `@fontsource` en `frontend/src/styles/fonts.css`.

## Color

```text
Marca (brand)     #4C7DFF   ase-brand / ase-primary
Marca fuerte      #7C5CFF   ase-brand-strong (segundo stop del gradiente, no un hover-darken)
Acento secundario #F0B429   ase-gold (reservado para UN momento "premium/destacado" — plan recomendado, CTA estrella)
Fondo             #0B1220   ase-bg (navy, no negro puro)
Superficie        #131B2E   ase-surface
Texto             #F3F6FC   ase-text
Texto secundario  #CBD5E1   ase-text2
Éxito / aviso / error → ver tailwind.config.ts (ase.success, ase.warning, ase.error)
```

Nota: la paleta real es azul/violeta sobre navy (ver `tailwind.config.ts`), no cian sobre negro — este documento se actualizó para reflejar lo implementado tras la re-auditoría de frontend (hallazgo de "design-system drift").

### Glass / backdrop-blur: prohibido

`frontend/src/index.css` fuerza `backdrop-filter: none !important` en todas las utilidades `backdrop-blur-*` — es una decisión deliberada ("sin efectos de cristal"), no un olvido. Al escribir una superficie traslúcida (headers fijos, tablas con scroll, etc.), **no** uses el patrón `bg-x/80 backdrop-blur supports-[backdrop-filter]:bg-x/60`: `@supports` detecta que el navegador entiende la propiedad `backdrop-filter`, no que esté activa, así que ese patrón aplicaba la opacidad *más transparente* sin ningún blur que la compensara. Usa directamente la opacidad sólida pensada como *fallback* (p. ej. `bg-ase-bg2/80`, `bg-ase-surface/90`) sin la clase `backdrop-blur` ni la variante `supports-[...]`.

## Iconografía y favicon

- Favicon maestro: `frontend/public/favicon.svg` (vector, sin dependencias externas).
- Apple touch: `frontend/public/apple-touch-icon.svg` (180×180).
- PWA manifest: `frontend/public/site.webmanifest`.
- OG / redes: `frontend/public/og/ase-share.svg` (1200×630).

No usar el favicon por defecto de Vite ni screenshots genéricos.

## Meta y compartir

- Título: `Arce Sabin Engineering`
- `theme-color`: `#020617`
- Imagen OG: `/og/ase-share.svg` (configurar `VITE_SITE_URL` en producción para URLs absolutas).
- Config central: `frontend/src/config/site.ts`

## Interacción

### Focus visible

- Anillo: `ring-2 ring-ase-brand/60 ring-offset-2 ring-offset-ase-bg`
- Nunca depender del outline azul del navegador.
- Botones: clase base en `Button.tsx` + utilidad `.ase-focus-ring`.

### Hover

- Enlaces de navegación: `text-ase-text2` → `hover:text-ase-brand`
- Botones primarios: `hover:brightness-110` + sombra `shadow-brand`
- Sin azul/violeta por defecto de Tailwind (`cyan-300`, `blue-500`, etc.).

### Scroll

- `html { scroll-behavior: smooth }` para anclas (`#section`).
- Al cambiar de ruta (React Router): scroll instantáneo al tope (`ScrollToTop`).
- Respetar `prefers-reduced-motion`.

## Estados de carga

- **Skeleton**: fondo `ase-surfaceSoft`, borde `ase-brand/10`, shimmer `ase-brand/25` (`Skeleton.tsx`).
- **Spinner**: anillo de marca (`LoadingIndicator.tsx`), no `animate-spin` gris del navegador.
- Evitar spinners sueltos; preferir skeletons en listas y tarjetas.

## Página 404

- Ruta `*` → `NotFoundPage` con cabecera/pie públicos y CTA a inicio.
- Código visual `404`, tipografía display, acento de marca.
- No redirigir silenciosamente a `/`.

## Sombras y efectos

- Sombra estándar: `shadow-soft`
- Sombra de marca: `shadow-brand`
- Evitar: glassmorphism (`backdrop-blur`), gradientes aurora, sombras Tailwind genéricas (bloqueadas en `index.css`).

## Espaciado y radios

- Sección pública: `py-28`, contenedor `max-w-[1440px] px-6 sm:px-8`
- Radios: `rounded-ase-lg`, `rounded-ase-2xl`, `rounded-ase-pill`

## Checklist antes de merge

- [ ] ¿Usa tokens `ase-*` y no colores Tailwind genéricos?
- [ ] ¿Focus visible con marca?
- [ ] ¿Loading con skeleton/spinner de marca?
- [ ] ¿Meta/OG actualizados si cambia título o imagen?
- [ ] ¿404 y scroll probados en navegación?
