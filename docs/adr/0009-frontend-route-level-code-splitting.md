# 0009 — Frontend code-splitting at the route level

## Context

The entire route tree loaded in a single bundle (~1.5 MB uncompressed, ~400 KB gzipped) that could only grow — every visitor downloaded every page's code (admin dashboard, TipTap blog editor, Recharts-based analytics) regardless of which page they actually opened.

## Decision

Every leaf page component is loaded via `React.lazy(() => import(...))` rather than a static import, organized into two new files to satisfy ESLint's Fast-Refresh rule (see Consequences): `src/app/lazyPages.tsx` (pure lazy component exports, ~50 pages) and `src/app/routeHelpers.tsx` (small wrapper/dispatch components like `RoleAwareDashboard` that also can't share a file with `router.tsx`'s non-component `router` export). `router.tsx` itself only assembles the route tree. Each of the three top-level layouts (`PublicLayout`, `AuthPublicLayout`, `AppLayout`) wraps its own `<Outlet />` in a `<Suspense fallback={<RouteLoadingFallback />}>` — three separate boundaries, not one global one — so page chrome (header/sidebar) stays mounted and only the route content area shows a spinner during a route transition.

## Alternatives considered

- **One global `<Suspense>` around the whole router.** Rejected: would flash the entire screen (including header/nav) to a spinner on every navigation, a visibly worse UX than only the content area loading.
- **Split by feature area instead of by route** (e.g. one chunk for "all admin pages"). Rejected: still ships unrelated admin pages together (e.g. visiting the blog editor would pull in the catalog-categories page too) — per-route splitting is more granular for the same tooling cost.

## Consequences

- Reduced the main bundle to ~613 KB uncompressed (~192 KB gzipped); heavy pages are isolated into their own chunks (the TipTap-based blog editor at ~416 KB, the Recharts-based admin chart page at ~313 KB) that only load when actually visited.
- `router.tsx` cannot mix its non-component `export const router = createBrowserRouter(...)` with any locally-defined component — ESLint's `react-refresh/only-export-components` rule disqualifies the whole file's Fast-Refresh boundary once any export isn't component-like, and flags every component-shaped declaration in that file regardless of whether it's exported. This is why the wrapper components had to move to a dedicated file rather than staying inline in `router.tsx` — a real constraint from the tooling, not a style preference.
- Every new leaf page added going forward must be added to `lazyPages.tsx` as a lazy import, not as a direct import in `router.tsx`, or it silently rejoins the main bundle.
