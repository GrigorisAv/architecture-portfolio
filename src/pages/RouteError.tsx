import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { useSeo } from '../lib/seo'

export function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  const title = notFound ? 'Η σελίδα δεν βρέθηκε' : 'Κάτι δεν πήγε καλά'
  useSeo({ title })
  return (
    <section className="page-x flex min-h-svh flex-col justify-center bg-ink pt-32 pb-20 text-paper">
      <p className="eyebrow text-bronze-light">{notFound ? 'Σφάλμα 404' : 'Σφάλμα'}</p>
      <h1 className="mt-6 max-w-4xl text-display">{title}</h1>
      <p className="mt-6 max-w-xl text-lead text-stone">
        {notFound
          ? 'Ο χώρος που αναζητάτε δεν υπάρχει ή έχει μετακινηθεί.'
          : 'Παρουσιάστηκε ένα απρόσμενο σφάλμα. Παρακαλούμε δοκιμάστε ξανά σε λίγο.'}
      </p>
      <Link to="/" className="btn btn-ghost-light mt-10 self-start">Επιστροφή στην αρχική</Link>
    </section>
  )
}
