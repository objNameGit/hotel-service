import { Navigate, useLocation } from 'react-router'
import type { LoginRedirectState } from '@/app/guards'
import { FullPageLoader } from '@/components/full-page-loader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DemoSession } from '@/domain/session'
import { LoginForm } from '@/features/auth/login-form'
import { ROLE_HOME, isPathAllowed } from '@/lib/paths'
import { useSessionStore } from '@/stores'

export function Component() {
  const status = useSessionStore((state) => state.status)
  const session = useSessionStore((state) => state.session)
  const from = (useLocation().state as LoginRedirectState | null)?.from

  const destination = ({ role }: DemoSession) => (from && isPathAllowed(role, from) ? from : ROLE_HOME[role])

  if (status === 'pending') return <FullPageLoader />
  if (session) return <Navigate to={destination(session)} replace />

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10 md:py-16">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl">Вход в демо</h1>
          </CardTitle>
          <CardDescription>
            Используйте демо-доступ администратора или пользователя. Пароль для обоих — <code>demo123</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
