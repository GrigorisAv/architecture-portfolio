import { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from '../../lib/gsap'

/**
 * Gentle page transition: on every pathname change after the first load, a stone/ink curtain
 * that already covers the new page lifts away, while the page rises softly into place.
 *
 * Safety: the curtain is pointer-events:none, ends at visibility:hidden, and any interrupted
 * tween is forced to its final (hidden) state on cleanup. It can never remain over content.
 */
export function PageTransition({ mainRef }: { mainRef: React.RefObject<HTMLElement | null> }) {
  const { pathname } = useLocation()
  const curtainRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)

  useGSAP(
    () => {
      if (firstRender.current) {
        firstRender.current = false
        return
      }
      const curtain = curtainRef.current
      const main = mainRef.current
      if (!curtain || !main) return

      if (prefersReducedMotion()) {
        gsap.set(curtain, { autoAlpha: 0 })
        return
      }

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(curtain, { autoAlpha: 0 })
          ScrollTrigger.refresh()
        },
      })
      tl.set(curtain, { autoAlpha: 1, scaleY: 1, transformOrigin: '50% 0%' })
        .to(curtain, { scaleY: 0, duration: 0.75, ease: 'expo.inOut' }, 0.05)
        .fromTo(main, { y: 28, autoAlpha: 0.001 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }, 0.3)

      return () => {
        tl.kill()
        gsap.set(curtain, { autoAlpha: 0 })
        gsap.set(main, { clearProps: 'transform,opacity,visibility' })
      }
    },
    { dependencies: [pathname] },
  )

  return (
    <div
      ref={curtainRef}
      aria-hidden="true"
      className="pointer-events-none invisible fixed inset-0 z-[60] bg-ink opacity-0"
    >
      <div className="absolute inset-x-0 bottom-0 h-px bg-bronze/60" />
    </div>
  )
}
