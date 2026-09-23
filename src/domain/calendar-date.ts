/**
 * Календарная дата в формате `YYYY-MM-DD` без времени и часового пояса.
 * Все операции выполняются в локальном календаре, без преобразования через UTC.
 */
export type CalendarDate = string

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

interface DateParts {
  year: number
  month: number
  day: number
}

function parseParts(value: string): DateParts | null {
  const match = CALENDAR_DATE_PATTERN.exec(value)
  if (!match) return null
  const [, y, m, d] = match
  const year = Number(y)
  const month = Number(m)
  const day = Number(d)
  const probe = new Date(year, month - 1, day)
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) {
    return null
  }
  return { year, month, day }
}

function requireParts(value: CalendarDate): DateParts {
  const parts = parseParts(value)
  if (!parts) throw new RangeError(`Некорректная календарная дата: ${value}`)
  return parts
}

function toLocalDate(value: CalendarDate): Date {
  const { year, month, day } = requireParts(value)
  return new Date(year, month - 1, day)
}

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

export function isCalendarDate(value: unknown): value is CalendarDate {
  return typeof value === 'string' && parseParts(value) !== null
}

export function calendarDateFromLocal(date: Date): CalendarDate {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayCalendarDate(now: Date = new Date()): CalendarDate {
  return calendarDateFromLocal(now)
}

export function addDays(value: CalendarDate, days: number): CalendarDate {
  const { year, month, day } = requireParts(value)
  return calendarDateFromLocal(new Date(year, month - 1, day + days))
}

export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** `2026-10-15` → `20261015`, используется в кодах тикеров. */
export function toCompactDate(value: CalendarDate): string {
  requireParts(value)
  return value.replaceAll('-', '')
}

const fullFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const shortFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dayMonthFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

export function formatCalendarDate(value: CalendarDate, style: 'full' | 'short' = 'full'): string {
  const formatter = style === 'full' ? fullFormatter : shortFormatter
  return formatter.format(toLocalDate(value))
}

/** Ночь проживания: «с 15 на 16 октября 2026 г.» */
export function formatNight(value: CalendarDate): string {
  const start = requireParts(value)
  const endValue = addDays(value, 1)
  const end = requireParts(endValue)
  const endText = fullFormatter.format(toLocalDate(endValue))

  if (start.year !== end.year) {
    return `с ${fullFormatter.format(toLocalDate(value))} на ${endText}`
  }
  if (start.month !== end.month) {
    return `с ${dayMonthFormatter.format(toLocalDate(value))} на ${endText}`
  }
  return `с ${start.day} на ${endText}`
}
