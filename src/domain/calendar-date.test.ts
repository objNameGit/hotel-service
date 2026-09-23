import { describe, expect, it } from 'vitest'
import {
  addDays,
  compareCalendarDates,
  formatNight,
  isCalendarDate,
  toCompactDate,
  todayCalendarDate,
} from './calendar-date'

describe('calendar-date', () => {
  it('берёт сегодняшнюю дату из локального календаря, а не из UTC', () => {
    expect(todayCalendarDate(new Date(2026, 9, 15, 0, 30))).toBe('2026-10-15')
    expect(todayCalendarDate(new Date(2026, 9, 15, 23, 59))).toBe('2026-10-15')
  })

  it('прибавляет дни через границы месяцев и лет', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30')
    expect(addDays('2026-09-23', 60)).toBe('2026-11-22')
  })

  it('проверяет существование даты', () => {
    expect(isCalendarDate('2026-02-28')).toBe(true)
    expect(isCalendarDate('2026-02-30')).toBe(false)
    expect(isCalendarDate('2026-1-5')).toBe(false)
    expect(isCalendarDate(20261015)).toBe(false)
  })

  it('сравнивает даты', () => {
    expect(compareCalendarDates('2026-10-15', '2026-10-16')).toBe(-1)
    expect(compareCalendarDates('2026-10-15', '2026-10-15')).toBe(0)
  })

  it('формирует компактную дату для кода тикера', () => {
    expect(toCompactDate('2026-10-15')).toBe('20261015')
  })

  it('описывает ночь проживания явно', () => {
    expect(formatNight('2026-10-15')).toBe('с 15 на 16 октября 2026 г.')
    expect(formatNight('2026-10-31')).toBe('с 31 октября на 1 ноября 2026 г.')
    expect(formatNight('2026-12-31')).toBe('с 31 декабря 2026 г. на 1 января 2027 г.')
  })
})
