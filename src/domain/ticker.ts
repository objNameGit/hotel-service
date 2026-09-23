import type { CalendarDate } from './calendar-date'
import type { Kopecks } from './money'

export type TickerId = string

/** Одна единица тикера — право на одну ночь в номере категории отеля на конкретную дату. */
export interface Ticker {
  id: TickerId
  code: string
  hotel: string
  city: string
  roomCategory: string
  nightDate: CalendarDate
  priceKopecks: Kopecks
  issuedQuantity: number
  availableQuantity: number
}

export const TICKER_CODE_MIN_LENGTH = 3
export const TICKER_CODE_MAX_LENGTH = 40
export const TICKER_CODE_PATTERN = /^[A-Za-z0-9-]+$/

export function normalizeTickerCode(code: string): string {
  return code.trim().toUpperCase()
}

export function isSoldOut(ticker: Pick<Ticker, 'availableQuantity'>): boolean {
  return ticker.availableQuantity === 0
}

export function compareTickers(a: Ticker, b: Ticker): number {
  return a.nightDate.localeCompare(b.nightDate) || a.code.localeCompare(b.code)
}

export function matchesTickerQuery(ticker: Ticker, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase('ru-RU')
  if (!needle) return true
  return [ticker.code, ticker.hotel, ticker.city].some((field) => field.toLocaleLowerCase('ru-RU').includes(needle))
}
