import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { ScrollToTop } from '../layout/ScrollToTop'
import { SkipLink } from '../layout/SkipLink'
import { RouteLoadingFallback } from '../layout/RouteLoadingFallback'
import { PublicHeader } from './PublicHeader'
import { PublicFooter } from './PublicFooter'

export function AuthPublicLayout() {
  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden bg-ase-bg text-ase-text">
      <SkipLink />
      <ScrollToTop />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-80 left-1/2 h-[720px] w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-r from-ase-primary/20 via-ase-accent/14 to-transparent blur-3xl" />
        <div className="absolute top-40 left-[-260px] h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-ase-accent/10 via-transparent to-ase-primary/12 blur-3xl" />
        <div className="absolute bottom-[-280px] right-[-280px] h-[640px] w-[760px] rounded-full bg-gradient-to-tr from-ase-accent/12 via-transparent to-ase-primary/14 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <PublicHeader />
      {/* flex-1 makes this the one element that grows to fill leftover
          viewport height, so PublicFooter always sits right after the
          page's real content instead of leaving a dead gap below it on
          short pages (login, register, ...) — see AuthPublicLayout's
          min-h-full on the outer flex column. `flex flex-col justify-center`
          then takes that same leftover space and splits it evenly above and
          below the form instead of dumping it all beneath a top-anchored
          card — these auth pages (login, register, forgot/reset password)
          are always shorter than a typical viewport, so without this the
          card sits pinned under the header with one big empty band before
          the footer. On the rare taller viewport where content would
          overflow, justify-center is a no-op and the page just scrolls. */}
      <main id="main-content" tabIndex={-1} className="relative flex flex-1 flex-col justify-center outline-none">
        <Suspense fallback={<RouteLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  )
}

