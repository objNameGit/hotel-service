import { ArrowLeftIcon, SearchXIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { QueryState } from '@/components/query-state'
import { Stat } from '@/components/stat'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCalendarDate, formatNight } from '@/domain/calendar-date'
import { formatRubles } from '@/domain/money'
import type { Ticker } from '@/domain/ticker'
import { DemoOrderBook } from '@/features/order-book/demo-order-book'
import { AvailabilityBadge } from '@/features/tickers/ticker-badges'
import { TradePanel } from '@/features/trade/trade-panel'
import { paths } from '@/lib/paths'
import { usePortfolio, useTickers } from '@/stores'

export function Component() {
  const { tickerId = '' } = useParams()
  const tickers = useTickers()
  const portfolio = usePortfolio()

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to={paths.market}>
          <ArrowLeftIcon data-icon="inline-start" aria-hidden />
          Рынок
        </Link>
      </Button>

      <QueryState query={tickers} isEmpty={() => false} loading={<TickerSkeleton />}>
        {(data) => {
          const ticker = data.find((candidate) => candidate.id === tickerId)
          if (!ticker) return <UnknownTicker />
          return (
            <div className="space-y-6">
              <PageHeader
                title={<span className="font-mono break-all">{ticker.code}</span>}
                description={`${ticker.hotel} · ${ticker.city} · ${ticker.roomCategory}`}
                actions={<AvailabilityBadge ticker={ticker} />}
              />
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
                <TickerDetails ticker={ticker} className="lg:col-start-1 lg:row-start-1" />
                <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
                  <QueryState query={portfolio} isEmpty={() => false} loading={<Skeleton className="h-96 w-full" />}>
                    {(data) => <TradePanel ticker={ticker} portfolio={data} />}
                  </QueryState>
                </div>
                <div className="min-w-0 lg:col-start-1 lg:row-start-2">
                  <DemoOrderBook ticker={ticker} />
                </div>
              </div>
            </div>
          )
        }}
      </QueryState>
    </div>
  )
}

function TickerDetails({ ticker, className }: { ticker: Ticker; className?: string }) {
  return (
    <Card className={className} aria-labelledby="ticker-details-title">
      <CardHeader>
        <CardTitle>
          <h2 id="ticker-details-title">Номеро-ночь</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
          <Stat label="Отель" value={ticker.hotel} />
          <Stat label="Город" value={ticker.city} />
          <Stat label="Категория номера" value={ticker.roomCategory} />
          <Stat
            label="Дата ночи"
            value={formatCalendarDate(ticker.nightDate)}
            hint={`Ночь ${formatNight(ticker.nightDate)}`}
          />
          <Stat
            label="Цена сделки"
            value={<span data-testid="ticker-price">{formatRubles(ticker.priceKopecks)}</span>}
            hint="Фиксированная цена администратора"
          />
          <Stat
            label="Доступный остаток"
            value={<span data-testid="ticker-available">{ticker.availableQuantity} ед.</span>}
            hint={`Выпущено: ${ticker.issuedQuantity} ед.`}
          />
        </dl>
      </CardContent>
    </Card>
  )
}

function UnknownTicker() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>
          <h1>Тикер не найден</h1>
        </EmptyTitle>
        <EmptyDescription>Возможно, ссылка устарела или демо было сброшено.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link to={paths.market}>Перейти на рынок</Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}

function TickerSkeleton() {
  return (
    <div role="status" aria-label="Загрузка тикера" className="space-y-6">
      <Skeleton className="h-8 w-72" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}
