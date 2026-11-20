import { useCallback, useRef, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import { EditorialFigure } from '../components/editorial/EditorialFigure'
import { useEditorialReveals } from '../components/editorial/useEditorialReveals'
import { Picture } from '../components/media/Picture'
import { Lightbox } from '../components/project/Lightbox'
import { PlanDrawing } from '../components/project/PlanDrawing'
import { Eyebrow } from '../components/ui/Eyebrow'
import { ArrowRight } from '../components/ui/icons'
import { PlaceholderBadge } from '../components/ui/PlaceholderBadge'
import type { Project, ProjectCategory } from '../content/types'
import { gsap, MOTION, useGSAP } from '../lib/gsap'
import { introAllowed } from '../lib/prerender'
import { absoluteUrl, useJsonLd, useSeo } from '../lib/seo'
import { fallbackSrc } from '../content/images'

interface DetailData {
  project: Project
  next: Project | null
  categories: ProjectCategory[]
}

/** Gallery rhythm: one wide plate, then an offset pair, repeating. */
const GALLERY_LAYOUT = [
  { cls: 'lg:col-span-12', ratio: '16 / 9', sizes: '100vw' },
  { cls: 'lg:col-span-7', ratio: '4 / 3', sizes: '(min-width: 1024px) 58vw, 100vw' },
  { cls: 'lg:col-span-4 lg:col-start-9 lg:mt-[clamp(5rem,12vw,12rem)]', ratio: '4 / 5', sizes: '(min-width: 1024px) 33vw, 100vw' },
]

export function ProjectDetailPage() {
  const { project, next, categories } = useLoaderData() as DetailData
  const category = categories.find((c) => c.id === project.categoryId)
  const ogImage = fallbackSrc(project.cover.src)
  useSeo({ title: project.title, description: project.summary, image: ogImage, type: 'article' })
  useJsonLd('project', {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.summary,
    image: absoluteUrl(ogImage),
    url: absoluteUrl(`/erga/${project.slug}`),
    inLanguage: 'el',
    ...(category ? { genre: category.label } : {}),
    ...(project.year ? { dateCreated: String(project.year) } : {}),
    ...(project.location ? { locationCreated: project.location } : {}),
    creator: { '@type': 'Organization', name: 'ATELIER STUDIO', url: absoluteUrl('/') },
  })
  useJsonLd('breadcrumbs', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Έργα', item: absoluteUrl('/erga') },
      ...(category ? [{ '@type': 'ListItem', position: 2, name: category.label, item: absoluteUrl(`/erga?katigoria=${category.slug}`) }] : []),
      { '@type': 'ListItem', position: category ? 3 : 2, name: project.title, item: absoluteUrl(`/erga/${project.slug}`) },
    ],
  })

  const root = useRef<HTMLDivElement>(null)
  useEditorialReveals(root)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const onLightbox = useCallback((i: number | null) => setLightbox(i), [])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (!introAllowed()) return
        gsap.fromTo('[data-detail-reveal]', { clipPath: 'inset(10% 8% 10% 8%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
        gsap.fromTo('[data-detail-zoom]', { scale: 1.2 }, { scale: 1, duration: 2.2, ease: 'expo.out' })
        gsap.fromTo('[data-detail-fade]', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, delay: 0.7 })
      })
      mm.add(MOTION.desktop, () => {
        gsap.to('[data-detail-parallax]', {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: { trigger: '[data-detail-hero]', start: 'top top', end: 'bottom top', scrub: true },
        })
      })
      mm.add(MOTION.desktop, () => {
        gsap.fromTo(
          '[data-next-image]',
          { clipPath: 'inset(18% 30% 18% 30%)', scale: 1.15 },
          { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, ease: 'none', scrollTrigger: { trigger: '[data-next]', start: 'top bottom', end: 'top 15%', scrub: 1 } },
        )
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  const facts: [string, string | null][] = [
    ['Κατηγορία', category?.label ?? null],
    ['Τοποθεσία', project.location ?? null],
    ['Έτος', project.year ? String(project.year) : null],
    ['Επιφάνεια', project.areaSqm ? `${project.areaSqm} τ.μ.` : null],
  ]

  return (
    <div ref={root}>
      {/* Hero */}
      <section data-detail-hero aria-labelledby="project-title" className="relative h-[92svh] min-h-[34rem] overflow-hidden bg-ink text-paper">
        <div data-detail-reveal className="absolute inset-0">
          <div data-detail-parallax className="absolute inset-0">
            <div data-detail-zoom className="media-frame absolute inset-0">
              <Picture image={project.cover} sizes="100vw" priority />
            </div>
          </div>
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(25_25_25/0.5)_0%,transparent_35%,rgb(25_25_25/0.2)_60%,rgb(25_25_25/0.85)_100%)]" />
        </div>
        <div className="page-x relative z-10 mx-auto flex h-full max-w-[var(--container-page)] flex-col justify-end pb-[clamp(2.5rem,7vh,5rem)]">
          <nav aria-label="Διαδρομή" data-detail-fade className="mb-8">
            <ol className="eyebrow flex flex-wrap items-center gap-3 text-stone">
              <li><Link to="/erga" className="link-draw inline-block py-2">Έργα</Link></li>
              <li aria-hidden="true">/</li>
              <li>{category && <Link to={`/erga?katigoria=${category.slug}`} className="link-draw inline-block py-2">{category.label}</Link>}</li>
            </ol>
          </nav>
          <h1 id="project-title" data-detail-fade className="max-w-5xl text-hero font-light">{project.title}</h1>
          <div data-detail-fade className="mt-8 flex flex-wrap items-center gap-5">
            {project.isPlaceholder && <PlaceholderBadge label="Ενδεικτικό έργο" />}
            <span className="text-sm text-stone">Οι φωτογραφίες είναι ενδεικτικές.</span>
          </div>
        </div>
      </section>

      {/* Facts + statement */}
      <section aria-label="Στοιχεία έργου" className="bg-paper text-ink">
        <div className="page-x mx-auto max-w-[var(--container-page)] pt-[clamp(4rem,9vw,8rem)]">
          <dl className="grid grid-cols-2 border-t border-stone-deep md:grid-cols-4">
            {facts.map(([label, value]) => (
              <div key={label} className="border-b border-stone-deep py-6 pr-6 md:border-b-0">
                <dt className="eyebrow text-bronze-ink">{label}</dt>
                <dd className={`mt-3 font-display text-2xl ${value ? '' : 'text-muted-paper italic'}`}>{value ?? 'Προς συμπλήρωση'}</dd>
              </div>
            ))}
          </dl>

          <div className="grid-12 mt-[clamp(4rem,9vw,8rem)] gap-y-12">
            <p data-reveal-text className="col-span-4 font-display text-[clamp(1.9rem,3.6vw,3.5rem)] font-light leading-[1.18] tracking-[-0.015em] lg:col-span-10 lg:col-start-2">
              {project.summary}
            </p>
          </div>

          <div className="grid-12 mt-[clamp(4rem,9vw,8rem)] gap-y-8 pb-[clamp(5rem,10vw,9rem)]">
            <div className="col-span-4 lg:col-span-4">
              <Eyebrow className="text-bronze-ink">Το έργο</Eyebrow>
              {project.isPlaceholder && (
                <div className="mt-5">
                  <PlaceholderBadge tone="light" label="Προσωρινό κείμενο" />
                </div>
              )}
            </div>
            <div className="col-span-4 space-y-6 lg:col-span-6 lg:col-start-7">
              {project.description.map((para, i) => (
                <p key={i} data-reveal-text className={i === 0 ? 'text-lead' : 'text-muted-paper'}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {project.gallery.length > 0 && (
        <section aria-labelledby="gallery-title" className="bg-paper text-ink">
          <div className="page-x mx-auto max-w-[var(--container-page)] pb-section">
            <div className="mb-12 flex items-end justify-between gap-6 border-b border-stone-deep pb-6">
              <h2 id="gallery-title" className="text-h3">Φωτογραφίες</h2>
              <p className="text-sm text-muted-paper">Επιλέξτε μια φωτογραφία για μεγέθυνση.</p>
            </div>
            <div className="grid-12 gap-y-[clamp(3rem,7vw,6rem)]">
              {project.gallery.map((image, i) => {
                const l = GALLERY_LAYOUT[i % GALLERY_LAYOUT.length]
                return (
                  <EditorialFigure
                    key={`${image.src}-${i}`}
                    className={`col-span-4 ${l.cls}`}
                    image={image}
                    sizes={l.sizes}
                    ratio={l.ratio}
                    tilt={7}
                    shift={i % 2 ? -5 : 5}
                    onOpen={() => setLightbox(i)}
                    caption={
                      <>
                        <span>{String(i + 1).padStart(2, '0')} / {String(project.gallery.length).padStart(2, '0')}</span>
                        <span className="eyebrow">Ενδεικτική φωτογραφία</span>
                      </>
                    }
                  />
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Drawings */}
      {project.drawings.length > 0 && (
        <section aria-labelledby="drawings-title" className="bg-stone text-ink">
          <div className="page-x mx-auto max-w-[var(--container-page)] py-section">
            <div className="grid-12 gap-y-10">
              <div className="col-span-4 lg:col-span-3">
                <Eyebrow className="text-bronze-ink">Σχέδια</Eyebrow>
                <h2 id="drawings-title" className="mt-6 text-h3">Κάτοψη</h2>
                <p className="mt-5 text-muted-paper">Σχηματικό, ενδεικτικό σχέδιο. Οι πραγματικές κατόψεις, τομές και τα renders θα προστεθούν από το CMS.</p>
                <div className="mt-6"><PlaceholderBadge tone="light" label="Ενδεικτικό σχέδιο" /></div>
              </div>
              <figure data-reveal-text className="col-span-4 border border-stone-deep bg-paper p-[clamp(1rem,3vw,3rem)] text-ink lg:col-span-8 lg:col-start-5">
                {project.drawings.map((d, i) =>
                  d.src.startsWith('plan:') ? (
                    <PlanDrawing key={i} seed={project.slug} className="h-auto w-full" />
                  ) : (
                    <Picture key={i} image={d} sizes="(min-width: 1024px) 60vw, 100vw" blur={false} imgClassName="h-auto w-full" />
                  ),
                )}
                <figcaption className="mt-4 flex justify-between text-sm text-muted-paper">
                  <span>Κάτοψη ισογείου</span>
                  <span className="eyebrow">Χωρίς κλίμακα</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>
      )}

      {/* Next project */}
      {next && (
        <section data-next aria-label="Επόμενο έργο" className="bg-ink text-paper">
          <Link to={`/erga/${next.slug}`} className="group block">
            <div className="page-x mx-auto max-w-[var(--container-page)] pt-[clamp(5rem,10vw,9rem)]">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="eyebrow text-bronze-light">Επόμενο έργο</p>
                  <p className="mt-6 font-display text-display font-light transition-[font-style] group-hover:italic">{next.title}</p>
                </div>
                <span className="btn btn-ghost-light pointer-events-none">
                  Συνέχεια <ArrowRight />
                </span>
              </div>
            </div>
            <div className="mt-[clamp(3rem,6vw,5rem)] overflow-hidden">
              <div data-next-image className="media-frame aspect-[21/9] w-full">
                <Picture image={next.cover} sizes="100vw" imgClassName="transition-transform duration-[1600ms] ease-[var(--ease-expo)] group-hover:scale-[1.03]" />
              </div>
            </div>
          </Link>
          <div className="page-x mx-auto flex max-w-[var(--container-page)] justify-center py-12">
            <Link to="/erga" className="link-draw eyebrow inline-flex min-h-11 items-center text-stone hover:text-paper">Όλα τα έργα</Link>
          </div>
        </section>
      )}

      <Lightbox images={project.gallery} index={lightbox} onChange={onLightbox} title={project.title} />
    </div>
  )
}
