import { localResolver } from '../../content/imagePaths'
import { commit, getState, uid } from '../../content/local/demoStore'
import type { ImageRecord } from '../../content/records'
import type { Offer } from '../../offers/model'
import { resizeImage } from '../lib/resizeImage'
import { AdminError, type AdminApi, type AdminSession } from './types'

/**
 * Browser-only CMS for previews. Nothing leaves this browser.
 * Uploaded photos are kept as WebP data URLs (≤1600 px) in localStorage, so they survive reloads and new tabs.
 */
const SESSION_KEY = 'ds-architect:demo-session'
const listeners = new Set<(s: AdminSession | null) => void>()
const demoSession: AdminSession = { userId: 'demo', email: 'demo@ds-architect.local' }

const readSession = (): AdminSession | null => {
  try {
    return localStorage.getItem(SESSION_KEY) ? demoSession : null
  } catch {
    return null
  }
}
const emit = (s: AdminSession | null) => listeners.forEach((l) => l(s))
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120))
const now = () => new Date().toISOString()

async function dataUrlFor(file: File) {
  const r = await resizeImage(file)
  const pick = [...r.variants].reverse().find((v) => v.width <= 1600) ?? r.variants[0]
  const url = await new Promise<string>((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(fr.result as string)
    fr.onerror = () => rej(new AdminError('Δεν ήταν δυνατή η ανάγνωση της εικόνας.'))
    fr.readAsDataURL(pick.blob)
  })
  return { url, width: pick.width, height: Math.round((r.height * pick.width) / r.width) }
}

export const demoAdminApi: AdminApi = {
  mode: 'demo',
  resolveImage: localResolver,

  async getSession() {
    return readSession()
  },
  onAuthChange(cb) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  },
  async signIn() {
    try {
      localStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* ignore */
    }
    emit(demoSession)
  },
  async signOut() {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    emit(null)
  },
  async requestPasswordReset() {
    throw new AdminError('Στη λειτουργία επίδειξης δεν υπάρχουν κωδικοί.')
  },
  async updatePassword() {
    throw new AdminError('Στη λειτουργία επίδειξης δεν υπάρχουν κωδικοί.')
  },

  async stats() {
    const s = getState()
    return delay({
      projectsPublished: s.projects.filter((p) => p.status === 'published').length,
      projectsDraft: s.projects.filter((p) => p.status === 'draft').length,
      projectsFeatured: s.projects.filter((p) => p.featured && p.status === 'published').length,
      requestsNew: s.quotes.filter((q) => q.status === 'new').length,
      requestsTotal: s.quotes.length,
    })
  },

  async listProjects() {
    return delay(structuredClone([...getState().projects].sort((a, b) => a.sortOrder - b.sortOrder)))
  },
  async getProject(id) {
    return delay(structuredClone(getState().projects.find((p) => p.id === id) ?? null))
  },
  async saveProject(project) {
    const s = getState()
    if (s.projects.some((p) => p.slug === project.slug && p.id !== project.id)) throw new AdminError('Υπάρχει ήδη έργο με αυτό το slug.')
    let saved = { ...project, updatedAt: now() }
    commit((d) => {
      if (!saved.id) {
        saved = { ...saved, id: uid(), sortOrder: Math.max(0, ...d.projects.map((p) => p.sortOrder)) + 1, images: [] }
        d.projects.push(saved)
      } else {
        const i = d.projects.findIndex((p) => p.id === saved.id)
        saved = { ...saved, images: d.projects[i].images }
        d.projects[i] = saved
      }
    })
    return delay(structuredClone(saved))
  },
  async deleteProject(id) {
    commit((d) => (d.projects = d.projects.filter((p) => p.id !== id)))
  },
  async uploadImage(projectId, file, kind) {
    const { url, width, height } = await dataUrlFor(file)
    const p = getState().projects.find((x) => x.id === projectId)
    const img: ImageRecord = { id: uid(), path: url, alt: '', width, height, kind, sortOrder: Math.max(-1, ...(p?.images.map((i) => i.sortOrder) ?? [])) + 1 }
    commit((d) => d.projects.find((x) => x.id === projectId)?.images.push(img))
    return img
  },
  async updateImage(projectId, image) {
    commit((d) => {
      const p = d.projects.find((x) => x.id === projectId)
      if (p) p.images = p.images.map((i) => (i.id === image.id ? image : i))
    })
  },
  async reorderImages(projectId, ids) {
    commit((d) => {
      const p = d.projects.find((x) => x.id === projectId)
      if (p) p.images.forEach((i) => (i.sortOrder = ids.indexOf(i.id)))
    })
  },
  async deleteImage(projectId, imageId) {
    commit((d) => {
      const p = d.projects.find((x) => x.id === projectId)
      if (!p) return
      p.images = p.images.filter((i) => i.id !== imageId)
      if (p.coverImageId === imageId) p.coverImageId = null
    })
  },

  async listCategories() {
    return delay(structuredClone([...getState().categories].sort((a, b) => a.sortOrder - b.sortOrder)))
  },
  async saveCategory(c) {
    if (getState().categories.some((x) => x.slug === c.slug && x.id !== c.id)) throw new AdminError('Υπάρχει ήδη κατηγορία με αυτό το slug.')
    const saved = { ...c, id: c.id || uid() }
    commit((d) => {
      const i = d.categories.findIndex((x) => x.id === saved.id)
      if (i === -1) d.categories.push(saved)
      else d.categories[i] = saved
    })
    return saved
  },
  async deleteCategory(id) {
    if (getState().projects.some((p) => p.categoryId === id)) throw new AdminError('Η κατηγορία χρησιμοποιείται από έργα. Μετακινήστε πρώτα τα έργα σε άλλη κατηγορία.')
    commit((d) => (d.categories = d.categories.filter((c) => c.id !== id)))
  },

  async listServices() {
    return delay(structuredClone([...getState().services].sort((a, b) => a.sortOrder - b.sortOrder)))
  },
  async saveService(sv) {
    if (getState().services.some((x) => x.slug === sv.slug && x.id !== sv.id)) throw new AdminError('Υπάρχει ήδη υπηρεσία με αυτό το slug.')
    const saved = { ...sv, id: sv.id || uid() }
    commit((d) => {
      const i = d.services.findIndex((x) => x.id === saved.id)
      if (i === -1) d.services.push(saved)
      else d.services[i] = saved
    })
    return saved
  },
  async deleteService(id) {
    commit((d) => (d.services = d.services.filter((s) => s.id !== id)))
  },
  async uploadMedia(_folder, file) {
    const { url, width, height } = await dataUrlFor(file)
    return { path: url, width, height }
  },

  async getHome() {
    return delay(structuredClone(getState().home))
  },
  async saveHome(home) {
    commit((d) => (d.home = home))
  },
  async listOffers() {
    return delay(structuredClone([...getState().offers].sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
  },
  async getOffer(id) {
    return delay(structuredClone(getState().offers.find((o) => o.id === id) ?? null))
  },
  async saveOffer(offer) {
    const now = new Date().toISOString()
    const existing = offer.id ? getState().offers.find((o) => o.id === offer.id) : undefined
    if (existing && (existing.status === 'accepted' || existing.status === 'declined') && JSON.stringify(existing.items) !== JSON.stringify(offer.items)) {
      throw new AdminError('Η προσφορά έχει απαντηθεί από τον πελάτη και δεν αλλάζει πλέον.')
    }
    let saved: Offer
    if (existing) {
      saved = { ...offer, number: existing.number, publicToken: existing.publicToken, respondedAt: existing.respondedAt, clientSignedName: existing.clientSignedName, clientSignature: existing.clientSignature, updatedAt: now }
      commit((d) => (d.offers = d.offers.map((o) => (o.id === saved.id ? saved : o))))
    } else {
      const year = offer.issueDate.slice(0, 4)
      const seq = getState().offers.filter((o) => o.number.startsWith(`ΠΡ-${year}-`)).length + 1
      saved = { ...offer, id: uid(), number: `ΠΡ-${year}-${String(seq).padStart(3, '0')}`, publicToken: uid(), createdAt: now, updatedAt: now }
      commit((d) => d.offers.push(saved))
    }
    return delay(structuredClone(saved))
  },
  async deleteOffer(id) {
    commit((d) => (d.offers = d.offers.filter((o) => o.id !== id)))
  },
  async getOfferSettings() {
    return delay(structuredClone(getState().offerSettings))
  },
  async saveOfferSettings(settings) {
    commit((d) => (d.offerSettings = settings))
  },
  async getFooter() {
    return delay(structuredClone(getState().footer))
  },
  async saveFooter(footer) {
    commit((d) => (d.footer = footer))
  },
  async getAbout() {
    return delay(structuredClone(getState().about))
  },
  async saveAbout(about) {
    commit((d) => (d.about = about))
  },
  async getSettings() {
    return delay(structuredClone(getState().settings))
  },
  async saveSettings(settings) {
    commit((d) => (d.settings = settings))
  },

  async listQuotes() {
    return delay(structuredClone(getState().quotes))
  },
  async updateQuote(id, patch) {
    commit((d) => {
      const q = d.quotes.find((x) => x.id === id)
      if (q) Object.assign(q, patch)
    })
  },
  async deleteQuote(id) {
    commit((d) => (d.quotes = d.quotes.filter((q) => q.id !== id)))
  },
}
