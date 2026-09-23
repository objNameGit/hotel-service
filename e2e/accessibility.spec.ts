import { expect, test, type Page } from '@playwright/test'
import { login, rub } from './helpers'

async function expectNoPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
}

test.describe('10. Мобильный экран и клавиатура', () => {
  for (const width of [375, 768, 1440]) {
    test(`страницы без горизонтальной прокрутки на ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await expectNoPageOverflow(page)
      await login(page, 'admin')
      await expectNoPageOverflow(page)
      await page.getByRole('button', { name: 'Выйти' }).click()
      await login(page, 'user')
      for (const path of ['/market', '/market/seed-aurora-std', '/portfolio']) {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        await expectNoPageOverflow(page)
      }
    })
  }

  test('основной сценарий выполняется с клавиатуры', async ({ page }) => {
    await page.goto('/login')

    const tabTo = async (name: RegExp, maxSteps = 40) => {
      for (let step = 0; step < maxSteps; step += 1) {
        await page.keyboard.press('Tab')
        const label = await page.evaluate(() => {
          const el = document.activeElement as HTMLInputElement | null
          if (!el || !['A', 'BUTTON', 'INPUT'].includes(el.tagName)) return ''
          return el.getAttribute('aria-label') ?? el.labels?.[0]?.innerText ?? el.innerText ?? ''
        })
        if (name.test(label)) return
      }
      throw new Error(`Не удалось сфокусировать элемент ${name}`)
    }

    await tabTo(/Пользователь/)
    await page.keyboard.press('Enter')
    await tabTo(/^\s*Войти\s*$/)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/market$/)

    await tabTo(/AURORA-STD-/)
    await expect(page.locator(':focus-visible')).toHaveCount(1)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/market\/seed-aurora-std$/)

    await tabTo(/Количество, ед\./)
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.type('2')
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await tabTo(/Подтвердить покупку/, 5)
    await page.keyboard.press('Enter')
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('cash-balance')).toHaveText(rub(90_000))
  })
})
