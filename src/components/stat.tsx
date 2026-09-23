import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatProps {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  className?: string
}

export function Stat({ label, value, hint, className }: StatProps) {
  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums break-words">{value}</dd>
      {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
    </div>
  )
}
