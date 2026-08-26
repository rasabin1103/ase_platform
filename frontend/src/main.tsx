import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './styles/fonts.css'
import './index.css'
import { AppProviders } from './app/providers'
import { router } from './app/router'
import { CookieNotice } from './components/layout/CookieNotice'
import { initSentry } from './monitoring'
import { registerServiceWorker } from './pwa'

initSentry()
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
      <CookieNotice />
    </AppProviders>
  </StrictMode>,
)
