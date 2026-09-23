// Скриншоты основных экранов на контрольных ширинах: node scripts/screenshots.mjs [baseURL]
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const baseURL = process.argv[2] ?? 'http://localhost:5173'
const suffix = process.argv[3] ? `-${process.argv[3]}` : ''
const outDir = new URL('../.screenshots/', import.meta.url)
const widths = [375, 768, 1440]

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()

for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, baseURL })
  const page = await context.newPage()
  const shot = async (name) => {
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    console.log(`${width}px ${name}: horizontal overflow ${overflow}px`)
    await page.screenshot({ path: new URL(`${name}-${width}${suffix}.png`, outDir).pathname, fullPage: true })
  }

  await page.goto('/')
  await shot('home')
  await page.goto('/login')
  await page.getByRole('button', { name: 'Администратор' }).click()
  await shot('login')
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.waitForURL('**/admin/tickers')
  await shot('admin')
  await page.getByRole('button', { name: 'Выпустить тикер' }).click()
  await shot('admin-errors')

  await page.getByRole('button', { name: 'Пользователь', exact: true }).first().click()
  await page.waitForURL('**/market')
  await shot('market')
  await page.goto('/market/seed-aurora-std')
  await shot('ticker')
  await page.getByRole('button', { name: 'Купить', exact: true }).click()
  await shot('ticker-confirm')
  await page.getByRole('button', { name: /Подтвердить/ }).click()
  await page.getByText(/^Куплено/).waitFor()
  await page.goto('/portfolio')
  await shot('portfolio')
  await page.goto('/nope')
  await shot('404')
  await context.close()
}

await browser.close()
