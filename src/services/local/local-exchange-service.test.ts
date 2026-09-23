import { beforeEach, describe, expect, it } from 'vitest'
import { rubles } from '@/domain/money'
import { MemoryStorage } from '@/test/memory-storage'
import { ServiceError, type ServiceErrorCode } from '../errors'
import type { CreateTickerInput, ExchangeService } from '../exchange-service'
import { LocalExchangeService, STATE_STORAGE_KEY } from './local-exchange-service'

const NOW = new Date(2026, 8, 23, 12, 0)

let stateStorage: MemoryStorage
let sessionStorage: MemoryStorage
let idCounter: number

function createService(latencyMs = 0): ExchangeService {
  return new LocalExchangeService({
    stateStorage,
    sessionStorage,
    latencyMs,
    now: () => NOW,
    generateId: () => `id-${++idCounter}`,
  })
}

async function expectServiceError(promise: Promise<unknown>, code: ServiceErrorCode): Promise<ServiceError> {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  )
  expect(error).toBeInstanceOf(ServiceError)
  expect((error as ServiceError).code).toBe(code)
  return error as ServiceError
}

const validTicker: CreateTickerInput = {
  code: 'nova-std-20261101',
  hotel: 'Nova Park',
  city: 'Казань',
  roomCategory: 'Стандарт',
  nightDate: '2026-11-01',
  quantity: 10,
  priceKopecks: rubles(4_500),
}

let seq = 0
const op = () => `op-${++seq}`

async function loginAs(service: ExchangeService, role: 'admin' | 'user') {
  await service.login({ email: `${role}@example.com`, password: 'demo123' })
}

beforeEach(() => {
  stateStorage = new MemoryStorage()
  sessionStorage = new MemoryStorage()
  idCounter = 0
})

describe('авторизация', () => {
  it('входит под обеими демо-учётными записями', async () => {
    const service = createService()
    expect(await service.login({ email: 'admin@example.com', password: 'demo123' })).toEqual({ role: 'admin' })
    expect(await service.login({ email: ' USER@example.com ', password: 'demo123' })).toEqual({ role: 'user' })
    expect(await service.getSession()).toEqual({ role: 'user' })
  })

  it('отклоняет неверные данные', async () => {
    const service = createService()
    await expectServiceError(service.login({ email: 'user@example.com', password: 'wrong' }), 'INVALID_CREDENTIALS')
    expect(await service.getSession()).toBeNull()
  })

  it('переключает роль без пароля и сохраняет данные', async () => {
    const service = createService()
    await loginAs(service, 'admin')
    await service.createTicker(validTicker)
    expect(await service.switchRole('user')).toEqual({ role: 'user' })
    expect((await service.listTickers()).map((t) => t.code)).toContain('NOVA-STD-20261101')
  })

  it('выход очищает сессию', async () => {
    const service = createService()
    await loginAs(service, 'user')
    await service.logout()
    expect(await service.getSession()).toBeNull()
    await expectServiceError(service.getPortfolio(), 'UNAUTHORIZED')
  })

  it('проверяет роль для операций', async () => {
    const service = createService()
    await loginAs(service, 'user')
    await expectServiceError(service.createTicker(validTicker), 'FORBIDDEN')
    await expectServiceError(service.resetDemo(), 'FORBIDDEN')
    await loginAs(service, 'admin')
    await expectServiceError(service.buy({ operationId: op(), tickerId: 'seed-aurora-std', quantity: 1 }), 'FORBIDDEN')
  })
})

describe('создание тикеров', () => {
  it('сохраняет код в верхнем регистре и делает весь выпуск доступным', async () => {
    const service = createService()
    await loginAs(service, 'admin')
    const ticker = await service.createTicker(validTicker)
    expect(ticker).toMatchObject({ code: 'NOVA-STD-20261101', issuedQuantity: 10, availableQuantity: 10 })
    expect(await service.getTicker(ticker.id)).toEqual(ticker)
  })

  it('отклоняет дубликат кода без учёта регистра', async () => {
    const service = createService()
    await loginAs(service, 'admin')
    await service.createTicker(validTicker)
    const error = await expectServiceError(
      service.createTicker({ ...validTicker, code: 'NOVA-std-20261101' }),
      'TICKER_CODE_TAKEN',
    )
    expect(error.fieldErrors.code).toBeDefined()
    expect(await service.listTickers()).toHaveLength(6)
  })

  it.each([
    ['прошедшую дату', { nightDate: '2026-09-22' }, 'nightDate'],
    ['отрицательную цену', { priceKopecks: -100 }, 'priceKopecks'],
    ['дробное количество', { quantity: 1.5 }, 'quantity'],
    ['нулевое количество', { quantity: 0 }, 'quantity'],
    ['короткий код', { code: 'AB' }, 'code'],
    ['недопустимые символы в коде', { code: 'ОТЕЛЬ_1' }, 'code'],
    ['пустой отель', { hotel: '   ' }, 'hotel'],
  ] as const)('отклоняет %s', async (_, patch, field) => {
    const service = createService()
    await loginAs(service, 'admin')
    const error = await expectServiceError(service.createTicker({ ...validTicker, ...patch }), 'VALIDATION')
    expect(error.fieldErrors[field]).toBeDefined()
    expect(await service.listTickers()).toHaveLength(5)
  })

  it('разрешает сегодняшнюю дату', async () => {
    const service = createService()
    await loginAs(service, 'admin')
    await expect(service.createTicker({ ...validTicker, nightDate: '2026-09-23' })).resolves.toBeDefined()
  })
})

describe('сделки', () => {
  const tickerId = 'seed-aurora-std'

  it('покупка и продажа по контрольному расчёту', async () => {
    const service = createService()
    await loginAs(service, 'user')

    const buy = await service.buy({ operationId: op(), tickerId, quantity: 2 })
    expect(buy.quote.totalKopecks).toBe(rubles(10_000))
    expect(buy.portfolio).toEqual({ cashKopecks: rubles(90_000), positions: [{ tickerId, quantity: 2 }] })
    expect(buy.ticker.availableQuantity).toBe(18)

    const sell = await service.sell({ operationId: op(), tickerId, quantity: 1 })
    expect(sell.portfolio).toEqual({ cashKopecks: rubles(95_000), positions: [{ tickerId, quantity: 1 }] })
    expect(sell.ticker.availableQuantity).toBe(19)
  })

  it('продажа всей позиции возвращает деньги и остаток', async () => {
    const service = createService()
    await loginAs(service, 'user')
    await service.buy({ operationId: op(), tickerId, quantity: 5 })
    const sell = await service.sell({ operationId: op(), tickerId, quantity: 5 })
    expect(sell.portfolio).toEqual({ cashKopecks: rubles(100_000), positions: [] })
    expect(sell.ticker.availableQuantity).toBe(20)
  })

  it('при недостатке денег сделка отклоняется без изменений', async () => {
    const service = createService()
    await loginAs(service, 'user')
    await service.listTickers()
    const before = stateStorage.getItem(STATE_STORAGE_KEY)
    // 9 × 12 000 ₽ = 108 000 ₽ > 100 000 ₽
    await expectServiceError(
      service.buy({ operationId: op(), tickerId: 'seed-aurora-ste', quantity: 9 }),
      'INSUFFICIENT_FUNDS',
    )
    expect(stateStorage.getItem(STATE_STORAGE_KEY)).toBe(before)
  })

  it('при недостатке доступных единиц сделка отклоняется без изменений', async () => {
    const service = createService()
    await loginAs(service, 'user')
    await service.listTickers()
    const before = stateStorage.getItem(STATE_STORAGE_KEY)
    await expectServiceError(
      service.buy({ operationId: op(), tickerId: 'seed-laguna-std', quantity: 21 }),
      'INSUFFICIENT_SUPPLY',
    )
    expect(stateStorage.getItem(STATE_STORAGE_KEY)).toBe(before)
  })

  it('продажа сверх позиции отклоняется без изменений', async () => {
    const service = createService()
    await loginAs(service, 'user')
    await service.buy({ operationId: op(), tickerId, quantity: 2 })
    const before = stateStorage.getItem(STATE_STORAGE_KEY)
    await expectServiceError(service.sell({ operationId: op(), tickerId, quantity: 3 }), 'INSUFFICIENT_POSITION')
    expect(stateStorage.getItem(STATE_STORAGE_KEY)).toBe(before)
  })

  it('повторная отправка той же операции не исполняет её дважды', async () => {
    const service = createService(5)
    await loginAs(service, 'user')
    const request = { operationId: op(), tickerId, quantity: 2 }

    const results = await Promise.allSettled([service.buy(request), service.buy(request), service.buy(request)])
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    const portfolio = await service.getPortfolio()
    expect(portfolio).toEqual({ cashKopecks: rubles(90_000), positions: [{ tickerId, quantity: 2 }] })
  })

  it('параллельные разные сделки перепроверяются последовательно', async () => {
    const service = createService(5)
    await loginAs(service, 'user')
    // Каждая покупка по отдельности допустима, вместе — нет: 12 000 × 5 × 2 = 120 000 ₽.
    const results = await Promise.allSettled([
      service.buy({ operationId: op(), tickerId: 'seed-aurora-ste', quantity: 5 }),
      service.buy({ operationId: op(), tickerId: 'seed-aurora-ste', quantity: 5 }),
    ])
    expect(results.map((r) => r.status)).toEqual(['fulfilled', 'rejected'])
    expect((await service.getPortfolio()).cashKopecks).toBe(rubles(40_000))
  })
})

describe('хранение и сброс', () => {
  it('данные сохраняются между экземплярами сервиса (перезагрузка страницы)', async () => {
    const first = createService()
    await loginAs(first, 'user')
    await first.buy({ operationId: op(), tickerId: 'seed-aurora-std', quantity: 2 })

    const second = createService()
    expect(await second.getSession()).toEqual({ role: 'user' })
    expect((await second.getPortfolio()).cashKopecks).toBe(rubles(90_000))
  })

  it('сброс восстанавливает исходные тикеры, баланс и пустой портфель', async () => {
    const service = createService()
    await loginAs(service, 'admin')
    await service.createTicker(validTicker)
    await service.switchRole('user')
    await service.buy({ operationId: op(), tickerId: 'seed-aurora-std', quantity: 2 })
    await service.switchRole('admin')

    await service.resetDemo()

    const tickers = await service.listTickers()
    expect(tickers).toHaveLength(5)
    expect(tickers.every((t) => t.availableQuantity === 20)).toBe(true)
    await service.switchRole('user')
    expect(await service.getPortfolio()).toEqual({ cashKopecks: rubles(100_000), positions: [] })
  })

  it.each([
    ['некорректный JSON', '{oops'],
    ['несовместимую версию', JSON.stringify({ version: 99, data: {} })],
    ['данные вне схемы', JSON.stringify({ version: 1, data: { tickers: 'nope' } })],
    [
      'нарушенный инвариант количества',
      JSON.stringify({
        version: 1,
        data: {
          tickers: [
            {
              id: 'x',
              code: 'XXX',
              hotel: 'H',
              city: 'C',
              roomCategory: 'R',
              nightDate: '2026-10-01',
              priceKopecks: 100,
              issuedQuantity: 5,
              availableQuantity: 5,
            },
          ],
          portfolio: { cashKopecks: 0, positions: [{ tickerId: 'x', quantity: 1 }] },
          processedOperationIds: [],
        },
      }),
    ],
  ])('распознаёт %s и предлагает сброс', async (_, raw) => {
    stateStorage.setItem(STATE_STORAGE_KEY, raw)
    const service = createService()
    await expectServiceError(service.listTickers(), 'STORAGE_CORRUPTED')

    await service.repairStorage()
    expect(await service.listTickers()).toHaveLength(5)
  })

  it('повреждённая сессия считается отсутствующей', async () => {
    sessionStorage.setItem('hotel-exchange:session', JSON.stringify({ version: 1, data: { role: 'root' } }))
    expect(await createService().getSession()).toBeNull()
  })
})
