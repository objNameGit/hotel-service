import { z } from 'zod'
import { compareCalendarDates, isCalendarDate, type CalendarDate } from './calendar-date'
import { TICKER_CODE_MAX_LENGTH, TICKER_CODE_MIN_LENGTH, TICKER_CODE_PATTERN, normalizeTickerCode } from './ticker'

export const VALIDATION_MESSAGES = {
  codeRequired: 'Укажите код тикера',
  codeLength: `Код должен содержать от ${TICKER_CODE_MIN_LENGTH} до ${TICKER_CODE_MAX_LENGTH} символов`,
  codePattern: 'Допустимы только латинские буквы, цифры и дефисы',
  codeTaken: 'Тикер с таким кодом уже существует',
  hotelRequired: 'Укажите название отеля',
  cityRequired: 'Укажите город',
  categoryRequired: 'Укажите категорию номера',
  dateRequired: 'Укажите дату ночи',
  dateInvalid: 'Некорректная дата',
  datePast: 'Дата ночи не может быть в прошлом',
  quantityRequired: 'Укажите количество',
  quantityInteger: 'Количество должно быть целым числом',
  quantityPositive: 'Количество должно быть больше нуля',
  priceRequired: 'Укажите цену',
  priceFormat: 'Введите положительную сумму в рублях, не более двух знаков после запятой',
  pricePositive: 'Цена должна быть больше нуля',
} as const

export const tickerCodeSchema = z
  .string()
  .transform(normalizeTickerCode)
  .pipe(
    z
      .string()
      .min(1, VALIDATION_MESSAGES.codeRequired)
      .min(TICKER_CODE_MIN_LENGTH, VALIDATION_MESSAGES.codeLength)
      .max(TICKER_CODE_MAX_LENGTH, VALIDATION_MESSAGES.codeLength)
      .regex(TICKER_CODE_PATTERN, VALIDATION_MESSAGES.codePattern),
  )

const requiredText = (message: string) => z.string().trim().min(1, message)

export const nightDateSchema = (today: () => CalendarDate) =>
  z
    .string()
    .min(1, VALIDATION_MESSAGES.dateRequired)
    .refine(isCalendarDate, VALIDATION_MESSAGES.dateInvalid)
    .refine((value) => compareCalendarDates(value, today()) >= 0, VALIDATION_MESSAGES.datePast)

/** Проверка входных данных создания тикера на стороне сервиса. */
export const createTickerInputSchema = (today: () => CalendarDate) =>
  z.object({
    code: tickerCodeSchema,
    hotel: requiredText(VALIDATION_MESSAGES.hotelRequired),
    city: requiredText(VALIDATION_MESSAGES.cityRequired),
    roomCategory: requiredText(VALIDATION_MESSAGES.categoryRequired),
    nightDate: nightDateSchema(today),
    quantity: z.int(VALIDATION_MESSAGES.quantityInteger).positive(VALIDATION_MESSAGES.quantityPositive),
    priceKopecks: z.int(VALIDATION_MESSAGES.priceFormat).positive(VALIDATION_MESSAGES.pricePositive),
  })

export type CreateTickerInput = z.input<ReturnType<typeof createTickerInputSchema>>
