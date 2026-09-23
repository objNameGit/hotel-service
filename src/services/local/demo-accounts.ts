import type { Role } from '@/domain/session'

export interface DemoAccount {
  role: Role
  email: string
  password: string
}

/** Фиксированные демо-учётные записи. Проверка выполняется только на клиенте. */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { role: 'admin', email: 'admin@example.com', password: 'demo123' },
  { role: 'user', email: 'user@example.com', password: 'demo123' },
]

export function findDemoAccount(email: string, password: string): DemoAccount | undefined {
  const normalizedEmail = email.trim().toLowerCase()
  return DEMO_ACCOUNTS.find((account) => account.email === normalizedEmail && account.password === password)
}
