# ASE frontend — design direction

Incremental evolution toward a **calm enterprise SaaS** look (Stripe / Vercel / Linear), without changing brand colours or information architecture.

## Tokens (`tailwind.config.ts`)

| Token | Use |
|-------|-----|
| Colours `ase.*` | Single source for backgrounds, text, borders, accents — do not introduce ad-hoc hexes. |
| `font-sans` | **Inter** — UI body and dense screens. |
| `font-display` | **Manrope** — marketing headlines and hero emphasis. |
| `rounded-2xl` | Preferred radius for cards, panels, primary actions. |
| `shadow-soft`, `shadow-ase`, `shadow-ase-lg` | Depth hierarchy; avoid heavy chroma glows. |
| `duration-200` + `ease-out` | Default motion for hovers and presses. |

## Layout primitives

- **`PublicAmbientBackground`** — shared marketing canvas (gradients + technical grid). Used by `PublicLayout` and `AuthPublicLayout`.
- **`Button`**, **`Card`**, **`Badge`** — keep interactions subtle; prefer ring/border over loud shadows.

## Phases (roadmap)

1. **Home / hero / header / CTA** — done in current iteration.
2. **Catalog cards & dashboard** — next: spacing, hover, badges, skeletons.
3. **About / storytelling** — tighten copy blocks + visual rhythm.
4. **Polish** — loading states, forms, mobile spacing.

Do **not**: gamer / cyberpunk / crypto aesthetics, particle fields, or long decorative animations.
