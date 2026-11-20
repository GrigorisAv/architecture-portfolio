import { useLoaderData } from 'react-router-dom'
import type { Project, ProjectCategory, Service, SiteSettings } from '../content/types'
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
}

export function HomePage() {
  const { featured, categories, services, settings } = useLoaderData() as HomeData
  useSeo({ description: settings.seo.description })
  useJsonLd('organization', {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: settings.studioName,
    description: settings.seo.description,
    url: absoluteUrl('/'),
    image: absoluteUrl('images/hero-dusk-villa-1600.jpg'),
    knowsAbout: ['Αρχιτεκτονική', 'Εσωτερικός σχεδιασμός', 'Ανακαινίσεις'],
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.address ? { address: settings.address } : {}),
    ...(settings.instagram ? { sameAs: [settings.instagram] } : {}),
  })

  return (
    <>
      <Hero />
      <Philosophy />
      <ProjectGallery3D projects={featured} categories={categories} />
      <Disciplines services={services} />
      <MaterialStudies />
      <ArchitectProfile settings={settings} />
      <ContactCta index="06" />
    </>
  )
}
