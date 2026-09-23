import { TRADE_REJECTION_MESSAGES, type TradeRejection } from '@/domain/trading'

export type ServiceErrorCode =
  | TradeRejection
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'TICKER_CODE_TAKEN'
  | 'DUPLICATE_OPERATION'
  | 'STORAGE_CORRUPTED'
  | 'UNKNOWN'

const MESSAGES: Record<ServiceErrorCode, string> = {
  ...TRADE_REJECTION_MESSAGES,
  INVALID_CREDENTIALS: 'Неверный email или пароль',
  UNAUTHORIZED: 'Необходимо войти в демо',
  FORBIDDEN: 'Операция недоступна для текущей роли',
  VALIDATION: 'Проверьте правильность заполнения полей',
  TICKER_CODE_TAKEN: 'Тикер с таким кодом уже существует',
  DUPLICATE_OPERATION: 'Эта операция уже была исполнена',
  STORAGE_CORRUPTED: 'Сохранённые данные повреждены или несовместимы с текущей версией',
  UNKNOWN: 'Что-то пошло не так. Попробуйте ещё раз',
}

export type FieldErrors = Partial<Record<string, string>>

export class ServiceError extends Error {
  readonly code: ServiceErrorCode
  readonly fieldErrors: FieldErrors

  constructor(code: ServiceErrorCode, options: { message?: string; fieldErrors?: FieldErrors; cause?: unknown } = {}) {
    super(options.message ?? MESSAGES[code], { cause: options.cause })
    this.name = 'ServiceError'
    this.code = code
    this.fieldErrors = options.fieldErrors ?? {}
  }
}

export function isServiceError(error: unknown, code?: ServiceErrorCode): error is ServiceError {
  return error instanceof ServiceError && (code === undefined || error.code === code)
}

export function toServiceError(error: unknown): ServiceError {
  return error instanceof ServiceError ? error : new ServiceError('UNKNOWN', { cause: error })
}
