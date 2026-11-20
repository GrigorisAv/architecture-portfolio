import { createBrowserRouter, createMemoryRouter, data, type RouteObject } from 'react-router-dom'
import { RootLayout } from './components/layout/RootLayout'
import { content } from './content/repository'
import { HomePage } from './pages/HomePage'
import { HydrateFallback } from './pages/HydrateFallback'
import { RouteError } from './pages/RouteError'
import { AboutPage, ProjectDetailPage, ProjectsPage, QuotePage, ServicesPage } from './pages/placeholders'

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
        { path: 'erga', element: <ProjectsPage /> },
        {
          path: 'erga/:slug',
          element: <ProjectDetailPage />,
          loader: async ({ params }) => {
            const project = await content.getProject(params.slug ?? '')
            if (!project) throw data('Not found', { status: 404 })
            return { project }
          },
        },
        { path: 'ypiresies', element: <ServicesPage /> },
        { path: 'sxetika', element: <AboutPage /> },
        { path: 'aitima-prosforas', element: <QuotePage /> },
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
