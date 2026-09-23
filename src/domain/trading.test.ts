import { describe, expect, it } from 'vitest'
import { findInvariantViolations, type ExchangeState } from './exchange-state'
import { rubles } from './money'
import { getPositionQuantity, valuePortfolio, type Portfolio } from './portfolio'
import { createInitialState } from './seed'
import type { Ticker } from './ticker'
import { executeTrade, maxTradeQuantity, quoteTrade, type MarketSnapshot, type TradeOrder } from './trading'

const ticker: Ticker = {
  id: 't1',
  code: 'AURORA-STD-20261015',
  hotel: 'Aurora Grand',
  city: 'Санкт-Петербург',
  roomCategory: 'Стандарт',
  nightDate: '2026-10-15',
  priceKopecks: rubles(5_000),
  issuedQuantity: 10,
  availableQuantity: 10,
}

const initialSnapshot = (): MarketSnapshot => ({
  tickers: [ticker],
  portfolio: { cashKopecks: rubles(100_000), positions: [] },
})

function trade(snapshot: MarketSnapshot, order: Omit<TradeOrder, 'tickerId'>) {
  const result = executeTrade(snapshot, { tickerId: 't1', ...order })
  if (!result.ok) throw new Error(`Сделка отклонена: ${result.error}`)
  return result.value
}

const toState = (snapshot: MarketSnapshot): ExchangeState => ({
  tickers: [...snapshot.tickers],
  portfolio: snapshot.portfolio,
  processedOperationIds: [],
})

describe('контрольный расчёт из ТЗ', () => {
  it('покупка 2 × 5 000 ₽ и продажа 1 сохраняют общую стоимость 100 000 ₽', () => {
    const afterBuy = trade(initialSnapshot(), { side: 'buy', quantity: 2 })
    expect(afterBuy.portfolio.cashKopecks).toBe(rubles(90_000))
    expect(getPositionQuantity(afterBuy.portfolio, 't1')).toBe(2)
    expect(afterBuy.tickers[0]?.availableQuantity).toBe(8)
    expect(valuePortfolio(afterBuy.portfolio, afterBuy.tickers).totalKopecks).toBe(rubles(100_000))

    const afterSell = trade(afterBuy, { side: 'sell', quantity: 1 })
    expect(afterSell.portfolio.cashKopecks).toBe(rubles(95_000))
    expect(getPositionQuantity(afterSell.portfolio, 't1')).toBe(1)
    expect(afterSell.tickers[0]?.availableQuantity).toBe(9)
    expect(valuePortfolio(afterSell.portfolio, afterSell.tickers).totalKopecks).toBe(rubles(100_000))
  })
})

describe('executeTrade', () => {
  it('продажа всей позиции удаляет её и возвращает деньги и остаток', () => {
    const afterBuy = trade(initialSnapshot(), { side: 'buy', quantity: 3 })
    const afterSell = trade(afterBuy, { side: 'sell', quantity: 3 })
    expect(afterSell.portfolio.positions).toEqual([])
    expect(afterSell.portfolio.cashKopecks).toBe(rubles(100_000))
    expect(afterSell.tickers[0]?.availableQuantity).toBe(10)
  })

  it('не изменяет исходное состояние', () => {
    const snapshot = initialSnapshot()
    const frozen = structuredClone(snapshot)
    trade(snapshot, { side: 'buy', quantity: 2 })
    expect(snapshot).toEqual(frozen)
  })

  it.each([
    [{ side: 'buy', quantity: 0 }, 'INVALID_QUANTITY'],
    [{ side: 'buy', quantity: -1 }, 'INVALID_QUANTITY'],
    [{ side: 'buy', quantity: 1.5 }, 'INVALID_QUANTITY'],
    [{ side: 'buy', quantity: 11 }, 'INSUFFICIENT_SUPPLY'],
    [{ side: 'sell', quantity: 1 }, 'INSUFFICIENT_POSITION'],
  ] as const)('отклоняет %o с ошибкой %s', (order, expected) => {
    const result = executeTrade(initialSnapshot(), { tickerId: 't1', ...order })
    expect(result).toEqual({ ok: false, error: expected })
  })

  it('отклоняет покупку при недостатке денег', () => {
    const poor: Portfolio = { cashKopecks: rubles(9_999), positions: [] }
    const result = executeTrade({ tickers: [ticker], portfolio: poor }, { tickerId: 't1', side: 'buy', quantity: 2 })
    expect(result).toEqual({ ok: false, error: 'INSUFFICIENT_FUNDS' })
  })

  it('отклоняет продажу сверх позиции', () => {
    const afterBuy = trade(initialSnapshot(), { side: 'buy', quantity: 2 })
    const result = executeTrade(afterBuy, { tickerId: 't1', side: 'sell', quantity: 3 })
    expect(result).toEqual({ ok: false, error: 'INSUFFICIENT_POSITION' })
  })

  it('отклоняет неизвестный тикер', () => {
    const result = executeTrade(initialSnapshot(), { tickerId: 'missing', side: 'buy', quantity: 1 })
    expect(result).toEqual({ ok: false, error: 'TICKER_NOT_FOUND' })
  })

  it('сохраняет инвариант «доступно + в портфеле = выпущено» после серии сделок', () => {
    let snapshot: MarketSnapshot = initialSnapshot()
    for (const order of [
      { side: 'buy', quantity: 4 },
      { side: 'sell', quantity: 1 },
      { side: 'buy', quantity: 6 },
      { side: 'sell', quantity: 9 },
    ] as const) {
      snapshot = trade(snapshot, order)
      expect(findInvariantViolations(toState(snapshot))).toEqual([])
    }
  })
})

describe('quoteTrade и maxTradeQuantity', () => {
  it('считает итог по фиксированной цене', () => {
    const quote = quoteTrade(ticker, initialSnapshot().portfolio, { side: 'buy', quantity: 3 })
    expect(quote.ok && quote.value.totalKopecks).toBe(rubles(15_000))
  })

  it('ограничивает покупку остатком и деньгами', () => {
    expect(maxTradeQuantity(ticker, { cashKopecks: rubles(100_000), positions: [] }, 'buy')).toBe(10)
    expect(maxTradeQuantity(ticker, { cashKopecks: rubles(12_000), positions: [] }, 'buy')).toBe(2)
    expect(maxTradeQuantity(ticker, { cashKopecks: 0, positions: [{ tickerId: 't1', quantity: 4 }] }, 'sell')).toBe(4)
  })
})

describe('начальное состояние', () => {
  it('соответствует требованиям ТЗ', () => {
    const state = createInitialState('2026-09-23')
    expect(state.tickers).toHaveLength(5)
    expect(new Set(state.tickers.map((t) => t.hotel)).size).toBeGreaterThanOrEqual(2)
    expect(new Set(state.tickers.map((t) => t.priceKopecks)).size).toBe(5)
    for (const t of state.tickers) {
      expect(t.issuedQuantity).toBe(20)
      expect(t.availableQuantity).toBe(20)
      expect(t.priceKopecks).toBeGreaterThanOrEqual(rubles(3_000))
      expect(t.priceKopecks).toBeLessThanOrEqual(rubles(12_000))
      expect(t.nightDate >= '2026-10-23' && t.nightDate <= '2026-11-22').toBe(true)
    }
    expect(state.portfolio).toEqual({ cashKopecks: rubles(100_000), positions: [] })
    expect(findInvariantViolations(state)).toEqual([])
  })
})
