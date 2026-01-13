export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface PaginationParams {
  page?: number
  perPage?: number
}

export interface PaginationMeta {
  currentPage: number
  perPage: number
  totalCount: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

// Error codes
export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
  REFERENCE_ERROR: 'REFERENCE_ERROR',
  SELF_DELETE_ERROR: 'SELF_DELETE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

// Helper functions
export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

export function errorResponse(code: ErrorCode, message: string): ApiResponse {
  return { success: false, error: { code, message } }
}
