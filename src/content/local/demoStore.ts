/**
 * Browser-only CMS store for previews (VITE_CMS_DEMO=true) and the default static content source.
 * Seeded from data.ts. In demo mode, admin edits persist in localStorage *of this browser only*.
 */
import { ABOUT_APPROACH_DEFAULT, HOME_DEFAULTS, normalizeHome, type AboutRecord, type HomeRecord, type CategoryRecord, type ImageRecord, type ProjectRecord, type QuoteRecord, type ServiceRecord } from '../records'
import type { SiteSettings } from '../types'
import { CMS_MODE } from '../../lib/env'
import { aboutContent, categories, projects, services, siteSettings } from './data'

export interface DemoState {
  version: 1
  categories: CategoryRecord[]
  projects: ProjectRecord[]
  services: ServiceRecord[]
  about: AboutRecord
  home: HomeRecord
  settings: SiteSettings
  quotes: QuoteRecord[]
}

const KEY = 'ds-architect:demo-cms:v1'

export function seedState(): DemoState {
  const now = new Date().toISOString()
  return {
    version: 1,
    categories: categories.map((c) => ({ id: c.id, slug: c.slug, label: c.label, sortOrder: c.order })),
    projects: projects.map((p, i) => {
      const images: ImageRecord[] = [
        ...p.gallery.map((g, k) => ({ id: `${p.id}-img-${k}`, path: `local:${g.src}`, alt: g.alt, width: null, height: null, kind: 'photo' as const, sortOrder: k })),
        ...p.drawings
          .filter((d) => !d.src.startsWith('plan:'))
          .map((d, k) => ({ id: `${p.id}-drw-${k}`, path: `local:${d.src}`, alt: d.alt, width: null, height: null, kind: 'drawing' as const, sortOrder: 100 + k })),
      ]
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        categoryId: p.categoryId,
        summary: p.summary,
        description: p.description,
        location: p.location ?? null,
        year: p.year ?? null,
        areaSqm: p.areaSqm ?? null,
        status: p.status,
        featured: p.featured,
        featuredOrder: p.featuredOrder ?? null,
        coverImageId: images.find((im) => im.path === `local:${p.cover.src}`)?.id ?? null,
        isPlaceholder: p.isPlaceholder,
        seoTitle: null,
        seoDescription: null,
        sortOrder: i + 1,
        updatedAt: now,
        images,
      }
    }),
    services: services.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      summary: s.summary,
      body: s.body,
      includes: s.includes,
      imagePath: `local:${s.image.src}`,
      imageAlt: s.image.alt,
      sortOrder: s.order,
      isPlaceholder: s.isPlaceholder,
    })),
    about: {
      intro: aboutContent.intro,
      bio: aboutContent.bio,
      philosophy: aboutContent.philosophy,
      approach: aboutContent.approach,
      portraitPath: null,
      portraitAlt: '',
      approachImagePath: ABOUT_APPROACH_DEFAULT.path,
      approachImageAlt: ABOUT_APPROACH_DEFAULT.alt,
      isPlaceholder: aboutContent.isPlaceholder,
    },
    home: structuredClone(HOME_DEFAULTS),
    settings: structuredClone(siteSettings),
    quotes: [],
  }
}

let state: DemoState | null = null

/** Persisting only happens in demo mode; otherwise the store is a read-only view of data.ts. */
const persistent = CMS_MODE === 'demo'

export function getState(): DemoState {
  if (state) return state
  if (persistent) {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as DemoState
        if (parsed.version === 1) {
          // Older saved states predate editable home/about photos.
          parsed.home = normalizeHome(parsed.home)
          parsed.about.approachImagePath ??= ABOUT_APPROACH_DEFAULT.path
          parsed.about.approachImageAlt ??= ABOUT_APPROACH_DEFAULT.alt
          state = parsed
        }
      }
    } catch {
      /* storage unavailable or corrupt: fall back to seed */
    }
  }
  state ??= seedState()
  return state
}

export function commit(mutator: (draft: DemoState) => void): void {
  const next = structuredClone(getState())
  mutator(next)
  state = next
  if (!persistent) return
  try {
    // Blob URLs die with the tab; never persist them.
    const toSave = structuredClone(next)
    toSave.projects.forEach((p) => (p.images = p.images.filter((i) => !i.path.startsWith('blob:'))))
    localStorage.setItem(KEY, JSON.stringify(toSave))
  } catch {
    /* quota or privacy mode: keep in-memory state */
  }
}

export function resetDemo(): void {
  state = seedState()
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)
