import { CMS_MODE } from '../../lib/env'
import type { AdminApi } from './types'

let api: Promise<AdminApi> | null = null

/** Loads the admin implementation for the configured mode (code-split). */
export function loadAdminApi(): Promise<AdminApi> | null {
  if (CMS_MODE === 'off') return null
  api ??= CMS_MODE === 'supabase' ? import('./supabaseAdminApi').then((m) => m.supabaseAdminApi) : import('./demoAdminApi').then((m) => m.demoAdminApi)
  return api
}
