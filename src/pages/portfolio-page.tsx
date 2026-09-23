import { WalletIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { QueryState } from '@/components/query-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRubles } from '@/domain/money'
import { valuePortfolio } from '@/domain/portfolio'
import { PositionsTable } from '@/features/portfolio/positions-table'
import { paths } from '@/lib/paths'
import { usePortfolio, useTickers, type Loadable } from '@/stores'

export function Component() {
  const tickers = useTickers()
  const portfolio = usePortfolio()

  const valuation = useMemo(
    () => (portfolio.data && tickers.data ? valuePortfolio(portfolio.data, tickers.data) : null),
    [portfolio.data, tickers.data],
  )
  const query: Loadable<NonNullable<typeof valuation>> = {
    status: valuation ? 'ready' : portfolio.error || tickers.error ? 'error' : 'loading',
    data: valuation,
    error: portfolio.error ?? tickers.error,
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Портфель" description="Стоимость активов считается по фиксированным ценам тикеров." />

      <QueryState query={query} isEmpty={() => false} loading={<Skeleton className="h-28 w-full" />}>
        {(data) => (
          <>
            <dl className="grid gap-4 sm:grid-cols-3">
              <SummaryCard label="Доступные деньги" value={data.cashKopecks} testId="portfolio-cash" />
              <SummaryCard label="Стоимость активов" value={data.assetsKopecks} testId="portfolio-assets" />
              <SummaryCard
                label="Общая стоимость портфеля"
                value={data.totalKopecks}
                testId="portfolio-total"
                hint="Деньги + активы"
              />
            </dl>

            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>
                  <h2>Позиции</h2>
                </CardTitle>
                <CardDescription>Чтобы продать, откройте тикер из позиции.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.positions.length > 0 ? (
                  <PositionsTable positions={data.positions} />
                ) : (
                  <Empty className="border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <WalletIcon aria-hidden />
                      </EmptyMedia>
                      <EmptyTitle>Портфель пуст</EmptyTitle>
                      <EmptyDescription>Купите номеро-ночь на рынке — она появится здесь.</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button asChild>
                        <Link to={paths.market}>Перейти на рынок</Link>
                      </Button>
                    </EmptyContent>
                  </Empty>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </QueryState>
    </div>
  )
}

function SummaryCard({ label, value, hint, testId }: { label: string; value: number; hint?: string; testId: string }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="text-2xl font-semibold tabular-nums" data-testid={testId}>
          {formatRubles(value)}
        </dd>
        {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
      </CardContent>
    </Card>
  )
}
