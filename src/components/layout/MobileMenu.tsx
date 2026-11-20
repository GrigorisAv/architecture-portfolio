import { useEffect, useRef, type RefObject } from 'react'
import { Link, useLocation, useRouteLoaderData } from 'react-router-dom'
import { ctaNav, primaryNav } from '../../config/navigation'
import { gsap, prefersReducedMotion, useGSAP } from '../../lib/gsap'
import { ArrowRight } from '../ui/icons'
import { handleNavClick } from './navLinkHandler'
import type { RootData } from './SiteFooter'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  toggleRef: RefObject<HTMLButtonElement | null>
  activeIndex: number
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Fullscreen mobile navigation.
 * - Hidden state = visibility:hidden + inert → it can never sit invisibly over content.
 * - Focus trap (toggle + menu links), Escape closes, focus returns to the toggle.
 * - Body scroll lock while open.
 */
export function MobileMenu({ open, onClose, toggleRef, activeIndex }: MobileMenuProps) {
  const { pathname } = useLocation()
  const settings = (useRouteLoaderData('root') as RootData | undefined)?.settings
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
      tl.set(rootRef.current, { autoAlpha: 1 })
        .fromTo(rootRef.current, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.inOut' })
        // y: 0 explicitly, so any existing transform can never add a pixel offset on top of yPercent.
        .fromTo('[data-menu-line]', { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 0.9, stagger: 0.06 }, '-=0.3')
        .fromTo('[data-menu-fade]', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.05 }, '-=0.6')
      tlRef.current = tl
      return () => {
        tl.kill()
        tlRef.current = null
      }
    },
    { scope: rootRef },
  )

  // Drive the timeline from `open`.
  useEffect(() => {
    const root = rootRef.current
    const tl = tlRef.current
    if (!root) return
    if (open) {
      root.inert = false
      if (prefersReducedMotion() || !tl) {
        gsap.set(root, { autoAlpha: 1, clipPath: 'none' })
        gsap.set(root.querySelectorAll('[data-menu-line], [data-menu-fade]'), { clearProps: 'all' })
      } else {
        tl.timeScale(1).play()
      }
    } else {
      root.inert = true
      if (prefersReducedMotion() || !tl || tl.progress() === 0) {
        tl?.pause(0)
        gsap.set(root, { autoAlpha: 0 })
      } else {
        tl.timeScale(1.8).reverse()
      }
    }
  }, [open])

  // Scroll lock, focus management, Escape and focus trap.
  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'

    const first = root?.querySelector<HTMLElement>(FOCUSABLE)
    const focusTimer = window.setTimeout(() => first?.focus(), 80)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        toggleRef.current?.focus()
        return
      }
      if (e.key !== 'Tab' || !root) return
      const nodes = [toggleRef.current, ...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(Boolean) as HTMLElement[]
      const firstEl = nodes[0]
      const lastEl = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey)
      html.style.overflow = prevOverflow
    }
  }, [open, onClose, toggleRef])

  // Close if the viewport grows to desktop while open.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => mq.matches && onClose()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [onClose])

  return (
    <div
      ref={rootRef}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Μενού πλοήγησης"
      className="invisible fixed inset-0 z-40 flex flex-col bg-ink-raised text-paper opacity-0 lg:hidden"
      inert
    >
      <div className="flex flex-1 flex-col justify-between overflow-y-auto px-gutter pb-10 pt-32">
        <nav aria-label="Πλοήγηση κινητού">
          <ol className="space-y-1">
            {primaryNav.map((item, i) => (
              <li key={item.to} className="border-b border-paper/10">
                <Link
                  to={item.to}
                  aria-current={i === activeIndex ? 'page' : undefined}
                  onClick={(e) => handleNavClick(e, item.to, pathname, onClose)}
                  className="group flex items-baseline gap-5 py-4"
                >
                  <span data-menu-fade className="eyebrow w-6 text-bronze-light" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="line-mask">
                    <span
                      data-menu-line
                      className={`block font-display text-[clamp(2.4rem,11vw,4rem)] font-light leading-[1.05] tracking-[-0.02em] transition-[font-style,color] ${
                        i === activeIndex ? 'italic text-bronze-light' : 'group-hover:italic'
                      }`}
                    >
                      {item.label}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div data-menu-fade className="mt-12 space-y-8">
          <Link
            to={ctaNav.to}
            onClick={(e) => handleNavClick(e, ctaNav.to, pathname, onClose)}
            className="btn btn-primary w-full sm:w-auto"
          >
            {ctaNav.label}
            <ArrowRight />
          </Link>
          <div className="text-sm text-muted-ink">
            <p>Αρχιτεκτονική &amp; Εσωτερικοί Χώροι</p>
            {settings?.email || settings?.phone ? (
              <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-stone">
                {settings.phone && <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} className="py-1.5">{settings.phone}</a>}
                {settings.email && <a href={`mailto:${settings.email}`} className="break-all py-1.5">{settings.email}</a>}
              </p>
            ) : (
              <p>Τα στοιχεία επικοινωνίας θα προστεθούν σύντομα.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
