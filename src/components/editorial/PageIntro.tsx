import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { Eyebrow } from '../ui/Eyebrow'

interface PageIntroProps {
  eyebrow: string
  title: ReactNode
  intro?: ReactNode
  aside?: ReactNode
  tone?: 'paper' | 'ink'
  children?: ReactNode
}

/** Opening block for inner pages: oversized title, short intro, soft staggered entrance. */
export function PageIntro({ eyebrow, title, intro, aside, tone = 'paper', children }: PageIntroProps) {
  const root = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo('[data-intro]', { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: 0.15 })
      })
      return () => mm.revert()
    },
    { scope: root },
  )
  const dark = tone === 'ink'
  return (
    <header ref={root} className={dark ? 'bg-ink text-paper' : 'bg-paper text-ink'}>
      <div className="page-x mx-auto max-w-[var(--container-page)] pb-[clamp(3rem,8vw,7rem)] pt-[clamp(9rem,18vw,14rem)]">
        <div data-intro>
          <Eyebrow className={dark ? 'text-bronze-light' : 'text-bronze-ink'}>{eyebrow}</Eyebrow>
        </div>
        <div className="grid-12 mt-8 gap-y-10">
          <h1 data-intro className="col-span-4 text-display lg:col-span-9">{title}</h1>
          {aside && <div data-intro className="col-span-4 self-end lg:col-span-3">{aside}</div>}
        </div>
        {intro && (
          <p data-intro className={`mt-10 max-w-2xl text-lead ${dark ? 'text-stone' : 'text-muted-paper'}`}>
            {intro}
          </p>
        )}
        {children && <div data-intro>{children}</div>}
      </div>
    </header>
  )
}
