import { useLoaderData } from 'react-router-dom'
import type { Project, ProjectCategory, Service, SiteSettings } from '../content/types'
import { useSeo } from '../lib/seo'
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
