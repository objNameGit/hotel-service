import type { DemoOrderBookData } from './generate-order-book'
import { OrderBookFallback } from './order-book-fallback'

/**
 * Единственная точка подключения визуализации стакана.
 * После установки исходного блока shadcn.io Web3 Order Book здесь сопоставляются
 * `DemoOrderBookData` и props блока, а `ORDER_BOOK_SOURCE` меняется на `'shadcn-io'`.
 */
export const ORDER_BOOK_SOURCE: 'shadcn-io' | 'fallback' = 'fallback'

export function OrderBookView({ data }: { data: DemoOrderBookData }) {
  return <OrderBookFallback data={data} />
}
