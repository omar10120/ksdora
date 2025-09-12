import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages } from '@/lib/apiResponse'
import { validateRequest, ValidationSchemas } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// GET - Fetch all cities
export const GET = asyncHandler(async (request: NextRequest) => {
  try {
    const cities = await prisma.city.findMany({
      include: {
        country: true,
        departureRoutes: true,
        arrivalRoutes: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return ApiResponseBuilder.success(
      cities,
      SuccessMessages.RETRIEVED,
      200
    )
  } catch (error) {
    throw ApiError.database('Failed to fetch cities')
  }
})

// POST - Create new city
export const POST = asyncHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    
    // Validate request data
    const validationResult = validateRequest(body, ValidationSchemas.city)
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

    const { name, nameAr, countryId } = body

    // Check if country exists
    const country = await prisma.country.findUnique({
      where: { id: countryId }
    })

    if (!country) {
      return ApiResponseBuilder.notFound('Country', 'Country not found')
    }

    // Check if city already exists
    const existingCity = await prisma.city.findFirst({
      where: {
        OR: [
          { name },
          { nameAr }
        ]
      }
    })

    if (existingCity) {
      return ApiResponseBuilder.conflict('City with this name already exists')
    }

    // Create city
    const city = await prisma.city.create({
      data: {
        name,
        nameAr,
        countryId
      },
      include: {
        country: true
      }
    })

    return ApiResponseBuilder.created(
      city,
      SuccessMessages.CREATED
    )
  } catch (error) {
    throw ApiError.database('Failed to create city')
  }
})