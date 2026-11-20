import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE_URL } from './env'

const SITE = 'ATELIER STUDIO'
const DEFAULT_IMAGE = 'images/hero-dusk-villa-1600.jpg'

function upsertMeta(attr: 'name' | 'property', key: string, value: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (value === null) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = value
}

function upsertLink(rel: string, href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (href === null) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

/** Absolute URL for a site path or bundled image; absolute URLs pass through. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl
  const origin = SITE_URL || window.location.origin
  const base = import.meta.env.BASE_URL.startsWith('/') ? import.meta.env.BASE_URL : '/'
  return `${origin}${base}${pathOrUrl.replace(/^\//, '')}`
}

export interface SeoOptions {
  title?: string
  description?: string
  /** Image path ("images/x-1600.jpg") or absolute URL. */
  image?: string
  type?: 'website' | 'article'
  noindex?: boolean
}

/** Title, description, canonical, Open Graph and Twitter tags, updated in place (no duplicates). */
export function useSeo({ title, description, image, type = 'website', noindex }: SeoOptions) {
  const { pathname } = useLocation()
  useEffect(() => {
    const full = title ? `${title} — ${SITE}` : `${SITE} — Αρχιτεκτονική & Εσωτερικοί Χώροι`
    const url = absoluteUrl(pathname)
    document.title = full
    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }
    upsertMeta('property', 'og:title', full)
    upsertMeta('name', 'twitter:title', full)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', absoluteUrl(image ?? DEFAULT_IMAGE))
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'robots', noindex ? 'noindex' : null)
    upsertLink('canonical', url)
  }, [title, description, image, type, noindex, pathname])
}

/** Injects one JSON-LD block (schema.org) into <head> while the page is mounted. */
export function useJsonLd(id: string, data: object | null) {
  const json = data ? JSON.stringify(data) : null
  useEffect(() => {
    if (!json) return
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = `ld-${id}`
    el.textContent = json
    document.getElementById(el.id)?.remove()
    document.head.appendChild(el)
    return () => el.remove()
  }, [id, json])
}
