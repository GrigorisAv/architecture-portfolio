import { createContext, useContext } from 'react'
import type { AdminApi, AdminSession } from './api/types'

export interface AdminCtx {
  api: AdminApi
  session: AdminSession
}

export const AdminContext = createContext<AdminCtx | null>(null)

export function useAdmin(): AdminCtx {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin outside AdminContext')
  return ctx
}
