import { RotateCcwIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toServiceError } from '@/services'
import { useExchangeStore } from '@/stores'

export function ResetDemoButton() {
  const resetDemo = useExchangeStore((state) => state.resetDemo)
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const handleReset = async () => {
    setPending(true)
    try {
      await resetDemo()
      setOpen(false)
      toast.success('Демо сброшено: исходные тикеры, баланс 100 000 ₽, пустой портфель')
    } catch (error) {
      toast.error(toServiceError(error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <RotateCcwIcon data-icon="inline-start" aria-hidden />
          Сбросить демо
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Сбросить демо?</AlertDialogTitle>
          <AlertDialogDescription>
            Созданные тикеры и все сделки будут удалены. Восстановятся исходные тикеры, баланс пользователя 100 000 ₽ и
            пустой портфель. Действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Отмена</AlertDialogCancel>
          <Button variant="destructive" onClick={() => void handleReset()} disabled={pending}>
            {pending && <Spinner data-icon="inline-start" />}
            Сбросить
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
