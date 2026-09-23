export const ROLES = ['admin', 'user'] as const

export type Role = (typeof ROLES)[number]

export interface DemoSession {
  role: Role
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Администратор',
  user: 'Пользователь',
}
