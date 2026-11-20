import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ctaNav, homeSections, primaryNav, type NavItem } from '../../config/navigation'
import { useActiveSection } from '../../hooks/useActiveSection'
import { useScrolled } from '../../hooks/useScrolled'
import { Monogram } from '../ui/icons'
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
            'mx-auto flex items-center justify-between gap-6 text-paper',
            'transition-[max-width,padding,background-color,border-color,backdrop-filter] duration-700 ease-[var(--ease-expo)]',
            'border',
            condensed ? 'max-w-[68rem] py-2.5 pl-5 pr-2.5' : 'max-w-[100rem] py-4 pl-4 pr-3 sm:pl-6',
            transparent
              ? 'border-transparent bg-transparent'
              : menuOpen
                ? 'border-transparent bg-transparent'
                : 'border-paper/10 bg-ink/[0.86] backdrop-blur-[18px] backdrop-saturate-[1.4]',
          ].join(' ')}
        >
          <Link
            to="/"
            onClick={(e) => handleNavClick(e, '/', pathname, closeMenu)}
            className="group flex items-center gap-3"
            aria-label="ATELIER STUDIO — Αρχική σελίδα"
          >
            <Monogram className="h-7 w-7 text-bronze-light transition-transform duration-700 ease-[var(--ease-expo)] group-hover:-translate-y-0.5" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[1.05rem] tracking-[0.32em]">ATELIER</span>
              <span className="mt-1 text-[0.6rem] font-semibold tracking-[0.5em] text-muted-ink">STUDIO</span>
            </span>
          </Link>

          <ul
            ref={listRef}
            className="relative hidden items-center gap-1 lg:flex"
            onMouseLeave={() => moveTo(activeIndex)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) moveTo(activeIndex)
            }}
          >
            {primaryNav.map((item, i) => {
              const active = i === activeIndex
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    data-nav-link
                    aria-current={active ? (isHome && item.section ? 'location' : 'page') : undefined}
                    onMouseEnter={() => moveTo(i)}
                    onFocus={() => moveTo(i)}
                    onClick={(e) => handleNavClick(e, item.to, pathname)}
                    className={[
                      'relative block px-4 py-2.5 text-[0.8125rem] font-medium tracking-[0.06em] transition-colors duration-300',
                      active ? 'text-paper' : 'text-paper/70 hover:text-paper',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-1 left-0 h-px bg-bronze-light transition-[transform,width,opacity] duration-500 ease-[var(--ease-expo)]"
              style={{
                width: Math.max(indicator.w - 32, 0),
                transform: `translateX(${indicator.x + 16}px)`,
                opacity: indicator.visible ? 1 : 0,
              }}
            />
          </ul>

          <div className="flex items-center gap-2">
            <Link
              to={ctaNav.to}
              onClick={(e) => handleNavClick(e, ctaNav.to, pathname)}
              aria-current={pathname.startsWith(ctaNav.to) ? 'page' : undefined}
              className="btn btn-primary hidden min-h-11 px-5 lg:inline-flex"
            >
              {ctaNav.label}
            </Link>

            <button
              ref={toggleRef}
              type="button"
              className="relative flex h-11 w-11 items-center justify-center lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Κλείσιμο μενού' : 'Άνοιγμα μενού'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span
                aria-hidden="true"
                className={`absolute h-px w-6 bg-paper transition-transform duration-500 ease-[var(--ease-expo)] ${menuOpen ? 'rotate-45' : '-translate-y-[4px]'}`}
              />
              <span
                aria-hidden="true"
                className={`absolute h-px bg-paper transition-[transform,width] duration-500 ease-[var(--ease-expo)] ${menuOpen ? 'w-6 -rotate-45' : 'w-4 translate-x-1 translate-y-[4px]'}`}
              />
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} toggleRef={toggleRef} activeIndex={activeIndex} />
    </>
  )
}
