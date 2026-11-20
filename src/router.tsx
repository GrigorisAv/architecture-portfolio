import { createBrowserRouter, data } from 'react-router-dom'
import { RootLayout } from './components/layout/RootLayout'
import { content } from './content/repository'
import { HomePage } from './pages/HomePage'
import { HydrateFallback } from './pages/HydrateFallback'
import { RouteError } from './pages/RouteError'
import { AboutPage, ProjectDetailPage, ProjectsPage, QuotePage, ServicesPage } from './pages/placeholders'

/** Route loaders call the content repository only, so the CMS swap in Phase 3 is invisible to pages. */
export const router = createBrowserRouter(
  [
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
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
