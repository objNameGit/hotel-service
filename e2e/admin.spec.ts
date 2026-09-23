import { expect, test, type Page } from '@playwright/test'
import { login, switchRole } from './helpers'

function futureDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

async function fillTicker(
  page: Page,
  values: Partial<Record<'code' | 'hotel' | 'city' | 'category' | 'date' | 'quantity' | 'price', string>>,
) {
  const form = page.getByRole('form', { name: 'Создание тикера' })
  const fields = {
    code: 'Код тикера',
    hotel: 'Отель',
    city: 'Город',
    category: 'Категория номера',
    date: 'Дата ночи',
    quantity: 'Количество',
    price: 'Цена за единицу, ₽',
  } as const
  for (const [key, label] of Object.entries(fields)) {
    const value = values[key as keyof typeof fields]
    if (value !== undefined) await form.getByLabel(label, { exact: true }).fill(value)
  }
  return form
}

const VALID = {
  code: 'nova-std-e2e',
  hotel: 'Nova Park',
  city: 'Казань',
  category: 'Стандарт',
  date: futureDate(10),
  quantity: '7',
  price: '4500,50',
}

test.describe('2–3. Управление тикерами', () => {
  test('созданный тикер появляется в таблице и на рынке после переключения роли', async ({ page }) => {
    await login(page, 'admin')
    const form = await fillTicker(page, VALID)
    await expect(form.getByText(/^Ночь с \d+/)).toBeVisible()
    await form.getByRole('button', { name: 'Выпустить тикер' }).click()

    const row = page.getByTestId('admin-ticker-row').filter({ hasText: 'NOVA-STD-E2E' })
    await expect(row).toBeVisible()
    await expect(row.getByRole('cell').nth(5)).toHaveText('7')
    await expect(row.getByRole('cell').nth(6)).toHaveText('7')

    await switchRole(page, 'user')
    await page.getByLabel('Поиск по коду, отелю и городу').fill('казань')
    const card = page.getByTestId('ticker-card').filter({ hasText: 'NOVA-STD-E2E' })
    await expect(card).toBeVisible()
    await expect(card).toContainText('Доступно: 7')
    await expect(page.getByTestId('ticker-card')).toHaveCount(1)
  })

  test('дубликат кода, прошедшая дата, отрицательная цена и дробное количество отклоняются', async ({ page }) => {
    await login(page, 'admin')
    const existingCode =
      (await page.getByTestId('admin-ticker-row').first().getByRole('cell').first().textContent()) ?? ''

    const form = await fillTicker(page, {
      ...VALID,
      code: existingCode.toLowerCase(),
      date: futureDate(-1),
      price: '-100',
      quantity: '1.5',
    })
    await form.getByRole('button', { name: 'Выпустить тикер' }).click()

    await expect(form.getByText('Дата ночи не может быть в прошлом')).toBeVisible()
    await expect(form.getByText('Цена должна быть больше нуля')).toBeVisible()
    await expect(form.getByText('Количество должно быть целым числом')).toBeVisible()

    await fillTicker(page, { date: futureDate(1), price: '100', quantity: '2' })
    await form.getByRole('button', { name: 'Выпустить тикер' }).click()
    await expect(form.getByText('Тикер с таким кодом уже существует')).toBeVisible()
    await expect(page.getByTestId('admin-ticker-row')).toHaveCount(5)
  })

  test('сброс демо восстанавливает исходные тикеры', async ({ page }) => {
    await login(page, 'admin')
    const form = await fillTicker(page, VALID)
    await form.getByRole('button', { name: 'Выпустить тикер' }).click()
    await expect(page.getByTestId('admin-ticker-row')).toHaveCount(6)

    await page.getByRole('button', { name: 'Сбросить демо' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Сбросить', exact: true }).click()
    await expect(page.getByTestId('admin-ticker-row')).toHaveCount(5)
  })
})
