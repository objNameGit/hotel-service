import { Spinner } from '@/components/ui/spinner'

export function FullPageLoader({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}
