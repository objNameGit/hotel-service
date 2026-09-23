import {
  ArrowRightIcon,
  BedDoubleIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  HandCoinsIcon,
  SearchIcon,
  ShoppingCartIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { QueryState } from '@/components/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { compareTickers } from '@/domain/ticker'
import { TickerCard } from '@/features/market/ticker-card'
import { ROLE_HOME, paths } from '@/lib/paths'
import { useSessionStore, useTickers } from '@/stores'

const STEPS = [
  { icon: SearchIcon, title: 'Выбрать номеро-ночь', text: 'Найдите тикер по отелю, городу или коду.' },
  { icon: ShoppingCartIcon, title: 'Купить', text: 'Сделка исполняется по фиксированной цене.' },
  { icon: BriefcaseIcon, title: 'Увидеть в портфеле', text: 'Баланс, позиции и их стоимость.' },
  { icon: HandCoinsIcon, title: 'Продать', text: 'Верните единицы и получите деньги обратно.' },
] as const

const EXAMPLES_COUNT = 3

export function Component() {
  const session = useSessionStore((state) => state.session)
  const tickers = useTickers()
  const examples = useMemo(
    () => ({ ...tickers, data: tickers.data ? [...tickers.data].sort(compareTickers).slice(0, EXAMPLES_COUNT) : null }),
    [tickers],
  )

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 md:py-20">
      <section aria-labelledby="hero-title" className="max-w-3xl space-y-6">
        <Badge variant="outline" className="border-amber-500/40 text-amber-200">
          Демонстрационная версия
        </Badge>
        <h1 id="hero-title" className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          Биржа номеро-ночей
        </h1>
        <p className="text-lg text-pretty text-muted-foreground">
          Демо-приложение, в котором ночи проживания в гостиничных номерах выпускаются как торгуемые единицы.
          Администратор выпускает тикер, пользователь покупает его, видит в портфеле и может продать обратно.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to={session ? ROLE_HOME[session.role] : paths.login}>
              {session ? 'Открыть демо' : 'Войти в демо'}
              <ArrowRightIcon data-icon="inline-end" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="asset-title" className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 id="asset-title" className="text-2xl font-semibold tracking-tight">
            Что торгуется
          </h2>
          <p className="text-muted-foreground">
            Одна единица тикера — право на одну ночь проживания в номере определённой категории конкретного отеля на
            конкретную дату. Количество тикера — число доступных номеров этой категории на эту ночь.
          </p>
          <p className="text-muted-foreground">
            Цена единицы фиксированная и задаётся администратором. Стакан на странице тикера — демонстрационная
            визуализация и не влияет на цену сделки.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground">Пример кода тикера</p>
          <p className="mt-1 font-mono text-lg font-medium break-all">AURORA-STD-20261015</p>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <BedDoubleIcon className="size-3" aria-hidden /> Отель
              </dt>
              <dd>Aurora</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Категория</dt>
              <dd>Стандарт</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDaysIcon className="size-3" aria-hidden /> Ночь
              </dt>
              <dd>15→16 окт.</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="flow-title" className="space-y-6">
        <h2 id="flow-title" className="text-2xl font-semibold tracking-tight">
          Как это работает
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative rounded-xl border bg-card p-5">
              <span className="text-xs text-muted-foreground tabular-nums">Шаг {index + 1}</span>
              <step.icon className="mt-3 size-5 text-buy" aria-hidden />
              <p className="mt-3 font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="examples-title" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 id="examples-title" className="text-2xl font-semibold tracking-tight">
              Тикеры в демо
            </h2>
            <p className="text-sm text-muted-foreground">Примеры из текущих данных приложения.</p>
          </div>
        </div>
        <QueryState
          query={examples}
          emptyTitle="Тикеров пока нет"
          loading={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: EXAMPLES_COUNT }, (_, index) => (
                <Skeleton key={index} className="h-48" />
              ))}
            </div>
          }
        >
          {(data) => (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((ticker) => (
                <li key={ticker.id} className="flex">
                  <TickerCard ticker={ticker} />
                </li>
              ))}
            </ul>
          )}
        </QueryState>
      </section>
    </div>
  )
}
