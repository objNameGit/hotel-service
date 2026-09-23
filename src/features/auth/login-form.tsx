import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { TextField } from '@/components/text-field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { ROLE_LABELS } from '@/domain/session'
import { DEMO_ACCOUNTS, toServiceError } from '@/services'
import { useSessionStore } from '@/stores'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Укажите email').pipe(z.email('Введите корректный email')),
  password: z.string().min(1, 'Укажите пароль'),
})

type LoginValues = z.infer<typeof loginSchema>

/** После успешного входа сессия обновляется в сторе, редирект выполняет страница. */
export function LoginForm() {
  const login = useSessionStore((state) => state.login)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values)
    } catch (error) {
      setFormError(toServiceError(error).message)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={isSubmitting} className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground" id="autofill-hint">
          Автозаполнение демо-доступа:
        </p>
        <div className="grid grid-cols-2 gap-2" role="group" aria-describedby="autofill-hint">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.role}
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                setFormError(null)
                setValue('email', account.email, { shouldValidate: true })
                setValue('password', account.password, { shouldValidate: true })
              }}
            >
              {ROLE_LABELS[account.role]}
            </Button>
          ))}
        </div>
      </div>

      <FieldGroup>
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="user@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Пароль"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
      </FieldGroup>

      {formError && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner data-icon="inline-start" />}
        {isSubmitting ? 'Входим…' : 'Войти'}
      </Button>
    </form>
  )
}
