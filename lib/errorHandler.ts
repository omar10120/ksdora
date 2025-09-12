import { NextRequest } from 'next/server'
import { ApiResponseBuilder, ErrorMessages } from './apiResponse'

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL'
}

// Custom error class
export class ApiError extends Error {
  public type: ErrorType
  public statusCode: number
  public isOperational: boolean
  public details?: any

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message)
    this.type = type
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details

    Error.captureStackTrace(this, this.constructor)
  }

  static validation(message: string, details?: any): ApiError {
    return new ApiError(message, ErrorType.VALIDATION, 400, true, details)
  }

  static notFound(resource: string = 'Resource'): ApiError {
    return new ApiError(`${resource} not found`, ErrorType.NOT_FOUND, 404)
  }

  static unauthorized(message: string = 'Unauthorized access'): ApiError {
    return new ApiError(message, ErrorType.AUTHENTICATION, 401)
  }

  static forbidden(message: string = 'Access forbidden'): ApiError {
    return new ApiError(message, ErrorType.AUTHORIZATION, 403)
  }

  static conflict(message: string = 'Resource conflict'): ApiError {
    return new ApiError(message, ErrorType.CONFLICT, 409)
  }

  static database(message: string = 'Database operation failed'): ApiError {
    return new ApiError(message, ErrorType.DATABASE, 500)
  }

  static rateLimit(message: string = 'Too many requests'): ApiError {
    return new ApiError(message, ErrorType.RATE_LIMIT, 429)
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(message, ErrorType.INTERNAL, 500)
  }
}

// Error handler class
export class ErrorHandler {
  private static isDevelopment = process.env.NODE_ENV === 'development'

  // Handle different types of errors
  static handle(error: any, request?: NextRequest) {
    // Log error details
    this.logError(error, request)

    // Handle known error types
    if (error instanceof ApiError) {
      return this.handleApiError(error)
    }

    // Handle Prisma errors
    if (error.code && error.meta) {
      return this.handlePrismaError(error)
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return this.handleValidationError(error)
    }

    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return this.handleNetworkError(error)
    }

    // Handle unknown errors
    return this.handleUnknownError(error)
  }

  // Handle API errors
  private static handleApiError(error: ApiError) {
    const message = this.isDevelopment ? error.message : this.getPublicMessage(error.type)
    
    return ApiResponseBuilder.error(
      message,
      error.statusCode,
      this.getPublicMessage(error.type)
    )
  }

  // Handle Prisma errors
  private static handlePrismaError(error: any) {
    switch (error.code) {
      case 'P2002':
        return ApiResponseBuilder.conflict('Resource already exists')
      case 'P2025':
        return ApiResponseBuilder.notFound('Record not found')
      case 'P2003':
        return ApiResponseBuilder.validationError(
          { foreignKey: ['Referenced record does not exist'] },
          'Foreign key constraint failed'
        )
      case 'P2014':
        return ApiResponseBuilder.conflict('The change you are trying to make would violate the required relation')
      default:
        return ApiResponseBuilder.database('Database operation failed')
    }
  }

  // Handle validation errors
  private static handleValidationError(error: any) {
    const errors: Record<string, string[]> = {}
    
    if (error.errors) {
      error.errors.forEach((err: any) => {
        const field = err.path?.join('.') || 'unknown'
        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(err.message)
      })
    }

    return ApiResponseBuilder.validationError(errors, ErrorMessages.VALIDATION_FAILED)
  }

  // Handle network errors
  private static handleNetworkError(error: any) {
    const message = this.isDevelopment ? error.message : ErrorMessages.NETWORK_ERROR
    return ApiResponseBuilder.error(message, 503, ErrorMessages.SERVICE_UNAVAILABLE)
  }

  // Handle unknown errors
  private static handleUnknownError(error: any) {
    const message = this.isDevelopment ? error.message : ErrorMessages.INTERNAL_ERROR
    return ApiResponseBuilder.error(message, 500, ErrorMessages.INTERNAL_ERROR)
  }

  // Get public message for error type
  private static getPublicMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.VALIDATION:
        return ErrorMessages.VALIDATION_FAILED
      case ErrorType.AUTHENTICATION:
        return ErrorMessages.UNAUTHORIZED
      case ErrorType.AUTHORIZATION:
        return ErrorMessages.FORBIDDEN
      case ErrorType.NOT_FOUND:
        return ErrorMessages.RESOURCE_NOT_FOUND
      case ErrorType.CONFLICT:
        return ErrorMessages.DUPLICATE_ENTRY
      case ErrorType.DATABASE:
        return ErrorMessages.DATABASE_ERROR
      case ErrorType.RATE_LIMIT:
        return ErrorMessages.RATE_LIMIT_EXCEEDED
      case ErrorType.NETWORK:
        return ErrorMessages.NETWORK_ERROR
      case ErrorType.EXTERNAL:
        return ErrorMessages.SERVICE_UNAVAILABLE
      default:
        return ErrorMessages.INTERNAL_ERROR
    }
  }

  // Log error details
  private static logError(error: any, request?: NextRequest) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        type: error.type || 'UNKNOWN',
        statusCode: error.statusCode || 500
      },
      request: request ? {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        ip: request.ip || request.headers.get('x-forwarded-for')
      } : null,
      environment: process.env.NODE_ENV
    }

    // In development, log full error details
    if (this.isDevelopment) {
      console.error('🚨 API Error:', JSON.stringify(errorInfo, null, 2))
    } else {
      // In production, log sanitized error details
      console.error('🚨 API Error:', {
        timestamp: errorInfo.timestamp,
        type: errorInfo.error.type,
        statusCode: errorInfo.error.statusCode,
        message: errorInfo.error.message,
        url: errorInfo.request?.url
      })
    }
  }

  // Async error wrapper for route handlers
  static asyncHandler(fn: Function) {
    return async (request: NextRequest, ...args: any[]) => {
      try {
        return await fn(request, ...args)
      } catch (error) {
        return this.handle(error, request)
      }
    }
  }

  // Validate and handle request
  static validateAndHandle<T>(
    data: T,
    schema: any,
    handler: (validatedData: T) => Promise<any>
  ) {
    return async (request: NextRequest, ...args: any[]) => {
      try {
        // Validate data
        const validationResult = schema.validate(data)
        if (!validationResult.isValid) {
          return ApiResponseBuilder.validationError(
            validationResult.errors.reduce((acc: any, error: any) => {
              if (!acc[error.field]) acc[error.field] = []
              acc[error.field].push(error.message)
              return acc
            }, {}),
            ErrorMessages.VALIDATION_FAILED
          )
        }

        // Handle request
        return await handler(validationResult.data)
      } catch (error) {
        return this.handle(error, request)
      }
    }
  }
}

// Export error handler instance
export const errorHandler = ErrorHandler

// Export async handler wrapper
export const asyncHandler = ErrorHandler.asyncHandler

// Export validation handler
export const validateAndHandle = ErrorHandler.validateAndHandle
