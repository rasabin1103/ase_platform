import { lazy } from 'react'

/**
 * Visor propio de cada producto probable desde «Probar mis productos».
 *
 * La clave es el `viewer` que el backend asigna a cada producto
 * (backend/app/core/product_viewers.py). Los productos que se ejecutan como
 * workflow de GitHub Actions usan el visor genérico (viewer === 'workflow') y
 * no aparecen aquí. Añadir un producto con herramienta propia = su entrada en
 * el backend + su componente aquí (cargado bajo demanda).
 */
export const WORKFLOW_VIEWER = 'workflow'

export const ContractGuardViewer = lazy(() => import('./contractGuard/ContractGuardWorkbench'))

/** Claves de visor con componente propio (ver ProductViewer). */
export const TOOL_VIEWERS = ['contract_guard'] as const

export function hasProductViewer(viewer: string | undefined): boolean {
  return (TOOL_VIEWERS as readonly string[]).includes(viewer ?? '')
}
