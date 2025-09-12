import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages } from '@/lib/apiResponse'
import { validateRequest } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// GET - Fetch all routes with pagination and filters
export const GET = asyncHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const departureCityId = searchParams.get('departureCityId')
    const arrivalCityId = searchParams.get('arrivalCityId')

    // Calculate pagination
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    if (departureCityId) {
      where.departureCityId = departureCityId
    }
    if (arrivalCityId) {
      where.arrivalCityId = arrivalCityId
    }

    // Get total count
    const total = await prisma.route.count({ where })
    
    // Get routes
    const routes = await prisma.route.findMany({
      where,
      orderBy: {
        departureCity: {
          name: 'asc'
        }
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
        },
        trips: {
          include: {
            bus: {
              select: {
                plateNumber: true,
                model: true,
                status: true
              }
            }
          },
          orderBy: {
            departureTime: 'asc'
          }
        }
      },
      skip,
      take: limit
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit)
    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    return ApiResponseBuilder.paginated(routes, pagination, SuccessMessages.RETRIEVED)
  } catch (error) {
    throw ApiError.database('Failed to fetch routes')
  }
})

// POST - Create new route
export const POST = asyncHandler(async (request: NextRequest) => {
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
      return ApiResponseBuilder.conflict('Route already exists between these cities')
    }

    // Create new route
    const route = await prisma.route.create({
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

    return ApiResponseBuilder.created(
      route,
      SuccessMessages.CREATED
    )
  } catch (error) {
    throw ApiError.database('Failed to create route')
  }
})