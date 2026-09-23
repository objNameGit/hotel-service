import { Link, Outlet } from 'react-router'
import { DemoBanner } from '@/components/demo-banner'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { ROLE_HOME, paths } from '@/lib/paths'
import { useSessionStore } from '@/stores'

export function PublicLayout() {
  const session = useSessionStore((state) => state.session)

  return (
    <div className="flex min-h-svh flex-col">
      <DemoBanner />
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
          <Logo />
          <Button asChild size="sm" variant="outline">
            {session ? (
              <Link to={ROLE_HOME[session.role]}>Открыть демо</Link>
            ) : (
              <Link to={paths.login}>Войти в демо</Link>
            )}
          </Button>
        </div>
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
          Демонстрационный проект. Не является офертой, не принимает платежи и не бронирует номера.
        </div>
      </footer>
    </div>
  )
}
