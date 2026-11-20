import { Link } from 'react-router-dom'
import type { Project } from '../../content/types'
import { Picture } from '../media/Picture'
import { ArrowRight } from '../ui/icons'
import { PlaceholderBadge } from '../ui/PlaceholderBadge'

interface ProjectCardProps {
  project: Project
  index: number
  categoryLabel: string
  ratio: string
  sizes: string
}

/** Portfolio card: whole card is one link; hover slowly enlarges the photo inside its frame (no layout shift). */
export function ProjectCard({ project, index, categoryLabel, ratio, sizes }: ProjectCardProps) {
  return (
    <article data-reveal-figure className="group" aria-labelledby={`card-${project.id}`}>
      <Link to={`/erga/${project.slug}`} className="block focus-visible:outline-offset-8">
        <div data-reveal-clip className="media-frame relative w-full" style={{ aspectRatio: ratio }}>
          <div data-reveal-inner className="absolute inset-x-0 -inset-y-[8%]">
            <Picture
              image={project.cover}
              sizes={sizes}
              className="absolute inset-0"
              imgClassName="h-full w-full transition-transform duration-[1400ms] ease-[var(--ease-expo)] group-hover:scale-[1.05] group-focus-visible:scale-[1.05]"
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-end justify-between bg-[linear-gradient(180deg,transparent_55%,rgb(25_25_25/0.7))] p-6 text-paper opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <span className="eyebrow translate-y-2 transition-transform duration-700 ease-[var(--ease-expo)] group-hover:translate-y-0">Δείτε το έργο</span>
            <ArrowRight className="h-3 w-6 -translate-x-2 transition-transform duration-700 ease-[var(--ease-expo)] group-hover:translate-x-0" />
          </div>
        </div>
        <div className="mt-5 flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow flex items-center gap-3 text-bronze-ink">
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span className="h-px w-6 bg-current opacity-50" aria-hidden="true" />
              <span>{categoryLabel}</span>
            </p>
            <h3 id={`card-${project.id}`} className="mt-3 font-display text-[clamp(1.6rem,2.6vw,2.5rem)] font-light leading-[1.08] tracking-[-0.015em] transition-[font-style] group-hover:italic">
              {project.title}
            </h3>
          </div>
          {project.isPlaceholder && (
            <span className="mt-1 shrink-0">
              <PlaceholderBadge tone="light" />
            </span>
          )}
        </div>
      </Link>
    </article>
  )
}
