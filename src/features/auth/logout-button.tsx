import { LogOutIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { paths } from '@/lib/paths'
import { useSessionStore } from '@/stores'

export function LogoutButton() {
  const logout = useSessionStore((state) => state.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(paths.login, { replace: true })
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => void handleLogout()}>
      <LogOutIcon data-icon="inline-start" aria-hidden />
      Выйти
    </Button>
  )
}
