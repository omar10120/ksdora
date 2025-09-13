import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages ,StatusCodes } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'
import { Seat } from '@prisma/client'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json()
  const userId = request.headers.get('userId')

  // Validate authentication
  if (!userId) {
    return ApiResponseBuilder.unauthorized('Authentication required')
  }

  // Validate request data - support both seat selection methods
  const validationResult = validateRequest(body, {
    tripId: { required: true },
    seatsNumber: { 
      required: false, 
      min: 1, 
      max: 10,
      custom: (value: any) => {
        if (value === undefined || value === null) return true // Optional if selectedSeats provided
        const parsed = parseInt(value)
        if (isNaN(parsed)) return 'Seats number must be a valid number'
        if (parsed <= 0) return 'Seats number must be greater than 0'
        if (parsed > 10) return 'Maximum 10 seats per booking'
        return true
      }
    },
    selectedSeats: {
      required: false,
      custom: (value: any) => {
        if (value === undefined || value === null) return true // Optional if seatsNumber provided
        if (!Array.isArray(value)) return 'Selected seats must be an array'
        if (value.length === 0) return 'At least one seat must be selected'
        if (value.length > 10) return 'Maximum 10 seats per booking'
        if (!value.every(seat => typeof seat === 'string' && seat.trim().length > 0)) {
          return 'All seat numbers must be non-empty strings'
        }
        return true
      }
    }
  })

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  const { tripId, seatsNumber, selectedSeats } = body

  // Ensure at least one selection method is provided
  if (!seatsNumber && !selectedSeats) {
    return ApiResponseBuilder.validationError(
      { seatsNumber: ['Either seatsNumber or selectedSeats must be provided'] },
      ErrorMessages.VALIDATION_FAILED
    )
  }

  // Determine seat selection method
  const useSpecificSeats = selectedSeats && selectedSeats.length > 0
  const seatCount = useSpecificSeats ? selectedSeats.length : parseInt(seatsNumber)

  // Comprehensive trip validation
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
          capacity: true,
          status: true
        }
      },
      seats: {
        select: {
          id: true,
          seatNumber: true,
          status: true
        }
      }
    }
  })

  if (!trip) {
    return ApiResponseBuilder.notFound('Trip')
  }

  // Comprehensive business logic validation
  const validationErrors: string[] = []

  // Check trip status
  if (trip.status !== 'scheduled') {
    validationErrors.push(`Trip is not available for booking. Current status: ${trip.status}`)
  }

  // Check booking deadline
  if (trip.lastBookingTime && new Date() > trip.lastBookingTime) {
    validationErrors.push('Booking deadline has passed for this trip')
  }

  // Check bus status
  if (trip.bus.status !== 'active' && trip.bus.status !== 'passenger_filling') {
    validationErrors.push(`Bus is not available for booking. Current status: ${trip.bus.status}`)
  }

  // Check departure time (can't book trips that have already departed)
  if (trip.departureTime && new Date() > trip.departureTime) {
    validationErrors.push('Cannot book a trip that has already departed')
  }

  // Check seat availability
  const availableSeatsCount = trip.seats.filter(seat => seat.status === 'available').length
  if (availableSeatsCount < seatCount) {
    validationErrors.push(`Only ${availableSeatsCount} seats are available. Requested: ${seatCount}`)
  }

  // Check if user already has a booking for this trip
  const existingUserBooking = await prisma.booking.findFirst({
    where: {
      userId,
      tripId,
      status: { in: ['pending', 'confirmed'] }
    }
  })

  if (existingUserBooking) {
    validationErrors.push('You already have an active booking for this trip')
  }

  // Return validation errors if any
  if (validationErrors.length > 0) {
    return ApiResponseBuilder.error(
      validationErrors.join('; '),
      StatusCodes.BAD_REQUEST
    )
  }

  const booking = await prisma.$transaction(async (tx) => {
    let availableSeats: Seat[]

    if (useSpecificSeats) {
      // Find specific seats by seat numbers
      availableSeats = await tx.seat.findMany({
        where: {
          tripId,
          seatNumber: { in: selectedSeats },
          status: 'available'
        }
      });

      if (availableSeats.length !== selectedSeats.length) {
        const unavailableSeats = selectedSeats.filter(
          (seatNumber: string) => !availableSeats.some(seat => seat.seatNumber === seatNumber)
        );
        throw ApiError.validation(
          `The following seats are not available: ${unavailableSeats.join(', ')}`
        )
      }
    } else {
      // Find any available seats (quantity-based selection)
      availableSeats = await tx.seat.findMany({
        where: {
          tripId,
          status: 'available'
        },
        take: seatCount,
        orderBy: { seatNumber: 'asc' }
      });

      if (availableSeats.length < seatCount) {
        throw ApiError.validation(`Only ${availableSeats.length} seats are available. Requested: ${seatCount}`)
      }
    }

    const totalPrice = new Decimal(trip.price).mul(availableSeats.length);

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
        },
        bill: {
          create: {
            amount: totalPrice,
            status: 'unpaid'
          }
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
        },
        bill: {
          include: {
            payments: {
              select: {
                id: true,
                amount: true,
                method: true,
                status: true,
                paidAt: true
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
      })),
      payment: {
        billId: booking.bill?.id,
        amount: booking.bill?.amount,
        status: booking.bill?.status,
        payments: booking.bill?.payments
      }
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

  return ApiResponseBuilder.success(
    {
      bookings: formattedBookings,
      pagination
    },
    `${formattedBookings.length} bookings found`
  )
})


