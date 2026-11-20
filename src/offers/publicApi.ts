/**
 * Client-side access to a single offer by its link. Supabase: RPCs get_public_offer / respond_offer.
 * Demo/local: the browser's demo store (works only in the browser that created the offer).
 */
import { CMS_MODE } from '../lib/env'
import type { PublicOffer } from './model'

export type RespondError = 'not_found' | 'already_answered' | 'expired' | 'invalid:name' | 'invalid:signature' | 'network'

export interface PublicOfferApi {
  get(token: string): Promise<PublicOffer | null>
  /** URL of a stored image path (issuer signature). */
  resolveImage(path: string): string
  respond(token: string, answer: { accept: boolean; name: string; signature: string | null }): Promise<{ ok: true } | { ok: false; error: RespondError }>
}

const KNOWN: RespondError[] = ['not_found', 'already_answered', 'expired', 'invalid:name', 'invalid:signature']

async function supabaseApi(): Promise<PublicOfferApi> {
  const { getSupabase, mediaPublicBase } = await import('../content/supabase/client')
  const { storageResolver } = await import('../content/imagePaths')
  const resolve = storageResolver(mediaPublicBase())
  const { toPublicOffer } = await import('./rows')
  return {
    resolveImage: (path) => resolve(path, null).src,
    async get(token) {
      const { data, error } = await getSupabase().rpc('get_public_offer', { payload: { token } })
      if (error) throw new Error(error.message)
      return data ? toPublicOffer(data as Record<string, unknown>) : null
    },
    async respond(token, a) {
      const { error } = await getSupabase().rpc('respond_offer', { payload: { token, accept: a.accept, name: a.name, signature: a.signature ?? '' } })
      if (!error) return { ok: true }
      const code = KNOWN.find((k) => error.message.startsWith(k))
      return { ok: false, error: code ?? 'network' }
    },
  }
}

async function demoApi(): Promise<PublicOfferApi> {
  const { commit, getState } = await import('../content/local/demoStore')
  const { todayIso } = await import('./model')
  const { localResolver } = await import('../content/imagePaths')
  return {
    resolveImage: (path) => localResolver(path, null).src,
    async get(token) {
      const o = getState().offers.find((x) => x.publicToken === token && x.status !== 'draft')
      if (!o) return null
      const { id: _i, quoteRequestId: _q, publicToken: _t, internalNotes: _n, createdAt: _c, updatedAt: _u, ...pub } = o
      return structuredClone(pub)
    },
    async respond(token, a) {
      const o = getState().offers.find((x) => x.publicToken === token && x.status !== 'draft')
      if (!o) return { ok: false, error: 'not_found' }
      if (o.status !== 'sent') return { ok: false, error: 'already_answered' }
      if (o.validUntil && o.validUntil < todayIso()) return { ok: false, error: 'expired' }
      if (a.name.trim().length < 3) return { ok: false, error: 'invalid:name' }
      if (a.accept && !a.signature?.startsWith('data:image/png;base64,')) return { ok: false, error: 'invalid:signature' }
      commit((d) => {
        const x = d.offers.find((y) => y.publicToken === token)!
        x.status = a.accept ? 'accepted' : 'declined'
        x.respondedAt = new Date().toISOString()
        x.clientSignedName = a.name.trim()
        x.clientSignature = a.accept ? a.signature : null
      })
      return { ok: true }
    },
  }
}

export const loadPublicOfferApi = (): Promise<PublicOfferApi> => (CMS_MODE === 'supabase' ? supabaseApi() : demoApi())
