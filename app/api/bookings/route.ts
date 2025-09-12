import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json()
  const userId = request.headers.get('userId')

  // Validate authentication
  if (!userId) {
    return ApiResponseBuilder.unauthorized('Authentication required')
  }

  // Validate request data
  const validationResult = validateRequest(body, {
    tripId: { required: true },
    seatsNumber: { 
      required: true, 
      min: 1, 
      max: 10,
      custom: (value: any) => {
        const parsed = parseInt(value)
        if (isNaN(parsed)) return 'Seats number must be a valid number'
        if (parsed <= 0) return 'Seats number must be greater than 0'
        if (parsed > 10) return 'Maximum 10 seats per booking'
        return true
      }
    }
  })

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  const { tripId, seatsNumber } = body
  const parsedSeats = parseInt(seatsNumber)

  // Check if trip exists and is available for booking
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      route: {
        include: {
          departureCity: { include: { country: true } },
          arrivalCity: { include: { country: true } }
        }
      },
      bus: {
        select: {
          id: true,
          plateNumber: true,
          model: true,
          capacity: true
        }
      }
    }
  })

  if (!trip) {
    return ApiResponseBuilder.notFound('Trip')
  }

  // Check if trip is available for booking
  if (trip.status !== 'scheduled') {
    return ApiResponseBuilder.error(
      `Trip is not available for booking. Current status: ${trip.status}`,
      400
    )
  }

  // Check if booking deadline has passed
  if (trip.lastBookingTime && new Date() > trip.lastBookingTime) {
    return ApiResponseBuilder.error(
      'Booking deadline has passed for this trip',
      400
    )
  }

  const booking = await prisma.$transaction(async (tx) => {
    const availableSeats = await tx.seat.findMany({
      where: {
        tripId,
        status: 'available'
      },
      take: parsedSeats,
      orderBy: { seatNumber: 'asc' }
    });

    if (availableSeats.length < parsedSeats) {
      throw ApiError.validation(`Only ${availableSeats.length} seats are available. Requested: ${parsedSeats}`)
    }

    const totalPrice = new Decimal(trip.price).mul(parsedSeats);

    const newBooking = await tx.booking.create({
      data: {
        userId,
        tripId,
        totalPrice,
        status: 'pending',
        details: {
          create: availableSeats.map(seat => ({
            seatId: seat.id,
            price: trip.price
          }))
        }
      },
      include: {
        trip: {
          include: {
            route: {
              include: {
                departureCity: { include: { country: true } },
                arrivalCity: { include: { country: true } }
              }
            },
            bus: {
              select: {
                id: true,
                plateNumber: true,
                model: true,
                capacity: true
              }
            }
          }
        },
        details: {
          include: {
            seat: {
              select: {
                id: true,
                seatNumber: true,
                status: true
              }
            }
          }
        }
      }
    });

    await tx.seat.updateMany({
      where: {
        id: { in: availableSeats.map(seat => seat.id) }
      },
      data: { status: 'booked' }
    });

    return newBooking
  });

  return ApiResponseBuilder.created(
    {
      ...booking,
      bookingReference: `BK-${booking.id.substring(0, 8).toUpperCase()}`,
      route: {
        from: {
          city: booking.trip.route.departureCity.name,
          cityAr: booking.trip.route.departureCity.nameAr,
          country: booking.trip.route.departureCity.country.name,
          countryAr: booking.trip.route.departureCity.country.nameAr
        },
        to: {
          city: booking.trip.route.arrivalCity.name,
          cityAr: booking.trip.route.arrivalCity.nameAr,
          country: booking.trip.route.arrivalCity.country.name,
          countryAr: booking.trip.route.arrivalCity.country.nameAr
        },
        distance: booking.trip.route.distance
      },
      bus: booking.trip.bus,
      seats: booking.details.map(detail => ({
        id: detail.seat.id,
        seatNumber: detail.seat.seatNumber,
        price: detail.price
      }))
    },
    SuccessMessages.BOOKING_CONFIRMED
  )
})

export const GET = asyncHandler(async (request: NextRequest) => {
  const userId = request.headers.get('userId')
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  // Validate authentication
  if (!userId) {
    return ApiResponseBuilder.unauthorized('Authentication required')
  }

  // Validate query parameters
  const validationResult = validateRequest(
    { status, page, limit },
    {
      status: { 
        required: false, 
        enum: ['pending', 'confirmed', 'cancelled', 'completed'] 
      },
      page: { required: false, min: 1 },
      limit: { required: false, min: 1, max: 50 }
    }
  )

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  // Build where clause
  const where: any = { userId }
  if (status) {
    where.status = status
  }

  // Calculate pagination
  const skip = (page - 1) * limit

  // Get bookings with pagination
  const bookings = await prisma.booking.findMany({
    where,
    include: {
      trip: {
        include: {
          route: {
            include: {
              departureCity: { include: { country: true } },
              arrivalCity: { include: { country: true } }
            }
          },
          bus: {
            select: {
              id: true,
              plateNumber: true,
              model: true,
              capacity: true
            }
          }
        }
      },
      details: {
        include: {
          seat: {
            select: {
              id: true,
              seatNumber: true,
              status: true
            }
          }
        }
      }
    },
    orderBy: {
      bookingDate: 'desc'
    },
    skip,
    take: limit
  })

  // Get total count
  const total = await prisma.booking.count({ where })

  // Format booking data
  const formattedBookings = bookings.map(booking => ({
    ...booking,
    bookingReference: `BK-${booking.id.substring(0, 8).toUpperCase()}`,
    route: {
      from: {
        city: booking.trip.route.departureCity.name,
        cityAr: booking.trip.route.departureCity.nameAr,
        country: booking.trip.route.departureCity.country.name,
        countryAr: booking.trip.route.departureCity.country.nameAr
      },
      to: {
        city: booking.trip.route.arrivalCity.name,
        cityAr: booking.trip.route.arrivalCity.nameAr,
        country: booking.trip.route.arrivalCity.country.name,
        countryAr: booking.trip.route.arrivalCity.country.nameAr
      },
      distance: booking.trip.route.distance
    },
    bus: booking.trip.bus,
    seats: booking.details.map(detail => ({
      id: detail.seat.id,
      seatNumber: detail.seat.seatNumber,
      price: detail.price,
      status: detail.seat.status
    }))
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
    formattedBookings,
    pagination,
    `${formattedBookings.length} bookings found`
  )
})


