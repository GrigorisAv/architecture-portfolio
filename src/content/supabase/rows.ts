/** Database row shapes (snake_case) and their mapping to CMS records. */
import type { AboutRecord, CategoryRecord, ImageRecord, ProjectRecord, QuoteRecord, ServiceRecord } from '../records'
import type { SiteSettings } from '../types'

export interface CategoryRow { id: string; slug: string; label: string; sort_order: number }
export interface ImageRow { id: string; project_id: string; storage_path: string; alt: string; width: number | null; height: number | null; kind: ImageRecord['kind']; sort_order: number }
export interface ProjectRow {
  id: string; slug: string; title: string; category_id: string; summary: string; description: string[]
  location: string | null; year: number | null; area_sqm: number | string | null; status: 'draft' | 'published'
  featured: boolean; featured_order: number | null; cover_image_id: string | null; is_placeholder: boolean
  seo_title: string | null; seo_description: string | null; sort_order: number; updated_at: string
  project_images?: ImageRow[]
}
export interface ServiceRow { id: string; slug: string; title: string; summary: string; body: string[]; includes: string[]; image_path: string | null; image_alt: string; sort_order: number; is_placeholder: boolean }
export interface SettingsRow {
  studio_name: string; tagline: string; architect_name: string | null; architect_role: string; email: string | null
  phone: string | null; address: string | null; instagram: string | null; seo_title: string; seo_description: string
}
export interface QuoteRow {
  id: string; full_name: string; email: string; phone: string; project_type: QuoteRecord['projectType']; area: string
  size_sqm: number | string | null; description: string; privacy_consent: boolean; status: QuoteRecord['status']; admin_notes: string | null; created_at: string
}

// Two FKs link projects and project_images (images, and the cover): name the one to embed (PostgREST PGRST201 otherwise).
export const PROJECT_SELECT = '*, project_images!project_images_project_id_fkey(*)'

export const toCategory = (r: CategoryRow): CategoryRecord => ({ id: r.id, slug: r.slug, label: r.label, sortOrder: r.sort_order })
export const toImage = (r: ImageRow): ImageRecord => ({ id: r.id, path: r.storage_path, alt: r.alt, width: r.width, height: r.height, kind: r.kind, sortOrder: r.sort_order })
export const toProject = (r: ProjectRow): ProjectRecord => ({
  id: r.id, slug: r.slug, title: r.title, categoryId: r.category_id, summary: r.summary, description: r.description ?? [],
  location: r.location, year: r.year, areaSqm: r.area_sqm === null ? null : Number(r.area_sqm), status: r.status,
  featured: r.featured, featuredOrder: r.featured_order, coverImageId: r.cover_image_id, isPlaceholder: r.is_placeholder,
  seoTitle: r.seo_title, seoDescription: r.seo_description, sortOrder: r.sort_order, updatedAt: r.updated_at,
  images: (r.project_images ?? []).map(toImage),
})
export const fromProject = (p: ProjectRecord) => ({
  slug: p.slug, title: p.title, category_id: p.categoryId, summary: p.summary, description: p.description,
  location: p.location, year: p.year, area_sqm: p.areaSqm, status: p.status, featured: p.featured,
  featured_order: p.featuredOrder, cover_image_id: p.coverImageId, is_placeholder: p.isPlaceholder,
  seo_title: p.seoTitle, seo_description: p.seoDescription, sort_order: p.sortOrder,
})
export const toService = (r: ServiceRow): ServiceRecord => ({
  id: r.id, slug: r.slug, title: r.title, summary: r.summary, body: r.body ?? [], includes: r.includes ?? [],
  imagePath: r.image_path, imageAlt: r.image_alt, sortOrder: r.sort_order, isPlaceholder: r.is_placeholder,
})
export const fromService = (s: ServiceRecord) => ({
  slug: s.slug, title: s.title, summary: s.summary, body: s.body, includes: s.includes, image_path: s.imagePath,
  image_alt: s.imageAlt, sort_order: s.sortOrder, is_placeholder: s.isPlaceholder,
})
export const toSettings = (r: SettingsRow): SiteSettings => ({
  studioName: r.studio_name, tagline: r.tagline, architectName: r.architect_name, architectRole: r.architect_role,
  email: r.email, phone: r.phone, address: r.address, instagram: r.instagram,
  seo: { title: r.seo_title, description: r.seo_description },
})
export const fromSettings = (s: SiteSettings): SettingsRow => ({
  studio_name: s.studioName, tagline: s.tagline, architect_name: s.architectName, architect_role: s.architectRole,
  email: s.email, phone: s.phone, address: s.address, instagram: s.instagram,
  seo_title: s.seo.title, seo_description: s.seo.description,
})
export const toAbout = (c: Partial<AboutRecord> | null): AboutRecord => ({
  intro: c?.intro ?? '', bio: c?.bio ?? [], philosophy: c?.philosophy ?? [], approach: c?.approach ?? [],
  portraitPath: c?.portraitPath ?? null, portraitAlt: c?.portraitAlt ?? '', isPlaceholder: c?.isPlaceholder ?? false,
})
export const toQuote = (r: QuoteRow): QuoteRecord => ({
  id: r.id, fullName: r.full_name, email: r.email, phone: r.phone, projectType: r.project_type, area: r.area,
  sizeSqm: r.size_sqm === null ? null : Number(r.size_sqm), description: r.description, privacyConsent: r.privacy_consent,
  status: r.status, adminNotes: r.admin_notes ?? '', createdAt: r.created_at,
})
