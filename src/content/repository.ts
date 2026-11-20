/**
 * Content access boundary. UI code talks ONLY to `content` / `quoteRequests`.
 * Supabase is used when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set; its code (and supabase-js)
 * is loaded lazily, so sites without a backend don't ship it.
 */
import type { FooterRecord } from './records'
import type { AboutContent, HomeContent, Project, ProjectCategory, QuoteRequest, QuoteSubmitResult, Service, SiteSettings } from './types'
import { localQuoteSender, localRepository } from './local/localRepository'
import { CMS_MODE } from '../lib/env'

export interface ContentRepository {
  listProjects(options?: { categorySlug?: string }): Promise<Project[]>
  listFeaturedProjects(): Promise<Project[]>
  getProject(slug: string): Promise<Project | null>
  listCategories(): Promise<ProjectCategory[]>
  listServices(): Promise<Service[]>
  getSiteSettings(): Promise<SiteSettings>
  getAboutContent(): Promise<AboutContent>
  getHomeContent(): Promise<HomeContent>
  getFooterContent(): Promise<FooterRecord>
  /** True while any published page still shows a bundled sample (Unsplash) photo. */
  usesSamplePhotos(): Promise<boolean>
  /** Next published project in portfolio order (wraps around). */
  getAdjacentProject(slug: string): Promise<Project | null>
}

export interface QuoteRequestSender {
  submit(request: QuoteRequest, extra?: { honeypot?: string }): Promise<QuoteSubmitResult>
}

const remote = () => import('./supabase/supabaseRepository')

function lazyRepository(): ContentRepository {
  const call =
    <K extends keyof ContentRepository>(key: K) =>
    async (...args: Parameters<ContentRepository[K]>) => {
      const { supabaseRepository } = await remote()
      return (supabaseRepository[key] as (...a: unknown[]) => unknown).apply(supabaseRepository, args)
    }
  return {
    listProjects: call('listProjects'),
    listFeaturedProjects: call('listFeaturedProjects'),
    getProject: call('getProject'),
    listCategories: call('listCategories'),
    listServices: call('listServices'),
    getSiteSettings: call('getSiteSettings'),
    getAboutContent: call('getAboutContent'),
    getHomeContent: call('getHomeContent'),
    usesSamplePhotos: call('usesSamplePhotos'),
    getFooterContent: call('getFooterContent'),
    getAdjacentProject: call('getAdjacentProject'),
  } as ContentRepository
}

export const content: ContentRepository = CMS_MODE === 'supabase' ? lazyRepository() : localRepository

export const quoteRequests: QuoteRequestSender =
  CMS_MODE === 'supabase'
    ? { submit: async (req, extra) => (await remote()).supabaseQuoteSender.submit(req, extra) }
    : localQuoteSender
