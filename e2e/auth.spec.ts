import { expect, test } from '@playwright/test'
import { login, switchRole } from './helpers'

test.describe('1. Вход, выход и ограничения маршрутов', () => {
  test('администратор попадает в управление тикерами', async ({ page }) => {
    await login(page, 'admin')
    await expect(page.getByRole('heading', { name: 'Управление тикерами' })).toBeVisible()
  })

  test('пользователь попадает на рынок', async ({ page }) => {
    await login(page, 'user')
    await expect(page.getByRole('heading', { name: 'Рынок', level: 1 })).toBeVisible()
  })

  test('неверные данные показывают ошибку, пустые поля — валидацию', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Войти', exact: true }).click()
    await expect(page.getByText('Укажите email')).toBeVisible()
    await expect(page.getByText('Укажите пароль')).toBeVisible()

    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Пароль').fill('wrong')
    await page.getByRole('button', { name: 'Войти', exact: true }).click()
    await expect(page.getByText('Неверный email или пароль')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('без входа закрытые маршруты ведут на /login, после входа — обратно', async ({ page }) => {
    for (const path of ['/market', '/portfolio', '/admin/tickers', '/market/seed-aurora-std']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login$/)
    }
    await page.getByRole('button', { name: 'Пользователь', exact: true }).click()
    await page.getByRole('button', { name: 'Войти', exact: true }).click()
    await expect(page).toHaveURL(/\/market\/seed-aurora-std$/)
  })

  test('пользователь не может открыть административный маршрут', async ({ page }) => {
    await login(page, 'user')
    await page.goto('/admin/tickers')
    await expect(page).toHaveURL(/\/market$/)
  })

  test('выход завершает сессию', async ({ page }) => {
    await login(page, 'user')
    await page.getByRole('button', { name: 'Выйти' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/portfolio')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('переключатель ролей меняет роль без пароля', async ({ page }) => {
    await login(page, 'admin')
    await switchRole(page, 'user')
    await switchRole(page, 'admin')
  })

  test('неизвестный адрес показывает 404', async ({ page }) => {
    await page.goto('/unknown/page')
    await expect(page.getByRole('heading', { name: /404/ })).toBeVisible()
  })
})
