import { SearchIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { QueryState } from '@/components/query-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { compareTickers, matchesTickerQuery } from '@/domain/ticker'
import { TickerCard } from '@/features/market/ticker-card'
import { useTickers } from '@/stores'

export function Component() {
  const tickers = useTickers()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const setQuery = (value: string) =>
    setSearchParams(value ? { q: value } : {}, { replace: true, preventScrollReset: true })

  const filtered = useMemo(
    () => (tickers.data ?? []).filter((ticker) => matchesTickerQuery(ticker, query)).sort(compareTickers),
    [tickers.data, query],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Рынок"
        description="Номеро-ночи по фиксированной цене администратора. Одна единица — одна ночь в номере."
      />

      <search className="max-w-md space-y-2">
        <Label htmlFor="market-search">Поиск по коду, отелю и городу</Label>
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="market-search"
            type="search"
            placeholder="Например, Aurora или Сочи"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-8"
          />
        </div>
      </search>

      <QueryState
        query={tickers}
        emptyTitle="На рынке пока нет тикеров"
        emptyDescription="Администратор ещё не выпустил ни одной номеро-ночи."
      >
        {() =>
          filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center" role="status">
              <p className="font-medium">Ничего не найдено по запросу «{query}»</p>
              <Button variant="link" onClick={() => setQuery('')}>
                Сбросить поиск
              </Button>
            </div>
          ) : (
            <>
              <p className="sr-only" role="status">
                Найдено тикеров: {filtered.length}
              </p>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((ticker) => (
                  <li key={ticker.id} className="flex">
                    <TickerCard ticker={ticker} />
                  </li>
                ))}
              </ul>
            </>
          )
        }
      </QueryState>
    </div>
  )
}
