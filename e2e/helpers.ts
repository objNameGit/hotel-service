import { expect, type Page } from '@playwright/test'

export type Role = 'admin' | 'user'

const ROLE_LABEL: Record<Role, string> = { admin: 'Администратор', user: 'Пользователь' }
export const ROLE_HOME: Record<Role, RegExp> = { admin: /\/admin\/tickers$/, user: /\/market$/ }

/** Сумма в рублях как в интерфейсе: «90 000 ₽» с неразрывными пробелами. */
export function rub(amount: number): RegExp {
  const digits = Math.trunc(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\\s')
  return new RegExp(`^${digits}\\s₽$`)
}

export async function login(page: Page, role: Role) {
  await page.goto('/login')
  await page.getByRole('button', { name: ROLE_LABEL[role], exact: true }).click()
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect(page).toHaveURL(ROLE_HOME[role])
}

/** Переключатель демо-роли в шапке (на мобильных и десктопе — разные экземпляры). */
export async function switchRole(page: Page, role: Role) {
  await page
    .getByRole('group', { name: 'Демо-роль' })
    .locator('visible=true')
    .getByRole('button', { name: ROLE_LABEL[role] })
    .click()
  await expect(page).toHaveURL(ROLE_HOME[role])
}

export async function openTicker(page: Page, tickerId: string) {
  await page.goto(`/market/${tickerId}`)
  await expect(page.getByTestId('cash-balance')).toBeVisible()
}

export async function trade(page: Page, side: 'buy' | 'sell', quantity: number) {
  await page.getByRole('tab', { name: side === 'buy' ? 'Купить' : 'Продать' }).click()
  await page.getByLabel('Количество, ед.').fill(String(quantity))
  await page.getByRole('button', { name: side === 'buy' ? 'Купить' : 'Продать', exact: true }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  return dialog
}

export async function confirmTrade(page: Page, side: 'buy' | 'sell', quantity: number) {
  const dialog = await trade(page, side, quantity)
  await dialog.getByRole('button', { name: /Подтвердить/ }).click()
  await expect(dialog).toBeHidden()
}
