import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// GET - Fetch route by ID
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const route = await prisma.route.findUnique({
      where: { id: params.id },
      include: {
        departureCity: {
          include: {
            country: true
          }
        },
        arrivalCity: {
          include: {
            country: true
          }
        },
        trips: {
          include: {
            bus: {
              select: {
                plateNumber: true,
                model: true,
                status: true
              }
            },
            bookings: {
              select: {
                id: true,
                status: true,
                totalPrice: true,
                bookingDate: true
              }
            }
          },
          orderBy: {
            departureTime: 'asc'
          }
        }
      }
    })

    if (!route) {
      return ApiResponseBuilder.notFound('Route')
    }

    return ApiResponseBuilder.success(
      route,
      SuccessMessages.RETRIEVED
    )
  } catch (error) {
    throw ApiError.database('Failed to fetch route')
  }
})

// PUT - Update route
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    
    // Validate request data
    const validationResult = validateRequest(body, {
      departureCityId: { required: true },
      arrivalCityId: { required: true },
      distance: { required: true, min: 1, max: 10000 }
    })
    
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

    const { departureCityId, arrivalCityId, distance } = body

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id: params.id }
    })

    if (!existingRoute) {
      return ApiResponseBuilder.notFound('Route')
    }

    // Check if cities exist
    const [departureCity, arrivalCity] = await Promise.all([
      prisma.city.findUnique({ 
        where: { id: departureCityId },
        include: { country: true }
      }),
      prisma.city.findUnique({ 
        where: { id: arrivalCityId },
        include: { country: true }
      })
    ])

    if (!departureCity || !arrivalCity) {
      return ApiResponseBuilder.notFound('One or both cities')
    }

    // Check if updated route would create a duplicate
    const duplicateRoute = await prisma.route.findFirst({
      where: {
        AND: [
          { departureCityId },
          { arrivalCityId },
          { id: { not: params.id } }
        ]
      }
    })

    if (duplicateRoute) {
      return ApiResponseBuilder.conflict('Route already exists between these cities')
    }

    const updatedRoute = await prisma.route.update({
      where: { id: params.id },
      data: {
        departureCityId,
        arrivalCityId,
        distance
      },
      include: {
        departureCity: {
          include: {
            country: true
          }
        },
        arrivalCity: {
          include: {
            country: true
          }
        }
      }
    })

    return ApiResponseBuilder.success(
      updatedRoute,
      SuccessMessages.UPDATED
    )
  } catch (error) {
    throw ApiError.database('Failed to update route')
  }
})

// DELETE - Delete route
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id: params.id }
    })

    if (!existingRoute) {
      return ApiResponseBuilder.notFound('Route')
    }

    // Check if route has any trips
    const routeWithTrips = await prisma.route.findFirst({
      where: {
        id: params.id,
        trips: {
          some: {}
        }
      }
    })

    if (routeWithTrips) {
      return ApiResponseBuilder.error(
        'Cannot delete route with associated trips',
        StatusCodes.BAD_REQUEST,
        'Route has associated trips and cannot be deleted'
      )
    }

    await prisma.route.delete({
      where: { id: params.id }
    })

    return ApiResponseBuilder.success(
      null,
      SuccessMessages.DELETED
    )
  } catch (error) {
    throw ApiError.database('Failed to delete route')
  }
})