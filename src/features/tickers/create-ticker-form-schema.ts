import { z } from 'zod'
import { todayCalendarDate, type CalendarDate } from '@/domain/calendar-date'
import { parseRublesInput } from '@/domain/money'
import { VALIDATION_MESSAGES as M, nightDateSchema, tickerCodeSchema } from '@/domain/validation'
import type { CreateTickerInput } from '@/services'

const requiredText = (message: string) => z.string().trim().min(1, message)

const quantityField = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: 'custom', message: M.quantityRequired })
      return z.NEVER
    }
    if (!/^[-+]?\d+$/.test(value)) {
      ctx.addIssue({ code: 'custom', message: M.quantityInteger })
      return z.NEVER
    }
    const quantity = Number(value)
    if (quantity <= 0) {
      ctx.addIssue({ code: 'custom', message: M.quantityPositive })
      return z.NEVER
    }
    if (!Number.isSafeInteger(quantity)) {
      ctx.addIssue({ code: 'custom', message: M.quantityInteger })
      return z.NEVER
    }
    return quantity
  })

const priceField = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: 'custom', message: M.priceRequired })
      return z.NEVER
    }
    if (value.startsWith('-')) {
      ctx.addIssue({ code: 'custom', message: M.pricePositive })
      return z.NEVER
    }
    const kopecks = parseRublesInput(value)
    if (kopecks === null) {
      ctx.addIssue({ code: 'custom', message: M.priceFormat })
      return z.NEVER
    }
    if (kopecks <= 0) {
      ctx.addIssue({ code: 'custom', message: M.pricePositive })
      return z.NEVER
    }
    return kopecks
  })

/** Схема формы: принимает строки из полей ввода и превращает их в типизированные значения. */
export const createTickerFormSchema = (today: () => CalendarDate = () => todayCalendarDate()) =>
  z.object({
    code: tickerCodeSchema,
    hotel: requiredText(M.hotelRequired),
    city: requiredText(M.cityRequired),
    roomCategory: requiredText(M.categoryRequired),
    nightDate: nightDateSchema(today),
    quantity: quantityField,
    price: priceField,
  })

type Schema = ReturnType<typeof createTickerFormSchema>
export type CreateTickerFormValues = z.input<Schema>
export type CreateTickerFormOutput = z.output<Schema>

export const EMPTY_CREATE_TICKER_FORM: CreateTickerFormValues = {
  code: '',
  hotel: '',
  city: '',
  roomCategory: '',
  nightDate: '',
  quantity: '',
  price: '',
}

export function toCreateTickerInput({ price, ...rest }: CreateTickerFormOutput): CreateTickerInput {
  return { ...rest, priceKopecks: price }
}

/** Соответствие полей сервиса полям формы для отображения серверных ошибок. */
export const SERVICE_FIELD_TO_FORM_FIELD: Record<string, keyof CreateTickerFormValues> = {
  code: 'code',
  hotel: 'hotel',
  city: 'city',
  roomCategory: 'roomCategory',
  nightDate: 'nightDate',
  quantity: 'quantity',
  priceKopecks: 'price',
}
