import { clockLabel } from '../engine/engine'
import type { ToolProps } from './types'

export function LogsTool({ mission, state }: ToolProps) {
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-black/40 p-4 font-mono text-caption leading-relaxed">
      <p className="text-ase-muted"># kobalto-payments-api · staging · tail -f</p>
      {state.log.length === 0 && <p className="text-ase-muted">Sin peticiones todavía.</p>}
      {state.log.map((l) => (
        <p key={l.id} className={l.status === 'error' ? 'text-ase-warning' : 'text-ase-success'}>
          <span className="text-ase-muted">[{clockLabel(mission, l.at)}:{String((l.id * 17) % 60).padStart(2, '0')}] #{l.id} </span>
          {l.technical}
        </p>
      ))}
    </div>
  )
}
