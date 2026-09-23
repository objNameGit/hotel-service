import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlertIcon, MoonStarIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { TextField } from '@/components/text-field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { formatNight, isCalendarDate, todayCalendarDate } from '@/domain/calendar-date'
import { isServiceError, toServiceError } from '@/services'
import { useExchangeStore } from '@/stores'
import {
  EMPTY_CREATE_TICKER_FORM,
  SERVICE_FIELD_TO_FORM_FIELD,
  createTickerFormSchema,
  toCreateTickerInput,
  type CreateTickerFormOutput,
  type CreateTickerFormValues,
} from './create-ticker-form-schema'

export function CreateTickerForm() {
  const createTicker = useExchangeStore((state) => state.createTicker)
  const schema = useMemo(() => createTickerFormSchema(), [])
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateTickerFormValues, unknown, CreateTickerFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_CREATE_TICKER_FORM,
  })

  const nightDate = useWatch({ control, name: 'nightDate' })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const ticker = await createTicker(toCreateTickerInput(values))
      reset(EMPTY_CREATE_TICKER_FORM)
      toast.success(`Тикер ${ticker.code} выпущен: ${ticker.issuedQuantity} ед. доступно к покупке`)
    } catch (error) {
      const serviceError = toServiceError(error)
      const fieldEntries = Object.entries(serviceError.fieldErrors)
      for (const [field, message] of fieldEntries) {
        const formField = SERVICE_FIELD_TO_FORM_FIELD[field]
        if (formField && message) setError(formField, { message }, { shouldFocus: true })
      }
      if (!isServiceError(error) || fieldEntries.length === 0) setFormError(serviceError.message)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={isSubmitting} aria-label="Создание тикера" className="space-y-6">
      <FieldGroup className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
        <TextField
          label="Код тикера"
          placeholder="Например, AURORA-STD-20261015"
          autoCapitalize="characters"
          spellCheck={false}
          description="3–40 символов: латинские буквы, цифры и дефисы. Сохраняется в верхнем регистре."
          error={errors.code?.message}
          className="md:col-span-2 xl:col-span-1"
          {...register('code')}
        />
        <TextField
          label="Отель"
          placeholder="Например, Aurora Grand"
          error={errors.hotel?.message}
          {...register('hotel')}
        />
        <TextField label="Город" placeholder="Например, Казань" error={errors.city?.message} {...register('city')} />
        <TextField
          label="Категория номера"
          placeholder="Например, Стандарт"
          error={errors.roomCategory?.message}
          {...register('roomCategory')}
        />
        <TextField
          label="Дата ночи"
          type="date"
          min={todayCalendarDate()}
          description={
            isCalendarDate(nightDate) ? (
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <MoonStarIcon className="size-3.5" aria-hidden />
                Ночь {formatNight(nightDate)}
              </span>
            ) : (
              'Ночь с указанного дня до следующего. Сегодня или позднее.'
            )
          }
          error={errors.nightDate?.message}
          {...register('nightDate')}
        />
        <TextField
          label="Количество"
          inputMode="numeric"
          placeholder="Например, 10"
          description="Номеров этой категории на одну ночь"
          error={errors.quantity?.message}
          {...register('quantity')}
        />
        <TextField
          label="Цена за единицу, ₽"
          inputMode="decimal"
          placeholder="Например, 5000"
          description="До двух знаков после запятой"
          error={errors.price?.message}
          {...register('price')}
        />
      </FieldGroup>

      {formError && (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Создание окончательное: редактирование и удаление не предусмотрены.
        </p>
        <Button type="submit" disabled={isSubmitting} className="sm:min-w-40">
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {isSubmitting ? 'Выпускаем…' : 'Выпустить тикер'}
        </Button>
      </div>
    </form>
  )
}
