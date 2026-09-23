import { BedDoubleIcon } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-buy/15 text-buy">
        <BedDoubleIcon className="size-4" aria-hidden />
      </span>
      <span className="hidden sm:inline">Биржа номеро-ночей</span>
      <span className="sm:hidden">Номеро-ночи</span>
    </Link>
  )
}
