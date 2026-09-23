import { ChevronRightIcon, MapPinIcon } from 'lucide-react'
import { Link } from 'react-router'
import { formatCalendarDate } from '@/domain/calendar-date'
import { formatRubles } from '@/domain/money'
import { isSoldOut, type Ticker } from '@/domain/ticker'
import { AvailabilityBadge } from '@/features/tickers/ticker-badges'
import { paths } from '@/lib/paths'
import { cn } from '@/lib/utils'

export function TickerCard({ ticker, to = paths.ticker(ticker.id) }: { ticker: Ticker; to?: string }) {
  const soldOut = isSoldOut(ticker)

  return (
    <Link
      to={to}
      data-testid="ticker-card"
      aria-label={`${ticker.code}: ${ticker.hotel}, ${ticker.roomCategory}, ${formatCalendarDate(ticker.nightDate)}, ${formatRubles(ticker.priceKopecks)}${soldOut ? ', раскуплено' : ''}`}
      className={cn(
        'group flex w-full flex-col gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/25 hover:bg-muted/40',
        soldOut && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-xs font-medium break-all text-muted-foreground">{ticker.code}</p>
          <p className="font-medium">{ticker.hotel}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPinIcon className="size-3" aria-hidden />
            {ticker.city}
          </p>
        </div>
        <AvailabilityBadge ticker={ticker} />
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Категория</dt>
          <dd>{ticker.roomCategory}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Ночь</dt>
          <dd className="whitespace-nowrap">{formatCalendarDate(ticker.nightDate, 'short')}</dd>
        </div>
      </dl>
      <div className="mt-auto flex items-center justify-between border-t pt-3">
        <span className="text-lg font-semibold tabular-nums">{formatRubles(ticker.priceKopecks)}</span>
        <span className="flex items-center text-sm text-muted-foreground group-hover:text-foreground">
          {soldOut ? 'Подробнее' : 'Торговать'}
          <ChevronRightIcon className="size-4" aria-hidden />
        </span>
      </div>
    </Link>
  )
}
