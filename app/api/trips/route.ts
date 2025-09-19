import { NextRequest ,NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages ,StatusCodes} from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// Simple in-memory cache for trips data
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds cache

// GET - Fetch all trips with pagination and filters
export const GET = asyncHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const routeId = searchParams.get('routeId')
    const busId = searchParams.get('busId')
    const departureDate = searchParams.get('departureDate')

    // Create cache key
    const cacheKey = `trips:${page}:${limit}:${status || 'all'}:${routeId || 'all'}:${busId || 'all'}:${departureDate || 'all'}`
    
    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.data
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (routeId) {
      where.routeId = routeId
    }
    if (busId) {
      where.busId = busId
    }
    if (departureDate) {
      const startDate = new Date(departureDate)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      where.departureTime = {
        gte: startDate,
        lt: endDate
      }
    }

    // Optimized query with SQL aggregation for seat counts
    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        orderBy: {
          departureTime: 'desc'
        },
        include: {
          route: {
            include: {
              departureCity: {
                include: { country: true }
              },
              arrivalCity: {
                include: { country: true }
              }
            }
          },
          bus: {
            select: {
              id: true,
              plateNumber: true,
              model: true,
              capacity: true,
              status: true
            }
          },
          bookings: {
            select: {
              id: true,
              status: true,
              totalPrice: true
            }
          }
        },
        skip,
        take: limit
      }),
      prisma.trip.count({ where })
    ])

    // Get seat counts using raw SQL for better performance
    const tripIds = trips.map(trip => trip.id)
    const seatCounts = tripIds.length > 0 ? await prisma.$queryRaw`
      SELECT 
        trip_id,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) as booked,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
      FROM seats 
      WHERE trip_id IN (${tripIds.join("','")})
      GROUP BY trip_id
    ` as Array<{
      trip_id: string
      total: bigint
      booked: bigint
      available: bigint
      reserved: bigint
      blocked: bigint
    }> : []

    // Create seat counts lookup map
    const seatCountsMap = seatCounts.reduce((acc, count) => {
      acc[count.trip_id] = {
        total: Number(count.total),
        booked: Number(count.booked),
        available: Number(count.available),
        reserved: Number(count.reserved),
        blocked: Number(count.blocked)
      }
      return acc
    }, {} as Record<string, any>)

    // Process trips with optimized seat summary
    const processedTrips = trips.map(trip => {
      const seatCounts = seatCountsMap[trip.id] || {
        total: 0,
        booked: 0,
        available: 0,
        reserved: 0,
        blocked: 0
      }
      
      const totalSeats = trip.bus.capacity
      const occupancyRate = totalSeats > 0 ? Math.round((seatCounts.booked / totalSeats) * 100) : 0
      
      return {
        ...trip,
        seatSummary: {
          total: totalSeats,
          booked: seatCounts.booked,
          available: seatCounts.available,
          reserved: seatCounts.reserved,
          blocked: seatCounts.blocked,
          occupancyRate
        }
      }
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

    const response = ApiResponseBuilder.paginated(processedTrips, pagination, SuccessMessages.RETRIEVED)
    
    // Cache the response
    cache.set(cacheKey, { data: response, timestamp: Date.now() })
    
    // Clean old cache entries (simple cleanup)
    if (cache.size > 100) {
      const now = Date.now()
      const entries = Array.from(cache.entries())
      for (const [key, value] of entries) {
        if (now - value.timestamp > CACHE_TTL) {
          cache.delete(key)
        }
      }
    }
    
    return response
  } catch (error) {
    throw ApiError.database('Failed to fetch trips')
  }
})



// Create new trip
export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { 
    routeId, 
    busId, 
    departureTime, 
    arrivalTime, 
    price, 
    longitude, 
    latitude, 
    lastBookingTime,
    titleAr,
    titleEn,
    descriptionAr,
    descriptionEn,
    imageUrls
  } = body

  // Validate request data
  const validationResult = validateRequest(body, {
    routeId: { required: true },
    busId: { required: true },
    departureTime: { 
      required: true, 
      custom: (value: any) => {
        const date = new Date(value)
        if (isNaN(date.getTime())) return 'Invalid departure time format'
        if (date <= new Date()) return 'Departure time must be in the future'
        return true
      }
    },
    arrivalTime: { 
      required: true, 
      custom: (value: any) => {
        const date = new Date(value)
        if (isNaN(date.getTime())) return 'Invalid arrival time format'
        return true
      }
    },
    price: { required: true, min: 0 },
    longitude: { required: true, min: -180, max: 180 },
    latitude: { required: true, min: -90, max: 90 },
    lastBookingTime: { 
      required: true, 
      custom: (value: any) => {
        const date = new Date(value)
        if (isNaN(date.getTime())) return 'Invalid last booking time format'
        return true
      }
    },
    titleAr: { required: false, maxLength: 255 },
    titleEn: { required: false, maxLength: 255 },
    descriptionAr: { required: false, maxLength: 1000 },
    descriptionEn: { required: false, maxLength: 1000 },
    imageUrls: { required: false }
  })

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  // Additional business logic validation
  const departureDate = new Date(departureTime)
  const arrivalDate = new Date(arrivalTime)
  const lastBookingDate = new Date(lastBookingTime)

  if (lastBookingDate >= departureDate) {
    return ApiResponseBuilder.error(
      'Last booking time must be before departure time',
      StatusCodes.BAD_REQUEST
    )
  }

  if (arrivalDate <= departureDate) {
    return ApiResponseBuilder.error(
      'Arrival time must be after departure time',
      StatusCodes.BAD_REQUEST
    )
  }

  // Parallel validation queries - 3 calls instead of sequential
  const [route, bus, conflictingTrip] = await Promise.all([
    prisma.route.findUnique({
      where: { id: routeId },
      include: {
        departureCity: { include: { country: true } },
        arrivalCity: { include: { country: true } }
      }
    }),
    prisma.bus.findUnique({
      where: { id: busId }
    }),
    prisma.trip.findFirst({
      where: {
        busId,
        status: { in: ['scheduled', 'in_progress'] },
        OR: [
          {
            AND: [
              { departureTime: { lte: departureDate } },
              { arrivalTime: { gte: departureDate } }
            ]
          },
          {
            AND: [
              { departureTime: { lte: arrivalDate } },
              { arrivalTime: { gte: arrivalDate } }
            ]
          },
          {
            AND: [
              { departureTime: { gte: departureDate } },
              { arrivalTime: { lte: arrivalDate } }
            ]
          }
        ]
      }
    })
  ])

  // Validate results
  if (!route) {
    return ApiResponseBuilder.notFound('Route')
  }

  if (!bus) {
    return ApiResponseBuilder.notFound('Bus')
  }

  if (bus.status !== 'active') {
    return ApiResponseBuilder.error(
      'Bus is not available for scheduling',
      StatusCodes.BAD_REQUEST
    )
  }

  if (conflictingTrip) {
    return ApiResponseBuilder.conflict(
      'Bus is already scheduled for another trip during this time period'
    )
  }

  // Create trip with seats
  const trip = await prisma.$transaction(async (tx) => {
    // Create the trip
    const newTrip = await tx.trip.create({
      data: {
        routeId,
        busId,
        departureTime: departureDate,
        arrivalTime: arrivalDate,
        lastBookingTime: lastBookingDate,
        price,
        status: 'scheduled',
        longitude,
        latitude,
        titleAr,
        titleEn,
        descriptionAr,
        descriptionEn,
        imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
        createdAt: new Date(),
        
      },
      include: {
        route: {
          include: {
            departureCity: { include: { country: true } },
            arrivalCity: { include: { country: true } }
          }
        },
        bus: true
      }
    })

    // Create seats for the trip
    const seatPromises = Array.from({ length: bus.capacity }, (_, i) => {
      return tx.seat.create({
        data: {
          tripId: newTrip.id,
          seatNumber: `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`,
          status: 'available'
        }
      })
    })

    await Promise.all(seatPromises)

    return newTrip
  })

  return ApiResponseBuilder.created(
    {
      ...trip,
      imageUrls: trip.imageUrls ? JSON.parse(trip.imageUrls) : null,
      route: {
        from: {
          city: trip.route.departureCity.name,
          cityAr: trip.route.departureCity.nameAr,
          country: trip.route.departureCity.country.name,
          countryAr: trip.route.departureCity.country.nameAr
        },
        to: {
          city: trip.route.arrivalCity.name,
          cityAr: trip.route.arrivalCity.nameAr,
          country: trip.route.arrivalCity.country.name,
          countryAr: trip.route.arrivalCity.country.nameAr
        },
        distance: trip.route.distance
      },
      bus: {
        id: trip.bus.id,
        plateNumber: trip.bus.plateNumber,
        model: trip.bus.model,
        capacity: trip.bus.capacity,
        status: trip.bus.status
      }
    },
    SuccessMessages.TRIP_SCHEDULED
  )
}) 





