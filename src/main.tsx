import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ScrollTrigger } from './lib/gsap'
import { router } from './router'
import './styles/global.css'

// Fonts change line lengths → recompute ScrollTrigger positions once they are ready.
document.fonts?.ready.then(() => ScrollTrigger.refresh())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
