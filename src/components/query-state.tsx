import { CircleAlertIcon, InboxIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import type { Loadable } from '@/stores'

interface QueryStateProps<T> {
  query: Loadable<T>
  children: (data: T) => ReactNode
  isEmpty?: (data: T) => boolean
  emptyTitle?: ReactNode
  emptyDescription?: ReactNode
  emptyAction?: ReactNode
  loading?: ReactNode
}

const defaultIsEmpty = (data: unknown) => Array.isArray(data) && data.length === 0

/** Единая обработка загрузки, ошибки и пустого состояния. Закешированные данные показываются при обновлении. */
export function QueryState<T>({
  query,
  children,
  isEmpty = defaultIsEmpty,
  emptyTitle = 'Здесь пока пусто',
  emptyDescription,
  emptyAction,
  loading,
}: QueryStateProps<T>) {
  if (query.data === null) {
    if (query.status === 'error' && query.error) {
      return (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden />
          <AlertTitle>Не удалось загрузить данные</AlertTitle>
          <AlertDescription>{query.error.message}</AlertDescription>
        </Alert>
      )
    }
    return (
      loading ?? (
        <div role="status" aria-label="Загрузка" className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      )
    )
  }

  if (isEmpty(query.data)) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          {emptyDescription && <EmptyDescription>{emptyDescription}</EmptyDescription>}
        </EmptyHeader>
        {emptyAction && <EmptyContent>{emptyAction}</EmptyContent>}
      </Empty>
    )
  }

  return children(query.data)
}
