import { Link, useLocation } from 'react-router-dom'
import { ctaNav, primaryNav } from '../../config/navigation'
import { CMS_MODE } from '../../lib/env'
import { Monogram } from '../ui/icons'
import { handleNavClick } from './navLinkHandler'

const YEAR = new Date().getFullYear()

export function SiteFooter() {
  const { pathname } = useLocation()
  return (
    <footer className="bg-ink text-paper">
      <div className="page-x mx-auto max-w-[var(--container-page)] pb-10 pt-20">
        <div className="grid-12 gap-y-12">
          <div className="col-span-4 lg:col-span-5">
            <Link to="/" onClick={(e) => handleNavClick(e, '/', pathname)} className="inline-flex items-center gap-3">
              <Monogram className="h-9 w-9 text-bronze-light" />
              <span className="font-display text-2xl tracking-[0.3em]">ATELIER STUDIO</span>
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
            <p className="text-stone">Τα στοιχεία επικοινωνίας θα προστεθούν σύντομα.</p>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-paper/12 pt-6 text-sm text-muted-ink md:flex-row md:items-center md:justify-between">
          <p>
            © {YEAR} ATELIER STUDIO. Προσωρινή ονομασία. ·{' '}
            <Link to="/politiki-aporritou" className="link-draw text-stone hover:text-paper">Πολιτική Απορρήτου</Link>
            {CMS_MODE === 'demo' && (
              <>
                {' · '}
                <Link to="/diaxeirisi" className="link-draw text-stone hover:text-paper">Διαχείριση (επίδειξη)</Link>
              </>
            )}
          </p>
          <p>Οι φωτογραφίες είναι ενδεικτικές (Unsplash) και δεν αποτελούν έργα του στούντιο.</p>
        </div>
      </div>
    </footer>
  )
}
