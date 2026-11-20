/**
 * Runtime configuration (Vite env, baked at build time).
 *   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY → real CMS (Supabase)
 *   VITE_CMS_DEMO=true                         → browser-only demo CMS (previews)
 *   neither                                    → static local content, admin disabled
 */
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
export const MEDIA_BUCKET = 'media'

export type CmsMode = 'supabase' | 'demo' | 'off'
export const CMS_MODE: CmsMode = SUPABASE_URL && SUPABASE_ANON_KEY ? 'supabase' : import.meta.env.VITE_CMS_DEMO === 'true' ? 'demo' : 'off'

/** Public origin of the site, e.g. https://www.example.gr (canonical URLs, Open Graph, sitemap). */
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').replace(/\/$/, '')
