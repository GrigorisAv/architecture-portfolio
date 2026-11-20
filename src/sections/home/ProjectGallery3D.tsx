import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Picture } from '../../components/media/Picture'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { ArrowRight } from '../../components/ui/icons'
import { PlaceholderBadge } from '../../components/ui/PlaceholderBadge'
import { tintFor } from '../../content/images'
import type { Project, ProjectCategory } from '../../content/types'
import { gsap, MOTION, ScrollTrigger, useGSAP } from '../../lib/gsap'

interface Props {
  projects: Project[]
  categories: Pick<ProjectCategory, 'id' | 'label'>[]
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * B. Signature 3D project gallery: the ONLY pinned section on the page.
 *
 * Per project, all linked to the real scroll position (scrub):
 *  1. appears rotated on Y, deep in Z
 *  2. approaches the viewer (translateZ → 0)
 *  3. perspective straightens (rotateY/rotateX → 0)
 *  4. recedes away (Z back, rotate the other way, fade)
 *  5. the next photo arrives from a different depth & side
 *  6. the title/meta block swaps in sync
 *  7. the stage background shifts to the photo's tint
 *
 * Without the `.is-3d` class (mobile, reduced motion, no JS) it is a normal, fully accessible list.
 */
export function ProjectGallery3D({ projects, categories }: Props) {
  const root = useRef<HTMLElement>(null)
  const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? ''
  const tints = projects.map((p) => tintFor(p.cover))

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      const section = root.current!

      mm.add(MOTION.desktop, () => {
        section.classList.add('is-3d')
        const q = gsap.utils.selector(section)
        const items = q('[data-g-item]') as HTMLElement[]
        const frames = q('[data-g-frame]') as HTMLElement[]
        const images = q('[data-g-image]') as HTMLElement[]
        const metas = q('[data-g-meta]') as HTMLElement[]
        const bg = q('[data-g-bg]')[0]
        const counter = q('[data-g-counter]')[0]
        const progress = q('[data-g-progress]')[0]
        const n = items.length
        const side = (i: number) => (i % 2 === 0 ? 1 : -1) // alternate entry side
        const depth = (i: number) => (i % 2 === 0 ? -1500 : -1050) // alternate depth level

        // Initial 3D state (x/y reset explicitly: StrictMode re-inits must not inherit a parsed matrix)
        gsap.set(frames, { x: 0, y: 0, transformPerspective: 1400, transformOrigin: '50% 50%', force3D: true })
        frames.forEach((f, i) =>
          gsap.set(f, { z: depth(i), rotationY: -24 * side(i), rotationX: 6, xPercent: 16 * side(i), autoAlpha: i === 0 ? 1 : 0 }),
        )
        gsap.set(images, { scale: 1.18 })
        gsap.set(metas, { x: 0, y: 0, autoAlpha: 0, yPercent: 30 })
        gsap.set(bg, { backgroundColor: tints[0] })

        // Pre-pin: the first photo drifts closer while the section scrolls into view.
        gsap.fromTo(
          frames[0],
          { z: -1700, rotationY: -26, rotationX: 6, xPercent: 16, autoAlpha: 0.2 },
          {
            z: -620,
            rotationY: -16,
            rotationX: 4,
            xPercent: 8,
            autoAlpha: 1,
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: 1 },
          },
        )
        gsap.fromTo(metas[0], { autoAlpha: 0, yPercent: 30 }, {
          autoAlpha: 1, yPercent: 0, ease: 'none',
          scrollTrigger: { trigger: section, start: 'top 45%', end: 'top 5%', scrub: 1 },
        })

        let active = 0
        const setActive = (i: number) => {
          if (i === active) return
          active = i
          items.forEach((el, k) => el.toggleAttribute('data-active', k === i))
          if (counter) counter.textContent = pad(i + 1)
        }
        items[0].setAttribute('data-active', '')

        // Segment i spans [i, i+1]:
        //   i+0.05 → i+0.55  approach + straighten      i+0.62 → i+1.02  recede (faded by i+0.86)
        //   i+0.83 → i+1.05  next photo arrives          i+0.88 → i+1.08  next title arrives
        const ENTER = 0.83
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          onUpdate: () => setActive(Math.min(n - 1, Math.max(0, Math.floor(tl.time() + (1 - ENTER))))),
          scrollTrigger: {
            trigger: section,
            pin: q('[data-g-pin]')[0],
            start: 'top top',
            end: () => `+=${window.innerHeight * (n * 0.85)}`,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        frames.forEach((frame, i) => {
          const t = i
          // 2 + 3: approach the viewer and straighten the perspective
          tl.to(frame, { z: 0, rotationY: 0, rotationX: 0, xPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, t + 0.05)
          tl.to(images[i], { scale: 1, duration: 0.55, ease: 'power2.out' }, t + 0.05)

          if (i < n - 1) {
            // 4: recede into depth, turning the other way
            // (it exits toward the side opposite to where the next photo enters, so they never cross)
            tl.to(frame, { z: -1300, rotationY: 22 * side(i), rotationX: -3, xPercent: 38 * side(i), duration: 0.4, ease: 'power2.in' }, t + 0.62)
            tl.to(frame, { autoAlpha: 0, duration: 0.2, ease: 'power1.in' }, t + 0.66)
            tl.to(metas[i], { autoAlpha: 0, yPercent: -30, duration: 0.18, ease: 'power2.in' }, t + 0.64)
            // 5: the next photo arrives on its own depth plane and side
            tl.fromTo(
              frames[i + 1],
              { z: depth(i + 1), rotationY: -24 * side(i + 1), rotationX: 6, xPercent: 16 * side(i + 1), autoAlpha: 0 },
              { z: -620, rotationY: -15 * side(i + 1), rotationX: 4, xPercent: 8 * side(i + 1), autoAlpha: 1, duration: 0.22, ease: 'power1.out', immediateRender: false },
              t + ENTER,
            )
            // 6: its title arrives in sync
            tl.fromTo(metas[i + 1], { autoAlpha: 0, yPercent: 30 }, { autoAlpha: 1, yPercent: 0, duration: 0.2, ease: 'power2.out', immediateRender: false }, t + 0.88)
            // 7: the stage takes on the next photo's tint
            tl.to(bg, { backgroundColor: tints[i + 1], duration: 0.35, ease: 'power1.inOut' }, t + 0.7)
          }
        })
        tl.to({}, { duration: 0.15 }) // brief hold on the last project
        if (progress) tl.fromTo(progress, { scaleX: 1 / n }, { scaleX: 1, duration: tl.duration(), ease: 'none' }, 0)

        // Keyboard: focusing a project's link scrolls its moment into view.
        const st = tl.scrollTrigger!
        const onFocus = (e: FocusEvent) => {
          const item = (e.target as HTMLElement).closest<HTMLElement>('[data-g-item]')
          if (!item) return
          const i = items.indexOf(item)
          const p = Math.min(1, (i + 0.55) / tl.duration())
          window.scrollTo({ top: st.start + (st.end - st.start) * p, behavior: 'instant' })
        }
        section.addEventListener('focusin', onFocus)

        return () => {
          section.removeEventListener('focusin', onFocus)
          section.classList.remove('is-3d')
          items.forEach((el) => el.removeAttribute('data-active'))
          if (counter) counter.textContent = pad(1)
        }
      })

      mm.add(MOTION.mobile, () => {
        const q = gsap.utils.selector(section)
        ;(q('[data-g-frame]') as HTMLElement[]).forEach((frame) => {
          gsap.fromTo(
            frame,
            { clipPath: 'inset(10% 6% 10% 6%)', y: 24 },
            { clipPath: 'inset(0% 0% 0% 0%)', y: 0, ease: 'none', scrollTrigger: { trigger: frame, start: 'top 95%', end: 'top 50%', scrub: true } },
          )
        })
      })

      // Images may change pin height calculations once decoded.
      const t = window.setTimeout(() => ScrollTrigger.refresh(), 400)
      return () => {
        window.clearTimeout(t)
        mm.revert()
      }
    },
    { scope: root },
  )

  return (
    <section id="erga" ref={root} aria-labelledby="erga-title" className="gallery relative bg-ink text-paper outline-none">
      <div data-g-pin className="gallery__pin relative">
        <div data-g-bg aria-hidden="true" className="gallery__bg absolute inset-0" />
        <div aria-hidden="true" className="gallery__grain pointer-events-none absolute inset-0" />

        <header className="gallery__head page-x relative z-10 mx-auto max-w-[var(--container-page)]">
          <Eyebrow index="02" className="text-bronze-light">
            Επιλεγμένα έργα
          </Eyebrow>
          <h2 id="erga-title" className="mt-6 text-h2">
            Έργα σε <em className="italic">προοπτική</em>
          </h2>
        </header>

        <ol className="gallery__list relative" aria-label="Επιλεγμένα έργα">
          {projects.map((project, i) => (
            <li key={project.id} data-g-item className="gallery__item">
              <article className="gallery__article" aria-labelledby={`g-title-${project.id}`}>
                <div className="gallery__stage">
                  <Link
                    to={`/erga/${project.slug}`}
                    data-g-frame
                    className="gallery__frame media-frame block"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <div data-g-image className="absolute inset-0">
                      <Picture image={project.cover} sizes="(min-width: 1024px) 56vw, 100vw" className="absolute inset-0" imgClassName="h-full w-full" />
                    </div>
                  </Link>
                </div>

                <div data-g-meta className="gallery__meta">
                  <p className="eyebrow flex items-center gap-4 text-bronze-light">
                    <span>{pad(i + 1)}</span>
                    <span className="h-px w-8 bg-current opacity-60" aria-hidden="true" />
                    <span>{categoryLabel(project.categoryId)}</span>
                  </p>
                  <h3 id={`g-title-${project.id}`} className="mt-5 font-display text-[clamp(2.25rem,4.4vw,4.75rem)] font-light leading-[1.02] tracking-[-0.025em]">
                    {project.title}
                  </h3>
                  <p className="mt-6 max-w-[26rem] text-stone">{project.summary}</p>
                  <div className="mt-8 flex flex-wrap items-center gap-5">
                    <Link to={`/erga/${project.slug}`} className="group inline-flex items-center gap-3 text-sm font-semibold tracking-[0.08em] text-paper">
                      <span className="link-draw">Δείτε το έργο</span>
                      <ArrowRight className="h-3 w-5 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
                      <span className="visually-hidden">: {project.title}</span>
                    </Link>
                    {project.isPlaceholder && <PlaceholderBadge label="Ενδεικτικό έργο" />}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>

        <footer className="gallery__foot page-x relative z-10 mx-auto flex max-w-[var(--container-page)] items-end justify-between gap-8">
          <div className="gallery__progress flex items-center gap-5" aria-hidden="true">
            <span className="font-display text-2xl tabular-nums">
              <span data-g-counter>01</span>
              <span className="text-muted-ink"> / {pad(projects.length)}</span>
            </span>
            <span className="relative h-px w-40 overflow-hidden bg-paper/20">
              <span data-g-progress className="absolute inset-0 origin-left bg-bronze-light" />
            </span>
          </div>
          <Link to="/erga" className="btn btn-ghost-light">
            Όλα τα έργα <ArrowRight />
          </Link>
        </footer>
      </div>
    </section>
  )
}
