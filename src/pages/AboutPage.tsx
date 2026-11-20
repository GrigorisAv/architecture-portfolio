import { useRef } from 'react'
import { useLoaderData } from 'react-router-dom'
import { EditorialFigure } from '../components/editorial/EditorialFigure'
import { useEditorialReveals } from '../components/editorial/useEditorialReveals'
import { Picture } from '../components/media/Picture'
import { Eyebrow } from '../components/ui/Eyebrow'
import { PlaceholderBadge } from '../components/ui/PlaceholderBadge'
import { PortraitPlaceholder } from '../components/ui/PortraitPlaceholder'
import type { AboutContent, SiteSettings } from '../content/types'
import { gsap, useGSAP } from '../lib/gsap'
import { introAllowed } from '../lib/prerender'
import { useSeo } from '../lib/seo'
import { ContactCta } from '../sections/home/ContactCta'

export function AboutPage() {
  const { about, settings } = useLoaderData() as { about: AboutContent; settings: SiteSettings }
  const root = useRef<HTMLDivElement>(null)
  useEditorialReveals(root)
  useSeo({ title: 'Σχετικά με εμένα', description: about.intro })

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (!introAllowed()) return
        gsap.fromTo('[data-about-intro]', { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: 0.15 })
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  const name = settings.architectName

  return (
    <div ref={root}>
      <section aria-labelledby="about-title" className="bg-paper text-ink">
        <div className="page-x mx-auto max-w-[var(--container-page)] pb-section pt-[clamp(9rem,18vw,14rem)]">
          <div className="grid-12 gap-y-14">
            <div className="col-span-4 lg:col-span-5" data-about-intro>
              {about.portrait ? (
                <div className="media-frame aspect-[4/5] w-full"><Picture image={about.portrait} sizes="(min-width: 1024px) 40vw, 100vw" priority /></div>
              ) : (
                <PortraitPlaceholder />
              )}
            </div>
            <div className="col-span-4 flex flex-col justify-end lg:col-span-6 lg:col-start-7">
              <div data-about-intro><Eyebrow className="text-bronze-ink">Σχετικά με εμένα</Eyebrow></div>
              <h1 id="about-title" data-about-intro className="mt-8 text-display">
                {name ?? <span className="text-muted-paper">[Όνομα Αρχιτέκτονα]</span>}
              </h1>
              <p data-about-intro className="eyebrow mt-5 text-muted-paper">{settings.architectRole} · Ιδρύτρια του ATELIER STUDIO</p>
              <p data-about-intro className="mt-10 max-w-xl font-display text-[clamp(1.5rem,2.4vw,2.25rem)] font-light leading-snug">{about.intro}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="bio-title" className="bg-paper text-ink">
        <div className="page-x mx-auto max-w-[var(--container-page)] pb-section">
          <div className="grid-12 gap-y-8 border-t border-stone-deep pt-[clamp(3rem,6vw,5rem)]">
            <div className="col-span-4 lg:col-span-4">
              <h2 id="bio-title" className="eyebrow text-bronze-ink">Βιογραφικό</h2>
              {about.isPlaceholder && <div className="mt-5"><PlaceholderBadge tone="light" label="Προσωρινό κείμενο" /></div>}
            </div>
            <div className="col-span-4 space-y-6 lg:col-span-6 lg:col-start-7">
              {about.bio.map((p, i) => <p key={i} data-reveal-text className={i === 0 ? 'text-lead' : 'text-muted-paper'}>{p}</p>)}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="philosophy-title" className="bg-ink text-paper">
        <div className="page-x mx-auto max-w-[var(--container-page)] py-section">
          <Eyebrow className="text-bronze-light">Σχεδιαστική φιλοσοφία</Eyebrow>
          <h2 id="philosophy-title" className="visually-hidden">Σχεδιαστική φιλοσοφία</h2>
          <ul className="mt-[clamp(3rem,7vw,6rem)] space-y-[clamp(3rem,7vw,6rem)]">
            {about.philosophy.map((item, i) => (
              <li key={item.title} data-reveal-text className={`grid-12 gap-y-4 ${i % 2 ? '' : ''}`}>
                <p className={`col-span-4 font-display text-[clamp(2.25rem,5vw,5rem)] font-light leading-[1.02] tracking-[-0.025em] lg:col-span-7 ${i % 2 ? 'lg:col-start-5' : ''}`}>
                  {item.title}
                </p>
                <p className={`col-span-4 self-end text-stone lg:col-span-3 ${i % 2 ? 'lg:col-start-1 lg:row-start-1' : 'lg:col-start-10'}`}>{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="approach-title" className="bg-paper text-ink">
        <div className="page-x mx-auto max-w-[var(--container-page)] py-section">
          <div className="grid-12 gap-y-14">
            <EditorialFigure
              className="col-span-4 lg:col-span-5"
              image={{ src: 'minimal-white-room', alt: 'Λιτό λευκό δωμάτιο με σκούρο καναπέ, φυτό, συρταριέρα και επιδαπέδιο φωτιστικό' }}
              sizes="(min-width: 1024px) 40vw, 100vw"
              ratio="4 / 5"
              tilt={8}
              caption={<><span>Ησυχία και φως</span><span className="eyebrow">Ενδεικτική φωτογραφία</span></>}
            />
            <div className="col-span-4 lg:col-span-6 lg:col-start-7 lg:pt-16">
              <Eyebrow className="text-bronze-ink">Επαγγελματική προσέγγιση</Eyebrow>
              <h2 id="approach-title" className="mt-8 text-h2" data-reveal-text>
                Ένα έργο, <em className="italic">μία σχέση</em>.
              </h2>
              <ul className="mt-12 border-t border-stone-deep">
                {about.approach.map((a) => (
                  <li key={a.title} data-reveal-text className="grid gap-2 border-b border-stone-deep py-7 md:grid-cols-[12rem_1fr] md:gap-8">
                    <h3 className="font-display text-2xl">{a.title}</h3>
                    <p className="text-muted-paper">{a.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <ContactCta />
    </div>
  )
}
