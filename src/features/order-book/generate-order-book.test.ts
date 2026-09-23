import { describe, expect, it } from 'vitest'
import { rubles } from '@/domain/money'
import { generateOrderBook } from './generate-order-book'

const ticker = { id: 'seed-aurora-std', priceKopecks: rubles(5_000) }

describe('generateOrderBook', () => {
  it('генерирует по пять уровней покупки и продажи вокруг цены', () => {
    const book = generateOrderBook(ticker)
    expect(book.bids).toHaveLength(5)
    expect(book.asks).toHaveLength(5)
    expect(book.asks.every((level) => level.priceKopecks > ticker.priceKopecks)).toBe(true)
    expect(book.bids.every((level) => level.priceKopecks < ticker.priceKopecks)).toBe(true)
    expect(book.asks.map((l) => l.priceKopecks)).toEqual(
      [...book.asks.map((l) => l.priceKopecks)].sort((a, b) => a - b),
    )
    expect(book.bids.map((l) => l.priceKopecks)).toEqual(
      [...book.bids.map((l) => l.priceKopecks)].sort((a, b) => b - a),
    )
  })

  it('стабилен для одного тикера', () => {
    expect(generateOrderBook(ticker)).toEqual(generateOrderBook(ticker))
  })

  it('отличается для разных тикеров', () => {
    const other = generateOrderBook({ ...ticker, id: 'seed-laguna-std' })
    expect(other.bids.map((l) => l.quantity)).not.toEqual(generateOrderBook(ticker).bids.map((l) => l.quantity))
  })

  it('считает накопленный объём, глубину и спред', () => {
    const book = generateOrderBook(ticker)
    let cumulative = 0
    for (const level of book.asks) {
      cumulative += level.quantity
      expect(level.cumulativeQuantity).toBe(cumulative)
      expect(level.depth).toBeGreaterThan(0)
      expect(level.depth).toBeLessThanOrEqual(1)
    }
    expect(Math.max(...[...book.asks, ...book.bids].map((l) => l.depth))).toBe(1)
    expect(book.spreadKopecks).toBe((book.asks[0]?.priceKopecks ?? 0) - (book.bids[0]?.priceKopecks ?? 0))
  })

  it('не создаёт уровни с неположительной ценой', () => {
    const book = generateOrderBook({ id: 'cheap', priceKopecks: 3 })
    expect(book.bids.every((level) => level.priceKopecks > 0)).toBe(true)
  })
})
