import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useExchangeStore } from '@/stores'

/** Показывается, если сохранённые данные повреждены или несовместимы с текущей версией. */
export function StorageRecoveryDialog() {
  const corrupted = useExchangeStore((state) => state.storageCorrupted)
  const repairStorage = useExchangeStore((state) => state.repairStorage)
  const [pending, setPending] = useState(false)

  const handleRepair = async () => {
    setPending(true)
    try {
      await repairStorage()
      toast.success('Демо восстановлено в исходное состояние')
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={corrupted}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Сохранённые данные не читаются</AlertDialogTitle>
          <AlertDialogDescription>
            Данные демо в этом браузере повреждены или сохранены несовместимой версией приложения. Сбросьте демо, чтобы
            восстановить исходные тикеры, баланс 100 000 ₽ и пустой портфель.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={() => void handleRepair()} disabled={pending}>
            {pending && <Spinner data-icon="inline-start" />}
            Сбросить демо
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
