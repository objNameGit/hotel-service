import { PageHeader } from '@/components/page-header'
import { QueryState } from '@/components/query-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResetDemoButton } from '@/features/demo/reset-demo-button'
import { CreateTickerForm } from '@/features/tickers/create-ticker-form'
import { TickersTable } from '@/features/tickers/tickers-table'
import { useTickers } from '@/stores'

export function Component() {
  const tickers = useTickers()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Управление тикерами"
        description="Выпуск номеро-ночей. Весь выпущенный объём сразу доступен пользователям на рынке."
        actions={<ResetDemoButton />}
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>
              <h2>Новый тикер</h2>
            </CardTitle>
            <CardDescription>Одна единица — одна ночь в номере выбранной категории.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTickerForm />
          </CardContent>
        </Card>

        <Card className="min-w-0 self-start">
          <CardHeader>
            <CardTitle>
              <h2>Выпущенные тикеры</h2>
            </CardTitle>
            <CardDescription>{tickers.data ? `Всего: ${tickers.data.length}` : 'Загрузка списка'}</CardDescription>
          </CardHeader>
          <CardContent>
            <QueryState query={tickers} emptyTitle="Тикеров пока нет" emptyDescription="Создайте первый тикер в форме.">
              {(data) => <TickersTable tickers={data} />}
            </QueryState>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
