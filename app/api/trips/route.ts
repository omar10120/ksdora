import { NextRequest ,NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const GET = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const date = searchParams.get('date')
  const passengers = parseInt(searchParams.get('passengers') || '1')

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const skip = (page - 1) * limit

  // Validate search parameters
  const validationResult = validateRequest(
    { from, to, date, passengers, page, limit },
    {
      from: { required: false, type: 'string', minLength: 2 },
      to: { required: false, type: 'string', minLength: 2 },
      date: { 
        required: false, 
        custom: (value: any) => {
          if (!value) return true
          const dateObj = new Date(value)
          if (isNaN(dateObj.getTime())) return 'Invalid date format'
          if (dateObj < new Date()) return 'Date cannot be in the past'
          return true
        }
      },
      passengers: { required: false, min: 1, max: 10 },
      page: { required: false, min: 1 },
      limit: { required: false, min: 1, max: 50 }
    }
  )

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  // Build search query
  const where: any = {
    status: 'scheduled',
    departureTime: {
      gte: new Date() // Only show future trips
    }
  }

  // Add city filters
  if (from || to) {
    where.route = {}
    if (from) {
      where.route.departureCity = { 
        OR: [
          { name: { contains: from, mode: 'insensitive' } },
          { nameAr: { contains: from, mode: 'insensitive' } }
        ]
      }
    }
    if (to) {
      where.route.arrivalCity = { 
        OR: [
          { name: { contains: to, mode: 'insensitive' } },
          { nameAr: { contains: to, mode: 'insensitive' } }
        ]
      }
    }
  }

  // Add date filter
  if (date) {
    const searchDate = new Date(date)
    const nextDay = new Date(searchDate)
    nextDay.setDate(nextDay.getDate() + 1)
    
    where.departureTime = {
      gte: searchDate,
      lt: nextDay
    }
  }

  // Get trips with available seats
  const trips = await prisma.trip.findMany({
    skip,
    take: limit,
    where,
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
          capacity: true
        }
      },
      seats: {
        where: { status: 'available' },
        select: { 
          id: true, 
          seatNumber: true,
          status: true 
        }
      },
      bookings: {
        where: { status: { in: ['confirmed', 'pending'] } },
        select: { id: true }
      }
    },
    orderBy: {
      departureTime: 'asc'
    }
  })

  // Filter trips with enough available seats
  const availableTrips = trips.filter(trip => trip.seats.length >= passengers)

  if (availableTrips.length === 0) {
    return ApiResponseBuilder.warning(
      'No trips found matching your search criteria',
      {
        searchCriteria: { from, to, date, passengers },
        suggestion: 'Try adjusting your search parameters or check back later for new trips'
      }
    )
  }

  // Format trip data
  const tripsData = availableTrips.map(trip => {
    const { seats, imageUrls, ...tripData } = trip
    return {
      ...tripData,
      imageUrls: typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls,
      availableSeats: seats.length,
      totalSeats: trip.bus.capacity,
      occupancyRate: Math.round(((trip.bus.capacity - seats.length) / trip.bus.capacity) * 100),
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
        capacity: trip.bus.capacity
      }
    }
  })

  // Get total count for pagination
  const total = await prisma.trip.count({ where })

  const pagination = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  }

  return ApiResponseBuilder.paginated(
    tripsData,
    pagination,
    `${tripsData.length} trips found matching your search`
  )
})

//Get MyTrips id 


// export async function GET(req: Request) {
  //   try {
//     const { searchParams } = new URL(req.url);
//     const from = searchParams.get('from');
//     const to = searchParams.get('to');
//     const date = searchParams.get('date');

//     const page = parseInt(searchParams.get('page') || '1');
//     const limit = parseInt(searchParams.get('limit') || '10');
//     const limitSeat = parseInt(searchParams.get('limitSeat') || '1000');
//     const skip = (page - 1) * limit;

//     const trips = await prisma.trip.findMany({
//       skip,
//       take: limit,
//       where: {
//         status: 'scheduled',
//         AND: [
//           {
//             route: {
//               departureCity: from ? {
//                 name: { contains: from }
//               } : undefined,
//               arrivalCity: to ? {
//                 name: { contains: to }
//               } : undefined
//             }
//           },
//           date ? {
//             departureTime: {
//               gte: new Date(date),
//               lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
//             }
//           } : {}
//         ]
//       },
//       include: {
//         route: {
//           include: {
//             departureCity: true,
//             arrivalCity: true
//           }
//         },
//         seats: {
//           where: {
//             status: 'available'
//           }
//         }
//       }
//     });

//     if (!trips || trips.length === 0) {
//       return NextResponse.json({ error: 'No trips found' }, { status: 404 });
//     }

//     const tripsWithFilteredSeats = trips.map(trip => ({
//       ...trip,
//       imageUrls: typeof trip.imageUrls === 'string' ? JSON.parse(trip.imageUrls) : trip.imageUrls,
//       seats: trip.seats,
//       totalAvailableSeats: trip.seats.length
//     }));

//     const total = await prisma.trip.count({
//       where: {
//         status: 'scheduled',
//         AND: [
//           {
//             route: {
//               departureCity: from ? {
//                 name: { contains: from }
//               } : undefined,
//               arrivalCity: to ? {
//                 name: { contains: to }
//               } : undefined
//             }
//           },
//           date ? {
//             departureTime: {
//               gte: new Date(date),
//               lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
//             }
//           } : {}
//         ]
//       }
//     });

//     return NextResponse.json({
//       trips: tripsWithFilteredSeats,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//         limitSeat
//       }
//     });

//   } catch (error) {
//     console.error('Get trips error:', error);
//     return NextResponse.json({ error: 'Internal server error trips' }, { status: 500 });
//   }
// }


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
      400
    )
  }

  if (arrivalDate <= departureDate) {
    return ApiResponseBuilder.error(
      'Arrival time must be after departure time',
      400
    )
  }

  // Check if route exists
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      departureCity: { include: { country: true } },
      arrivalCity: { include: { country: true } }
    }
  })

  if (!route) {
    return ApiResponseBuilder.notFound('Route')
  }

  // Check if bus exists and is available
  const bus = await prisma.bus.findUnique({
    where: { id: busId }
  })

  if (!bus) {
    return ApiResponseBuilder.notFound('Bus')
  }

  if (bus.status !== 'active') {
    return ApiResponseBuilder.error(
      'Bus is not available for scheduling',
      400
    )
  }

  // Check for bus availability conflicts
  const conflictingTrip = await prisma.trip.findFirst({
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
        imageUrls: imageUrls ? JSON.stringify(imageUrls) : null
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


//Get MyTrips id 




