import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { ScrollTrigger } from '../../lib/gsap'

/**
 * Scroll position on navigation:
 * - PUSH/REPLACE without hash → top of page (instant, hidden by the transition curtain).
 * - With hash → scroll to the section after layout (pin spacers, fonts) has settled.
 * - POP (back/forward) → browser restores natively.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation()
  const navType = useNavigationType()
  // Read through a ref: a query-only change (e.g. project filters) must not re-run the scroll effect.
  const navTypeRef = useRef(navType)
  useLayoutEffect(() => {
    navTypeRef.current = navType
  }, [navType])

  useLayoutEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = navType === 'POP' ? 'auto' : 'manual'
  }, [navType])

  useEffect(() => {
    if (navTypeRef.current === 'POP') return
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return
    }
    const id = decodeURIComponent(hash.slice(1))
    let cancelled = false
    const go = () => {
      if (cancelled) return
      ScrollTrigger.refresh()
      const el = document.getElementById(id)
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0)
        window.scrollTo({ top, behavior: 'instant' })
      }
    }
    const t = window.setTimeout(go, 60)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [pathname, hash])

  return null
}
