import { useRef } from 'react'
import { Picture } from '../../components/media/Picture'
import { gsap, MOTION, useGSAP } from '../../lib/gsap'
import { scrollToSection } from '../../lib/scroll'

const heroImage = {
  src: 'hero-dusk-villa',
  alt: 'Σύγχρονη κατοικία το σούρουπο: σκούρος ορθογώνιος όγκος με κάθετα φωτισμένα ανοίγματα πάνω από λευκή βάση και κήπο',
  focal: '50% 55%',
}

/**
 * A. Cinematic hero
 * - Load: clip-path reveal, slow image settle, staggered masked headline.
 * - Desktop scroll (CSS sticky, not a GSAP pin): the full-bleed photo contracts into an
 *   editorial frame on the right while the stage shifts from charcoal to ivory.
 * - Mobile: load reveal + gentle parallax. Reduced motion: static final state.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // Intro (runs for any motion-allowed viewport)
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
        tl.fromTo('[data-hero-reveal]', { clipPath: 'inset(16% 20% 16% 20%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.9, ease: 'expo.inOut' })
          .fromTo('[data-hero-zoom]', { scale: 1.28 }, { scale: 1, duration: 2.6 }, 0)
          .fromTo('[data-hero-line]', { yPercent: 115 }, { yPercent: 0, duration: 1.4, stagger: 0.12 }, 0.75)
          .fromTo('[data-hero-fade]', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1 }, 1.15)
      })

      // Desktop: scroll-linked editorial transformation
      mm.add(MOTION.desktop, () => {
        root.current?.classList.add('is-cinematic')
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            invalidateOnRefresh: true,
          },
        })
        tl.to('[data-hero-frame]', { clipPath: 'inset(13% 5% 11% 47%)', ease: 'power1.inOut', duration: 1 }, 0)
          .to('[data-hero-parallax]', { scale: 1.08, yPercent: -4, duration: 1 }, 0)
          .to('[data-hero-scrim]', { autoAlpha: 0, duration: 0.6 }, 0.1)
          .to('[data-hero-paper]', { autoAlpha: 1, duration: 0.55, ease: 'power1.inOut' }, 0.15)
          .to('[data-hero-ink]', { color: '#191919', duration: 0.45 }, 0.25)
          .to('[data-hero-muted]', { color: '#5e5850', duration: 0.45 }, 0.25)
          .to('[data-hero-title]', { scale: 0.86, yPercent: -18, transformOrigin: '0% 100%', duration: 1 }, 0)
          .to('[data-hero-cue]', { autoAlpha: 0, duration: 0.15 }, 0)
          .fromTo('[data-hero-caption]', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.65)

        return () => root.current?.classList.remove('is-cinematic')
      })

      // Mobile: light parallax only
      mm.add(MOTION.mobile, () => {
        gsap.to('[data-hero-parallax]', {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
        })
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section
      id="arxi"
      ref={root}
      aria-labelledby="hero-title"
      className="hero relative bg-ink text-paper [&.is-cinematic]:h-[185svh]"
    >
      <div className="sticky top-0 h-svh min-h-[34rem] overflow-hidden">
        {/* Dark → light layer (desktop scroll) */}
        <div data-hero-paper aria-hidden="true" className="invisible absolute inset-0 bg-paper opacity-0" />

        {/* Photo: frame (scroll clip) > reveal (load clip) > parallax (scroll) > zoom (load) */}
        <div data-hero-frame className="absolute inset-0" style={{ clipPath: 'inset(0% 0% 0% 0%)' }}>
          <div data-hero-reveal className="absolute inset-0">
            <div data-hero-parallax className="absolute inset-0 will-change-transform">
              <div data-hero-zoom className="media-frame absolute inset-0">
                <Picture image={heroImage} sizes="100vw" priority />
              </div>
            </div>
            <div
              data-hero-scrim
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(180deg,rgb(25_25_25/0.55)_0%,rgb(25_25_25/0.1)_35%,rgb(25_25_25/0.25)_60%,rgb(25_25_25/0.85)_100%)]"
            />
          </div>
        </div>

        {/* Editorial caption that appears once the photo becomes a framed plate (desktop) */}
        <div
          data-hero-caption
          aria-hidden="true"
          className="invisible absolute bottom-[4.5%] right-[5%] hidden w-[48%] items-baseline justify-between text-muted-paper opacity-0 lg:flex"
        >
          <span className="eyebrow">Πλάκα I · Κατοικία, σούρουπο</span>
          <span className="eyebrow">Ενδεικτική φωτογραφία</span>
        </div>

        <div className="page-x relative z-10 mx-auto flex h-full max-w-[var(--container-page)] flex-col justify-end pb-[clamp(2.5rem,7vh,5rem)] pt-32">
          <p data-hero-fade data-hero-muted className="eyebrow mb-8 text-stone">
            <span className="hidden sm:inline">
              ATELIER STUDIO <span aria-hidden="true" className="mx-3 inline-block h-px w-8 translate-y-[-0.25em] bg-current align-middle opacity-60" />
            </span>
            Αρχιτεκτονική &amp; Εσωτερικοί Χώροι
          </p>

          <h1 id="hero-title" data-hero-title data-hero-ink className="text-hero font-light">
            <span className="line-mask">
              <span data-hero-line className="block">Η τέχνη</span>
            </span>
            <span className="line-mask">
              <span data-hero-line className="block pl-[0.9em]">
                του <em className="font-light italic">χώρου</em>
              </span>
            </span>
          </h1>

          <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between lg:max-w-[44%]">
            <p data-hero-fade data-hero-ink className="max-w-md text-lead text-paper/90">
              Αρχιτεκτονική και εσωτερικός σχεδιασμός με μεσογειακό φως, καθαρές αναλογίες και υλικά που γερνούν όμορφα.
            </p>
          </div>
        </div>

        {/* Scroll cue */}
        <button
          type="button"
          data-hero-fade
          data-hero-cue
          onClick={() => scrollToSection('filosofia')}
          className="group absolute bottom-[clamp(2.5rem,7vh,5rem)] right-[var(--spacing-gutter)] z-10 hidden flex-col items-center gap-4 text-paper md:flex"
          aria-label="Μετάβαση στη φιλοσοφία του στούντιο"
        >
          <span className="eyebrow [writing-mode:vertical-rl]">Κύλιση</span>
          <span aria-hidden="true" className="relative h-20 w-px overflow-hidden bg-paper/25">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_2.4s_var(--ease-quart)_infinite] bg-bronze-light" />
          </span>
        </button>
      </div>
    </section>
  )
}
