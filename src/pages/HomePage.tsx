import { useLoaderData } from 'react-router-dom'
import type { HomeContent, Project, ProjectCategory, Service, SiteSettings } from '../content/types'
import { absoluteUrl, useJsonLd, useSeo } from '../lib/seo'
import { ArchitectProfile } from '../sections/home/ArchitectProfile'
import { ContactCta } from '../sections/home/ContactCta'
import { Disciplines } from '../sections/home/Disciplines'
import { Hero } from '../sections/home/Hero'
import { MaterialStudies } from '../sections/home/MaterialStudies'
import { Philosophy } from '../sections/home/Philosophy'
import { ProjectGallery3D } from '../sections/home/ProjectGallery3D'

interface HomeData {
  featured: Project[]
  categories: ProjectCategory[]
  services: Service[]
  settings: SiteSettings
  home: HomeContent
}

/** Social cards need a plain JPEG/WebP URL: bundled keys map to their 1600px JPEG. */
function ogImage(src: string): string {
  return /^(https?:|data:|blob:)/.test(src) ? src : `images/${src}-1600.jpg`
}

export function HomePage() {
  const { featured, categories, services, settings, home } = useLoaderData() as HomeData
  const { images } = home
  const shareImage = ogImage(images.hero.src)
  useSeo({ description: settings.seo.description, image: shareImage })
  useJsonLd('organization', {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: settings.studioName,
    description: settings.seo.description,
    url: absoluteUrl('/'),
    image: absoluteUrl(shareImage),
    knowsAbout: ['Αρχιτεκτονική', 'Εσωτερικός σχεδιασμός', 'Ανακαινίσεις'],
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.address ? { address: settings.address } : {}),
    ...(settings.instagram ? { sameAs: [settings.instagram] } : {}),
  })

  return (
    <>
      <Hero image={images.hero} />
      <Philosophy image={images.philosophy} />
      <ProjectGallery3D projects={featured} categories={categories} />
      <Disciplines services={services} images={images} />
      <MaterialStudies images={images} />
      <ArchitectProfile settings={settings} />
      <ContactCta index="06" />
    </>
  )
}
