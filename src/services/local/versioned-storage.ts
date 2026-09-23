import type { z } from 'zod'

export type LoadResult<T> = { status: 'empty' } | { status: 'ok'; data: T } | { status: 'invalid'; reason: string }

/** Миграция данных с версии `N` (ключ) на версию `N + 1`. */
export type Migrations = Readonly<Record<number, (data: unknown) => unknown>>

export interface VersionedStorageOptions<T> {
  storage: Storage
  key: string
  version: number
  schema: z.ZodType<T>
  migrations?: Migrations
  /** Дополнительная проверка согласованности; возвращает список нарушений. */
  validate?: (data: T) => string[]
}

interface Envelope {
  version: number
  data: unknown
}

function isEnvelope(value: unknown): value is Envelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    Number.isInteger((value as Envelope).version) &&
    'data' in value
  )
}

/** JSON-хранилище с версией формата, миграциями и проверкой схемы при чтении. */
export class VersionedStorage<T> {
  readonly key: string
  private readonly options: VersionedStorageOptions<T>

  constructor(options: VersionedStorageOptions<T>) {
    this.options = options
    this.key = options.key
  }

  load(): LoadResult<T> {
    const { storage, key, version, schema, migrations = {}, validate } = this.options
    const raw = storage.getItem(key)
    if (raw === null) return { status: 'empty' }

    let envelope: unknown
    try {
      envelope = JSON.parse(raw)
    } catch {
      return { status: 'invalid', reason: 'Данные не являются корректным JSON' }
    }
    if (!isEnvelope(envelope)) return { status: 'invalid', reason: 'Неизвестный формат данных' }

    let { data } = envelope
    for (let current = envelope.version; current < version; current += 1) {
      const migrate = migrations[current]
      if (!migrate) return { status: 'invalid', reason: `Нет миграции с версии ${current}` }
      data = migrate(data)
    }
    if (envelope.version > version) {
      return { status: 'invalid', reason: `Версия данных ${envelope.version} новее поддерживаемой ${version}` }
    }

    const parsed = schema.safeParse(data)
    if (!parsed.success) return { status: 'invalid', reason: 'Данные не соответствуют схеме' }

    const violations = validate?.(parsed.data) ?? []
    if (violations.length > 0) return { status: 'invalid', reason: violations.join('; ') }

    return { status: 'ok', data: parsed.data }
  }

  save(data: T): void {
    const envelope: Envelope = { version: this.options.version, data }
    this.options.storage.setItem(this.options.key, JSON.stringify(envelope))
  }

  clear(): void {
    this.options.storage.removeItem(this.options.key)
  }
}
