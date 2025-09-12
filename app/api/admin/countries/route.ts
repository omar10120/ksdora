import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages } from '@/lib/apiResponse'
import { validateRequest, ValidationSchemas } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// GET - Fetch all countries
export const GET = asyncHandler(async (request: NextRequest) => {
  try {
    const countries = await prisma.country.findMany({

      orderBy: {
        name: 'asc'
      }
    })

    return ApiResponseBuilder.success(
      countries,
      SuccessMessages.RETRIEVED,
      200
    )
  } catch (error) {
    throw ApiError.database('Failed to fetch countries')
  }
})

// POST - Create new country
export const POST = asyncHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    
    // Validate request data
    const validationResult = validateRequest(body, ValidationSchemas.country)
    if (!validationResult.isValid) {
      const errorMessages: Record<string, string[]> = {}
      validationResult.errors.forEach(error => {
        if (!errorMessages[error.field]) {
          errorMessages[error.field] = []
        }
        errorMessages[error.field].push(error.message)
      })

      
      
      return ApiResponseBuilder.validationError(errorMessages, ErrorMessages.VALIDATION_FAILED)
    }

    const { name, nameAr, code } = body



    // Check if country already exists
    const existingcountry = await prisma.country.findFirst({
      where: {
        OR: [
          { name },
          { nameAr }
        ]
      }
    })

    if (existingcountry) {
      return ApiResponseBuilder.conflict('country with this name already exists')
    }

    // Create country
    const country = await prisma.country.create({
      data: {
        name,
        nameAr,
        code
      }
    })

    return ApiResponseBuilder.created(
      country,
      SuccessMessages.CREATED
    )
  } catch (error) {
    throw ApiError.database('Failed to create country')
  }
})