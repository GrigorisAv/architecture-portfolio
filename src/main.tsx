import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ScrollTrigger } from './lib/gsap'
import { clearPrerenderFlag } from './lib/prerender'
import { router } from './router'
import './styles/global.css'

// Fonts change line lengths → recompute ScrollTrigger positions once they are ready.
document.fonts?.ready.then(() => ScrollTrigger.refresh())

/**
 * Render only once the first route's code and data are ready. A prerendered page keeps its static HTML
 * on screen until then (no "loading" flash); a plain SPA shell shows nothing for that short moment.
 */
function start() {
  const container = document.getElementById('root')!
  const app = (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  )
  // Prerendered pages are hydrated (React adopts the existing DOM: no repaint, LCP stays at first paint).
  if (document.documentElement.hasAttribute('data-prerendered') && container.firstElementChild) {
    hydrateRoot(container, app, {
      onRecoverableError: (error) => {
        // Recorded for tests (window.__hydrationErrors); React recovers by client-rendering.
        ;((window as unknown as { __hydrationErrors?: unknown[] }).__hydrationErrors ??= []).push(String(error))
        if (import.meta.env.DEV) console.warn('Hydration mismatch (React recovered by re-rendering):', error)
      },
    })
  } else {
    createRoot(container).render(app)
  }
  clearPrerenderFlag()
}

if (router.state.initialized) start()
else {
  const unsubscribe = router.subscribe((state) => {
    if (state.initialized) {
      unsubscribe()
      start()
    }
  })
}
