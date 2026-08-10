import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

type Props = {
  label: string
  addLabel: string
  items: string[]
  onChange: (items: string[]) => void
}

export function StringListEditor({ label, addLabel, items, onChange }: Props) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const v = draft.trim()
    if (!v) return
    onChange([...items, v])
    setDraft('')
  }

  return (
    <div className="space-y-2">
      <span className="block text-xs text-ase-muted">{label}</span>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={add}>
          {addLabel}
        </Button>
      </div>
      <ul className="space-y-1">
        {items.map((line, idx) => (
          <li
            key={`${line}-${idx}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
          >
            <span className="text-ase-text2">{line}</span>
            <button
              type="button"
              className="text-xs text-ase-error hover:underline"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
