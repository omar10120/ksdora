import { NextResponse } from 'next/server'

// Response status types
export type ApiResponseStatus = 'success' | 'error' | 'warning' | 'info'

// Base API response interface
export interface ApiResponse<T = any> {
  success: boolean
  status: ApiResponseStatus
  message: string
  data?: T
  error?: string
  timestamp: string
  path?: string
  requestId?: string
}

// Success response interface
export interface SuccessResponse<T = any> extends ApiResponse<T> {
  success: true
  status: 'success'
  data: T
}

// Error response interface
export interface ErrorResponse extends ApiResponse {
  success: false
  status: 'error'
  error: string
}

// Warning response interface
export interface WarningResponse<T = any> extends ApiResponse<T> {
  success: true
  status: 'warning'
  data?: T
}

// Info response interface
export interface InfoResponse<T = any> extends ApiResponse<T> {
  success: true
  status: 'info'
  data?: T
}

// Pagination interface
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Paginated response interface
export interface PaginatedResponse<T = any> extends SuccessResponse<T[]> {
  pagination: PaginationMeta
}

// API Response Builder Class
export class ApiResponseBuilder {
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Success Response
  static success<T>(
    data: T,
    message: string = 'Operation completed successfully',
    statusCode: number = 200
  ): NextResponse<SuccessResponse<T>> {
    const response: SuccessResponse<T> = {
      success: true,
      status: 'success',
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    }

    return NextResponse.json(response, { status: statusCode })
  }

  // Error Response
  static error(
    error: string,
    statusCode: number = 500,
    message: string = 'An error occurred'
  ): NextResponse<ErrorResponse> {
    const response: ErrorResponse = {
      success: false,
      status: 'error',
      message,
      error,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    }

    return NextResponse.json(response, { status: statusCode })
  }

  // Warning Response
  static warning<T>(
    message: string,
    data?: T,
    statusCode: number = 200
  ): NextResponse<WarningResponse<T>> {
    const response: WarningResponse<T> = {
      success: true,
      status: 'warning',
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    }

    return NextResponse.json(response, { status: statusCode })
  }

  // Info Response
  static info<T>(
    message: string,
    data?: T,
    statusCode: number = 200
  ): NextResponse<InfoResponse<T>> {
    const response: InfoResponse<T> = {
      success: true,
      status: 'info',
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    }

    return NextResponse.json(response, { status: statusCode })
  }

  // Paginated Response
  static paginated<T>(
    data: T[],
    pagination: PaginationMeta,
    message: string = 'Data retrieved successfully'
  ): NextResponse<PaginatedResponse<T>> {
    const response: PaginatedResponse<T> = {
      success: true,
      status: 'success',
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    }

    return NextResponse.json(response, { status: 200 })
  }

  // Created Response
  static created<T>(
    data: T,
    message: string = 'Resource created successfully'
  ): NextResponse<SuccessResponse<T>> {
    return this.success(data, message, 201)
  }

  // No Content Response
  static noContent(message: string = 'Operation completed successfully'): NextResponse {
    const response: ApiResponse = {
      success: true,
      status: 'success',
      message,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    }

    return NextResponse.json(response, { status: 204 })
  }

  // Validation Error Response
  static validationError(
    errors: Record<string, string[]>,
    message: string = 'Validation failed'
  ): NextResponse<ErrorResponse> {
    const errorMessage = Object.entries(errors)
      .map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(', ')}`)
      .join('; ')

    return this.error(errorMessage, 400, message)
  }

  // Not Found Response
  static notFound(
    resource: string = 'Resource',
    message?: string
  ): NextResponse<ErrorResponse> {
    const errorMessage = message || `${resource} not found`
    return this.error(errorMessage, 404, errorMessage)
  }

  // Unauthorized Response
  static unauthorized(
    message: string = 'Unauthorized access'
  ): NextResponse<ErrorResponse> {
    return this.error(message, 401, message)
  }

  // Forbidden Response
  static forbidden(
    message: string = 'Access forbidden'
  ): NextResponse<ErrorResponse> {
    return this.error(message, 403, message)
  }

  // Conflict Response
  static conflict(
    message: string = 'Resource conflict'
  ): NextResponse<ErrorResponse> {
    return this.error(message, 409, message)
  }

  // Too Many Requests Response
  static tooManyRequests(
    message: string = 'Too many requests'
  ): NextResponse<ErrorResponse> {
    return this.error(message, 429, message)
  }
}

// Common error messages
export const ErrorMessages = {
  VALIDATION_FAILED: 'Validation failed',
  RESOURCE_NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  DUPLICATE_ENTRY: 'Resource already exists',
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_EXPIRED: 'Token expired',
  INVALID_TOKEN: 'Invalid token',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  MAINTENANCE_MODE: 'Service temporarily unavailable',
  INVALID_REQUEST: 'Invalid request',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_FORMAT: 'Invalid format',
  FILE_TOO_LARGE: 'File too large',
  UNSUPPORTED_FILE_TYPE: 'Unsupported file type',
  NETWORK_ERROR: 'Network error',
  TIMEOUT: 'Request timeout',
  SERVICE_UNAVAILABLE: 'Service unavailable'
} as const

// Success messages
export const SuccessMessages = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  RETRIEVED: 'Data retrieved successfully',
  OPERATION_COMPLETED: 'Operation completed successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_RESET: 'Password reset successful',
  EMAIL_SENT: 'Email sent successfully',
  VERIFICATION_SUCCESS: 'Verification successful',
  BOOKING_CONFIRMED: 'Booking confirmed successfully',
  PAYMENT_SUCCESS: 'Payment processed successfully',
  SEAT_RESERVED: 'Seat reserved successfully',
  TRIP_SCHEDULED: 'Trip scheduled successfully'
} as const

// HTTP Status Codes
export const StatusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const

// Export the builder as default
export default ApiResponseBuilder
