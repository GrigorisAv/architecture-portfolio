/**
 * Content access boundary. UI code talks ONLY to `content`, never to data files or a database.
 * Phase 3 adds a Supabase implementation of `ContentRepository` and swaps it in here;
 * routes, loaders and components stay unchanged.
 */
import type { AboutContent, Project, ProjectCategory, QuoteRequest, QuoteSubmitResult, Service, SiteSettings } from './types'
import { localQuoteSender, localRepository } from './local/localRepository'

export interface ContentRepository {
  listProjects(options?: { categorySlug?: string }): Promise<Project[]>
  listFeaturedProjects(): Promise<Project[]>
  getProject(slug: string): Promise<Project | null>
  listCategories(): Promise<ProjectCategory[]>
  listServices(): Promise<Service[]>
  getSiteSettings(): Promise<SiteSettings>
  getAboutContent(): Promise<AboutContent>
  /** Next published project in portfolio order (wraps around). */
  getAdjacentProject(slug: string): Promise<Project | null>
}

/** Quote requests go through this boundary; Phase 3 provides a Supabase-backed sender. */
export interface QuoteRequestSender {
  submit(request: QuoteRequest): Promise<QuoteSubmitResult>
}

export const content: ContentRepository = localRepository
export const quoteRequests: QuoteRequestSender = localQuoteSender
