import { ContractGuardViewer } from './registry'

/** Renderiza el visor propio de un producto. Un `case` por visor registrado. */
export function ProductViewer({ viewer }: { viewer: string | undefined }) {
  switch (viewer) {
    case 'contract_guard':
      return <ContractGuardViewer />
    default:
      return null
  }
}
