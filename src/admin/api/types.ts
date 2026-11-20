import type { AboutRecord, HomeRecord, CategoryRecord, ImageKind, ImageRecord, ImageResolver, ProjectRecord, QuoteRecord, QuoteStatus, ServiceRecord } from '../../content/records'
import type { SiteSettings } from '../../content/types'

export interface AdminSession {
  userId: string
  email: string
}

export interface DashboardStats {
  projectsPublished: number
  projectsDraft: number
  projectsFeatured: number
  requestsNew: number
  requestsTotal: number
}

export type MediaFolder = 'services' | 'about' | 'home'

/** Error whose message is safe to show to the admin (Greek). */
export class AdminError extends Error {}

/** Everything the CMS UI needs. Implemented by Supabase (real) and demo (browser-only). */
export interface AdminApi {
  mode: 'supabase' | 'demo'
  resolveImage: ImageResolver

  getSession(): Promise<AdminSession | null>
  onAuthChange(cb: (session: AdminSession | null) => void): () => void
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  updatePassword(password: string): Promise<void>

  stats(): Promise<DashboardStats>

  listProjects(): Promise<ProjectRecord[]>
  getProject(id: string): Promise<ProjectRecord | null>
  /** Creates when `id` is empty. Images are managed with the image methods. */
  saveProject(project: ProjectRecord): Promise<ProjectRecord>
  deleteProject(id: string): Promise<void>
  uploadImage(projectId: string, file: File, kind: ImageKind): Promise<ImageRecord>
  updateImage(projectId: string, image: ImageRecord): Promise<void>
  reorderImages(projectId: string, orderedIds: string[]): Promise<void>
  deleteImage(projectId: string, imageId: string): Promise<void>

  listCategories(): Promise<CategoryRecord[]>
  saveCategory(category: CategoryRecord): Promise<CategoryRecord>
  deleteCategory(id: string): Promise<void>

  listServices(): Promise<ServiceRecord[]>
  saveService(service: ServiceRecord): Promise<ServiceRecord>
  deleteService(id: string): Promise<void>
  /** Uploads a standalone image (service photo, portrait) and returns its stored path. */
  uploadMedia(folder: MediaFolder, file: File): Promise<{ path: string; width: number; height: number }>

  getHome(): Promise<HomeRecord>
  saveHome(home: HomeRecord): Promise<void>

  getAbout(): Promise<AboutRecord>
  saveAbout(about: AboutRecord): Promise<void>

  getSettings(): Promise<SiteSettings>
  saveSettings(settings: SiteSettings): Promise<void>

  listQuotes(): Promise<QuoteRecord[]>
  updateQuote(id: string, patch: { status?: QuoteStatus; adminNotes?: string }): Promise<void>
  deleteQuote(id: string): Promise<void>
}

export const emptyProject = (categoryId = ''): ProjectRecord => ({
  id: '',
  slug: '',
  title: '',
  categoryId,
  summary: '',
  description: [],
  location: null,
  year: null,
  areaSqm: null,
  status: 'draft',
  featured: false,
  featuredOrder: null,
  coverImageId: null,
  isPlaceholder: false,
  seoTitle: null,
  seoDescription: null,
  sortOrder: 0,
  updatedAt: new Date().toISOString(),
  images: [],
})
