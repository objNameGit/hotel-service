import { multiplyMoney, type Kopecks } from './money'
import { getPositionQuantity, type Portfolio, type Position } from './portfolio'
import { err, ok, type Result } from './result'
import type { Ticker, TickerId } from './ticker'

export type TradeSide = 'buy' | 'sell'

export const TRADE_SIDE_LABELS: Record<TradeSide, string> = {
  buy: 'Покупка',
  sell: 'Продажа',
}

export type TradeRejection =
  'INVALID_QUANTITY' | 'TICKER_NOT_FOUND' | 'INSUFFICIENT_FUNDS' | 'INSUFFICIENT_SUPPLY' | 'INSUFFICIENT_POSITION'

export const TRADE_REJECTION_MESSAGES: Record<TradeRejection, string> = {
  INVALID_QUANTITY: 'Количество должно быть положительным целым числом',
  TICKER_NOT_FOUND: 'Тикер не найден',
  INSUFFICIENT_FUNDS: 'Недостаточно средств для покупки',
  INSUFFICIENT_SUPPLY: 'Недостаточно доступных единиц',
  INSUFFICIENT_POSITION: 'Нельзя продать больше, чем есть в портфеле',
}

export interface TradeOrder {
  tickerId: TickerId
  side: TradeSide
  quantity: number
}

export interface TradeQuote extends TradeOrder {
  tickerCode: string
  priceKopecks: Kopecks
  totalKopecks: Kopecks
}

export interface MarketSnapshot {
  tickers: readonly Ticker[]
  portfolio: Portfolio
}

export interface TradeOutcome {
  quote: TradeQuote
  tickers: Ticker[]
  portfolio: Portfolio
}

export function isValidQuantity(quantity: number): boolean {
  return Number.isSafeInteger(quantity) && quantity > 0
}

/** Максимальное количество, доступное для сделки в указанном направлении. */
export function maxTradeQuantity(ticker: Ticker, portfolio: Portfolio, side: TradeSide): number {
  if (side === 'sell') return getPositionQuantity(portfolio, ticker.id)
  const affordable = Math.floor(portfolio.cashKopecks / ticker.priceKopecks)
  return Math.max(0, Math.min(ticker.availableQuantity, affordable))
}

/** Проверяет сделку по фиксированной цене тикера, не изменяя данные. */
export function quoteTrade(
  ticker: Ticker,
  portfolio: Portfolio,
  order: Omit<TradeOrder, 'tickerId'>,
): Result<TradeQuote, TradeRejection> {
  if (!isValidQuantity(order.quantity)) return err('INVALID_QUANTITY')

  const totalKopecks = multiplyMoney(ticker.priceKopecks, order.quantity)

  if (order.side === 'buy') {
    if (order.quantity > ticker.availableQuantity) return err('INSUFFICIENT_SUPPLY')
    if (totalKopecks > portfolio.cashKopecks) return err('INSUFFICIENT_FUNDS')
  } else if (order.quantity > getPositionQuantity(portfolio, ticker.id)) {
    return err('INSUFFICIENT_POSITION')
  }

  return ok({
    tickerId: ticker.id,
    tickerCode: ticker.code,
    side: order.side,
    quantity: order.quantity,
    priceKopecks: ticker.priceKopecks,
    totalKopecks,
  })
}

function applyPositionDelta(positions: readonly Position[], tickerId: TickerId, delta: number): Position[] {
  const current = positions.find((position) => position.tickerId === tickerId)?.quantity ?? 0
  const next = current + delta
  const rest = positions.filter((position) => position.tickerId !== tickerId)
  return next > 0 ? [...rest, { tickerId, quantity: next }] : rest
}

/**
 * Исполняет сделку и возвращает новое состояние целиком: баланс, позицию и остаток.
 * Исходные данные не изменяются, при отказе состояние не меняется вовсе.
 */
export function executeTrade(snapshot: MarketSnapshot, order: TradeOrder): Result<TradeOutcome, TradeRejection> {
  const ticker = snapshot.tickers.find((candidate) => candidate.id === order.tickerId)
  if (!ticker) return err('TICKER_NOT_FOUND')

  const quoted = quoteTrade(ticker, snapshot.portfolio, order)
  if (!quoted.ok) return quoted
  const quote = quoted.value

  const sign = order.side === 'buy' ? 1 : -1
  const tickers = snapshot.tickers.map((candidate) =>
    candidate.id === ticker.id
      ? { ...candidate, availableQuantity: candidate.availableQuantity - sign * quote.quantity }
      : candidate,
  )
  const portfolio: Portfolio = {
    cashKopecks: snapshot.portfolio.cashKopecks - sign * quote.totalKopecks,
    positions: applyPositionDelta(snapshot.portfolio.positions, ticker.id, sign * quote.quantity),
  }

  return ok({ quote, tickers, portfolio })
}
