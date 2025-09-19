import { NextRequest ,NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages ,StatusCodes} from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

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

    // Single optimized query with count and data
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
        seats: {
          select: {
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

    // Process trips to add seat summary statistics
    const processedTrips = trips.map(trip => {
      const { seats, ...tripData } = trip
      
      // Calculate seat counts by status
      const seatCounts = seats.reduce((acc, seat) => {
        const status = seat.status || 'available'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Calculate totals
      const totalSeats = trip.bus.capacity
      const bookedSeats = seatCounts.booked || 0
      const availableSeats = seatCounts.available || 0
      const reservedSeats = seatCounts.reserved || 0
      const blockedSeats = seatCounts.blocked || 0
      
      return {
        ...tripData,
        seatSummary: {
          total: totalSeats,
          booked: bookedSeats,
          available: availableSeats,
          reserved: reservedSeats,
          blocked: blockedSeats,
          occupancyRate: Math.round((bookedSeats / totalSeats) * 100)
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

    return ApiResponseBuilder.paginated(processedTrips, pagination, SuccessMessages.RETRIEVED)
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





