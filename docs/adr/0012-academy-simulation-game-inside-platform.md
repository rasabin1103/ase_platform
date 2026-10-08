# 0012 — ASE Academy simulation game is a data-driven 2D web feature inside ase_platform, not a 3D game or a separate app

## Context

We want course-games: learners live a simulated workplace (first course: testing fundamentals) and their decisions have immediate and delayed consequences. Two questions came up: (1) should it be a "powerful" 3D game, and (2) should it live in its own folder/app (`ase_game`) or inside `ase_platform`.

The learning value of the target skills (reading ambiguous requirements, designing test cases, reporting bugs, go/no-go calls) lives in screen-based work and decisions, not in a 3D environment. `ase_platform` already provides the same frontend stack we would choose (React 19, Vite, TS, Tailwind), auth (JWT, 2FA), a catalog with a `course` type, purchases (Stripe), `Course`/`CourseEnrollment`, PostgreSQL, observability, and hosting (Vercel + Railway).

## Decision

- Build the game as a **2D "simulated work desktop"** (fake ticket board, chat, email, a real mini app with seeded bugs) inside `ase_platform`: frontend in `frontend/src/features/academy/`, backend in `backend/app/modules/academy/`.
- The engine is a **deterministic, data-driven state machine** in pure TypeScript; courses are YAML content validated with zod. New courses = new content, not new code.
- Progress and decision logs are stored server-side. The final exam that grants a certificate is scored **server-side only**.

## Alternatives considered

- **3D game (Unity/Godot/Three.js).** Rejected for now: 10–20× production cost per scene, slower content iteration for each new course, heavier downloads/GPU needs that hurt reach (browser, mobile, corporate laptops), and no added learning value for the core skills. Can be revisited as an optional visual layer over the same engine if there is traction.
- **Separate app/repo (`ase_game`).** Rejected: would duplicate auth, payments, enrollment, design system and deployment. Separation was only attractive when the platform stack was unknown.

## Consequences

- No new infrastructure or hosting cost; the feature ships with the platform's normal deploy.
- The academy feature must stay isolated (own folder, route-level lazy loading per ADR 0009) so it doesn't bloat the main bundle or couple to unrelated modules.
- Mission content is visible to the client; we accept that and only protect the certificate exam.
- Content versioning is required so in-progress runs aren't broken by content updates.
