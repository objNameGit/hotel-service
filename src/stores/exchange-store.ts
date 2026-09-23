import { create } from 'zustand'
import type { Portfolio } from '@/domain/portfolio'
import type { Ticker } from '@/domain/ticker'
import type { TradeSide } from '@/domain/trading'
import {
  isServiceError,
  toServiceError,
  type CreateTickerInput,
  type ExchangeService,
  type ServiceError,
  type TradeReceipt,
  type TradeRequest,
} from '@/services'

export interface Loadable<T> {
  status: 'idle' | 'loading' | 'ready' | 'error'
  data: T | null
  error: ServiceError | null
}

const idle = <T>(): Loadable<T> => ({ status: 'idle', data: null, error: null })

export interface ExchangeStoreState {
  tickers: Loadable<Ticker[]>
  portfolio: Loadable<Portfolio>
  /** Сохранённые данные повреждены или несовместимы — нужно предложить сброс. */
  storageCorrupted: boolean
  loadTickers(): Promise<void>
  loadPortfolio(): Promise<void>
  createTicker(input: CreateTickerInput): Promise<Ticker>
  trade(side: TradeSide, request: TradeRequest): Promise<TradeReceipt>
  resetDemo(): Promise<void>
  repairStorage(): Promise<void>
  /** Помечает данные устаревшими и перезагружает уже запрошенные. */
  refresh(): Promise<void>
}

export const createExchangeStore = (service: ExchangeService) =>
  create<ExchangeStoreState>()((set, get) => {
    const fail = (error: unknown): ServiceError => {
      const serviceError = toServiceError(error)
      if (isServiceError(serviceError, 'STORAGE_CORRUPTED')) set({ storageCorrupted: true })
      return serviceError
    }

    const load = async <K extends 'tickers' | 'portfolio'>(
      key: K,
      fetch: () => Promise<NonNullable<ExchangeStoreState[K]['data']>>,
    ) => {
      set((state) => ({ [key]: { ...state[key], status: 'loading', error: null } }) as Partial<ExchangeStoreState>)
      try {
        const data = await fetch()
        set({ [key]: { status: 'ready', data, error: null } } as Partial<ExchangeStoreState>)
      } catch (error) {
        const serviceError = fail(error)
        set(
          (state) =>
            ({ [key]: { ...state[key], status: 'error', error: serviceError } }) as Partial<ExchangeStoreState>,
        )
      }
    }

    return {
      tickers: idle(),
      portfolio: idle(),
      storageCorrupted: false,

      loadTickers: () => load('tickers', () => service.listTickers()),
      loadPortfolio: () => load('portfolio', () => service.getPortfolio()),

      async createTicker(input) {
        try {
          const ticker = await service.createTicker(input)
          set((state) => ({
            tickers: { status: 'ready', error: null, data: [...(state.tickers.data ?? []), ticker] },
          }))
          return ticker
        } catch (error) {
          throw fail(error)
        }
      },

      async trade(side, request) {
        try {
          const receipt = side === 'buy' ? await service.buy(request) : await service.sell(request)
          set((state) => ({
            tickers: {
              ...state.tickers,
              data:
                state.tickers.data?.map((ticker) => (ticker.id === receipt.ticker.id ? receipt.ticker : ticker)) ??
                null,
            },
            portfolio: { status: 'ready', data: receipt.portfolio, error: null },
          }))
          return receipt
        } catch (error) {
          const serviceError = fail(error)
          void get().refresh()
          throw serviceError
        }
      },

      async resetDemo() {
        try {
          await service.resetDemo()
        } catch (error) {
          throw fail(error)
        }
        set({ portfolio: idle() })
        await get().loadTickers()
      },

      async repairStorage() {
        await service.repairStorage()
        const portfolioRequested = get().portfolio.status !== 'idle'
        set({ storageCorrupted: false, tickers: idle(), portfolio: idle() })
        await Promise.all([get().loadTickers(), portfolioRequested ? get().loadPortfolio() : undefined])
      },

      async refresh() {
        const { tickers, portfolio, loadTickers, loadPortfolio } = get()
        await Promise.all([
          tickers.status !== 'idle' ? loadTickers() : undefined,
          portfolio.status !== 'idle' ? loadPortfolio() : undefined,
        ])
      },
    }
  })
