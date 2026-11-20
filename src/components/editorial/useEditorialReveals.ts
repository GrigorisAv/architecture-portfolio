import type { RefObject } from 'react'
import { gsap, MOTION, useGSAP } from '../../lib/gsap'

/**
 * C. Editorial reveals, scoped to a section.
 *   [data-reveal-figure] > [data-reveal-clip] > [data-reveal-inner] : photo opens from an inset,
 *       tilts from a slight rotateX into the picture plane, drifts up; inner image parallaxes.
 *   [data-reveal-text]  : soft rise (once).
 *   [data-reveal-words] : words brighten in sequence, linked to scroll.
 * Everything is rendered final by default; motion is applied only when allowed.
 */
export function useEditorialReveals(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      const q = gsap.utils.selector(scope)

      mm.add(MOTION.desktop, () => {
        q('[data-reveal-figure]').forEach((fig: HTMLElement) => {
          const clip = fig.querySelector('[data-reveal-clip]')
          const inner = fig.querySelector('[data-reveal-inner]')
          const tilt = Number(fig.dataset.revealTilt ?? 9)
          const shift = Number(fig.dataset.revealShift ?? 0)
          if (clip) {
            gsap.fromTo(
              clip,
              { clipPath: 'inset(14% 9% 14% 9%)', rotationX: tilt, rotationY: shift, y: 90, transformPerspective: 1300, transformOrigin: '50% 100%' },
              {
                clipPath: 'inset(0% 0% 0% 0%)',
                rotationX: 0,
                rotationY: 0,
                y: 0,
                ease: 'none',
                scrollTrigger: { trigger: fig, start: 'top 96%', end: 'top 32%', scrub: 1 },
              },
            )
          }
          if (inner) {
            gsap.fromTo(
              inner,
              { yPercent: -7 },
              { yPercent: 7, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } },
            )
          }
        })

        q('[data-reveal-words]').forEach((el: HTMLElement) => {
          // Colour (not opacity) reveal: words start at a warm grey that still meets 3:1 for large text,
          // and settle on their own final colour, so the statement is legible at every scroll position.
          const words = [...el.querySelectorAll<HTMLElement>('[data-word]')]
          words.forEach((w) => (w.dataset.endColor = getComputedStyle(w).color))
          gsap.fromTo(
            words,
            { color: '#8a8378' },
            { color: (_i: number, w: HTMLElement) => w.dataset.endColor!, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 1 } },
          )
        })
      })

      mm.add(MOTION.mobile, () => {
        q('[data-reveal-clip]').forEach((clip: HTMLElement) => {
          gsap.fromTo(
            clip,
            { clipPath: 'inset(8% 0% 8% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: clip, start: 'top 95%', end: 'top 50%', scrub: true } },
          )
        })
      })

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        q('[data-reveal-text]').forEach((el: HTMLElement) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 24 },
            { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } },
          )
        })
      })

      return () => mm.revert()
    },
    { scope },
  )
}
