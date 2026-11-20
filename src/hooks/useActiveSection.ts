import { useEffect, useState } from 'react'

/**
 * Tracks which section crosses the viewport's reading line.
 * Re-observes when `key` changes (e.g. after route change) so newly mounted sections are found.
 */
export function useActiveSection(ids: readonly string[], enabled: boolean, key?: unknown): string | null {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    const visible = new Map<string, boolean>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting)
        const current = ids.find((id) => visible.get(id))
        setActive(current ?? null)
      },
      { rootMargin: '-45% 0px -54% 0px', threshold: 0 },
    )
    // Wait a frame so the page's sections exist.
    const raf = requestAnimationFrame(() => {
      ids.forEach((id) => {
        const el = document.getElementById(id)
        if (el) observer.observe(el)
      })
    })
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [ids, enabled, key])

  return enabled ? active : null
}
