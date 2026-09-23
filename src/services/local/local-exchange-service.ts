import { todayCalendarDate } from '@/domain/calendar-date'
import { PROCESSED_OPERATIONS_LIMIT, findInvariantViolations, type ExchangeState } from '@/domain/exchange-state'
import type { Portfolio } from '@/domain/portfolio'
import { createInitialState } from '@/domain/seed'
import type { DemoSession, Role } from '@/domain/session'
import type { Ticker, TickerId } from '@/domain/ticker'
import { executeTrade, type TradeSide } from '@/domain/trading'
import { VALIDATION_MESSAGES, createTickerInputSchema } from '@/domain/validation'
import { ServiceError, type FieldErrors } from '../errors'
import type { CreateTickerInput, Credentials, ExchangeService, TradeReceipt, TradeRequest } from '../exchange-service'
import { findDemoAccount } from './demo-accounts'
import { demoSessionSchema, exchangeStateSchema } from './schemas'
import { VersionedStorage, type Migrations } from './versioned-storage'

export const STATE_STORAGE_KEY = 'hotel-exchange:state'
export const SESSION_STORAGE_KEY = 'hotel-exchange:session'
export const STATE_VERSION = 1
const SESSION_VERSION = 1
const LOCK_NAME = 'hotel-exchange:state'

/** Миграции формата сохранённого состояния; ключ — исходная версия. */
const STATE_MIGRATIONS: Migrations = {}

export interface LocalExchangeServiceOptions {
  stateStorage: Storage
  sessionStorage: Storage
  /** Имитация сетевой задержки, чтобы в интерфейсе были видны состояния ожидания. */
  latencyMs?: number
  now?: () => Date
  generateId?: () => string
  /** Межвкладочная блокировка. Если не задана, операции сериализуются в пределах вкладки. */
  locks?: Pick<LockManager, 'request'>
  /** Источник событий `storage` для синхронизации между вкладками. */
  eventTarget?: Pick<Window, 'addEventListener' | 'removeEventListener'>
}

const clone = <T>(value: T): T => structuredClone(value)

export class LocalExchangeService implements ExchangeService {
  private readonly state: VersionedStorage<ExchangeState>
  private readonly session: VersionedStorage<DemoSession>
  private readonly latencyMs: number
  private readonly now: () => Date
  private readonly generateId: () => string
  private readonly locks?: Pick<LockManager, 'request'>
  private readonly eventTarget?: Pick<Window, 'addEventListener' | 'removeEventListener'>
  private queue: Promise<unknown> = Promise.resolve()

  constructor(options: LocalExchangeServiceOptions) {
    this.state = new VersionedStorage({
      storage: options.stateStorage,
      key: STATE_STORAGE_KEY,
      version: STATE_VERSION,
      schema: exchangeStateSchema,
      migrations: STATE_MIGRATIONS,
      validate: findInvariantViolations,
    })
    this.session = new VersionedStorage({
      storage: options.sessionStorage,
      key: SESSION_STORAGE_KEY,
      version: SESSION_VERSION,
      schema: demoSessionSchema,
    })
    this.latencyMs = options.latencyMs ?? 0
    this.now = options.now ?? (() => new Date())
    this.generateId = options.generateId ?? (() => crypto.randomUUID())
    this.locks = options.locks
    this.eventTarget = options.eventTarget
  }

  // --- Авторизация -------------------------------------------------------

  async getSession(): Promise<DemoSession | null> {
    const loaded = this.session.load()
    if (loaded.status === 'invalid') this.session.clear()
    return loaded.status === 'ok' ? loaded.data : null
  }

  async login({ email, password }: Credentials): Promise<DemoSession> {
    await this.simulateLatency()
    const account = findDemoAccount(email, password)
    if (!account) throw new ServiceError('INVALID_CREDENTIALS')
    return this.startSession(account.role)
  }

  async logout(): Promise<void> {
    this.session.clear()
  }

  async switchRole(role: Role): Promise<DemoSession> {
    await this.requireSession()
    return this.startSession(role)
  }

  // --- Рынок --------------------------------------------------------------

  async listTickers(): Promise<Ticker[]> {
    await this.simulateLatency()
    return clone(this.readState().tickers)
  }

  async getTicker(id: TickerId): Promise<Ticker | null> {
    await this.simulateLatency()
    const ticker = this.readState().tickers.find((candidate) => candidate.id === id)
    return ticker ? clone(ticker) : null
  }

  async createTicker(input: CreateTickerInput): Promise<Ticker> {
    await this.requireRole('admin')
    const parsed = createTickerInputSchema(() => todayCalendarDate(this.now())).safeParse(input)
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? 'form')
        fieldErrors[field] ??= issue.message
      }
      throw new ServiceError('VALIDATION', { fieldErrors })
    }

    return this.exclusive(async () => {
      await this.simulateLatency()
      const state = this.readState()
      const data = parsed.data
      if (state.tickers.some((ticker) => ticker.code === data.code)) {
        throw new ServiceError('TICKER_CODE_TAKEN', { fieldErrors: { code: VALIDATION_MESSAGES.codeTaken } })
      }
      const ticker: Ticker = {
        id: this.generateId(),
        code: data.code,
        hotel: data.hotel,
        city: data.city,
        roomCategory: data.roomCategory,
        nightDate: data.nightDate,
        priceKopecks: data.priceKopecks,
        issuedQuantity: data.quantity,
        availableQuantity: data.quantity,
      }
      this.writeState({ ...state, tickers: [...state.tickers, ticker] })
      return clone(ticker)
    })
  }

  // --- Портфель и сделки --------------------------------------------------

  async getPortfolio(): Promise<Portfolio> {
    await this.requireRole('user')
    await this.simulateLatency()
    return clone(this.readState().portfolio)
  }

  buy(request: TradeRequest): Promise<TradeReceipt> {
    return this.trade('buy', request)
  }

  sell(request: TradeRequest): Promise<TradeReceipt> {
    return this.trade('sell', request)
  }

  private async trade(side: TradeSide, request: TradeRequest): Promise<TradeReceipt> {
    await this.requireRole('user')
    return this.exclusive(async () => {
      await this.simulateLatency()
      const state = this.readState()
      if (state.processedOperationIds.includes(request.operationId)) {
        throw new ServiceError('DUPLICATE_OPERATION')
      }

      const result = executeTrade(state, { tickerId: request.tickerId, quantity: request.quantity, side })
      if (!result.ok) throw new ServiceError(result.error)

      const { quote, tickers, portfolio } = result.value
      this.writeState({
        tickers,
        portfolio,
        processedOperationIds: [...state.processedOperationIds, request.operationId].slice(-PROCESSED_OPERATIONS_LIMIT),
      })

      const ticker = tickers.find((candidate) => candidate.id === quote.tickerId)
      if (!ticker) throw new ServiceError('TICKER_NOT_FOUND')
      return clone({ quote, ticker, portfolio })
    })
  }

  // --- Демо ---------------------------------------------------------------

  async resetDemo(): Promise<void> {
    await this.requireRole('admin')
    await this.exclusive(async () => {
      await this.simulateLatency()
      this.writeState(this.createInitialState())
    })
  }

  async repairStorage(): Promise<void> {
    await this.exclusive(async () => {
      if (this.state.load().status === 'invalid') this.writeState(this.createInitialState())
    })
  }

  subscribe(listener: () => void): () => void {
    const target = this.eventTarget
    if (!target) return () => {}
    const handler = (event: StorageEvent) => {
      if (event.key === STATE_STORAGE_KEY || event.key === null) listener()
    }
    target.addEventListener('storage', handler)
    return () => target.removeEventListener('storage', handler)
  }

  // --- Внутреннее ---------------------------------------------------------

  private createInitialState(): ExchangeState {
    return createInitialState(todayCalendarDate(this.now()))
  }

  private readState(): ExchangeState {
    const loaded = this.state.load()
    switch (loaded.status) {
      case 'ok':
        return loaded.data
      case 'empty': {
        const initial = this.createInitialState()
        this.writeState(initial)
        return initial
      }
      case 'invalid':
        throw new ServiceError('STORAGE_CORRUPTED', { cause: loaded.reason })
    }
  }

  private writeState(state: ExchangeState): void {
    const violations = findInvariantViolations(state)
    if (violations.length > 0) {
      throw new ServiceError('UNKNOWN', { cause: violations })
    }
    this.state.save(state)
  }

  private startSession(role: Role): DemoSession {
    const session: DemoSession = { role }
    this.session.save(session)
    return session
  }

  private async requireSession(): Promise<DemoSession> {
    const session = await this.getSession()
    if (!session) throw new ServiceError('UNAUTHORIZED')
    return session
  }

  private async requireRole(role: Role): Promise<DemoSession> {
    const session = await this.requireSession()
    if (session.role !== role) throw new ServiceError('FORBIDDEN')
    return session
  }

  /** Операции записи выполняются строго последовательно: чтение → проверка → одна запись. */
  private exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = () => (this.locks ? this.locks.request(LOCK_NAME, task) : task())
    const result = this.queue.then(run, run) as Promise<T>
    this.queue = result.catch(() => undefined)
    return result
  }

  private async simulateLatency(): Promise<void> {
    if (this.latencyMs > 0) await new Promise((resolve) => setTimeout(resolve, this.latencyMs))
  }
}
