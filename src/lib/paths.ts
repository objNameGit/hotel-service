import type { Role } from '@/domain/session'
import type { TickerId } from '@/domain/ticker'

export const paths = {
  home: '/',
  login: '/login',
  adminTickers: '/admin/tickers',
  market: '/market',
  ticker: (id: TickerId) => `/market/${encodeURIComponent(id)}`,
  portfolio: '/portfolio',
} as const

export const ROLE_HOME: Record<Role, string> = {
  admin: paths.adminTickers,
  user: paths.market,
}

const ROLE_SECTIONS: Record<Role, readonly string[]> = {
  admin: ['/admin'],
  user: [paths.market, paths.portfolio],
}

/** Доступен ли закрытый маршрут роли. Проверка клиентская и служит поведению демо. */
export function isPathAllowed(role: Role, pathname: string): boolean {
  return ROLE_SECTIONS[role].some((section) => pathname === section || pathname.startsWith(`${section}/`))
}
