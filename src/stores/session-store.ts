import { create } from 'zustand'
import type { DemoSession, Role } from '@/domain/session'
import type { AuthApi, Credentials } from '@/services'

export interface SessionStoreState {
  /** `pending` — сессия ещё не прочитана из sessionStorage. */
  status: 'pending' | 'ready'
  session: DemoSession | null
  restore(): Promise<void>
  login(credentials: Credentials): Promise<DemoSession>
  logout(): Promise<void>
  switchRole(role: Role): Promise<DemoSession>
}

export const createSessionStore = (service: AuthApi) =>
  create<SessionStoreState>()((set) => ({
    status: 'pending',
    session: null,

    async restore() {
      const session = await service.getSession()
      set({ status: 'ready', session })
    },

    async login(credentials) {
      const session = await service.login(credentials)
      set({ status: 'ready', session })
      return session
    },

    async logout() {
      await service.logout()
      set({ status: 'ready', session: null })
    },

    async switchRole(role) {
      const session = await service.switchRole(role)
      set({ session })
      return session
    },
  }))
