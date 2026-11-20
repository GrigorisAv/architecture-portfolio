import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { CMS_MODE } from '../lib/env'
import { loadAdminApi } from './api'
import { AdminError, type AdminApi, type AdminSession } from './api/types'
import { AdminContext, useAdmin } from './AdminContext'
import { AboutEditor } from './pages/AboutEditor'
import { Categories } from './pages/Categories'
import { Dashboard } from './pages/Dashboard'
import { FooterEditor } from './pages/FooterEditor'
import { PhotoGuide } from './pages/PhotoGuide'
import { Offers } from './pages/Offers'
import { OfferEditor } from './pages/OfferEditor'
import { OfferPrint } from './pages/OfferPrint'
import { OfferSettingsPage } from './pages/OfferSettingsPage'
import { HomeEditor } from './pages/HomeEditor'
import { ProjectEditor } from './pages/ProjectEditor'
import { ProjectsList } from './pages/ProjectsList'
import { Requests } from './pages/Requests'
import { ServicesAdmin } from './pages/ServicesAdmin'
import { Settings } from './pages/Settings'
import { Button, Field, Loading, ToastProvider } from './ui/kit'
import { SiteLink } from './ui/SiteLink'
import { inputCls } from './ui/kitUtils'

/** /diaxeirisi/* : private CMS. Lazy-loaded; never indexed. */
export default function AdminApp() {
  const [api, setApi] = useState<AdminApi | null>(null)
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined)

  useEffect(() => {
    const prevTitle = document.title
    document.title = 'Διαχείριση — DS Architect'
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    return () => {
      document.title = prevTitle
      robots.remove()
    }
  }, [])

  useEffect(() => {
    const p = loadAdminApi()
    if (!p) return
    let unsub = () => {}
    p.then(async (a) => {
      setApi(a)
      setSession(await a.getSession())
      unsub = a.onAuthChange(setSession)
    })
    return () => unsub()
  }, [])

  if (CMS_MODE === 'off') return <CmsOff />
  if (!api || session === undefined) return <Centered><Loading label="Φόρτωση διαχείρισης…" /></Centered>

  return (
    <ToastProvider>
      <div className="min-h-svh bg-[#f2efe8] text-ink">
        {api.mode === 'demo' && <DemoBanner />}
        <Routes>
          <Route path="neos-kodikos" element={<UpdatePassword api={api} />} />
          <Route
            path="prosfores/:id/ektyposi"
            element={
              session ? (
                <AdminContext.Provider value={{ api, session }}>
                  <OfferPrint />
                </AdminContext.Provider>
              ) : (
                <Login api={api} />
              )
            }
          />
          <Route
            path="*"
            element={
              session ? (
                <AdminContext.Provider value={{ api, session }}>
                  <Shell />
                </AdminContext.Provider>
              ) : (
                <Login api={api} />
              )
            }
          />
        </Routes>
      </div>
    </ToastProvider>
  )
}

function DemoBanner() {
  return (
    <div role="note" data-print-hide className="bg-bronze-light px-4 py-2 text-center text-sm font-medium text-ink">
      Λειτουργία επίδειξης: δεν υπάρχει σύνδεση με Supabase. Οι αλλαγές αποθηκεύονται μόνο σε αυτόν τον browser.
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-svh items-center justify-center bg-[#f2efe8] px-4">{children}</div>
}

function CmsOff() {
  return (
    <Centered>
      <div className="max-w-lg rounded-lg border border-stone-deep bg-white p-8">
        <h1 className="font-display text-3xl">Η διαχείριση δεν είναι ενεργή</h1>
        <p className="mt-4 text-muted-paper">
          Ο ιστότοπος δεν έχει συνδεθεί ακόμη με Supabase. Ορίστε τις μεταβλητές <code>VITE_SUPABASE_URL</code> και <code>VITE_SUPABASE_ANON_KEY</code> και κάντε νέο build.
        </p>
        <Link to="/" className="mt-6 inline-block text-sm font-semibold underline underline-offset-4">Επιστροφή στον ιστότοπο</Link>
      </div>
    </Centered>
  )
}

/* ---------------- Login ---------------- */
function Login({ api }: { api: AdminApi }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const demo = api.mode === 'demo'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!demo && (!email.trim() || !password)) return setError('Συμπληρώστε email και κωδικό.')
    setBusy(true)
    try {
      await api.signIn(email.trim(), password)
    } catch (err) {
      setError(err instanceof AdminError ? err.message : 'Η σύνδεση απέτυχε. Δοκιμάστε ξανά.')
    } finally {
      setBusy(false)
    }
  }
  const reset = async () => {
    setError(null)
    if (!email.trim()) return setError('Συμπληρώστε πρώτα το email σας.')
    try {
      await api.requestPasswordReset(email.trim())
      setInfo('Αν το email αντιστοιχεί στον λογαριασμό διαχείρισης, θα λάβετε σύνδεσμο για νέο κωδικό.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα')
    }
  }

  return (
    <Centered>
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-stone-deep/70 bg-white p-8 shadow-[0_20px_60px_-30px_rgb(0_0_0/0.3)]" noValidate>
        <p className="font-display text-xl tracking-[0.14em]">DS <span className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.34em] text-bronze-ink">Architect</span></p>
        <h1 className="mt-8 font-display text-3xl font-light">Σύνδεση διαχείρισης</h1>
        <p className="mt-2 text-sm text-muted-paper">{demo ? 'Λειτουργία επίδειξης: δεν απαιτούνται στοιχεία.' : 'Μόνο για τη διαχειρίστρια του ιστότοπου.'}</p>

        {!demo && (
          <div className="mt-8 flex flex-col gap-5">
            <Field label="Email">{(p) => <input {...p} type="email" autoComplete="username" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
            <Field label="Κωδικός">{(p) => <input {...p} type="password" autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />}</Field>
          </div>
        )}
        {error && <p role="alert" className="mt-5 rounded-md bg-[#fbf1ef] px-3 py-2 text-sm text-error">{error}</p>}
        {info && <p role="status" className="mt-5 rounded-md bg-stone/50 px-3 py-2 text-sm">{info}</p>}
        <Button type="submit" variant="primary" busy={busy} className="mt-8 w-full">{demo ? 'Είσοδος επίδειξης' : 'Σύνδεση'}</Button>
        {!demo && <button type="button" onClick={reset} className="mt-4 text-sm text-muted-paper underline underline-offset-4 hover:text-ink">Ξέχασα τον κωδικό</button>}
        <p className="mt-8 border-t border-stone-deep/60 pt-4 text-xs text-muted-paper">Δεν υπάρχει δημόσια εγγραφή. Ο λογαριασμός δημιουργείται μόνο με πρόσκληση.</p>
      </form>
    </Centered>
  )
}

/* ---------------- Set password (invite / recovery link) ---------------- */
function UpdatePassword({ api }: { api: AdminApi }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.length < 10) return setError('Ο κωδικός πρέπει να έχει τουλάχιστον 10 χαρακτήρες.')
    if (pw !== pw2) return setError('Οι δύο κωδικοί δεν ταιριάζουν.')
    setBusy(true)
    try {
      await api.updatePassword(pw)
      navigate('/diaxeirisi', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Centered>
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-stone-deep/70 bg-white p-8" noValidate>
        <h1 className="font-display text-3xl font-light">Ορισμός κωδικού</h1>
        <p className="mt-2 text-sm text-muted-paper">Επιλέξτε έναν ισχυρό κωδικό, τουλάχιστον 10 χαρακτήρων.</p>
        <div className="mt-8 flex flex-col gap-5">
          <Field label="Νέος κωδικός">{(p) => <input {...p} type="password" autoComplete="new-password" className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} />}</Field>
          <Field label="Επανάληψη κωδικού">{(p) => <input {...p} type="password" autoComplete="new-password" className={inputCls} value={pw2} onChange={(e) => setPw2(e.target.value)} />}</Field>
        </div>
        {error && <p role="alert" className="mt-5 text-sm text-error">{error}</p>}
        <Button type="submit" variant="primary" busy={busy} className="mt-8 w-full">Αποθήκευση κωδικού</Button>
      </form>
    </Centered>
  )
}

/* ---------------- Shell ---------------- */
const NAV = [
  { to: '/diaxeirisi', label: 'Πίνακας ελέγχου', end: true },
  { to: '/diaxeirisi/arxiki', label: 'Αρχική σελίδα' },
  { to: '/diaxeirisi/erga', label: 'Έργα' },
  { to: '/diaxeirisi/katigories', label: 'Κατηγορίες' },
  { to: '/diaxeirisi/ypiresies', label: 'Υπηρεσίες' },
  { to: '/diaxeirisi/sxetika', label: 'Σελίδα «Σχετικά»' },
  { to: '/diaxeirisi/footer', label: 'Footer' },
  { to: '/diaxeirisi/aitimata', label: 'Αιτήματα προσφοράς' },
  { to: '/diaxeirisi/prosfores', label: 'Προσφορές' },
  { to: '/diaxeirisi/rythmiseis', label: 'Ρυθμίσεις & SEO' },
  { to: '/diaxeirisi/odigos-fotografion', label: 'Οδηγός φωτογραφιών' },
]

function Shell() {
  const { api, session } = useAdmin()
  const [open, setOpen] = useState(false)
  return (
    <div className="lg:grid lg:min-h-svh lg:grid-cols-[16rem_1fr]">
      <a href="#admin-main" className="skip-link">Μετάβαση στο περιεχόμενο</a>
      <aside className="bg-ink text-paper lg:sticky lg:top-0 lg:h-svh">
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/diaxeirisi" className="font-display text-lg tracking-[0.14em]">
            DS <span className="font-sans text-[0.55rem] font-semibold tracking-[0.34em] text-bronze-light">CMS</span>
          </Link>
          <button type="button" className="rounded-md px-3 py-2 text-sm lg:hidden" aria-expanded={open} aria-controls="admin-nav" onClick={() => setOpen((o) => !o)}>
            Μενού
          </button>
        </div>
        <nav id="admin-nav" aria-label="Διαχείριση" className={`${open ? 'block' : 'hidden'} px-3 pb-5 lg:block`}>
          <ul className="flex flex-col gap-0.5">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `block rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-paper/10 text-paper' : 'text-paper/65 hover:bg-paper/5 hover:text-paper'}`}
                >
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-8 border-t border-paper/10 px-3 pt-5 text-xs text-muted-ink">
            <p className="truncate" title={session.email}>{session.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <SiteLink to="/" className="rounded-md border border-paper/20 px-3 py-1.5 text-paper/80 hover:text-paper">Προβολή ιστότοπου ↗</SiteLink>
              <button type="button" onClick={() => api.signOut()} className="rounded-md border border-paper/20 px-3 py-1.5 text-paper/80 hover:text-paper">Αποσύνδεση</button>
            </div>
          </div>
        </nav>
      </aside>
      <main id="admin-main" tabIndex={-1} className="min-w-0 px-4 py-8 outline-none sm:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-6xl">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="arxiki" element={<HomeEditor />} />
            <Route path="erga" element={<ProjectsList />} />
            <Route path="erga/neo" element={<ProjectEditor />} />
            <Route path="erga/:id" element={<ProjectEditor />} />
            <Route path="katigories" element={<Categories />} />
            <Route path="ypiresies" element={<ServicesAdmin />} />
            <Route path="sxetika" element={<AboutEditor />} />
            <Route path="footer" element={<FooterEditor />} />
            <Route path="aitimata" element={<Requests />} />
            <Route path="prosfores" element={<Offers />} />
            <Route path="prosfores/rythmiseis" element={<OfferSettingsPage />} />
            <Route path="prosfores/:id" element={<OfferEditor />} />
            <Route path="rythmiseis" element={<Settings />} />
            <Route path="odigos-fotografion" element={<PhotoGuide />} />
            <Route path="*" element={<p>Η σελίδα δεν βρέθηκε. <Link className="underline" to="/diaxeirisi">Πίνακας ελέγχου</Link></p>} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
