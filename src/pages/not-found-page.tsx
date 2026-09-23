import { CompassIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

export function Component() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CompassIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle>
            <h1 className="text-lg">404 — страница не найдена</h1>
          </EmptyTitle>
          <EmptyDescription>Такой страницы нет. Проверьте адрес или вернитесь на главную.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/">На главную</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
