import type { World } from '../../engine/types'

/** Pack de mundo: Kobalto, neobanco ficticio con sede en Madrid. */
export const kobaltoWorld: World = {
  id: 'kobalto',
  company: 'Kobalto',
  sector: 'Fintech · neobanco',
  tagline: 'Tu banco, sin letra pequeña.',
  npcs: [
    { id: 'laura', name: 'Laura Méndez', role: 'QA Lead · tu mentora', avatar: 'LM', color: '#7C5CFF' },
    { id: 'diego', name: 'Diego Ruiz', role: 'Backend developer', avatar: 'DR', color: '#22C55E' },
    { id: 'marta', name: 'Marta Sanz', role: 'Product Owner · Pagos', avatar: 'MS', color: '#F0B429' },
    { id: 'oscar', name: 'Óscar Gil', role: 'IT · Puesto de trabajo', avatar: 'ÓG', color: '#38BDF8' },
    { id: 'ivan', name: 'Iván Torres', role: 'Plataforma / DevOps', avatar: 'IT', color: '#F97316' },
    { id: 'carmen', name: 'Carmen López', role: 'Riesgos y Compliance', avatar: 'CL', color: '#EC4899' },
    { id: 'nuria', name: 'Nuria Vidal', role: 'Atención al cliente', avatar: 'NV', color: '#14B8A6' },
    { id: 'raul', name: 'Raúl Ortega', role: 'Engineering Manager', avatar: 'RO', color: '#A3A3A3' },
    { id: 'sergio', name: 'Sergio Navas', role: 'QA Automation · Tarjetas', avatar: 'SN', color: '#EAB308' },
    { id: 'elena', name: 'Elena Prieto', role: 'Product Owner · Empresas', avatar: 'EP', color: '#F472B6' },
    { id: 'tomas', name: 'Tomás Ferrer', role: 'Desarrollador senior · Empresas', avatar: 'TF', color: '#60A5FA' },
    { id: 'sofia', name: 'Sofía Reyes', role: 'Desarrolladora junior · Empresas', avatar: 'SR', color: '#A78BFA' },
    { id: 'personas', name: 'Equipo de Personas', role: 'RR. HH.', avatar: 'K', color: '#4C7DFF' },
  ],
}
