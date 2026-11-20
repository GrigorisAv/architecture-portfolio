import { storageResolver, variantPath, variantWidths } from '../../content/imagePaths'
import type { ImageRecord } from '../../content/records'
import { getSupabase, mediaPublicBase } from '../../content/supabase/client'
import {
  fromProject, fromService, fromSettings, PROJECT_SELECT, toAbout, toCategory, toImage, toProject, toQuote, toService, toSettings,
  type CategoryRow, type ImageRow, type ProjectRow, type QuoteRow, type ServiceRow, type SettingsRow,
} from '../../content/supabase/rows'
import { MEDIA_BUCKET } from '../../lib/env'
import { resizeImage } from '../lib/resizeImage'
import { AdminError, type AdminApi, type AdminSession } from './types'

const sb = () => getSupabase()

/** Maps Postgres / Supabase errors to Greek, admin-safe messages. */
function check<T>(res: { data: T; error: { message: string; code?: string } | null }, action: string): T {
  if (!res.error) return res.data
  const { code, message } = res.error
  if (code === '23505') throw new AdminError('Η τιμή υπάρχει ήδη (π.χ. το slug χρησιμοποιείται από άλλη εγγραφή).')
  if (code === '23503') throw new AdminError('Η εγγραφή χρησιμοποιείται αλλού και δεν μπορεί να διαγραφεί.')
  if (code === '23514') throw new AdminError('Κάποια τιμή δεν είναι έγκυρη (π.χ. μορφή slug ή έτος).')
  if (code === '42501' || /row-level security/i.test(message)) throw new AdminError('Δεν έχετε δικαίωμα για αυτή την ενέργεια. Συνδεθείτε ξανά.')
  throw new AdminError(`Σφάλμα κατά ${action}: ${message}`)
}

const toSession = (u: { id: string; email?: string } | null | undefined): AdminSession | null => (u ? { userId: u.id, email: u.email ?? '' } : null)

async function uploadVariants(base: string, file: File) {
  const resized = await resizeImage(file)
  for (const v of resized.variants) {
    const { error } = await sb().storage.from(MEDIA_BUCKET).upload(variantPath(base, v.width), v.blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false })
    if (error) throw new AdminError(`Το ανέβασμα απέτυχε: ${error.message}`)
  }
  return resized
}

async function removeVariants(base: string, width: number | null) {
  if (base.startsWith('local:') || /^(https?:|blob:)/.test(base)) return
  await sb().storage.from(MEDIA_BUCKET).remove(variantWidths(width).map((w) => variantPath(base, w)))
}

export const supabaseAdminApi: AdminApi = {
  mode: 'supabase',
  resolveImage: storageResolver(mediaPublicBase()),

  async getSession() {
    const { data } = await sb().auth.getSession()
    return toSession(data.session?.user)
  },
  onAuthChange(cb) {
    const { data } = sb().auth.onAuthStateChange((_e, session) => cb(toSession(session?.user)))
    return () => data.subscription.unsubscribe()
  },
  async signIn(email, password) {
    const { error } = await sb().auth.signInWithPassword({ email, password })
    if (error) {
      if (/invalid login/i.test(error.message)) throw new AdminError('Λάθος email ή κωδικός.')
      if (/rate/i.test(error.message)) throw new AdminError('Πολλές προσπάθειες σύνδεσης. Δοκιμάστε ξανά σε λίγα λεπτά.')
      throw new AdminError(`Η σύνδεση απέτυχε: ${error.message}`)
    }
    const { data: isAdmin } = await sb().rpc('is_admin')
    if (!isAdmin) {
      await sb().auth.signOut()
      throw new AdminError('Αυτός ο λογαριασμός δεν έχει δικαίωμα διαχείρισης.')
    }
  },
  async signOut() {
    await sb().auth.signOut()
  },
  async requestPasswordReset(email) {
    const redirectTo = `${location.origin}${import.meta.env.BASE_URL}diaxeirisi/neos-kodikos`
    const { error } = await sb().auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw new AdminError('Δεν ήταν δυνατή η αποστολή του email επαναφοράς. Δοκιμάστε ξανά αργότερα.')
  },
  async updatePassword(password) {
    const { error } = await sb().auth.updateUser({ password })
    if (error) throw new AdminError(/weak|short/i.test(error.message) ? 'Ο κωδικός είναι πολύ αδύναμος. Χρησιμοποιήστε τουλάχιστον 10 χαρακτήρες.' : `Η αλλαγή κωδικού απέτυχε: ${error.message}`)
  },

  async stats() {
    const data = check(await sb().rpc('admin_dashboard_stats'), 'τη φόρτωση στατιστικών') as Record<string, number>
    return {
      projectsPublished: data.projects_published,
      projectsDraft: data.projects_draft,
      projectsFeatured: data.projects_featured,
      requestsNew: data.requests_new,
      requestsTotal: data.requests_total,
    }
  },

  async listProjects() {
    const rows = check(await sb().from('projects').select(PROJECT_SELECT).order('sort_order'), 'τη φόρτωση έργων') as ProjectRow[]
    return rows.map(toProject)
  },
  async getProject(id) {
    const row = check(await sb().from('projects').select(PROJECT_SELECT).eq('id', id).maybeSingle(), 'τη φόρτωση έργου') as ProjectRow | null
    return row ? toProject(row) : null
  },
  async saveProject(p) {
    const payload = fromProject(p)
    const query = p.id
      ? sb().from('projects').update(payload).eq('id', p.id).select(PROJECT_SELECT).single()
      : sb().from('projects').insert(payload).select(PROJECT_SELECT).single()
    return toProject(check(await query, 'την αποθήκευση έργου') as ProjectRow)
  },
  async deleteProject(id) {
    const project = await this.getProject(id)
    for (const img of project?.images ?? []) await removeVariants(img.path, img.width)
    check(await sb().from('projects').delete().eq('id', id), 'τη διαγραφή έργου')
  },
  async uploadImage(projectId, file, kind) {
    const base = `projects/${projectId}/${crypto.randomUUID()}`
    const resized = await uploadVariants(base, file)
    const { data: maxRow } = await sb().from('project_images').select('sort_order').eq('project_id', projectId).order('sort_order', { ascending: false }).limit(1).maybeSingle()
    const row = check(
      await sb()
        .from('project_images')
        .insert({ project_id: projectId, storage_path: base, alt: '', width: resized.width, height: resized.height, kind, sort_order: (maxRow?.sort_order ?? -1) + 1 })
        .select('*')
        .single(),
      'την καταχώριση εικόνας',
    ) as ImageRow
    return toImage(row)
  },
  async updateImage(_projectId, image: ImageRecord) {
    check(await sb().from('project_images').update({ alt: image.alt, kind: image.kind, sort_order: image.sortOrder }).eq('id', image.id), 'την ενημέρωση εικόνας')
  },
  async reorderImages(_projectId, ids) {
    for (const [i, id] of ids.entries()) check(await sb().from('project_images').update({ sort_order: i }).eq('id', id), 'την ταξινόμηση')
  },
  async deleteImage(_projectId, imageId) {
    const row = check(await sb().from('project_images').select('*').eq('id', imageId).single(), 'τη φόρτωση εικόνας') as ImageRow
    check(await sb().from('project_images').delete().eq('id', imageId), 'τη διαγραφή εικόνας')
    await removeVariants(row.storage_path, row.width)
  },

  async listCategories() {
    return (check(await sb().from('categories').select('*').order('sort_order'), 'τη φόρτωση κατηγοριών') as CategoryRow[]).map(toCategory)
  },
  async saveCategory(c) {
    const payload = { slug: c.slug, label: c.label, sort_order: c.sortOrder }
    const q = c.id ? sb().from('categories').update(payload).eq('id', c.id).select('*').single() : sb().from('categories').insert(payload).select('*').single()
    return toCategory(check(await q, 'την αποθήκευση κατηγορίας') as CategoryRow)
  },
  async deleteCategory(id) {
    const res = await sb().from('categories').delete().eq('id', id)
    if (res.error?.code === '23503') throw new AdminError('Η κατηγορία χρησιμοποιείται από έργα. Μετακινήστε πρώτα τα έργα σε άλλη κατηγορία.')
    check(res, 'τη διαγραφή κατηγορίας')
  },

  async listServices() {
    return (check(await sb().from('services').select('*').order('sort_order'), 'τη φόρτωση υπηρεσιών') as ServiceRow[]).map(toService)
  },
  async saveService(s) {
    const payload = fromService(s)
    const q = s.id ? sb().from('services').update(payload).eq('id', s.id).select('*').single() : sb().from('services').insert(payload).select('*').single()
    return toService(check(await q, 'την αποθήκευση υπηρεσίας') as ServiceRow)
  },
  async deleteService(id) {
    check(await sb().from('services').delete().eq('id', id), 'τη διαγραφή υπηρεσίας')
  },
  async uploadMedia(folder, file) {
    const base = `${folder}/${crypto.randomUUID()}`
    const r = await uploadVariants(base, file)
    return { path: base, width: r.width, height: r.height }
  },

  async getAbout() {
    const row = check(await sb().from('page_content').select('content').eq('key', 'about').maybeSingle(), 'τη φόρτωση σελίδας') as { content: object } | null
    return toAbout((row?.content as never) ?? null)
  },
  async saveAbout(about) {
    check(await sb().from('page_content').upsert({ key: 'about', content: about }), 'την αποθήκευση σελίδας')
  },
  async getSettings() {
    return toSettings(check(await sb().from('site_settings').select('*').eq('id', 1).single(), 'τη φόρτωση ρυθμίσεων') as SettingsRow)
  },
  async saveSettings(s) {
    check(await sb().from('site_settings').update(fromSettings(s)).eq('id', 1), 'την αποθήκευση ρυθμίσεων')
  },

  async listQuotes() {
    return (check(await sb().from('quote_requests').select('*').order('created_at', { ascending: false }), 'τη φόρτωση αιτημάτων') as QuoteRow[]).map(toQuote)
  },
  async updateQuote(id, patch) {
    const payload: Record<string, unknown> = {}
    if (patch.status) payload.status = patch.status
    if (patch.adminNotes !== undefined) payload.admin_notes = patch.adminNotes
    check(await sb().from('quote_requests').update(payload).eq('id', id), 'την ενημέρωση αιτήματος')
  },
  async deleteQuote(id) {
    check(await sb().from('quote_requests').delete().eq('id', id), 'τη διαγραφή αιτήματος')
  },
}
