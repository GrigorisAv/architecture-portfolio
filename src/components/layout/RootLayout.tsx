import { useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PageTransition } from './PageTransition'
import { ScrollManager } from './ScrollManager'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

export function RootLayout() {
  const mainRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  return (
    <>
      <a href="#main" className="skip-link eyebrow">Μετάβαση στο περιεχόμενο</a>
      <SiteHeader />
      {/* key → each page mounts fresh; its GSAP contexts/ScrollTriggers revert on unmount */}
      <main id="main" ref={mainRef} key={pathname} tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <PageTransition mainRef={mainRef} />
      <ScrollManager />
    </>
  )
}
