/**
 * The static build prerenders every public page to HTML (scripts/prerender.mjs) and marks <html data-prerendered>.
 * On that first load the content is already on screen, so entrance animations are skipped to avoid a flicker.
 * The flag is cleared after the first frame, so client-side navigations animate normally.
 */
export function introAllowed(): boolean {
  return typeof document !== 'undefined' && !document.documentElement.hasAttribute('data-prerendered')
}

export function clearPrerenderFlag() {
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.removeAttribute('data-prerendered')))
}
