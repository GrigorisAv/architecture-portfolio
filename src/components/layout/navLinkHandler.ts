import type { MouseEvent } from 'react'
import { scrollToSection } from '../../lib/scroll'

/**
 * Handles a nav click: in-page hash on the current page → smooth scroll;
 * otherwise let the router navigate (page transition plays).
 */
export function handleNavClick(
  event: MouseEvent<HTMLAnchorElement>,
  to: string,
  pathname: string,
  after?: () => void,
) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const [path, hash] = to.split('#')
  const targetPath = path || '/'
  if (hash && targetPath === pathname) {
    event.preventDefault()
    after?.()
    // Two frames: lets a closing menu release the scroll lock first.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (scrollToSection(hash)) history.replaceState(null, '', `#${hash}`)
      }),
    )
    return
  }
  if (targetPath === pathname && !hash) {
    event.preventDefault()
    after?.()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  after?.()
}
