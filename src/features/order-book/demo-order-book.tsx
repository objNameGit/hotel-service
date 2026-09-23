import { InfoIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Ticker } from '@/domain/ticker'
import { generateOrderBook } from './generate-order-book'
import { ORDER_BOOK_SOURCE, OrderBookView } from './order-book-view'

export const ORDER_BOOK_CAPTION = 'Демонстрационный стакан. Сделки исполняются по фиксированной цене'

/** Визуализация стакана. Не является источником цены и не ограничивает объём сделок. */
export function DemoOrderBook({ ticker }: { ticker: Pick<Ticker, 'id' | 'priceKopecks'> }) {
  const data = useMemo(() => generateOrderBook(ticker), [ticker])

  return (
    <Card data-testid="order-book" data-order-book-source={ORDER_BOOK_SOURCE} aria-labelledby="order-book-title">
      <CardHeader>
        <CardTitle>
          <h2 id="order-book-title">Стакан</h2>
        </CardTitle>
        <CardDescription className="flex items-start gap-1.5">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{ORDER_BOOK_CAPTION}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <OrderBookView data={data} />
      </CardContent>
    </Card>
  )
}
