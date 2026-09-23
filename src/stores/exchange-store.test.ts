import { beforeEach, describe, expect, it } from 'vitest'
import { rubles } from '@/domain/money'
import { LocalExchangeService, STATE_STORAGE_KEY } from '@/services/local/local-exchange-service'
import { MemoryStorage } from '@/test/memory-storage'
import { createExchangeStore } from './exchange-store'

let stateStorage: MemoryStorage
let service: LocalExchangeService

beforeEach(() => {
  stateStorage = new MemoryStorage()
  service = new LocalExchangeService({ stateStorage, sessionStorage: new MemoryStorage() })
})

describe('exchange store', () => {
  it('после покупки обновляет остаток тикера и портфель из ответа сервиса', async () => {
    await service.login({ email: 'user@example.com', password: 'demo123' })
    const store = createExchangeStore(service)
    await store.getState().loadTickers()

    await store.getState().trade('buy', { operationId: 'op-1', tickerId: 'seed-aurora-std', quantity: 2 })

    const { tickers, portfolio } = store.getState()
    expect(tickers.data?.find((t) => t.id === 'seed-aurora-std')?.availableQuantity).toBe(18)
    expect(portfolio.data?.cashKopecks).toBe(rubles(90_000))
  })

  it('при повреждённых данных помечает хранилище и после восстановления загружает данные заново', async () => {
    stateStorage.setItem(STATE_STORAGE_KEY, '{broken')
    const store = createExchangeStore(service)

    await store.getState().loadTickers()
    expect(store.getState().storageCorrupted).toBe(true)
    expect(store.getState().tickers.status).toBe('error')

    await store.getState().repairStorage()
    expect(store.getState().storageCorrupted).toBe(false)
    expect(store.getState().tickers.data).toHaveLength(5)
  })
})
