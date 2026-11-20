/**
 * Content model, shaped for a future private CMS (Supabase: Postgres + Auth + Storage).
 * Each interface maps 1:1 to a planned table. See docs/ARCHITECTURE.md.
 */

/** An image reference. `src` is either a local manifest key (e.g. "hero-dusk-villa")
 *  or an absolute URL (e.g. a Supabase Storage public URL once the CMS exists). */
export interface ImageAsset {
  src: string
  /** Greek alt text describing space, light and material. Empty string = decorative. */
  alt: string
  width?: number
  height?: number
  /** Optional focal point for object-position, e.g. "50% 40%". */
  focal?: string
}

export type PublishStatus = 'draft' | 'published'

/** table: categories */
export interface ProjectCategory {
  id: string
  slug: string
  label: string
  order: number
}

/** table: projects (+ project_images for the gallery) */
export interface Project {
  id: string
  slug: string
  title: string
  categoryId: string
  summary: string
  description?: string
  location?: string | null
  year?: number | null
  areaSqm?: number | null
  status: PublishStatus
  featured: boolean
  featuredOrder?: number | null
  cover: ImageAsset
  gallery: ImageAsset[]
  /** True for demo content. Rendered with a visible "Ενδεικτικό" label. */
  isPlaceholder: boolean
}

/** table: services */
export interface Service {
  id: string
  slug: string
  title: string
  summary: string
  order: number
  isPlaceholder: boolean
}

/** table: site_settings (single row) */
export interface SiteSettings {
  studioName: string
  tagline: string
  architectName: string | null
  architectRole: string
  email: string | null
  phone: string | null
  address: string | null
  instagram: string | null
  seo: {
    title: string
    description: string
  }
}
