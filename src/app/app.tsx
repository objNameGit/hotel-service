import { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { StorageRecoveryDialog } from '@/features/demo/storage-recovery-dialog'
import { exchangeService, useExchangeStore, useSessionStore } from '@/stores'
import { router } from './router'

export function App() {
  const restoreSession = useSessionStore((state) => state.restore)

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  useEffect(
    () =>
      exchangeService.subscribe(() => {
        void restoreSession()
        void useExchangeStore.getState().refresh()
      }),
    [restoreSession],
  )

  return (
    <TooltipProvider>
      <RouterProvider router={router} />
      <StorageRecoveryDialog />
      <Toaster position="top-center" richColors closeButton />
    </TooltipProvider>
  )
}
