import { Outlet } from 'react-router-dom'
import { ScrollToTop } from '../layout/ScrollToTop'
import { PublicHeader } from './PublicHeader'
import { PublicFooter } from './PublicFooter'

export function PublicLayout() {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-ase-bg text-ase-text">
      <ScrollToTop />
      <div className="pointer-events-none absolute inset-0">
        {/* Blueprint grid — the brand's own technical/engineering signature,
            used as the site-wide background instead of generic aurora glow. */}
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:8px_8px] opacity-[0.05]" />
        {/* One restrained, top-anchored wash for depth — inline style so it
            isn't caught by the project's blanket gradient-utility block in index.css. */}
        <div
          className="absolute inset-x-0 top-0 h-[420px]"
          style={{ backgroundImage: 'linear-gradient(to bottom, rgba(56,189,248,0.07), transparent)' }}
        />
      </div>

      <PublicHeader />
      <main className="relative">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}

