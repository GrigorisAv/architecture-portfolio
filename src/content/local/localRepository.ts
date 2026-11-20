import type { ContentRepository, QuoteRequestSender } from '../repository'
import { localResolver } from '../imagePaths'
import { publishedSorted, aboutUsesSample, homeUsesSample, isSamplePath, toDomainAbout, toDomainCategory, toDomainHome, toDomainProject, toDomainService } from '../records'
import { CMS_MODE } from '../../lib/env'
import { commit, getState, uid } from './demoStore'

const projectsPublished = () => publishedSorted(getState().projects).map((p) => toDomainProject(p, localResolver))

export const localRepository: ContentRepository = {
  async listProjects(options) {
    const list = projectsPublished()
    if (!options?.categorySlug) return list
    const cat = getState().categories.find((c) => c.slug === options.categorySlug)
    return cat ? list.filter((p) => p.categoryId === cat.id) : []
  },
  async listFeaturedProjects() {
    return projectsPublished()
      .filter((p) => p.featured)
      .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99))
  },
  async getProject(slug) {
    return projectsPublished().find((p) => p.slug === slug) ?? null
  },
  async getAdjacentProject(slug) {
    const list = projectsPublished()
    const i = list.findIndex((p) => p.slug === slug)
    if (i === -1 || list.length < 2) return null
    return list[(i + 1) % list.length]
  },
  async listCategories() {
    return [...getState().categories].sort((a, b) => a.sortOrder - b.sortOrder).map(toDomainCategory)
  },
  async listServices() {
    return [...getState().services].sort((a, b) => a.sortOrder - b.sortOrder).map((s) => toDomainService(s, localResolver))
  },
  async getSiteSettings() {
    return getState().settings
  },
  async getAboutContent() {
    return toDomainAbout(getState().about, localResolver)
  },
  async getFooterContent() {
    return getState().footer
  },
  async usesSamplePhotos() {
    const s = getState()
    return (
      homeUsesSample(s.home) ||
      aboutUsesSample(s.about) ||
      publishedSorted(s.projects).some((p) => p.images.some((i) => isSamplePath(i.path))) ||
      s.services.some((sv) => !!sv.imagePath && isSamplePath(sv.imagePath))
    )
  },
  async getHomeContent() {
    return toDomainHome(getState().home, localResolver)
  },
}

/**
 * Without Supabase nothing is sent. In demo mode the request is kept in this browser
 * so it can be viewed in the demo admin; the UI says so explicitly.
 */
export const localQuoteSender: QuoteRequestSender = {
  async submit(request) {
    await new Promise((r) => setTimeout(r, 600))
    if (CMS_MODE !== 'demo') return { status: 'not-configured' }
    commit((s) => {
      s.quotes.unshift({
        ...request,
        id: uid(),
        projectType: request.projectType || 'allo',
        sizeSqm: request.sizeSqm ? Number(request.sizeSqm.replace(',', '.')) : null,
        status: 'new',
        adminNotes: '',
        createdAt: new Date().toISOString(),
      })
    })
    return { status: 'demo-stored' }
  },
}
