import type { ContentRepository } from '../repository'
import { categories, projects, services, siteSettings } from './data'

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
  async listCategories() {
    return [...categories].sort((a, b) => a.order - b.order)
  },
  async listServices() {
    return [...services].sort((a, b) => a.order - b.order)
  },
  async getSiteSettings() {
    return siteSettings
  },
}
