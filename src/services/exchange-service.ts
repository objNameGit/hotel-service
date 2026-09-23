import type { Portfolio } from '@/domain/portfolio'
import type { DemoSession, Role } from '@/domain/session'
import type { Ticker, TickerId } from '@/domain/ticker'
import type { TradeOrder, TradeQuote } from '@/domain/trading'
import type { CreateTickerInput } from '@/domain/validation'

export type { CreateTickerInput }

export interface Credentials {
  email: string
  password: string
}

export interface TradeRequest extends Omit<TradeOrder, 'side'> {
  /** Уникален для каждой подтверждённой операции; повтор с тем же id отклоняется. */
  operationId: string
}

export interface TradeReceipt {
  quote: TradeQuote
  ticker: Ticker
  portfolio: Portfolio
}

export interface AuthApi {
  getSession(): Promise<DemoSession | null>
  login(credentials: Credentials): Promise<DemoSession>
  logout(): Promise<void>
  /** Инструмент демонстрации: смена роли без повторного ввода пароля. */
  switchRole(role: Role): Promise<DemoSession>
}

export interface MarketApi {
  listTickers(): Promise<Ticker[]>
  getTicker(id: TickerId): Promise<Ticker | null>
  createTicker(input: CreateTickerInput): Promise<Ticker>
}

export interface PortfolioApi {
  getPortfolio(): Promise<Portfolio>
}

export interface TradingApi {
  buy(request: TradeRequest): Promise<TradeReceipt>
  sell(request: TradeRequest): Promise<TradeReceipt>
}

export interface DemoApi {
  resetDemo(): Promise<void>
  /** Восстанавливает исходное состояние, если сохранённые данные повреждены или несовместимы. */
  repairStorage(): Promise<void>
  /** Уведомляет об изменениях данных извне (например, из другой вкладки). */
  subscribe(listener: () => void): () => void
}

/**
 * Контракт операций с данными. UI зависит только от этого интерфейса;
 * текущая реализация локальная, HTTP-реализацию можно подставить без изменений страниц.
 */
export interface ExchangeService extends AuthApi, MarketApi, PortfolioApi, TradingApi, DemoApi {}
