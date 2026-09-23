import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCalendarDate } from '@/domain/calendar-date'
import { formatRubles } from '@/domain/money'
import { compareTickers, isSoldOut, type Ticker } from '@/domain/ticker'

export function TickersTable({ tickers }: { tickers: readonly Ticker[] }) {
  const sorted = useMemo(() => [...tickers].sort(compareTickers), [tickers])

  return (
    <Table>
      <TableCaption className="sr-only">Выпущенные тикеры</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Код</TableHead>
          <TableHead>Отель</TableHead>
          <TableHead>Категория</TableHead>
          <TableHead>Дата ночи</TableHead>
          <TableHead className="text-right">Цена</TableHead>
          <TableHead className="text-right">Выпущено</TableHead>
          <TableHead className="text-right">Доступно</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((ticker) => (
          <TableRow key={ticker.id} data-testid="admin-ticker-row">
            <TableCell className="font-mono text-xs font-medium">{ticker.code}</TableCell>
            <TableCell className="min-w-28 whitespace-normal">
              <div>{ticker.hotel}</div>
              <div className="text-xs text-muted-foreground">{ticker.city}</div>
            </TableCell>
            <TableCell className="min-w-28 whitespace-normal">{ticker.roomCategory}</TableCell>
            <TableCell className="whitespace-nowrap">{formatCalendarDate(ticker.nightDate, 'short')}</TableCell>
            <TableCell className="text-right tabular-nums">{formatRubles(ticker.priceKopecks)}</TableCell>
            <TableCell className="text-right tabular-nums">{ticker.issuedQuantity}</TableCell>
            <TableCell className="text-right tabular-nums">
              {isSoldOut(ticker) ? (
                <Badge variant="outline" className="border-sell/40 text-sell">
                  0
                </Badge>
              ) : (
                ticker.availableQuantity
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
