import { expect, test } from '@playwright/test'
import { login, openTicker } from './helpers'

test.describe('9. Демонстрационный стакан', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user')
    await openTicker(page, 'seed-aurora-std')
  })

  test('подписан как демонстрационный и показывает стабильные уровни', async ({ page }) => {
    const book = page.getByTestId('order-book')
    await expect(book.getByText('Демонстрационный стакан. Сделки исполняются по фиксированной цене')).toBeVisible()

    const snapshot = await book.innerText()
    await page.reload()
    await expect(page.getByTestId('order-book')).toBeVisible()
    expect(await page.getByTestId('order-book').innerText()).toBe(snapshot)
  })

  test('использует исходный блок shadcn.io Web3 Order Book', async ({ page }) => {
    const source = await page.getByTestId('order-book').getAttribute('data-order-book-source')
    test.skip(
      source === 'fallback',
      'Исходный блок не установлен: выполните `npm run blocks:order-book` (нужен токен shadcn.io).',
    )
    expect(source).toBe('shadcn-io')
  })
})
