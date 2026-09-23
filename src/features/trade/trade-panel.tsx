import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Stat } from '@/components/stat'
import { TextField } from '@/components/text-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatRubles, multiplyMoney } from '@/domain/money'
import { getPositionQuantity, type Portfolio } from '@/domain/portfolio'
import type { Ticker } from '@/domain/ticker'
import {
  TRADE_REJECTION_MESSAGES,
  isValidQuantity,
  maxTradeQuantity,
  quoteTrade,
  type TradeQuote,
  type TradeSide,
} from '@/domain/trading'
import { cn } from '@/lib/utils'
import { toServiceError } from '@/services'
import { useExchangeStore } from '@/stores'
import { TradeConfirmDialog } from './trade-confirm-dialog'

const tradeFormSchema = z.object({
  quantity: z
    .string()
    .trim()
    .min(1, 'Укажите количество')
    .regex(/^\d+$/, TRADE_REJECTION_MESSAGES.INVALID_QUANTITY)
    .transform(Number)
    .refine(isValidQuantity, TRADE_REJECTION_MESSAGES.INVALID_QUANTITY),
})

type TradeFormValues = z.input<typeof tradeFormSchema>
type TradeFormOutput = z.output<typeof tradeFormSchema>

interface PendingTrade {
  quote: TradeQuote
  operationId: string
}

export function TradePanel({ ticker, portfolio }: { ticker: Ticker; portfolio: Portfolio }) {
  const trade = useExchangeStore((state) => state.trade)
  const [side, setSide] = useState<TradeSide>('buy')
  const [pendingTrade, setPendingTrade] = useState<PendingTrade | null>(null)
  const [executing, setExecuting] = useState(false)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    reset,
    control,
    formState: { errors },
  } = useForm<TradeFormValues, unknown, TradeFormOutput>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: { quantity: '1' },
  })

  const held = getPositionQuantity(portfolio, ticker.id)
  const max = maxTradeQuantity(ticker, portfolio, side)
  const rawQuantity = useWatch({ control, name: 'quantity' }).trim()
  const previewQuantity = /^\d+$/.test(rawQuantity) ? Number(rawQuantity) : 0
  const previewTotal = isValidQuantity(previewQuantity) ? multiplyMoney(ticker.priceKopecks, previewQuantity) : 0
  const unavailableReason =
    side === 'buy'
      ? ticker.availableQuantity === 0
        ? 'Тикер раскуплен'
        : max === 0
          ? TRADE_REJECTION_MESSAGES.INSUFFICIENT_FUNDS
          : null
      : held === 0
        ? 'Этого актива нет в вашем портфеле'
        : null

  const onSubmit = handleSubmit(({ quantity }) => {
    const quoted = quoteTrade(ticker, portfolio, { side, quantity })
    if (!quoted.ok) {
      setError('quantity', { message: TRADE_REJECTION_MESSAGES[quoted.error] }, { shouldFocus: true })
      return
    }
    setExecutionError(null)
    setPendingTrade({ quote: quoted.value, operationId: crypto.randomUUID() })
  })

  const confirm = async () => {
    if (!pendingTrade || inFlight.current) return
    inFlight.current = true
    setExecuting(true)
    const { quote, operationId } = pendingTrade
    try {
      await trade(quote.side, { operationId, tickerId: quote.tickerId, quantity: quote.quantity })
      setPendingTrade(null)
      reset({ quantity: '1' })
      toast.success(
        `${quote.side === 'buy' ? 'Куплено' : 'Продано'} ${quote.quantity} ед. ${quote.tickerCode} на ${formatRubles(quote.totalKopecks)}`,
      )
    } catch (error) {
      setExecutionError(toServiceError(error).message)
    } finally {
      inFlight.current = false
      setExecuting(false)
    }
  }

  const changeSide = (next: string) => {
    setSide(next as TradeSide)
    clearErrors()
  }

  const isBuy = side === 'buy'

  return (
    <Card aria-labelledby="trade-title">
      <CardHeader>
        <CardTitle>
          <h2 id="trade-title">Купить / Продать</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-3">
          <Stat
            label="Ваш баланс"
            value={<span data-testid="cash-balance">{formatRubles(portfolio.cashKopecks)}</span>}
          />
          <Stat
            label="В портфеле"
            value={<span data-testid="position-quantity">{held} ед.</span>}
            hint={held > 0 ? formatRubles(multiplyMoney(ticker.priceKopecks, held)) : undefined}
          />
        </dl>

        <Tabs value={side} onValueChange={changeSide}>
          <TabsList className="grid w-full grid-cols-2" aria-label="Направление сделки">
            <TabsTrigger value="buy" className="data-[state=active]:text-buy">
              Купить
            </TabsTrigger>
            <TabsTrigger value="sell" className="data-[state=active]:text-sell">
              Продать
            </TabsTrigger>
          </TabsList>

          <TabsContent value={side} className="pt-2">
            <form onSubmit={onSubmit} noValidate className="space-y-4" aria-label={isBuy ? 'Покупка' : 'Продажа'}>
              <div className="flex items-start gap-2">
                <TextField
                  label="Количество, ед."
                  inputMode="numeric"
                  autoComplete="off"
                  description={
                    isBuy
                      ? `Доступно к покупке: ${max} ед. (остаток ${ticker.availableQuantity})`
                      : `Можно продать: ${held} ед.`
                  }
                  error={errors.quantity?.message}
                  {...register('quantity')}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-6 shrink-0"
                  disabled={max === 0}
                  onClick={() => setValue('quantity', String(max), { shouldValidate: true })}
                >
                  Макс.
                </Button>
              </div>

              <dl className="space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Цена за единицу</dt>
                  <dd className="tabular-nums">{formatRubles(ticker.priceKopecks)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-medium">Итого</dt>
                  <dd className="text-base font-semibold tabular-nums" data-testid="trade-total" aria-live="polite">
                    {formatRubles(previewTotal)}
                  </dd>
                </div>
              </dl>

              {unavailableReason && (
                <p className="text-sm text-muted-foreground" role="status">
                  {unavailableReason}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={unavailableReason !== null || executing}
                className={cn('w-full text-black', isBuy ? 'bg-buy hover:bg-buy/90' : 'bg-sell hover:bg-sell/90')}
              >
                {isBuy ? 'Купить' : 'Продать'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>

      <TradeConfirmDialog
        quote={pendingTrade?.quote ?? null}
        pending={executing}
        error={executionError}
        onConfirm={() => void confirm()}
        onCancel={() => setPendingTrade(null)}
      />
    </Card>
  )
}
