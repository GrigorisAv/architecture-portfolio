import type { ContentRepository, QuoteRequestSender } from '../repository'
import { storageResolver } from '../imagePaths'
import { aboutUsesSample, homeUsesSample, normalizeFooter, normalizeHome, toDomainAbout, toDomainCategory, toDomainHome, toDomainProject, toDomainService } from '../records'
import type { Project, QuoteSubmitResult } from '../types'
import { getSupabase, mediaPublicBase } from './client'
import { PROJECT_SELECT, toAbout, toCategory, toProject, toService, toSettings, type CategoryRow, type ProjectRow, type ServiceRow, type SettingsRow } from './rows'

const resolve = () => storageResolver(mediaPublicBase())

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`Supabase (${context}): ${error?.message ?? 'unknown error'}`)
}

async function publishedProjects(): Promise<Project[]> {
  // RLS already hides drafts from the public; the filter keeps admin previews of the site honest too.
  const { data, error } = await getSupabase().from('projects').select(PROJECT_SELECT).eq('status', 'published').order('sort_order')
  if (error) fail('projects', error)
  const r = resolve()
  return (data as ProjectRow[]).map((row) => toDomainProject(toProject(row), r))
}

export const supabaseRepository: ContentRepository = {
  async listProjects(options) {
    const list = await publishedProjects()
    if (!options?.categorySlug) return list
    const cats = await this.listCategories()
    const cat = cats.find((c) => c.slug === options.categorySlug)
    return cat ? list.filter((p) => p.categoryId === cat.id) : []
  },
  async listFeaturedProjects() {
    return (await publishedProjects()).filter((p) => p.featured).sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99))
  },
  async getProject(slug) {
    const { data, error } = await getSupabase().from('projects').select(PROJECT_SELECT).eq('slug', slug).eq('status', 'published').maybeSingle()
    if (error) fail('project', error)
    return data ? toDomainProject(toProject(data as ProjectRow), resolve()) : null
  },
  async getAdjacentProject(slug) {
    const list = await publishedProjects()
    const i = list.findIndex((p) => p.slug === slug)
    return i === -1 || list.length < 2 ? null : list[(i + 1) % list.length]
  },
  async listCategories() {
    const { data, error } = await getSupabase().from('categories').select('*').order('sort_order')
    if (error) fail('categories', error)
    return (data as CategoryRow[]).map((r) => toDomainCategory(toCategory(r)))
  },
  async listServices() {
    const { data, error } = await getSupabase().from('services').select('*').order('sort_order')
    if (error) fail('services', error)
    const r = resolve()
    return (data as ServiceRow[]).map((row) => toDomainService(toService(row), r))
  },
  async getSiteSettings() {
    const { data, error } = await getSupabase().from('site_settings').select('*').eq('id', 1).single()
    if (error) fail('settings', error)
    return toSettings(data as SettingsRow)
  },
  async getAboutContent() {
    const { data, error } = await getSupabase().from('page_content').select('content').eq('key', 'about').maybeSingle()
    if (error) fail('about', error)
    return toDomainAbout(toAbout((data?.content as object) ?? null), resolve())
  },
  async getFooterContent() {
    const { data, error } = await getSupabase().from('page_content').select('content').eq('key', 'footer').maybeSingle()
    if (error) fail('footer', error)
    return normalizeFooter((data?.content as object) ?? null)
  },
  async usesSamplePhotos() {
    const sb = getSupabase()
    const [pages, images, services] = await Promise.all([
      sb.from('page_content').select('key, content'),
      // Conservative: a draft's sample photo keeps the note too; deleting the sample projects removes it.
      sb.from('project_images').select('id').like('storage_path', 'local:%').limit(1),
      sb.from('services').select('id').like('image_path', 'local:%').limit(1),
    ])
    if (pages.error) fail('pages', pages.error)
    if (images.error) fail('images', images.error)
    if (services.error) fail('services', services.error)
    const page = (key: string) => ((pages.data as { key: string; content: object }[]).find((p) => p.key === key)?.content ?? null) as never
    return homeUsesSample(normalizeHome(page('home'))) || aboutUsesSample(toAbout(page('about'))) || images.data.length > 0 || services.data.length > 0
  },
  async getHomeContent() {
    const { data, error } = await getSupabase().from('page_content').select('content').eq('key', 'home').maybeSingle()
    if (error) fail('home', error)
    return toDomainHome(normalizeHome((data?.content as object) ?? null), resolve())
  },
}

const RPC_MESSAGES: Record<string, string> = {
  rate_limited: 'Έχουν σταλεί πολλά αιτήματα σε σύντομο χρόνο. Δοκιμάστε ξανά σε λίγο.',
}

export const supabaseQuoteSender: QuoteRequestSender = {
  async submit(request, extra) {
    const { error } = await getSupabase().rpc('submit_quote_request', { payload: { ...request, website: extra?.honeypot ?? '' } })
    if (!error) return { status: 'sent' } satisfies QuoteSubmitResult
    const code = error.message
    if (code.startsWith('invalid:')) {
      return { status: 'error', message: 'Κάποιο πεδίο δεν έγινε δεκτό από τον server. Ελέγξτε τα στοιχεία και δοκιμάστε ξανά.', field: code.slice(8) }
    }
    return { status: 'error', message: RPC_MESSAGES[code] ?? 'Δεν ήταν δυνατή η αποστολή. Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.' }
  },
}
