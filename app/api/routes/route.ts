import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const GET = asyncHandler(async (request: NextRequest) => {
 try {
    const { searchParams } = new URL(request.url)
    const departureCityId = searchParams.get('from')
    const arrivalCityId = searchParams.get('to')

    const routes = await prisma.route.findMany({
      where: {
        AND: [
          departureCityId ? { departureCityId } : {},
          arrivalCityId ? { arrivalCityId } : {}
        ]
      },
      include: {
        departureCity: true,
        arrivalCity: true,
        trips: {
          include: {
            bus: true,
            seats: true
          }
        }
      }
    })

    return ApiResponseBuilder.success(routes, SuccessMessages.RETRIEVED)
  } catch (error) {
    throw ApiError.database('Failed to get routes')
  }
})

export const POST = asyncHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { departureCityId, arrivalCityId, distance } = body

    if (!departureCityId || !arrivalCityId) {
      return ApiResponseBuilder.validationError(
        { departureCityId: ['Departure and arrival cities are required'], arrivalCityId: ['Departure and arrival cities are required'] },
        ErrorMessages.VALIDATION_FAILED
      )
    }

    // Check if cities exist
    const [departureCity, arrivalCity] = await Promise.all([
      prisma.city.findUnique({ where: { id: departureCityId } }),
      prisma.city.findUnique({ where: { id: arrivalCityId } })
    ])

    if (!departureCity || !arrivalCity) {
      return ApiResponseBuilder.notFound('One or both cities')
    }

    // Check if route already exists
    const existingRoute = await prisma.route.findFirst({
      where: {
        AND: [
          { departureCityId },
          { arrivalCityId }
        ]
      }
    })

    if (existingRoute) {
      return ApiResponseBuilder.conflict('Route already exists')
    }

    const route = await prisma.route.create({
      data: {
        departureCityId,
        arrivalCityId,
        distance
      },
      include: {
        departureCity: true,
        arrivalCity: true
      }
    })

    return ApiResponseBuilder.success(route, SuccessMessages.CREATED)
  } catch (error) {
    throw ApiError.database('Failed to create route')
  }
 
})