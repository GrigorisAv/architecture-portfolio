import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { MEDIA_BUCKET, SUPABASE_ANON_KEY, SUPABASE_URL } from '../../lib/env'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    // Implicit flow: invite and recovery links sent by Supabase Auth work without a stored PKCE verifier.
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  return client
}

export const mediaPublicBase = () => `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}`
