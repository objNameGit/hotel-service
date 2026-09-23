import { LocalExchangeService } from './local/local-exchange-service'
import type { ExchangeService } from './exchange-service'

export * from './errors'
export type * from './exchange-service'
export { DEMO_ACCOUNTS, type DemoAccount } from './local/demo-accounts'

const DEFAULT_LATENCY_MS = 350

function resolveLatency(): number {
  const configured = Number(import.meta.env.VITE_DEMO_LATENCY_MS)
  return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_LATENCY_MS
}

export function createExchangeService(): ExchangeService {
  return new LocalExchangeService({
    stateStorage: window.localStorage,
    sessionStorage: window.sessionStorage,
    latencyMs: resolveLatency(),
    locks: navigator.locks,
    eventTarget: window,
  })
}
