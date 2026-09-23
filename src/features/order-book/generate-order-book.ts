import type { Kopecks } from '@/domain/money'
import type { Ticker } from '@/domain/ticker'

export interface OrderBookLevel {
  priceKopecks: Kopecks
  quantity: number
  /** Накопленный объём от лучшей цены до этого уровня. */
  cumulativeQuantity: number
  /** Глубина уровня относительно максимального накопленного объёма, 0…1. */
  depth: number
}

export interface DemoOrderBookData {
  referencePriceKopecks: Kopecks
  /** Уровни покупки, от лучшей (высшей) цены. */
  bids: OrderBookLevel[]
  /** Уровни продажи, от лучшей (низшей) цены. */
  asks: OrderBookLevel[]
  spreadKopecks: Kopecks
  spreadPercent: number
}

export const ORDER_BOOK_LEVELS = 5
const STEP_RATIO = 0.004
const MAX_LEVEL_QUANTITY = 12

/** FNV-1a: стабильный хеш строки для сида. */
function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Mulberry32: детерминированный генератор псевдослучайных чисел. */
function createRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function priceStep(price: Kopecks): Kopecks {
  const rubleRounded = Math.round((price * STEP_RATIO) / 100) * 100
  return Math.max(1, rubleRounded || Math.round(price * STEP_RATIO))
}

/**
 * Стабильные демонстрационные уровни вокруг фиксированной цены тикера.
 * Для одного тикера всегда одинаковы; не участвуют в исполнении сделок.
 */
export function generateOrderBook(
  ticker: Pick<Ticker, 'id' | 'priceKopecks'>,
  levels: number = ORDER_BOOK_LEVELS,
): DemoOrderBookData {
  const random = createRandom(hashString(ticker.id))
  const step = priceStep(ticker.priceKopecks)
  const quantity = () => 1 + Math.floor(random() * MAX_LEVEL_QUANTITY)

  const side = (direction: 1 | -1) => {
    let cumulative = 0
    return Array.from({ length: levels }, (_, index) => ticker.priceKopecks + direction * step * (index + 1))
      .filter((price) => price > 0)
      .map((priceKopecks) => {
        const levelQuantity = quantity()
        cumulative += levelQuantity
        return { priceKopecks, quantity: levelQuantity, cumulativeQuantity: cumulative, depth: 0 }
      })
  }

  const asks = side(1)
  const bids = side(-1)
  const maxCumulative = Math.max(1, ...[...asks, ...bids].map((level) => level.cumulativeQuantity))
  for (const level of [...asks, ...bids]) level.depth = level.cumulativeQuantity / maxCumulative

  const bestAsk = asks[0]?.priceKopecks ?? ticker.priceKopecks
  const bestBid = bids[0]?.priceKopecks ?? ticker.priceKopecks
  const spreadKopecks = bestAsk - bestBid

  return {
    referencePriceKopecks: ticker.priceKopecks,
    bids,
    asks,
    spreadKopecks,
    spreadPercent: (spreadKopecks / ticker.priceKopecks) * 100,
  }
}
