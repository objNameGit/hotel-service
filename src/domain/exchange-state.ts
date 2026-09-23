import { getPositionQuantity, type Portfolio } from './portfolio'
import type { Ticker } from './ticker'

/** Полное состояние демо-биржи, которое сохраняется между сессиями. */
export interface ExchangeState {
  tickers: Ticker[]
  portfolio: Portfolio
  /** Идентификаторы уже исполненных операций: защита от повторной отправки. */
  processedOperationIds: string[]
}

export const PROCESSED_OPERATIONS_LIMIT = 200

const isNonNegativeInteger = (value: number) => Number.isSafeInteger(value) && value >= 0

/**
 * Проверяет инварианты состояния. Главный из них для каждого тикера:
 * доступное количество + количество в портфеле = выпущенное количество.
 */
export function findInvariantViolations(state: ExchangeState): string[] {
  const violations: string[] = []
  const ids = new Set<string>()
  const codes = new Set<string>()

  if (!isNonNegativeInteger(state.portfolio.cashKopecks)) {
    violations.push('Баланс должен быть неотрицательным целым числом копеек')
  }

  for (const ticker of state.tickers) {
    if (ids.has(ticker.id)) violations.push(`Повторяющийся идентификатор тикера ${ticker.id}`)
    if (codes.has(ticker.code)) violations.push(`Повторяющийся код тикера ${ticker.code}`)
    ids.add(ticker.id)
    codes.add(ticker.code)

    const held = getPositionQuantity(state.portfolio, ticker.id)
    if (ticker.availableQuantity + held !== ticker.issuedQuantity) {
      violations.push(`Нарушен баланс количества для ${ticker.code}`)
    }
    if (!isNonNegativeInteger(ticker.availableQuantity) || ticker.priceKopecks <= 0) {
      violations.push(`Некорректные количество или цена у ${ticker.code}`)
    }
  }

  const positionIds = new Set<string>()
  for (const position of state.portfolio.positions) {
    if (!ids.has(position.tickerId)) violations.push(`Позиция по неизвестному тикеру ${position.tickerId}`)
    if (positionIds.has(position.tickerId)) violations.push(`Повторяющаяся позиция ${position.tickerId}`)
    if (!Number.isSafeInteger(position.quantity) || position.quantity <= 0) {
      violations.push(`Некорректное количество в позиции ${position.tickerId}`)
    }
    positionIds.add(position.tickerId)
  }

  return violations
}
