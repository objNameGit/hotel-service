import { CircleAlertIcon } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { formatRubles } from '@/domain/money'
import { TRADE_SIDE_LABELS, type TradeQuote } from '@/domain/trading'
import { cn } from '@/lib/utils'

interface TradeConfirmDialogProps {
  quote: TradeQuote | null
  pending: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function TradeConfirmDialog({ quote, pending, error, onConfirm, onCancel }: TradeConfirmDialogProps) {
  const isBuy = quote?.side === 'buy'

  return (
    <AlertDialog open={quote !== null} onOpenChange={(open) => !open && !pending && onCancel()}>
      <AlertDialogContent>
        {quote && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Подтвердите {isBuy ? 'покупку' : 'продажу'}</AlertDialogTitle>
              <AlertDialogDescription>
                Сделка исполняется по фиксированной цене администратора, без комиссий.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <dl
              className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-lg border p-4 text-sm"
              data-testid="trade-summary"
            >
              <dt className="text-muted-foreground">Направление</dt>
              <dd className={cn('text-right font-medium', isBuy ? 'text-buy' : 'text-sell')}>
                {TRADE_SIDE_LABELS[quote.side]}
              </dd>
              <dt className="text-muted-foreground">Тикер</dt>
              <dd className="text-right font-mono text-xs break-all">{quote.tickerCode}</dd>
              <dt className="text-muted-foreground">Количество</dt>
              <dd className="text-right tabular-nums">{quote.quantity} ед.</dd>
              <dt className="text-muted-foreground">Цена за единицу</dt>
              <dd className="text-right tabular-nums">{formatRubles(quote.priceKopecks)}</dd>
              <dt className="border-t pt-2 font-medium">Итого</dt>
              <dd className="border-t pt-2 text-right text-base font-semibold tabular-nums">
                {formatRubles(quote.totalKopecks)}
              </dd>
            </dl>

            {error && (
              <Alert variant="destructive">
                <CircleAlertIcon aria-hidden />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <AlertDialogFooter>
              <Button variant="outline" onClick={onCancel} disabled={pending}>
                {error ? 'Закрыть' : 'Отмена'}
              </Button>
              {!error && (
                <Button
                  onClick={onConfirm}
                  disabled={pending}
                  className={cn(isBuy ? 'bg-buy text-black hover:bg-buy/90' : 'bg-sell text-black hover:bg-sell/90')}
                >
                  {pending && <Spinner data-icon="inline-start" />}
                  {pending ? 'Исполняем…' : `Подтвердить ${isBuy ? 'покупку' : 'продажу'}`}
                </Button>
              )}
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
