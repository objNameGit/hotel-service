import { addDays, toCompactDate, type CalendarDate } from './calendar-date'
import type { ExchangeState } from './exchange-state'
import { rubles } from './money'
import type { Ticker } from './ticker'

export const INITIAL_CASH = rubles(100_000)
export const INITIAL_TICKER_QUANTITY = 20

interface SeedTicker {
  id: string
  prefix: string
  hotel: string
  city: string
  roomCategory: string
  daysFromToday: number
  priceRubles: number
}

/** Вымышленные отели; даты — через 30–60 дней после инициализации. */
const SEED_TICKERS: readonly SeedTicker[] = [
  {
    id: 'seed-aurora-std',
    prefix: 'AURORA-STD',
    hotel: 'Aurora Grand',
    city: 'Санкт-Петербург',
    roomCategory: 'Стандарт',
    daysFromToday: 30,
    priceRubles: 5_000,
  },
  {
    id: 'seed-aurora-dlx',
    prefix: 'AURORA-DLX',
    hotel: 'Aurora Grand',
    city: 'Санкт-Петербург',
    roomCategory: 'Делюкс',
    daysFromToday: 38,
    priceRubles: 8_400,
  },
  {
    id: 'seed-aurora-ste',
    prefix: 'AURORA-STE',
    hotel: 'Aurora Grand',
    city: 'Санкт-Петербург',
    roomCategory: 'Люкс',
    daysFromToday: 45,
    priceRubles: 12_000,
  },
  {
    id: 'seed-laguna-std',
    prefix: 'LAGUNA-STD',
    hotel: 'Laguna Bay',
    city: 'Сочи',
    roomCategory: 'Стандарт',
    daysFromToday: 52,
    priceRubles: 3_200,
  },
  {
    id: 'seed-laguna-sea',
    prefix: 'LAGUNA-SEA',
    hotel: 'Laguna Bay',
    city: 'Сочи',
    roomCategory: 'Стандарт с видом на море',
    daysFromToday: 60,
    priceRubles: 6_750,
  },
]

export function createSeedTickers(today: CalendarDate): Ticker[] {
  return SEED_TICKERS.map((seed) => {
    const nightDate = addDays(today, seed.daysFromToday)
    return {
      id: seed.id,
      code: `${seed.prefix}-${toCompactDate(nightDate)}`,
      hotel: seed.hotel,
      city: seed.city,
      roomCategory: seed.roomCategory,
      nightDate,
      priceKopecks: rubles(seed.priceRubles),
      issuedQuantity: INITIAL_TICKER_QUANTITY,
      availableQuantity: INITIAL_TICKER_QUANTITY,
    }
  })
}

export function createInitialState(today: CalendarDate): ExchangeState {
  return {
    tickers: createSeedTickers(today),
    portfolio: { cashKopecks: INITIAL_CASH, positions: [] },
    processedOperationIds: [],
  }
}
