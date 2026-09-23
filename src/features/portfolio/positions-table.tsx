import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCalendarDate } from '@/domain/calendar-date'
import { formatRubles } from '@/domain/money'
import type { PositionValuation } from '@/domain/portfolio'
import { paths } from '@/lib/paths'

export function PositionsTable({ positions }: { positions: readonly PositionValuation[] }) {
  return (
    <Table>
      <TableCaption className="sr-only">Позиции портфеля</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Тикер</TableHead>
          <TableHead>Отель</TableHead>
          <TableHead>Категория</TableHead>
          <TableHead>Дата ночи</TableHead>
          <TableHead className="text-right">Кол-во</TableHead>
          <TableHead className="text-right">Цена</TableHead>
          <TableHead className="text-right">Стоимость</TableHead>
          <TableHead>
            <span className="sr-only">Действия</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map(({ ticker, quantity, valueKopecks }) => (
          <TableRow key={ticker.id} data-testid="position-row">
            <TableCell className="font-mono text-xs font-medium">
              <Link to={paths.ticker(ticker.id)} className="hover:underline">
                {ticker.code}
              </Link>
            </TableCell>
            <TableCell className="min-w-28 whitespace-normal">{ticker.hotel}</TableCell>
            <TableCell className="min-w-28 whitespace-normal">{ticker.roomCategory}</TableCell>
            <TableCell className="whitespace-nowrap">{formatCalendarDate(ticker.nightDate, 'short')}</TableCell>
            <TableCell className="text-right tabular-nums">{quantity}</TableCell>
            <TableCell className="text-right tabular-nums">{formatRubles(ticker.priceKopecks)}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">{formatRubles(valueKopecks)}</TableCell>
            <TableCell className="text-right">
              <Button asChild size="sm" variant="outline">
                <Link to={paths.ticker(ticker.id)} aria-label={`Продать ${ticker.code}`}>
                  Продать
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
