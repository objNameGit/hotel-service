import { useEffect } from 'react'
import { createExchangeService } from '@/services'
import { createExchangeStore } from './exchange-store'
import { createSessionStore } from './session-store'

export type { Loadable } from './exchange-store'

export const exchangeService = createExchangeService()

export const useSessionStore = createSessionStore(exchangeService)
export const useExchangeStore = createExchangeStore(exchangeService)

/** Список тикеров; при монтировании обновляется в фоне, показывая закешированные данные. */
export function useTickers() {
  const tickers = useExchangeStore((state) => state.tickers)
  const loadTickers = useExchangeStore((state) => state.loadTickers)
  useEffect(() => {
    void loadTickers()
  }, [loadTickers])
  return tickers
}

export function usePortfolio() {
  const portfolio = useExchangeStore((state) => state.portfolio)
  const loadPortfolio = useExchangeStore((state) => state.loadPortfolio)
  useEffect(() => {
    void loadPortfolio()
  }, [loadPortfolio])
  return portfolio
}
