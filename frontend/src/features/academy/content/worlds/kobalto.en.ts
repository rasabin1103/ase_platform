import type { World } from '../../engine/types'

/** World pack (English): Kobalto, a fictional Madrid-based neobank. Same ids as kobalto.ts. */
export const kobaltoWorldEn: World = {
  id: 'kobalto',
  company: 'Kobalto',
  sector: 'Fintech · neobank',
  tagline: 'Your bank, no small print.',
  npcs: [
    { id: 'laura', name: 'Laura Méndez', role: 'QA Lead · your mentor', avatar: 'LM', color: '#7C5CFF' },
    { id: 'diego', name: 'Diego Ruiz', role: 'Backend developer', avatar: 'DR', color: '#22C55E' },
    { id: 'marta', name: 'Marta Sanz', role: 'Product Owner · Payments', avatar: 'MS', color: '#F0B429' },
    { id: 'oscar', name: 'Óscar Gil', role: 'IT · Workplace', avatar: 'ÓG', color: '#38BDF8' },
    { id: 'ivan', name: 'Iván Torres', role: 'Platform / DevOps', avatar: 'IT', color: '#F97316' },
    { id: 'carmen', name: 'Carmen López', role: 'Risk & Compliance', avatar: 'CL', color: '#EC4899' },
    { id: 'nuria', name: 'Nuria Vidal', role: 'Customer Support', avatar: 'NV', color: '#14B8A6' },
    { id: 'raul', name: 'Raúl Ortega', role: 'Engineering Manager', avatar: 'RO', color: '#A3A3A3' },
    { id: 'sergio', name: 'Sergio Navas', role: 'QA Automation · Cards', avatar: 'SN', color: '#EAB308' },
    { id: 'elena', name: 'Elena Prieto', role: 'Product Owner · Business', avatar: 'EP', color: '#F472B6' },
    { id: 'tomas', name: 'Tomás Ferrer', role: 'Senior developer · Business', avatar: 'TF', color: '#60A5FA' },
    { id: 'sofia', name: 'Sofía Reyes', role: 'Junior developer · Business', avatar: 'SR', color: '#A78BFA' },
    { id: 'personas', name: 'People Team', role: 'HR', avatar: 'K', color: '#4C7DFF' },
  ],
}
