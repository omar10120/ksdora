import { ApiResponseBuilder, ErrorMessages } from './apiResponse'

// Validation error interface
export interface ValidationError {
  field: string
  message: string
  value?: any
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Validation rules interface
export interface ValidationRule {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  email?: boolean
  url?: boolean
  custom?: (value: any) => boolean | string
  enum?: any[]
}

// Validation schema interface
export interface ValidationSchema {
  [key: string]: ValidationRule
}

// Validation class
export class Validator {
  private errors: ValidationError[] = []

  // Validate a single field

  
  private validateField(
    fieldName: string,
    value: any,
    rules: ValidationRule
  ): void {
    // Required validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      this.errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        value
      })
      return
    }

    // Skip other validations if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return
    }
    // 🔹 Type validation (add this here)
    if (rules.type) {
      const type = Array.isArray(value) ? 'array' : typeof value
      if (type !== rules.type) {
        this.errors.push({
          field: fieldName,
          message: `${fieldName} must be of type ${rules.type}`,
          value
        })
        return
      }
    }
    // String validations
    if (typeof value === 'string') {
      // Min length validation
      if (rules.minLength && value.length < rules.minLength) {
        this.errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rules.minLength} characters long`,
          value 
        })
      }

      // Max length validation
      if (rules.maxLength && value.length > rules.maxLength) {
        this.errors.push({
          field: fieldName,
          message: `${fieldName} must be at most ${rules.maxLength} characters long`,
          value
        })
      }

      // Email validation
      if (rules.email && !this.isValidEmail(value)) {
        this.errors.push({
          field: fieldName,
          message: `${fieldName} must be a valid email address`,
          value
        })
      }

      // URL validation
      if (rules.url && !this.isValidUrl(value)) {
        this.errors.push({
          field: fieldName,
          message: `${fieldName} must be a valid URL`,
          value
        })
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        this.errors.push({
          field: fieldName,
          message: `${fieldName} format is invalid`,
          value
        })
      }
    }

    // Number validations
    if (typeof value === 'number') {
      // Min value validation
      if (rules.min !== undefined && value < rules.min) {
        this.errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rules.min}`,
          value
        })
      }

      // Max value validation
      if (rules.max !== undefined && value > rules.max) {
        this.errors.push({
          field: fieldName,
          message: `${fieldName} must be at most ${rules.max}`,
          value
        })
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      this.errors.push({
        field: fieldName,
        message: `${fieldName} must be one of: ${rules.enum.join(', ')}`,
        value
      })
    }

    // Custom validation
    if (rules.custom) {
      const result = rules.custom(value)
      if (result !== true) {
        this.errors.push({
          field: fieldName,
          message: typeof result === 'string' ? result : `${fieldName} is invalid`,
          value
        })
      }
    }
  }

  // Validate an object against a schema
  validate(data: any, schema: ValidationSchema): ValidationResult {
    this.errors = []

    for (const [fieldName, rules] of Object.entries(schema)) {
      this.validateField(fieldName, data[fieldName], rules)
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors
    }
  }

  // Validate array of objects
  validateArray(data: any[], schema: ValidationSchema): ValidationResult {
    this.errors = []

    data.forEach((item, index) => {
      for (const [fieldName, rules] of Object.entries(schema)) {
        this.validateField(`${fieldName}[${index}]`, item[fieldName], rules)
      }
    })

    return {
      isValid: this.errors.length === 0,
      errors: this.errors
    }
  }

  // Helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Convert validation errors to API response
  static toApiResponse(validationResult: ValidationResult) {
    if (validationResult.isValid) {
      return null
    }

    const errorMessages: Record<string, string[]> = {}
    
    validationResult.errors.forEach(error => {
      if (!errorMessages[error.field]) {
        errorMessages[error.field] = []
      }
      errorMessages[error.field].push(error.message)
    })

    return ApiResponseBuilder.validationError(errorMessages, ErrorMessages.VALIDATION_FAILED)
  }
}

// Common validation schemas
export const ValidationSchemas = {
  // User validation
  user: {
    name: { required: true, minLength: 2, maxLength: 100 },
    email: { required: true, email: true },
    password: { required: true, minLength: 6, maxLength: 100 },
    phone: { required: false, pattern: /^\+?[\d\s\-\(\)]+$/ },
    role: { required: false, enum: ['USER', 'ADMIN'] as string[] }
  },

  // City validation
  city: {
    name: { required: true, minLength: 2, maxLength: 100 },
    nameAr: { required: true, minLength: 2, maxLength: 100 },
    countryId: { required: true }
  },

  // Country validation
  country: {
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    nameAr: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    code: { required: true, type: 'string', minLength: 2, maxLength: 3 }
  },
  

  // Route validation
  route: {
    departureCityId: { required: true },
    arrivalCityId: { required: true },
    distance: { required: true, min: 0 }
  },

  // Trip validation
  trip: {
    routeId: { required: true },
    busId: { required: true },
    departureTime: { required: true },
    arrivalTime: { required: true },
    price: { required: true, min: 0 },
    status: { required: true, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] }
  },

  // Booking validation
  booking: {
    userId: { required: true },
    tripId: { required: true },
    totalPrice: { required: true, min: 0 },
    status: { required: true, enum: ['pending', 'confirmed', 'completed', 'cancelled'] }
  },

  // Payment validation
  payment: {
    billId: { required: true },
    amount: { required: true, min: 0 },
    method: { required: true, enum: ['cash', 'card', 'bank_transfer', 'company_alharam'] as string[] },
    status: { required: true, enum: ['pending', 'successful', 'failed'] as string[] }
  }
} as const

// Export validator instance
export const validator = new Validator()

// Export validation helper functions
export const validateRequest = (data: any, schema: ValidationSchema) => {
  return validator.validate(data, schema)
}

export const validateArray = (data: any[], schema: ValidationSchema) => {
  return validator.validateArray(data, schema)
}

export const createValidationResponse = (validationResult: ValidationResult) => {
  return Validator.toApiResponse(validationResult)
}
