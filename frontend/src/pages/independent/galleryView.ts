export type GalleryView = 'grid' | 'list'

const VIEW_KEY = 'ase.testExecution.view'

export function readStoredView(): GalleryView {
  try {
    return window.localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

export function storeView(view: GalleryView) {
  try {
    window.localStorage.setItem(VIEW_KEY, view)
  } catch {
    // Sin almacenamiento disponible: la vista solo dura la sesión.
  }
}
