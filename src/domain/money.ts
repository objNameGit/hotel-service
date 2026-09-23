/** Денежная сумма в копейках. Всегда целое число. */
export type Kopecks = number

export const KOPECKS_PER_RUBLE = 100

export function rubles(amount: number): Kopecks {
  const kopecks = Math.round(amount * KOPECKS_PER_RUBLE)
  if (!Number.isSafeInteger(kopecks)) throw new RangeError('Сумма вне допустимого диапазона')
  return kopecks
}

const RUBLES_INPUT_PATTERN = /^(\d+)(?:[.,](\d{1,2}))?$/

/**
 * Разбирает ввод пользователя в рублях («5000», «5 000,5», «12000.99») в копейки
 * без арифметики с плавающей точкой. Возвращает `null` для некорректного ввода,
 * включая отрицательные суммы и более двух знаков после запятой.
 */
export function parseRublesInput(input: string): Kopecks | null {
  const normalized = input.replace(/[\s\u00a0\u202f]/g, '')
  const match = RUBLES_INPUT_PATTERN.exec(normalized)
  if (!match) return null
  const [, whole = '0', fraction = ''] = match
  const kopecks = Number(whole) * KOPECKS_PER_RUBLE + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(kopecks) ? kopecks : null
}

export function multiplyMoney(price: Kopecks, quantity: number): Kopecks {
  const total = price * quantity
  if (!Number.isSafeInteger(total)) throw new RangeError('Сумма вне допустимого диапазона')
  return total
}

const wholeFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})
const fractionalFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatRubles(amount: Kopecks): string {
  const formatter = amount % KOPECKS_PER_RUBLE === 0 ? wholeFormatter : fractionalFormatter
  return formatter.format(amount / KOPECKS_PER_RUBLE)
}
