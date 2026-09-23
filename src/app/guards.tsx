import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageLoader } from '@/components/full-page-loader'
import type { Role } from '@/domain/session'
import { ROLE_HOME, paths } from '@/lib/paths'
import { useSessionStore } from '@/stores'

export interface LoginRedirectState {
  from?: string
}

/** Закрытые маршруты без входа перенаправляют на `/login`. */
export function RequireSession() {
  const status = useSessionStore((state) => state.status)
  const session = useSessionStore((state) => state.session)
  const location = useLocation()

  if (status === 'pending') return <FullPageLoader />
  if (!session) {
    const state: LoginRedirectState = { from: location.pathname + location.search }
    return <Navigate to={paths.login} replace state={state} />
  }
  return <Outlet />
}

/** Раздел другой роли перенаправляет в домашний раздел текущей роли. */
export function RequireRole({ role }: { role: Role }) {
  const session = useSessionStore((state) => state.session)
  if (session && session.role !== role) return <Navigate to={ROLE_HOME[session.role]} replace />
  return <Outlet />
}
