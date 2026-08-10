import { useState } from 'react'
import { cn } from '../ui/cn'

export type ProjectCardData = {
  title: string
  imageSrc: string
  location: string
  year: string
  magnitude: string
}

export function ProjectCard({ project, className }: { project: ProjectCardData; className?: string }) {
  const [imgOk, setImgOk] = useState(true)

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface shadow-soft',
        'transition duration-200 hover:-translate-y-1 hover:border-ase-brand/25',
        className,
      )}
    >
      <div className="relative aspect-[16/11] w-full bg-ase-bg2">
        {imgOk ? (
          <img
            src={project.imageSrc}
            alt={project.title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-ase-muted">
            Añade foto en <span className="ml-1 font-mono text-ase-text2">{project.imageSrc}</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-black/0 transition duration-200 group-hover:bg-black/35" />

        {/* Technical reveal */}
        <div className="absolute inset-x-0 bottom-0 translate-y-[6px] px-5 pb-5 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="rounded-2xl border border-white/10 bg-ase-ink/70 p-4 text-ase-chalk shadow-soft">
            <div className="text-sm font-semibold">{project.title}</div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <div className="text-label text-white/70">UBICACIÓN</div>
                <div className="mt-1 font-mono text-data-sm text-white/90">{project.location}</div>
              </div>
              <div>
                <div className="text-label text-white/70">AÑO</div>
                <div className="mt-1 font-mono text-data-sm text-white/90">{project.year}</div>
              </div>
              <div>
                <div className="text-label text-white/70">MAGNITUD</div>
                <div className="mt-1 font-mono text-data-sm text-white/90">{project.magnitude}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static label (no scroll animation) */}
      <div className="px-5 py-5">
        <div className="text-sm font-semibold text-ase-text">{project.title}</div>
        <div className="mt-1 text-sm text-ase-text2">
          <span className="font-mono text-data-sm text-ase-muted">{project.year}</span> · {project.location}
        </div>
      </div>
    </div>
  )
}

