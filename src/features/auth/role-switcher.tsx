import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ROLES, ROLE_LABELS, type Role } from '@/domain/session'
import { ROLE_HOME } from '@/lib/paths'
import { cn } from '@/lib/utils'
import { toServiceError } from '@/services'
import { useSessionStore } from '@/stores'

/** Инструмент демонстрации: смена активной роли без повторного ввода пароля. */
export function RoleSwitcher({ className }: { className?: string }) {
  const role = useSessionStore((state) => state.session?.role)
  const switchRole = useSessionStore((state) => state.switchRole)
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const labelId = useId()

  const select = async (next: Role) => {
    if (next === role || pending) return
    setPending(true)
    try {
      await switchRole(next)
      navigate(ROLE_HOME[next])
      toast.success(`Активная роль: ${ROLE_LABELS[next]}`)
    } catch (error) {
      toast.error(toServiceError(error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div role="group" aria-labelledby={labelId} className={cn('flex items-center gap-2', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="border-amber-500/40 text-amber-200" tabIndex={0}>
            <span id={labelId}>Демо-роль</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>Инструмент демонстрации: переключает роль без пароля, данные сохраняются</TooltipContent>
      </Tooltip>
      <div className="flex rounded-lg border bg-muted/40 p-0.5">
        {ROLES.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={option === role ? 'secondary' : 'ghost'}
            aria-pressed={option === role}
            disabled={pending}
            onClick={() => void select(option)}
            className={cn('h-7', option !== role && 'text-muted-foreground')}
          >
            {ROLE_LABELS[option]}
          </Button>
        ))}
      </div>
    </div>
  )
}
