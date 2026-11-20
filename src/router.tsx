import { createBrowserRouter, createMemoryRouter, data, type RouteObject } from 'react-router-dom'
import { RootLayout } from './components/layout/RootLayout'
import { content } from './content/repository'
import { HomePage } from './pages/HomePage'
import { HydrateFallback } from './pages/HydrateFallback'
import { RouteError } from './pages/RouteError'

/** Inner pages are separate chunks, fetched in parallel with their loader data. The home page stays eager (LCP). */
const page = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) => async () => ({ Component: (await load())[name] })

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
            const [featured, categories, services, settings, home] = await Promise.all([
              content.listFeaturedProjects(),
              content.listCategories(),
              content.listServices(),
              content.getSiteSettings(),
              content.getHomeContent(),
            ])
            return { featured, categories, services, settings, home }
          },
        },
        {
          path: 'erga',
          lazy: page(() => import('./pages/ProjectsPage'), 'ProjectsPage'),
          loader: async () => {
            const [projects, categories] = await Promise.all([content.listProjects(), content.listCategories()])
            return { projects, categories }
          },
        },
        {
          path: 'erga/:slug',
          lazy: page(() => import('./pages/ProjectDetailPage'), 'ProjectDetailPage'),
          loader: async ({ params }) => {
            const slug = params.slug ?? ''
            const [project, next, categories] = await Promise.all([content.getProject(slug), content.getAdjacentProject(slug), content.listCategories()])
            if (!project) throw data('Not found', { status: 404 })
            return { project, next, categories }
          },
        },
        { path: 'ypiresies', lazy: page(() => import('./pages/ServicesPage'), 'ServicesPage'), loader: async () => ({ services: await content.listServices() }) },
        {
          path: 'sxetika',
          lazy: page(() => import('./pages/AboutPage'), 'AboutPage'),
          loader: async () => {
            const [about, settings] = await Promise.all([content.getAboutContent(), content.getSiteSettings()])
            return { about, settings }
          },
        },
        { path: 'aitima-prosforas', lazy: page(() => import('./pages/QuotePage'), 'QuotePage') },
        { path: 'politiki-aporritou', lazy: page(() => import('./pages/PrivacyPage'), 'PrivacyPage') },
        { path: '*', element: <RouteError />, loader: () => { throw data('Not found', { status: 404 }) } },
      ],
    },
    {
      // Private CMS: separate chunk, no public header/footer, never in the public bundle.
      path: '/diaxeirisi/*',
      hydrateFallbackElement: <HydrateFallback />,
      lazy: async () => ({ Component: (await import('./admin/AdminApp')).default }),
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
