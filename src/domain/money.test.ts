import { describe, expect, it } from 'vitest'
import { formatRubles, multiplyMoney, parseRublesInput, rubles } from './money'

const normalizeSpaces = (value: string) => value.replace(/[\u00a0\u202f]/g, ' ')

describe('parseRublesInput', () => {
  it.each([
    ['5000', 500_000],
    ['5 000', 500_000],
    ['5000,5', 500_050],
    ['5000.05', 500_005],
    ['12000.99', 1_200_099],
    ['0.01', 1],
  ])('разбирает «%s» в %i копеек', (input, expected) => {
    expect(parseRublesInput(input)).toBe(expected)
  })

  it.each(['', '-100', '10.999', 'abc', '1e3', '10,', '.5'])('отклоняет «%s»', (input) => {
    expect(parseRublesInput(input)).toBeNull()
  })

  it('не теряет точность на типичных дробных суммах', () => {
    expect(parseRublesInput('0.29')).toBe(29)
    expect(parseRublesInput('1.15')).toBe(115)
  })
})

describe('formatRubles', () => {
  it('показывает целые рубли без копеек', () => {
    expect(normalizeSpaces(formatRubles(rubles(100_000)))).toBe('100 000 ₽')
  })

  it('показывает копейки, если они есть', () => {
    expect(normalizeSpaces(formatRubles(500_050))).toBe('5 000,50 ₽')
  })
})

describe('multiplyMoney', () => {
  it('умножает цену в копейках на количество', () => {
    expect(multiplyMoney(rubles(5_000), 2)).toBe(rubles(10_000))
  })
})
