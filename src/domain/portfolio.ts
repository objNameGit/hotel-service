import { multiplyMoney, type Kopecks } from './money'
import { compareTickers, type Ticker, type TickerId } from './ticker'

export interface Position {
  tickerId: TickerId
  quantity: number
}

export interface Portfolio {
  cashKopecks: Kopecks
  positions: Position[]
}

export interface PositionValuation {
  ticker: Ticker
  quantity: number
  valueKopecks: Kopecks
}

export interface PortfolioValuation {
  cashKopecks: Kopecks
  assetsKopecks: Kopecks
  totalKopecks: Kopecks
  positions: PositionValuation[]
}

export function getPositionQuantity(portfolio: Portfolio, tickerId: TickerId): number {
  return portfolio.positions.find((position) => position.tickerId === tickerId)?.quantity ?? 0
}

/** Оценка портфеля по фиксированным ценам тикеров. Нулевые позиции не включаются. */
export function valuePortfolio(portfolio: Portfolio, tickers: readonly Ticker[]): PortfolioValuation {
  const tickersById = new Map(tickers.map((ticker) => [ticker.id, ticker]))
  const positions: PositionValuation[] = []

  for (const position of portfolio.positions) {
    const ticker = tickersById.get(position.tickerId)
    if (!ticker || position.quantity <= 0) continue
    positions.push({
      ticker,
      quantity: position.quantity,
      valueKopecks: multiplyMoney(ticker.priceKopecks, position.quantity),
    })
  }

  positions.sort((a, b) => compareTickers(a.ticker, b.ticker))

  const assetsKopecks = positions.reduce((sum, position) => sum + position.valueKopecks, 0)
  return {
    cashKopecks: portfolio.cashKopecks,
    assetsKopecks,
    totalKopecks: portfolio.cashKopecks + assetsKopecks,
    positions,
  }
}
