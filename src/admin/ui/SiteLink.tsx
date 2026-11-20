import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * Link from the CMS to the public site. Real deployments open a new tab;
 * in-page previews (memory router, no URL paths) navigate within the app instead.
 */
export function SiteLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  if (import.meta.env.VITE_ROUTER === 'memory') return <Link to={to} className={className}>{children}</Link>
  return (
    <a href={`${import.meta.env.BASE_URL}${to.replace(/^\//, '')}`} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  )
}
