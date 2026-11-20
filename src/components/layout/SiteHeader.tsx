import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ctaNav, homeSections, primaryNav, type NavItem } from '../../config/navigation'
import { useActiveSection } from '../../hooks/useActiveSection'
import { useScrolled } from '../../hooks/useScrolled'
import { MobileMenu } from './MobileMenu'
import { handleNavClick } from './navLinkHandler'

function isItemActive(item: NavItem, pathname: string, activeSection: string | null): boolean {
  if (pathname === '/') return !!item.section && item.section === activeSection
  const path = item.to.split('#')[0]
  return path !== '/' && pathname.startsWith(path)
}

export function SiteHeader() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const scrolled = useScrolled(48)
  const activeSection = useActiveSection(homeSections, isHome, pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Close the mobile menu on any route change (derived during render). Never leave an overlay behind.
  const [menuPath, setMenuPath] = useState(pathname)
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setMenuOpen(false)
  }

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  /* ---- Sliding hover / active indicator (desktop) ---- */
  const listRef = useRef<HTMLUListElement>(null)
  const [indicator, setIndicator] = useState({ x: 0, w: 0, visible: false })
  const activeIndex = primaryNav.findIndex((item) => isItemActive(item, pathname, activeSection))

  const moveTo = useCallback((index: number) => {
    const list = listRef.current
    const link = list?.querySelectorAll<HTMLElement>('[data-nav-link]')[index]
    if (!list || !link) {
      setIndicator((s) => ({ ...s, visible: false }))
      return
    }
    const l = list.getBoundingClientRect()
    const r = link.getBoundingClientRect()
    setIndicator({ x: r.left - l.left, w: r.width, visible: true })
  }, [])

  useLayoutEffect(() => {
    moveTo(activeIndex)
  }, [activeIndex, moveTo, scrolled])

  useEffect(() => {
    const onResize = () => moveTo(activeIndex)
    window.addEventListener('resize', onResize)
    document.fonts?.ready.then(onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeIndex, moveTo])

  const transparent = isHome && !scrolled && !menuOpen
  const condensed = scrolled && !menuOpen

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4" data-site-header>
        <nav
          aria-label="Κύρια πλοήγηση"
          className={[
            'mx-auto flex items-center justify-between gap-6 rounded-full text-paper lg:grid lg:grid-cols-[1fr_auto_1fr]',
            'transition-[max-width,padding,background-color,border-color,box-shadow] duration-700 ease-[var(--ease-expo)]',
            'border backdrop-blur-[18px] backdrop-saturate-[1.4]',
            condensed ? 'max-w-[82rem] py-2 pl-6 pr-2' : 'max-w-[100rem] py-2.5 pl-6 pr-2.5 sm:pl-7',
            menuOpen
              ? 'border-transparent bg-transparent backdrop-blur-none'
              : transparent
                ? 'border-paper/10 bg-ink/45'
                : 'border-paper/[0.07] bg-[#1b1b1b]/[0.94] shadow-[0_12px_40px_-12px_rgb(0_0_0/0.45)]',
          ].join(' ')}
        >
          <Link
            to="/"
            onClick={(e) => handleNavClick(e, '/', pathname, closeMenu)}
            className="group flex items-baseline gap-3 justify-self-start"
          >
            <span className="font-display text-[1.45rem] leading-none tracking-[0.14em] transition-opacity duration-300 group-hover:opacity-80">ATELIER</span>
            <span className="text-[0.66rem] font-semibold leading-none tracking-[0.34em] text-bronze-light"> STUDIO</span>
            <span className="visually-hidden">, αρχική σελίδα</span>
          </Link>

          <ul
            ref={listRef}
            className="relative hidden items-center gap-1 lg:flex"
            onMouseLeave={() => moveTo(activeIndex)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) moveTo(activeIndex)
            }}
          >
            {/* Sliding pill: follows hover/focus, rests on the active item */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-paper/[0.08] transition-[transform,width,opacity] duration-500 ease-[var(--ease-expo)]"
              style={{
                width: indicator.w,
                transform: `translateX(${indicator.x}px)`,
                opacity: indicator.visible ? 1 : 0,
              }}
            />
            {primaryNav.map((item, i) => {
              const active = i === activeIndex
              return (
                <li key={item.to} className="relative">
                  <Link
                    to={item.to}
                    data-nav-link
                    aria-current={active ? (isHome && item.section ? 'location' : 'page') : undefined}
                    onMouseEnter={() => moveTo(i)}
                    onFocus={() => moveTo(i)}
                    onClick={(e) => handleNavClick(e, item.to, pathname)}
                    className={[
                      'relative block rounded-full px-[1.1rem] py-2.5 text-[0.9rem] font-semibold tracking-[0.01em] transition-colors duration-300',
                      'focus-visible:outline-offset-2',
                      active ? 'text-paper' : 'text-paper/65 hover:text-paper',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-paper/80 transition-[opacity,transform] duration-500 ease-[var(--ease-expo)] ${
                      active ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                    }`}
                  />
                </li>
              )
            })}
          </ul>

          <div className="flex items-center gap-2 justify-self-end">
            <Link
              to={ctaNav.to}
              onClick={(e) => handleNavClick(e, ctaNav.to, pathname)}
              aria-current={pathname.startsWith(ctaNav.to) ? 'page' : undefined}
              className="hidden h-12 items-center rounded-full bg-paper px-7 text-[0.9rem] font-medium tracking-[0.01em] text-ink transition-colors duration-300 hover:bg-stone focus-visible:outline-offset-3 focus-visible:outline-paper aria-[current=page]:bg-bronze-light lg:inline-flex"
            >
              {ctaNav.label}
            </Link>

            <button
              ref={toggleRef}
              type="button"
              className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-paper/[0.08] lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Κλείσιμο μενού' : 'Άνοιγμα μενού'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span
                aria-hidden="true"
                className={`absolute h-px w-5 bg-paper transition-transform duration-500 ease-[var(--ease-expo)] ${menuOpen ? 'rotate-45' : '-translate-y-[4px]'}`}
              />
              <span
                aria-hidden="true"
                className={`absolute h-px bg-paper transition-[transform,width] duration-500 ease-[var(--ease-expo)] ${menuOpen ? 'w-5 -rotate-45' : 'w-3.5 translate-x-[3px] translate-y-[4px]'}`}
              />
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} toggleRef={toggleRef} activeIndex={activeIndex} />
    </>
  )
}
