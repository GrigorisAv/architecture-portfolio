import { createBrowserRouter, createMemoryRouter, data, type RouteObject } from 'react-router-dom'
import { RootLayout } from './components/layout/RootLayout'
import { content } from './content/repository'
import { HomePage } from './pages/HomePage'
import { HydrateFallback } from './pages/HydrateFallback'
import { RouteError } from './pages/RouteError'
import { AboutPage } from './pages/AboutPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { QuotePage } from './pages/QuotePage'
import { ServicesPage } from './pages/ServicesPage'

/** Route loaders call the content repository only, so the CMS swap in Phase 3 is invisible to pages. */
const routes: RouteObject[] = [
    {
      path: '/',
      element: <RootLayout />,
      errorElement: <RouteError />,
      hydrateFallbackElement: <HydrateFallback />,
      children: [
        {
          index: true,
          element: <HomePage />,
          loader: async () => {
            const [featured, categories, services, settings] = await Promise.all([
              content.listFeaturedProjects(),
              content.listCategories(),
              content.listServices(),
              content.getSiteSettings(),
            ])
            return { featured, categories, services, settings }
          },
        },
        {
          path: 'erga',
          element: <ProjectsPage />,
          loader: async () => {
            const [projects, categories] = await Promise.all([content.listProjects(), content.listCategories()])
            return { projects, categories }
          },
        },
        {
          path: 'erga/:slug',
          element: <ProjectDetailPage />,
          loader: async ({ params }) => {
            const slug = params.slug ?? ''
            const [project, next, categories] = await Promise.all([content.getProject(slug), content.getAdjacentProject(slug), content.listCategories()])
            if (!project) throw data('Not found', { status: 404 })
            return { project, next, categories }
          },
        },
        { path: 'ypiresies', element: <ServicesPage />, loader: async () => ({ services: await content.listServices() }) },
        {
          path: 'sxetika',
          element: <AboutPage />,
          loader: async () => {
            const [about, settings] = await Promise.all([content.getAboutContent(), content.getSiteSettings()])
            return { about, settings }
          },
        },
        { path: 'aitima-prosforas', element: <QuotePage /> },
        { path: 'politiki-aporritou', element: <PrivacyPage /> },
        { path: '*', element: <RouteError />, loader: () => { throw data('Not found', { status: 404 }) } },
      ],
    },
]

/**
 * Production: real URLs (browser history).
 * VITE_ROUTER=memory: in-page navigation only, for sandboxed previews where URL paths are unavailable.
 */
export const router =
  import.meta.env.VITE_ROUTER === 'memory'
    ? createMemoryRouter(routes, { initialEntries: ['/'] })
    : createBrowserRouter(routes, { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' })
