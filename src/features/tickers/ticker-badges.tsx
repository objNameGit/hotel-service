import { Badge } from '@/components/ui/badge'
import type { Ticker } from '@/domain/ticker'
import { isSoldOut } from '@/domain/ticker'

export function AvailabilityBadge({ ticker }: { ticker: Pick<Ticker, 'availableQuantity'> }) {
  if (isSoldOut(ticker)) {
    return (
      <Badge variant="outline" className="border-sell/40 text-sell">
        Раскуплено
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-buy/40 text-buy tabular-nums">
      Доступно: {ticker.availableQuantity}
    </Badge>
  )
}
