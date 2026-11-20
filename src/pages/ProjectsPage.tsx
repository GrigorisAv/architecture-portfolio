import { useMemo, useRef } from 'react'
import { useLoaderData, useSearchParams } from 'react-router-dom'
import { PageIntro } from '../components/editorial/PageIntro'
import { useEditorialReveals } from '../components/editorial/useEditorialReveals'
import { ProjectCard } from '../components/project/ProjectCard'
import type { Project, ProjectCategory } from '../content/types'
import { gsap, prefersReducedMotion, useGSAP } from '../lib/gsap'
import { introAllowed } from '../lib/prerender'
import { useSeo } from '../lib/seo'
import { ContactCta } from '../sections/home/ContactCta'

interface ProjectsData {
  projects: Project[]
  categories: ProjectCategory[]
}

/** Asymmetric 12-col rhythm, repeating every 4 cards. Mobile: one column. */
const LAYOUT = [
  { cls: 'lg:col-span-7', ratio: '4 / 3', sizes: '(min-width: 1024px) 55vw, 100vw' },
  { cls: 'lg:col-span-4 lg:col-start-9 lg:mt-[clamp(6rem,14vw,14rem)]', ratio: '4 / 5', sizes: '(min-width: 1024px) 32vw, 100vw' },
  { cls: 'lg:col-span-5 lg:col-start-2', ratio: '4 / 5', sizes: '(min-width: 1024px) 40vw, 100vw' },
  { cls: 'lg:col-span-6 lg:col-start-7 lg:mt-[clamp(4rem,9vw,9rem)]', ratio: '3 / 2', sizes: '(min-width: 1024px) 48vw, 100vw' },
]

const PARAM = 'katigoria'

export function ProjectsPage() {
  const { projects, categories } = useLoaderData() as ProjectsData
  const [params, setParams] = useSearchParams()
  const barRef = useRef<HTMLDivElement>(null)
  const active = categories.find((c) => c.slug === params.get(PARAM)) ?? null

  useSeo({
    title: active ? `Έργα: ${active.label}` : 'Έργα',
    description: 'Επιλεγμένα έργα αρχιτεκτονικής και εσωτερικού σχεδιασμού: κατοικίες, εσωτερικοί χώροι, ανακαινίσεις και επαγγελματικοί χώροι.',
  })

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    projects.forEach((p) => map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1))
    return map
  }, [projects])

  const visible = active ? projects.filter((p) => p.categoryId === active.id) : projects
  const labelFor = (id: string) => categories.find((c) => c.id === id)?.label ?? ''

  const select = (slug: string | null) => {
    const next = new URLSearchParams(params)
    if (slug) next.set(PARAM, slug)
    else next.delete(PARAM)
    setParams(next, { replace: true, preventScrollReset: true })
    // If the list has scrolled away (a shorter result would leave the reader at the footer), bring it back.
    requestAnimationFrame(() => {
      const bar = barRef.current
      if (!bar) return
      const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const top = bar.parentElement!.getBoundingClientRect().top + window.scrollY - offset
      if (window.scrollY > top + 8) window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    })
  }

  const filters = [{ slug: null as string | null, label: 'Όλα', count: projects.length }, ...categories.map((c) => ({ slug: c.slug, label: c.label, count: counts.get(c.id) ?? 0 }))]

  return (
    <>
      <PageIntro
        eyebrow="Έργα"
        title={
          <>
            Ένα ευρετήριο <em className="italic">χώρων</em>.
          </>
        }
        intro="Κατοικίες, εσωτερικοί χώροι, ανακαινίσεις και επαγγελματικοί χώροι. Κάθε έργο ξεκινά από τον τόπο, το φως και τους ανθρώπους του."
        aside={<p className="text-sm text-muted-paper">Όλα τα έργα που εμφανίζονται είναι ενδεικτικά και θα αντικατασταθούν από πραγματικά.</p>}
      />

      <section aria-labelledby="erga-list-title" className="bg-paper pb-section">
        <div className="page-x mx-auto max-w-[var(--container-page)]">
          <h2 id="erga-list-title" className="visually-hidden">Λίστα έργων</h2>

          <div ref={barRef} className="z-20 -mx-2 mb-[clamp(3rem,7vw,6rem)] scroll-mt-[calc(var(--header-h)+0.5rem)] border-y border-stone-deep bg-paper/92 px-2 py-4 backdrop-blur-md lg:sticky lg:top-[calc(var(--header-h)+0.5rem)]">
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
              <div role="group" aria-label="Φίλτρο κατηγορίας" className="flex flex-wrap gap-2">
                {filters.map((f) => {
                  const pressed = (f.slug ?? null) === (active?.slug ?? null)
                  return (
                    <button
                      key={f.label}
                      type="button"
                      aria-pressed={pressed}
                      disabled={f.count === 0}
                      onClick={() => select(f.slug)}
                      className={[
                        'inline-flex min-h-11 items-center gap-2 border px-4 text-sm font-medium tracking-[0.02em] transition-colors duration-300',
                        pressed ? 'border-ink bg-ink text-paper' : 'border-stone-deep text-ink hover:border-ink',
                        'disabled:cursor-not-allowed disabled:opacity-40',
                      ].join(' ')}
                    >
                      {f.label}
                      <span className={`text-xs tabular-nums ${pressed ? 'text-stone' : 'text-muted-paper'}`}>{f.count}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-sm text-muted-paper" aria-live="polite">
                {visible.length === 1 ? 'Εμφανίζεται 1 έργο' : `Εμφανίζονται ${visible.length} έργα`}
                {active ? ` στην κατηγορία «${active.label}»` : ''}
              </p>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-start gap-6 border border-stone-deep p-10">
              <p className="font-display text-h3">Δεν υπάρχουν ακόμη έργα σε αυτή την κατηγορία.</p>
              <button type="button" onClick={() => select(null)} className="btn btn-ghost-dark">Προβολή όλων των έργων</button>
            </div>
          ) : (
            <ProjectGrid key={active?.slug ?? 'all'} projects={visible} labelFor={labelFor} />
          )}
        </div>
      </section>

      <ContactCta />
    </>
  )
}

function ProjectGrid({ projects, labelFor }: { projects: Project[]; labelFor: (id: string) => string }) {
  const root = useRef<HTMLDivElement>(null)
  useEditorialReveals(root)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (!introAllowed()) return
        gsap.fromTo(root.current, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out' })
      })
      return () => mm.revert()
    },
    { scope: root },
  )
  return (
    <div ref={root} className="grid-12 gap-y-[clamp(4rem,9vw,8rem)]">
      {projects.map((p, i) => {
        const l = LAYOUT[i % LAYOUT.length]
        return (
          <div key={p.id} className={`col-span-4 ${l.cls}`}>
            <ProjectCard project={p} index={i} categoryLabel={labelFor(p.categoryId)} ratio={l.ratio} sizes={l.sizes} />
          </div>
        )
      })}
    </div>
  )
}
