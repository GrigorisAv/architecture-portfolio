import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FieldShell, TextArea, TextInput } from '../components/form/fields'
import { describedBy } from '../components/form/fieldUtils'
import { PageIntro } from '../components/editorial/PageIntro'
import { ArrowRight } from '../components/ui/icons'
import { quoteRequests } from '../content/repository'
import type { QuoteRequest, QuoteSubmitResult } from '../content/types'
import {
  DESCRIPTION_MAX,
  emptyQuote,
  FIELD_ORDER,
  PROJECT_TYPES,
  validateAll,
  validateField,
  type QuoteErrors,
  type QuoteField,
} from '../lib/quoteValidation'
import { CMS_MODE } from '../lib/env'
import { useSeo } from '../lib/seo'

const LABELS: Record<QuoteField, string> = {
  fullName: 'Ονοματεπώνυμο',
  email: 'Email',
  phone: 'Τηλέφωνο',
  projectType: 'Είδος έργου',
  area: 'Περιοχή',
  sizeSqm: 'Τετραγωνικά μέτρα',
  description: 'Περιγραφή',
  privacyConsent: 'Πολιτική Απορρήτου',
}

const FIELD_ID: Record<QuoteField, string> = {
  fullName: 'q-fullname',
  email: 'q-email',
  phone: 'q-phone',
  projectType: 'q-type-0',
  area: 'q-area',
  sizeSqm: 'q-sqm',
  description: 'q-description',
  privacyConsent: 'q-privacy',
}

type Phase = 'idle' | 'submitting' | 'done'

export function QuotePage() {
  useSeo({
    title: 'Αίτημα Προσφοράς',
    description: 'Περιγράψτε το έργο σας (νέα κατοικία, ανακαίνιση, εσωτερικός ή επαγγελματικός χώρος) και ζητήστε προσφορά από το DS Architect.',
  })

  const [values, setValues] = useState<QuoteRequest>(emptyQuote)
  const [errors, setErrors] = useState<QuoteErrors>({})
  const [touched, setTouched] = useState<Partial<Record<QuoteField, boolean>>>({})
  const [summary, setSummary] = useState<QuoteField[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<QuoteSubmitResult | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const summaryRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const update = <K extends QuoteField>(field: K, value: QuoteRequest[K]) => {
    const next = { ...values, [field]: value }
    setValues(next)
    setResult(null)
    // Once a field has been visited, re-validate it as the user corrects it.
    if (touched[field]) setErrors((e) => ({ ...e, [field]: validateField(field, next) }))
  }

  const blur = (field: QuoteField) => {
    setTouched((t) => ({ ...t, [field]: true }))
    setErrors((e) => ({ ...e, [field]: validateField(field, values) }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (phase === 'submitting') return
    const all = validateAll(values)
    setErrors(all)
    setTouched(Object.fromEntries(FIELD_ORDER.map((f) => [f, true])))
    const invalid = FIELD_ORDER.filter((f) => all[f])
    setSummary(invalid)
    if (invalid.length) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setPhase('submitting')
    try {
      const res = await quoteRequests.submit(values, { honeypot })
      setResult(res)
      if (res.status === 'sent') {
        setValues(emptyQuote)
        setTouched({})
        setErrors({})
        setSummary([])
      } else if (res.status === 'error' && res.field && res.field in LABELS) {
        const f = res.field as QuoteField
        setErrors((x) => ({ ...x, [f]: 'Ο server δεν δέχτηκε αυτό το πεδίο. Ελέγξτε την τιμή του.' }))
        setTouched((x) => ({ ...x, [f]: true }))
      }
    } catch {
      setResult({ status: 'error', message: 'Δεν ήταν δυνατή η αποστολή. Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.' })
    }
    setPhase('done')
    requestAnimationFrame(() => resultRef.current?.focus())
  }

  const err = (f: QuoteField) => (touched[f] ? errors[f] : undefined)
  const descLength = values.description.trim().length

  return (
    <>
      <PageIntro
        eyebrow="Αίτημα Προσφοράς"
        title={
          <>
            Ας μιλήσουμε για τον <em className="italic">χώρο</em> σας.
          </>
        }
        intro="Πείτε μας λίγα λόγια για το έργο. Θα επικοινωνήσουμε μαζί σας για μια πρώτη, χωρίς δέσμευση, συζήτηση."
      />

      <section aria-label="Φόρμα αιτήματος προσφοράς" className="bg-paper pb-section text-ink">
        <div className="page-x mx-auto max-w-[var(--container-page)]">
          <div className="grid-12 gap-y-16 border-t border-stone-deep pt-[clamp(3rem,6vw,5rem)]">
            {/* Context column */}
            <aside className="col-span-4 lg:col-span-4">
              <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
                <h2 className="eyebrow text-bronze-ink">Τι ακολουθεί</h2>
                <ol className="mt-6 space-y-6">
                  {[
                    ['Ανάγνωση', 'Διαβάζουμε προσεκτικά την περιγραφή σας.'],
                    ['Επικοινωνία', 'Σας καλούμε για να συζητήσουμε ανάγκες και χρονοδιάγραμμα.'],
                    ['Πρόταση', 'Λαμβάνετε μια σαφή πρόταση συνεργασίας και κόστους.'],
                  ].map(([t, d], i) => (
                    <li key={t} className="grid grid-cols-[2.5rem_1fr] gap-x-3">
                      <span className="font-display text-xl italic text-bronze-ink">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="font-display text-xl">{t}</p>
                        <p className="mt-1 text-muted-paper">{d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                {CMS_MODE !== 'supabase' && (
                  <div className="mt-10 border-l-2 border-bronze pl-5">
                    <p className="text-sm font-semibold">Σημείωση για τη δοκιμαστική έκδοση</p>
                    <p className="mt-2 text-sm text-muted-paper">
                      {CMS_MODE === 'demo'
                        ? 'Λειτουργία επίδειξης: τα αιτήματα δεν αποστέλλονται. Κρατούνται μόνο σε αυτόν τον browser, για να εμφανίζονται στη διαχείριση επίδειξης.'
                        : 'Η φόρμα ελέγχει τα στοιχεία κανονικά, αλλά η αποστολή αιτημάτων δεν έχει ενεργοποιηθεί ακόμη. Τίποτα δεν αποστέλλεται ούτε αποθηκεύεται.'}
                    </p>
                  </div>
                )}
              </div>
            </aside>

            {/* Form */}
            <form noValidate onSubmit={onSubmit} className="col-span-4 lg:col-span-7 lg:col-start-6" aria-describedby="q-required-note">
              <p id="q-required-note" className="mb-10 text-sm text-muted-paper">
                Τα πεδία με <span className="text-bronze-ink">*</span> είναι υποχρεωτικά.
              </p>

              {summary.length > 0 && (
                <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="q-summary-title" className="mb-12 border border-error/60 bg-white p-6 outline-none focus-visible:outline-2 focus-visible:outline-error">
                  <h2 id="q-summary-title" className="font-display text-2xl text-error">
                    {summary.length === 1 ? 'Ελέγξτε 1 πεδίο' : `Ελέγξτε ${summary.length} πεδία`}
                  </h2>
                  <ul className="mt-4 space-y-2">
                    {summary.map((f) => (
                      <li key={f}>
                        <a
                          href={`#${FIELD_ID[f]}`}
                          onClick={(e) => {
                            e.preventDefault()
                            const el = document.getElementById(FIELD_ID[f])
                            el?.focus()
                            el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
                          }}
                          className="text-error underline underline-offset-4"
                        >
                          {LABELS[f]}: {errors[f]}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Honeypot: invisible to people, tempting to bots. Server ignores submissions that fill it. */}
              <div className="visually-hidden" aria-hidden="true">
                <label htmlFor="q-website">Ιστότοπος</label>
                <input id="q-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </div>

              <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
                <FieldShell id="q-fullname" label="Ονοματεπώνυμο" required error={err('fullName')}>
                  <TextInput
                    id="q-fullname" name="fullName" autoComplete="name" required
                    value={values.fullName} invalid={!!err('fullName')}
                    aria-describedby={describedBy('q-fullname', null, err('fullName'))}
                    onChange={(e) => update('fullName', e.target.value)} onBlur={() => blur('fullName')}
                  />
                </FieldShell>
                <FieldShell id="q-email" label="Email" required error={err('email')}>
                  <TextInput
                    id="q-email" name="email" type="email" autoComplete="email" inputMode="email" required
                    value={values.email} invalid={!!err('email')}
                    aria-describedby={describedBy('q-email', null, err('email'))}
                    onChange={(e) => update('email', e.target.value)} onBlur={() => blur('email')}
                  />
                </FieldShell>
                <FieldShell id="q-phone" label="Τηλέφωνο" required error={err('phone')}>
                  <TextInput
                    id="q-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required
                    value={values.phone} invalid={!!err('phone')}
                    aria-describedby={describedBy('q-phone', null, err('phone'))}
                    onChange={(e) => update('phone', e.target.value)} onBlur={() => blur('phone')}
                  />
                </FieldShell>
                <FieldShell id="q-area" label="Περιοχή" required hint="Πόλη ή περιοχή του έργου" error={err('area')}>
                  <TextInput
                    id="q-area" name="area" autoComplete="address-level2" required
                    value={values.area} invalid={!!err('area')}
                    aria-describedby={describedBy('q-area', true, err('area'))}
                    onChange={(e) => update('area', e.target.value)} onBlur={() => blur('area')}
                  />
                </FieldShell>
              </div>

              <fieldset className="mt-6" aria-describedby={err('projectType') ? 'q-type-error' : undefined}>
                <legend className="text-sm font-semibold tracking-[0.02em]">
                  Είδος έργου<span className="ml-1 text-bronze-ink" aria-hidden="true">*</span>
                  <span className="visually-hidden"> (υποχρεωτικό)</span>
                </legend>
                <div className="mt-4 flex flex-wrap gap-2" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) blur('projectType') }}>
                  {PROJECT_TYPES.map((t, i) => {
                    const checked = values.projectType === t.value
                    return (
                      <label
                        key={t.value}
                        className={[
                          'relative inline-flex min-h-11 cursor-pointer items-center border px-4 text-sm font-medium transition-colors duration-300',
                          'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink',
                          checked ? 'border-ink bg-ink text-paper' : err('projectType') ? 'border-error' : 'border-stone-deep hover:border-ink',
                        ].join(' ')}
                      >
                        <input
                          id={`q-type-${i}`} type="radio" name="projectType" value={t.value} checked={checked}
                          className="absolute opacity-0"
                          onChange={() => {
                            update('projectType', t.value)
                            setTouched((x) => ({ ...x, projectType: true }))
                            setErrors((x) => ({ ...x, projectType: undefined }))
                          }}
                        />
                        {t.label}
                      </label>
                    )
                  })}
                </div>
                <p id="q-type-error" className={`mt-2 min-h-[1.25rem] text-sm font-medium text-error ${err('projectType') ? '' : 'invisible'}`} aria-live="polite">
                  {err('projectType') && <><span aria-hidden="true">— </span>{err('projectType')}</>}
                </p>
              </fieldset>

              <div className="mt-6 grid gap-x-10 md:grid-cols-2">
                <FieldShell id="q-sqm" label="Τετραγωνικά μέτρα" hint="Κατά προσέγγιση, αν το γνωρίζετε" error={err('sizeSqm')}>
                  <TextInput
                    id="q-sqm" name="sizeSqm" inputMode="decimal"
                    value={values.sizeSqm} invalid={!!err('sizeSqm')}
                    aria-describedby={describedBy('q-sqm', true, err('sizeSqm'))}
                    onChange={(e) => update('sizeSqm', e.target.value)} onBlur={() => blur('sizeSqm')}
                  />
                </FieldShell>
              </div>

              <div className="mt-6">
                <FieldShell
                  id="q-description" label="Περιγραφή" required error={err('description')}
                  hint="Τι θέλετε να σχεδιάσουμε; Π.χ. τον χώρο, τις ανάγκες σας, το χρονοδιάγραμμα και τον προϋπολογισμό."
                  counter={<span className={`text-xs tabular-nums ${descLength > DESCRIPTION_MAX ? 'text-error' : 'text-muted-paper'}`}>{descLength} / {DESCRIPTION_MAX}</span>}
                >
                  <TextArea
                    id="q-description" name="description" rows={6} required
                    value={values.description} invalid={!!err('description')}
                    aria-describedby={describedBy('q-description', true, err('description'))}
                    onChange={(e) => update('description', e.target.value)} onBlur={() => blur('description')}
                  />
                </FieldShell>
              </div>

              <div className="mt-6">
                <label htmlFor="q-privacy" className="flex cursor-pointer items-start gap-4">
                  <input
                    id="q-privacy" type="checkbox" name="privacyConsent"
                    checked={values.privacyConsent}
                    aria-invalid={!!err('privacyConsent') || undefined}
                    aria-describedby={['q-privacy-text', err('privacyConsent') ? 'q-privacy-error' : null].filter(Boolean).join(' ')}
                    onChange={(e) => {
                      update('privacyConsent', e.target.checked)
                      setTouched((x) => ({ ...x, privacyConsent: true }))
                      setErrors((x) => ({ ...x, privacyConsent: validateField('privacyConsent', { ...values, privacyConsent: e.target.checked }) }))
                    }}
                    className="mt-1 h-5 w-5 shrink-0 accent-ink"
                  />
                  <span id="q-privacy-text" className="text-sm leading-relaxed text-muted-paper">
                    <span className="font-semibold text-ink">Αποδέχομαι την επεξεργασία των στοιχείων μου</span>
                    <span className="text-bronze-ink" aria-hidden="true"> *</span> αποκλειστικά για την απάντηση σε αυτό το αίτημα, σύμφωνα με την{' '}
                    <Link to="/politiki-aporritou" className="inline-block py-1 text-ink underline underline-offset-4">Πολιτική Απορρήτου</Link>.
                  </span>
                </label>
                <p id="q-privacy-error" className={`mt-2 min-h-[1.25rem] text-sm font-medium text-error ${err('privacyConsent') ? '' : 'invisible'}`} aria-live="polite">
                  {err('privacyConsent') && <><span aria-hidden="true">— </span>{err('privacyConsent')}</>}
                </p>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-stone-deep pt-8">
                <button type="submit" className="btn btn-primary min-w-60 disabled:cursor-wait disabled:opacity-70" disabled={phase === 'submitting'} aria-busy={phase === 'submitting'}>
                  {phase === 'submitting' ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border border-ink border-t-transparent" aria-hidden="true" />
                      {CMS_MODE === 'supabase' ? 'Αποστολή…' : 'Έλεγχος…'}
                    </>
                  ) : (
                    <>Αποστολή αιτήματος <ArrowRight /></>
                  )}
                </button>
                <p className="text-sm text-muted-paper">Απαντάμε συνήθως μέσα σε λίγες εργάσιμες ημέρες.</p>
              </div>

              <div ref={resultRef} tabIndex={-1} role="status" className="mt-8 outline-none">
                {result?.status === 'not-configured' && (
                  <div className="border border-bronze bg-white p-6">
                    <p className="font-display text-2xl">Τα στοιχεία είναι σωστά, αλλά το αίτημα δεν στάλθηκε.</p>
                    <p className="mt-3 text-muted-paper">
                      Η αποστολή αιτημάτων θα ενεργοποιηθεί μαζί με το σύστημα διαχείρισης. Μέχρι τότε τίποτα δεν αποστέλλεται ή αποθηκεύεται, και τα στοιχεία σας παραμένουν μόνο σε αυτή τη σελίδα.
                    </p>
                  </div>
                )}
                {result?.status === 'demo-stored' && (
                  <div className="border border-bronze bg-white p-6">
                    <p className="font-display text-2xl">Λειτουργία επίδειξης: το αίτημα δεν στάλθηκε.</p>
                    <p className="mt-3 text-muted-paper">
                      Αποθηκεύτηκε μόνο σε αυτόν τον browser και εμφανίζεται στη διαχείριση επίδειξης («Αιτήματα»). Κανείς άλλος δεν μπορεί να το δει.
                    </p>
                  </div>
                )}
                {result?.status === 'sent' && (
                  <div className="border border-ink bg-white p-6">
                    <p className="font-display text-2xl">Ευχαριστούμε, το αίτημά σας στάλθηκε.</p>
                    <p className="mt-3 text-muted-paper">Θα επικοινωνήσουμε μαζί σας σύντομα.</p>
                  </div>
                )}
                {result?.status === 'error' && (
                  <div className="border border-error bg-white p-6">
                    <p className="font-display text-2xl text-error">Η αποστολή απέτυχε.</p>
                    <p className="mt-3 text-muted-paper">{result.message}</p>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
