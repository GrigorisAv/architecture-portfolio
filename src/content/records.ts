/**
 * CMS records: the shape stored in the database (camelCase mirror of the SQL tables).
 * Both data sources (Supabase, demo) speak records; `toDomain*` turns them into what pages render.
 */
import type { AboutContent, HomeContent, ImageAsset, Project, ProjectCategory, PublishStatus, QuoteRequest, Service, SiteSettings } from './types'

export type ImageKind = 'photo' | 'drawing' | 'render'

export interface ImageRecord {
  id: string
  /** "local:<manifest key>" | storage base path "projects/<id>/<uuid>" | absolute/blob URL */
  path: string
  alt: string
  width: number | null
  height: number | null
  kind: ImageKind
  sortOrder: number
}

export interface CategoryRecord {
  id: string
  slug: string
  label: string
  sortOrder: number
}

export interface ProjectRecord {
  id: string
  slug: string
  title: string
  categoryId: string
  summary: string
  description: string[]
  location: string | null
  year: number | null
  areaSqm: number | null
  status: PublishStatus
  featured: boolean
  featuredOrder: number | null
  coverImageId: string | null
  isPlaceholder: boolean
  seoTitle: string | null
  seoDescription: string | null
  sortOrder: number
  updatedAt: string
  images: ImageRecord[]
}

export interface ServiceRecord {
  id: string
  slug: string
  title: string
  summary: string
  body: string[]
  includes: string[]
  imagePath: string | null
  imageAlt: string
  sortOrder: number
  isPlaceholder: boolean
}

export interface AboutRecord {
  intro: string
  bio: string[]
  philosophy: { title: string; text: string }[]
  approach: { title: string; text: string }[]
  portraitPath: string | null
  portraitAlt: string
  /** Photo beside «Επαγγελματική προσέγγιση». */
  approachImagePath: string | null
  approachImageAlt: string
  isPlaceholder: boolean
}

/** Editable photos of the home page (page_content key = 'home'). */
export const HOME_IMAGE_SLOTS = ['hero', 'philosophy', 'architecture', 'interiors', 'material1', 'material2', 'material3'] as const
export type HomeImageSlot = (typeof HOME_IMAGE_SLOTS)[number]
export interface SlotImage {
  path: string
  alt: string
}
export interface HomeRecord {
  images: Record<HomeImageSlot, SlotImage>
}

/** Bundled sample photos: used until the architect uploads her own. */
export const HOME_DEFAULTS: HomeRecord = {
  images: {
    hero: { path: 'local:hero-dusk-villa', alt: 'Σύγχρονη κατοικία το σούρουπο: σκούρος ορθογώνιος όγκος με κάθετα φωτισμένα ανοίγματα πάνω από λευκή βάση και κήπο' },
    philosophy: { path: 'local:oak-stair-detail', alt: 'Λευκό κλιμακοστάσιο με δρύινα σκαλοπάτια, μαύρο μεταλλικό κιγκλίδωμα και κρεμαστά φωτιστικά' },
    architecture: { path: 'local:pool-villa', alt: 'Σύγχρονη διώροφη κατοικία με επάλληλες λευκές πλάκες, μεγάλα υαλοστάσια και πισίνα στον κήπο' },
    interiors: { path: 'local:dining-stair-interior', alt: 'Τραπεζαρία με σκούρο ξύλινο τραπέζι μπροστά από γυάλινο διαχωριστικό, ξύλινη επένδυση και ανοιχτό κλιμακοστάσιο' },
    material1: { path: 'local:timber-black-house', alt: 'Κατοικία με ξύλινο κουτί εισόδου, μαύρη μεταλλική επένδυση και κήπο με αμμοχάλικο' },
    material2: { path: 'local:glass-stair-pool', alt: 'Αιωρούμενη ξύλινη σκάλα μπροστά από γυάλινη πρόσοψη με θέα στην πισίνα' },
    material3: { path: 'local:wood-wall-dining', alt: 'Καθιστικό και τραπεζαρία που ανοίγουν σε ξύλινο deck, με επένδυση ξύλου και πέτρινο τζάκι' },
  },
}
export const ABOUT_APPROACH_DEFAULT: SlotImage = { path: 'local:minimal-white-room', alt: 'Λιτό λευκό δωμάτιο με σκούρο καναπέ, φυτό, συρταριέρα και επιδαπέδιο φωτιστικό' }

/** Fills slots missing from stored content (older rows, partial saves) with the defaults. */
export function normalizeHome(c: Partial<HomeRecord> | null | undefined): HomeRecord {
  const images = { ...HOME_DEFAULTS.images }
  for (const slot of HOME_IMAGE_SLOTS) {
    const v = c?.images?.[slot]
    if (v && typeof v.path === 'string' && v.path) images[slot] = { path: v.path, alt: typeof v.alt === 'string' ? v.alt : '' }
  }
  return { images }
}

export type QuoteStatus = 'new' | 'read' | 'replied' | 'archived'

export interface QuoteRecord extends Omit<QuoteRequest, 'sizeSqm' | 'projectType'> {
  id: string
  projectType: Exclude<QuoteRequest['projectType'], ''>
  sizeSqm: number | null
  status: QuoteStatus
  adminNotes: string
  createdAt: string
}

/* ---------------- record → domain ---------------- */

export type ImageResolver = (path: string, width: number | null) => Pick<ImageAsset, 'src' | 'srcset'>

export function toImageAsset(img: { path: string; alt: string; width: number | null; height: number | null }, resolve: ImageResolver): ImageAsset {
  return { ...resolve(img.path, img.width), alt: img.alt, width: img.width ?? undefined, height: img.height ?? undefined }
}

const PLAN_PLACEHOLDER: ImageAsset = { src: 'plan:placeholder', alt: 'Ενδεικτικό σχηματικό σχέδιο κάτοψης' }

export function toDomainProject(r: ProjectRecord, resolve: ImageResolver): Project {
  const byOrder = [...r.images].sort((a, b) => a.sortOrder - b.sortOrder)
  const photos = byOrder.filter((i) => i.kind === 'photo')
  const drawings = byOrder.filter((i) => i.kind !== 'photo')
  const coverRec = byOrder.find((i) => i.id === r.coverImageId) ?? photos[0] ?? byOrder[0]
  const cover: ImageAsset = coverRec ? toImageAsset(coverRec, resolve) : { src: 'hero-dusk-villa', alt: '' }
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    categoryId: r.categoryId,
    summary: r.summary,
    description: r.description,
    location: r.location,
    year: r.year,
    areaSqm: r.areaSqm,
    status: r.status,
    featured: r.featured,
    featuredOrder: r.featuredOrder,
    cover,
    gallery: photos.map((p) => toImageAsset(p, resolve)),
    drawings: drawings.length ? drawings.map((d) => toImageAsset(d, resolve)) : r.isPlaceholder ? [PLAN_PLACEHOLDER] : [],
    isPlaceholder: r.isPlaceholder,
  }
}

export function toDomainCategory(c: CategoryRecord): ProjectCategory {
  return { id: c.id, slug: c.slug, label: c.label, order: c.sortOrder }
}

export function toDomainService(s: ServiceRecord, resolve: ImageResolver): Service {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    summary: s.summary,
    body: s.body,
    includes: s.includes,
    image: s.imagePath ? toImageAsset({ path: s.imagePath, alt: s.imageAlt, width: null, height: null }, resolve) : { src: 'minimal-white-room', alt: '' },
    order: s.sortOrder,
    isPlaceholder: s.isPlaceholder,
  }
}

export function toDomainAbout(a: AboutRecord, resolve: ImageResolver): AboutContent {
  return {
    intro: a.intro,
    bio: a.bio,
    philosophy: a.philosophy,
    approach: a.approach,
    portrait: a.portraitPath ? toImageAsset({ path: a.portraitPath, alt: a.portraitAlt, width: null, height: null }, resolve) : null,
    approachImage: slotAsset(a.approachImagePath ? { path: a.approachImagePath, alt: a.approachImageAlt } : ABOUT_APPROACH_DEFAULT, resolve),
    isPlaceholder: a.isPlaceholder,
  }
}

/** Sample (bundled) photos are labelled «Ενδεικτική φωτογραφία» on the site; uploads are not. */
export const isSamplePath = (path: string) => path.startsWith('local:')

function slotAsset(img: SlotImage, resolve: ImageResolver): ImageAsset & { isSample: boolean } {
  return { ...toImageAsset({ ...img, width: null, height: null }, resolve), isSample: isSamplePath(img.path) }
}

const SAMPLE_FOCAL: Partial<Record<HomeImageSlot, string>> = { hero: '50% 55%', philosophy: '50% 40%', material1: '40% 50%' }

export function toDomainHome(r: HomeRecord, resolve: ImageResolver): HomeContent {
  const images = {} as HomeContent['images']
  for (const slot of HOME_IMAGE_SLOTS) images[slot] = slotAsset(r.images[slot], resolve)
  // Crops tuned for the sample photos; uploads are centred.
  for (const [slot, focal] of Object.entries(SAMPLE_FOCAL) as [HomeImageSlot, string][]) {
    if (r.images[slot].path === HOME_DEFAULTS.images[slot].path) images[slot].focal = focal
  }
  return { images }
}

export type { SiteSettings }

/** Published, in portfolio order. */
export function publishedSorted(list: ProjectRecord[]): ProjectRecord[] {
  return list.filter((p) => p.status === 'published').sort((a, b) => a.sortOrder - b.sortOrder)
}
