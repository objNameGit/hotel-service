import { createBrowserRouter, type RouteObject } from 'react-router'
import { FullPageLoader } from '@/components/full-page-loader'
import { RequireRole, RequireSession } from './guards'
import { AppLayout } from './layouts/app-layout'
import { PublicLayout } from './layouts/public-layout'
import { RouteErrorBoundary } from './route-error-boundary'

/** Страницы загружаются по требованию; каждая экспортирует компонент `Component`. */
const page = (load: () => Promise<{ Component: React.ComponentType }>): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: (await load()).Component }),
})

export const routes: RouteObject[] = [
  {
    ErrorBoundary: RouteErrorBoundary,
    HydrateFallback: FullPageLoader,
    children: [
      {
        Component: PublicLayout,
        children: [
          { index: true, ...page(() => import('@/pages/home-page')) },
          { path: 'login', ...page(() => import('@/pages/login-page')) },
        ],
      },
      {
        Component: RequireSession,
        children: [
          {
            Component: AppLayout,
            children: [
              {
                element: <RequireRole role="admin" />,
                children: [{ path: 'admin/tickers', ...page(() => import('@/pages/admin-tickers-page')) }],
              },
              {
                element: <RequireRole role="user" />,
                children: [
                  { path: 'market', ...page(() => import('@/pages/market-page')) },
                  { path: 'market/:tickerId', ...page(() => import('@/pages/ticker-page')) },
                  { path: 'portfolio', ...page(() => import('@/pages/portfolio-page')) },
                ],
              },
            ],
          },
        ],
      },
      {
        Component: PublicLayout,
        children: [{ path: '*', ...page(() => import('@/pages/not-found-page')) }],
      },
    ],
  },
]

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
})
