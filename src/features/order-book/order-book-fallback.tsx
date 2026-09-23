import { TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatRubles } from '@/domain/money'
import { cn } from '@/lib/utils'
import type { DemoOrderBookData, OrderBookLevel } from './generate-order-book'

/**
 * ВРЕМЕННАЯ ЗАГЛУШКА, а не замена платного блока. По ТЗ самостоятельная имитация не принимается:
 * после установки исходного Web3 Order Book (`npm run blocks:order-book`) этот файл удаляется,
 * а `order-book-view.tsx` подключает исходный блок.
 */
export function OrderBookFallback({ data }: { data: DemoOrderBookData }) {
  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/40 text-amber-200">
        <TriangleAlertIcon aria-hidden />
        <AlertTitle>Исходный блок Web3 Order Book не установлен</AlertTitle>
        <AlertDescription className="text-amber-200/80">
          Это временная заглушка с теми же данными. Для приёмки установите блок shadcn.io командой{' '}
          <code className="font-mono">npm run blocks:order-book</code> (нужен токен заказчика).
        </AlertDescription>
      </Alert>

      <div className="text-sm" role="table" aria-label="Уровни демонстрационного стакана">
        <div role="row" className="grid grid-cols-3 px-2 pb-1 text-xs text-muted-foreground">
          <span role="columnheader">Цена</span>
          <span role="columnheader" className="text-right">
            Кол-во
          </span>
          <span role="columnheader" className="text-right">
            Глубина
          </span>
        </div>
        {[...data.asks].reverse().map((level) => (
          <LevelRow key={`ask-${level.priceKopecks}`} level={level} side="ask" />
        ))}
        <div role="row" className="my-1 flex justify-between border-y px-2 py-1.5 text-xs text-muted-foreground">
          <span role="cell">Спред</span>
          <span role="cell" className="tabular-nums">
            {formatRubles(data.spreadKopecks)} ({data.spreadPercent.toFixed(2)}%)
          </span>
        </div>
        {data.bids.map((level) => (
          <LevelRow key={`bid-${level.priceKopecks}`} level={level} side="bid" />
        ))}
      </div>
    </div>
  )
}

function LevelRow({ level, side }: { level: OrderBookLevel; side: 'bid' | 'ask' }) {
  return (
    <div role="row" data-testid={`order-book-${side}`} className="relative grid grid-cols-3 px-2 py-1 tabular-nums">
      <span
        aria-hidden
        className={cn('absolute inset-y-0 right-0', side === 'bid' ? 'bg-buy/10' : 'bg-sell/10')}
        style={{ width: `${level.depth * 100}%` }}
      />
      <span role="cell" className={cn('relative', side === 'bid' ? 'text-buy' : 'text-sell')}>
        {formatRubles(level.priceKopecks)}
      </span>
      <span role="cell" className="relative text-right">
        {level.quantity}
      </span>
      <span role="cell" className="relative text-right text-muted-foreground">
        {level.cumulativeQuantity}
      </span>
    </div>
  )
}
