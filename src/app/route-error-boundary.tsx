import { TriangleAlertIcon } from 'lucide-react'
import { Link, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { toServiceError } from '@/services'

export function RouteErrorBoundary() {
  const error = useRouteError()
  const message = error instanceof Error ? toServiceError(error).message : 'Неизвестная ошибка'

  return (
    <main className="mx-auto flex min-h-svh max-w-lg items-center px-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Не удалось открыть страницу</EmptyTitle>
          <EmptyDescription>{message}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center">
          <Button onClick={() => window.location.reload()}>Перезагрузить</Button>
          <Button asChild variant="outline">
            <Link to="/">На главную</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
