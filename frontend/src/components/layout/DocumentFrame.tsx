import { Outlet } from 'react-router-dom'

/** Ensures each page layout fills the viewport and the footer stays at the scroll end. */
export function DocumentFrame() {
  return (
    <div className="flex min-h-dvh w-full flex-1 flex-col bg-ase-bg">
      <Outlet />
    </div>
  )
}
