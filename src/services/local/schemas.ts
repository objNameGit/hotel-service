import { z } from 'zod'
import { isCalendarDate } from '@/domain/calendar-date'
import type { ExchangeState } from '@/domain/exchange-state'
import { ROLES, type DemoSession } from '@/domain/session'

const count = z.int().nonnegative()

const tickerSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  hotel: z.string().min(1),
  city: z.string().min(1),
  roomCategory: z.string().min(1),
  nightDate: z.string().refine(isCalendarDate),
  priceKopecks: z.int().positive(),
  issuedQuantity: z.int().positive(),
  availableQuantity: count,
})

export const exchangeStateSchema: z.ZodType<ExchangeState> = z.object({
  tickers: z.array(tickerSchema),
  portfolio: z.object({
    cashKopecks: count,
    positions: z.array(z.object({ tickerId: z.string().min(1), quantity: z.int().positive() })),
  }),
  processedOperationIds: z.array(z.string()),
})

export const demoSessionSchema: z.ZodType<DemoSession> = z.object({
  role: z.enum(ROLES),
})
