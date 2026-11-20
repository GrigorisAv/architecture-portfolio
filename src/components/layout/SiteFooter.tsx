import { Link, useLocation, useRouteLoaderData } from 'react-router-dom'
import { ctaNav, primaryNav } from '../../config/navigation'
import type { SiteSettings } from '../../content/types'
import { CMS_MODE } from '../../lib/env'
import { Monogram } from '../ui/icons'
import { handleNavClick } from './navLinkHandler'

const YEAR = new Date().getFullYear()

export interface RootData {
  settings: SiteSettings
  samplePhotos: boolean
}

/** Accepts a full profile URL or a bare handle ("@name" / "name"). */
const instagramUrl = (v: string) => (/^https?:\/\//.test(v) ? v : `https://www.instagram.com/${v.replace(/^@/, '')}/`)
const instagramHandle = (v: string) => '@' + v.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/^@/, '').replace(/\/.*$/, '')

export function SiteFooter() {
  const { pathname } = useLocation()
  // Undefined only if the root data failed to load: show the neutral fallbacks.
  const root = useRouteLoaderData('root') as RootData | undefined
  const s = root?.settings
  const hasContact = !!(s?.email || s?.phone || s?.address || s?.instagram)
  return (
    <footer className="bg-ink text-paper">
      <div className="page-x mx-auto max-w-[var(--container-page)] pb-10 pt-20">
        <div className="grid-12 gap-y-12">
          <div className="col-span-4 lg:col-span-5">
            <Link to="/" onClick={(e) => handleNavClick(e, '/', pathname)} className="inline-flex min-h-11 items-center gap-3">
              <Monogram className="h-9 w-9 text-bronze-light" />
              <span className="font-display text-2xl uppercase tracking-[0.3em]">DS Architect</span>
              <span className="visually-hidden">, αρχική σελίδα</span>
            </Link>
            <p className="mt-6 max-w-sm text-muted-ink">Αρχιτεκτονική &amp; Εσωτερικοί Χώροι. Η τέχνη του χώρου, με μεσογειακό φως και καθαρές αναλογίες.</p>
          </div>

          <nav aria-label="Πλοήγηση υποσέλιδου" className="col-span-2 lg:col-span-3 lg:col-start-7">
            <p className="eyebrow mb-5 text-bronze-light">Πλοήγηση</p>
            <ul className="space-y-2.5">
              {[...primaryNav, ctaNav].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} onClick={(e) => handleNavClick(e, item.to, pathname)} className="link-draw text-stone hover:text-paper">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-2 lg:col-span-3">
            <p className="eyebrow mb-5 text-bronze-light">Επικοινωνία</p>
            {hasContact ? (
              <ul className="space-y-2.5 text-stone">
                {s?.email && <li><a href={`mailto:${s.email}`} className="link-draw break-all hover:text-paper">{s.email}</a></li>}
                {s?.phone && <li><a href={`tel:${s.phone.replace(/[^\d+]/g, '')}`} className="link-draw hover:text-paper">{s.phone}</a></li>}
                {s?.address && <li className="whitespace-pre-line text-muted-ink">{s.address}</li>}
                {s?.instagram && (
                  <li>
                    <a href={instagramUrl(s.instagram)} target="_blank" rel="noopener noreferrer" className="link-draw hover:text-paper">
                      Instagram · {instagramHandle(s.instagram)}
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-stone">Τα στοιχεία επικοινωνίας θα προστεθούν σύντομα.</p>
            )}
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-paper/12 pt-6 text-sm text-muted-ink md:flex-row md:items-center md:justify-between">
          <p>
            © {YEAR} DS Architect ·{' '}
            <Link to="/politiki-aporritou" className="link-draw inline-block py-2 text-stone hover:text-paper">Πολιτική Απορρήτου</Link>
            {CMS_MODE === 'demo' && (
              <>
                {' · '}
                <Link to="/diaxeirisi" className="link-draw inline-block py-2 text-stone hover:text-paper">Διαχείριση (επίδειξη)</Link>
              </>
            )}
          </p>
          {(root?.samplePhotos ?? true) && <p>Ορισμένες φωτογραφίες είναι ενδεικτικές (Unsplash) και δεν αποτελούν έργα του στούντιο.</p>}
        </div>
      </div>
    </footer>
  )
}
