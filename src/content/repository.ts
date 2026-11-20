/**
 * Content access boundary. UI code talks ONLY to `content`, never to data files or a database.
 * Phase 3 adds a Supabase implementation of `ContentRepository` and swaps it in here;
 * routes, loaders and components stay unchanged.
 */
import type { Project, ProjectCategory, Service, SiteSettings } from './types'
import { localRepository } from './local/localRepository'

export interface ContentRepository {
  listProjects(options?: { categorySlug?: string }): Promise<Project[]>
  listFeaturedProjects(): Promise<Project[]>
  getProject(slug: string): Promise<Project | null>
  listCategories(): Promise<ProjectCategory[]>
  listServices(): Promise<Service[]>
  getSiteSettings(): Promise<SiteSettings>
}

export const content: ContentRepository = localRepository
