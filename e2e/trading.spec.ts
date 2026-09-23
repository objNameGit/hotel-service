import { expect, test, type Page } from '@playwright/test'
import { confirmTrade, login, openTicker, rub, switchRole, trade } from './helpers'

/** AURORA-STD: 5 000 ₽, 20 единиц — удобен для контрольного расчёта. */
const STD = 'seed-aurora-std'

async function expectTickerState(
  page: Page,
  { cash, held, available }: { cash: number; held: number; available: number },
) {
  await expect(page.getByTestId('cash-balance')).toHaveText(rub(cash))
  await expect(page.getByTestId('position-quantity')).toHaveText(`${held} ед.`)
  await expect(page.getByTestId('ticker-available')).toHaveText(`${available} ед.`)
}

async function expectPortfolio(page: Page, { cash, assets, total }: { cash: number; assets: number; total: number }) {
  await page.getByRole('link', { name: 'Портфель' }).click()
  await expect(page.getByTestId('portfolio-cash')).toHaveText(rub(cash))
  await expect(page.getByTestId('portfolio-assets')).toHaveText(rub(assets))
  await expect(page.getByTestId('portfolio-total')).toHaveText(rub(total))
}

test.describe('4–8. Сделки', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user')
  })

  test('контрольный расчёт: покупка 2 × 5 000 ₽ и продажа 1', async ({ page }) => {
    await openTicker(page, STD)
    await expectTickerState(page, { cash: 100_000, held: 0, available: 20 })

    const dialog = await trade(page, 'buy', 2)
    const summary = dialog.getByTestId('trade-summary')
    await expect(summary).toContainText('Покупка')
    await expect(summary).toContainText('AURORA-STD-')
    await expect(summary).toContainText('2 ед.')
    await expect(summary).toContainText(/10\s000\s₽/)
    await dialog.getByRole('button', { name: /Подтвердить/ }).click()
    await expect(dialog).toBeHidden()
    await expectTickerState(page, { cash: 90_000, held: 2, available: 18 })

    await expectPortfolio(page, { cash: 90_000, assets: 10_000, total: 100_000 })
    const row = page.getByTestId('position-row')
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('Aurora Grand')
    await expect(row).toContainText('Стандарт')

    await row.getByRole('link', { name: /Продать/ }).click()
    await confirmTrade(page, 'sell', 1)
    await expectTickerState(page, { cash: 95_000, held: 1, available: 19 })
    await expectPortfolio(page, { cash: 95_000, assets: 5_000, total: 100_000 })
  })

  test('продажа всей позиции скрывает её из портфеля', async ({ page }) => {
    await openTicker(page, STD)
    await confirmTrade(page, 'buy', 3)
    await confirmTrade(page, 'sell', 3)
    await expectTickerState(page, { cash: 100_000, held: 0, available: 20 })
    await page.getByRole('link', { name: 'Портфель' }).click()
    await expect(page.getByText('Портфель пуст')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Перейти на рынок' })).toBeVisible()
  })

  test('недостаток денег отклоняет сделку без изменений', async ({ page }) => {
    await openTicker(page, 'seed-aurora-ste') // 12 000 ₽ × 9 = 108 000 ₽
    await page.getByLabel('Количество, ед.').fill('9')
    await page.getByRole('button', { name: 'Купить', exact: true }).click()
    await expect(page.getByText('Недостаточно средств для покупки')).toBeVisible()
    await expect(page.getByRole('alertdialog')).toBeHidden()
    await expectTickerState(page, { cash: 100_000, held: 0, available: 20 })
  })

  test('недостаток доступных единиц отклоняет сделку без изменений', async ({ page }) => {
    await openTicker(page, 'seed-laguna-std') // 3 200 ₽ × 21 = 67 200 ₽, но остаток 20
    await page.getByLabel('Количество, ед.').fill('21')
    await page.getByRole('button', { name: 'Купить', exact: true }).click()
    await expect(page.getByText('Недостаточно доступных единиц')).toBeVisible()
    await expectTickerState(page, { cash: 100_000, held: 0, available: 20 })
  })

  test('продажа сверх позиции отклоняется', async ({ page }) => {
    await openTicker(page, STD)
    await confirmTrade(page, 'buy', 2)
    await page.getByRole('tab', { name: 'Продать' }).click()
    await page.getByLabel('Количество, ед.').fill('3')
    await page.getByRole('button', { name: 'Продать', exact: true }).click()
    await expect(page.getByText('Нельзя продать больше, чем есть в портфеле')).toBeVisible()
    await expectTickerState(page, { cash: 90_000, held: 2, available: 18 })
  })

  test('дробное и нулевое количество отклоняются формой', async ({ page }) => {
    await openTicker(page, STD)
    for (const value of ['1.5', '0']) {
      await page.getByLabel('Количество, ед.').fill(value)
      await page.getByRole('button', { name: 'Купить', exact: true }).click()
      await expect(page.getByText('Количество должно быть положительным целым числом')).toBeVisible()
    }
    await expectTickerState(page, { cash: 100_000, held: 0, available: 20 })
  })

  test('повторная отправка не создаёт лишних операций', async ({ page }) => {
    await openTicker(page, STD)
    const dialog = await trade(page, 'buy', 2)
    const confirm = dialog.getByRole('button', { name: /Подтвердить/ })
    await confirm.dblclick()
    await expect(dialog.getByRole('button', { name: /Исполняем/ })).toBeDisabled()
    await expect(dialog).toBeHidden()
    await expectTickerState(page, { cash: 90_000, held: 2, available: 18 })
  })

  test('данные сохраняются после перезагрузки и смены роли, сброс восстанавливает начальное состояние', async ({
    page,
  }) => {
    await openTicker(page, STD)
    await confirmTrade(page, 'buy', 2)

    await page.reload()
    await expectTickerState(page, { cash: 90_000, held: 2, available: 18 })

    await switchRole(page, 'admin')
    await expect(
      page.getByTestId('admin-ticker-row').filter({ hasText: 'AURORA-STD-' }).getByRole('cell').nth(6),
    ).toHaveText('18')
    await page.getByRole('button', { name: 'Сбросить демо' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Сбросить', exact: true }).click()
    await expect(page.getByRole('alertdialog')).toBeHidden()

    await switchRole(page, 'user')
    await expectPortfolio(page, { cash: 100_000, assets: 0, total: 100_000 })
    await expect(page.getByText('Портфель пуст')).toBeVisible()
  })

  test('повреждённые данные предлагают сброс', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('hotel-exchange:state', '{broken'))
    await page.reload()
    const dialog = page.getByRole('alertdialog', { name: 'Сохранённые данные не читаются' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Сбросить демо' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('ticker-card')).toHaveCount(5)
  })

  test('неизвестный тикер показывает понятное сообщение', async ({ page }) => {
    await page.goto('/market/does-not-exist')
    await expect(page.getByRole('heading', { name: 'Тикер не найден' })).toBeVisible()
  })
})
