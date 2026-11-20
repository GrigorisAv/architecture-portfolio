import type { ContentRepository, QuoteRequestSender } from '../repository'
import { aboutContent, categories, projects, services, siteSettings } from './data'

const published = () => projects.filter((p) => p.status === 'published')

export const localRepository: ContentRepository = {
  async listProjects(options) {
    const list = published()
    if (!options?.categorySlug) return list
    const cat = categories.find((c) => c.slug === options.categorySlug)
    return cat ? list.filter((p) => p.categoryId === cat.id) : []
  },
  async listFeaturedProjects() {
    return published()
      .filter((p) => p.featured)
      .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99))
  },
  async getProject(slug) {
    return published().find((p) => p.slug === slug) ?? null
  },
  async getAdjacentProject(slug) {
    const list = published()
    const i = list.findIndex((p) => p.slug === slug)
    if (i === -1 || list.length < 2) return null
    return list[(i + 1) % list.length]
  },
  async listCategories() {
    return [...categories].sort((a, b) => a.order - b.order)
  },
  async listServices() {
    return [...services].sort((a, b) => a.order - b.order)
  },
  async getSiteSettings() {
    return siteSettings
  },
  async getAboutContent() {
    return aboutContent
  },
}

/**
 * No backend yet: requests are NOT sent anywhere and nothing is stored.
 * The UI states this plainly. Phase 3 replaces this with a Supabase sender.
 */
export const localQuoteSender: QuoteRequestSender = {
  async submit() {
    await new Promise((r) => setTimeout(r, 700))
    return { status: 'not-configured' }
  },
}
