import { describe, expect, it } from 'vitest'
import { createTickerFormSchema, toCreateTickerInput, type CreateTickerFormValues } from './create-ticker-form-schema'

const schema = createTickerFormSchema(() => '2026-09-23')

const valid: CreateTickerFormValues = {
  code: ' aurora-std-20261015 ',
  hotel: 'Aurora Grand',
  city: 'Санкт-Петербург',
  roomCategory: 'Стандарт',
  nightDate: '2026-10-15',
  quantity: '10',
  price: '5 000,50',
}

function firstError(patch: Partial<CreateTickerFormValues>, field: keyof CreateTickerFormValues) {
  const result = schema.safeParse({ ...valid, ...patch })
  expect(result.success).toBe(false)
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message
}

describe('createTickerFormSchema', () => {
  it('нормализует значения формы во входные данные сервиса', () => {
    const parsed = schema.parse(valid)
    expect(toCreateTickerInput(parsed)).toEqual({
      code: 'AURORA-STD-20261015',
      hotel: 'Aurora Grand',
      city: 'Санкт-Петербург',
      roomCategory: 'Стандарт',
      nightDate: '2026-10-15',
      quantity: 10,
      priceKopecks: 500_050,
    })
  })

  it('отклоняет прошедшую дату и разрешает сегодняшнюю', () => {
    expect(firstError({ nightDate: '2026-09-22' }, 'nightDate')).toBe('Дата ночи не может быть в прошлом')
    expect(schema.safeParse({ ...valid, nightDate: '2026-09-23' }).success).toBe(true)
  })

  it('отклоняет отрицательную, нулевую цену и цену с тремя знаками после запятой', () => {
    expect(firstError({ price: '-100' }, 'price')).toBe('Цена должна быть больше нуля')
    expect(firstError({ price: '0' }, 'price')).toBe('Цена должна быть больше нуля')
    expect(firstError({ price: '10.999' }, 'price')).toMatch(/двух знаков/)
  })

  it('отклоняет дробное, отрицательное и пустое количество', () => {
    expect(firstError({ quantity: '1.5' }, 'quantity')).toBe('Количество должно быть целым числом')
    expect(firstError({ quantity: '-3' }, 'quantity')).toBe('Количество должно быть больше нуля')
    expect(firstError({ quantity: '' }, 'quantity')).toBe('Укажите количество')
  })

  it('проверяет длину и символы кода', () => {
    expect(firstError({ code: 'AB' }, 'code')).toMatch(/от 3 до 40/)
    expect(firstError({ code: 'A'.repeat(41) }, 'code')).toMatch(/от 3 до 40/)
    expect(firstError({ code: 'AURORA_STD' }, 'code')).toMatch(/латинские/)
  })

  it('требует непустые текстовые поля', () => {
    expect(firstError({ hotel: '  ' }, 'hotel')).toBe('Укажите название отеля')
    expect(firstError({ city: '' }, 'city')).toBe('Укажите город')
    expect(firstError({ roomCategory: '' }, 'roomCategory')).toBe('Укажите категорию номера')
  })
})
