import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const GET = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const includeTrips = searchParams.get('includeTrips') === 'true'

  // Validate query parameters
  const validationResult = validateRequest(
    { status, page, limit },
    {
      status: { 
        required: false, 
        enum: ['active', 'maintenance', 'inactive'] 
      },
      page: { required: false, min: 1 },
      limit: { required: false, min: 1, max: 100 }
    }
  )

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  // Build where clause
  const where: any = {}
  if (status) {
    where.status = status
  }

  // Calculate pagination
  const skip = (page - 1) * limit

  // Build include clause
  const include: any = {}
  if (includeTrips) {
    include.trips = {
      include: {
        route: {
          include: {
            departureCity: { include: { country: true } },
            arrivalCity: { include: { country: true } }
          }
        }
      },
      orderBy: { departureTime: 'desc' },
      take: 5 // Limit recent trips
    }
  }

  // Get buses with pagination
  const buses = await prisma.bus.findMany({
    where,
    include,

    skip,
    take: limit
  })

  // Get total count
  const total = await prisma.bus.count({ where })

  // Format bus data
  const formattedBuses = buses.map(bus => ({
    ...bus,
    tripCount: bus.trips ? bus.trips.length : 0,
    recentTrips: bus.trips ? bus.trips.map(trip => ({
      id: trip.id,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      status: trip.status,
      // route: {
      //   from: {
      //     city: trip.route.departureCity.name,
      //     cityAr: trip.route.departureCity.nameAr,
      //     country: trip.route.departureCity.country?.name,
      //     countryAr: trip.route.departureCity.country?.nameAr
      //   },
      //   to: {
      //     city: trip.route.arrivalCity.name,
      //     cityAr: trip.route.arrivalCity.nameAr,
      //     country: trip.route.arrivalCity.country?.name,
      //     countryAr: trip.route.arrivalCity.country?.nameAr
      //   }
      // }
    })) : []
  }))

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

  return ApiResponseBuilder.paginated(
    formattedBuses,
    pagination,
    `${formattedBuses.length} buses found`
  )
})

export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json()

  // Validate request data
  const validationResult = validateRequest(body, {
    plateNumber: { 
      required: true, 
      minLength: 3, 
      maxLength: 20,
      pattern: /^[A-Z0-9-]+$/,
      custom: (value: string) => {
        if (!value.match(/^[A-Z0-9-]+$/)) {
          return 'Plate number must contain only uppercase letters, numbers, and hyphens'
        }
        return true
      }
    },
    capacity: { 
      required: true, 
      min: 10, 
      max: 100,
      custom: (value: any) => {
        const parsed = parseInt(value)
        if (isNaN(parsed)) return 'Capacity must be a valid number'
        if (parsed < 10) return 'Capacity must be at least 10 seats'
        if (parsed > 100) return 'Capacity cannot exceed 100 seats'
        return true
      }
    },
    model: { 
      required: false, 
      minLength: 2, 
      maxLength: 50 
    },
    status: { 
      required: false, 
      enum: ['active', 'maintenance', 'inactive'] 
    }
  })

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  const { plateNumber, capacity, model, status } = body

  // Check if bus with this plate number already exists
  const existingBus = await prisma.bus.findUnique({
    where: { plateNumber: plateNumber.toUpperCase() }
  })

  if (existingBus) {
    return ApiResponseBuilder.conflict('Bus with this plate number already exists')
  }

  // Create bus
  const bus = await prisma.bus.create({
    data: {
      plateNumber: plateNumber.toUpperCase(),
      capacity: parseInt(capacity),
      model: model || null,
      status: status || 'active'
    }
  })

  return ApiResponseBuilder.created(
    {
      ...bus,
      plateNumber: bus.plateNumber,
      capacity: bus.capacity,
      model: bus.model,
      status: bus.status,

    },
    SuccessMessages.CREATED
  )
})