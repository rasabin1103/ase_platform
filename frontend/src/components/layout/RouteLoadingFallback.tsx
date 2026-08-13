/** Shown briefly inside a layout's <Outlet /> while a lazily-loaded route
 * chunk downloads (see app/router.tsx — every leaf page is React.lazy()'d
 * so the initial bundle only ships the shell + whichever page was
 * requested, instead of the entire route tree). Kept intentionally quiet —
 * this only shows on a slow connection or a cold chunk fetch, not on every
 * navigation, since already-downloaded chunks resolve synchronously. */
export function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-ase-brand" />
    </div>
  )
}
