import { prefersReducedMotion } from './gsap'

/** Native smooth scroll to a section (no scroll hijacking), then move focus there for a11y. */
export function scrollToSection(id: string, { focus = true } = {}): boolean {
  const el = document.getElementById(id)
  if (!el) return false
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  if (focus) {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
  }
  return true
}
