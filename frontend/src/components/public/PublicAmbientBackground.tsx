/**
 * Shared canvas for public + auth marketing pages: soft gradients and a light
 * technical grid (Stripe/Vercel-style restraint — no particles or heavy glow).
 */
export function PublicAmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {/* Cool ambient wash — low opacity for enterprise calm */}
      <div className="absolute -top-72 left-1/2 h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-gradient-to-r from-ase-primary/14 via-ase-accent/10 to-transparent blur-3xl" />
      <div className="absolute top-32 left-[-240px] h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-slate-500/8 via-transparent to-ase-primary/10 blur-3xl" />
      <div className="absolute bottom-[-260px] right-[-240px] h-[600px] w-[700px] rounded-full bg-gradient-to-tr from-ase-accent/8 via-transparent to-slate-600/10 blur-3xl" />
      {/* Top vignette + cool lift */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-ase-bg" />
      {/* Technical grid — fine lines, low contrast */}
      <div
        className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(to_right,rgba(248,250,252,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(248,250,252,0.45)_1px,transparent_1px)] [background-size:48px_48px]"
        style={{
          maskImage: 'radial-gradient(ellipse 85% 70% at 50% 0%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 70% at 50% 0%, black 20%, transparent 75%)',
        }}
      />
    </div>
  )
}
