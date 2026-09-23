import { NavLink, Outlet } from 'react-router'
import { DemoBanner } from '@/components/demo-banner'
import { Logo } from '@/components/logo'
import type { Role } from '@/domain/session'
import { LogoutButton } from '@/features/auth/logout-button'
import { RoleSwitcher } from '@/features/auth/role-switcher'
import { ROLE_HOME, paths } from '@/lib/paths'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores'

const NAVIGATION: Record<Role, { to: string; label: string }[]> = {
  admin: [{ to: paths.adminTickers, label: 'Управление тикерами' }],
  user: [
    { to: paths.market, label: 'Рынок' },
    { to: paths.portfolio, label: 'Портфель' },
  ],
}

export function AppLayout() {
  const role = useSessionStore((state) => state.session?.role ?? 'user')

  return (
    <div className="flex min-h-svh flex-col">
      <DemoBanner />
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
          <Logo to={ROLE_HOME[role]} />
          <nav aria-label="Основная навигация" className="order-3 flex w-full gap-1 md:order-none md:w-auto">
            {NAVIGATION[role].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to !== paths.market}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted hover:text-foreground',
                    isActive ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <RoleSwitcher className="hidden sm:flex" />
            <LogoutButton />
          </div>
          <RoleSwitcher className="order-4 w-full sm:hidden" />
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  )
}
