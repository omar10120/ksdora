import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages } from '@/lib/apiResponse'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - Get seat availability for a trip
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const tripId = params.id

  // Validate trip ID
  if (!tripId || typeof tripId !== 'string') {
    return ApiResponseBuilder.error('Invalid trip ID', 400)
  }

  // Check if trip exists
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

  // Get all seats for this trip
  const seats = await prisma.seat.findMany({
    where: { tripId },
    orderBy: { seatNumber: 'asc' }
  })

  // Group seats by status
  const seatsByStatus = seats.reduce((acc, seat) => {
    if (!acc[seat.status || '']) {
      acc[seat.status || ''] = []
    }
    acc[seat.status || ''].push({
      id: seat.id,
      seatNumber: seat.seatNumber,
      status: seat.status
    })
    return acc
  }, {} as Record<string, any[]>)

  // Calculate availability statistics
  const totalSeats = seats.length
  const availableSeats = seatsByStatus.available || []
  const bookedSeats = seatsByStatus.booked || []
  const blockedSeats = seatsByStatus.blocked || []
  const reservedSeats = seatsByStatus.reserved || []

  const availabilityStats = {
    total: totalSeats,
    available: availableSeats.length,
    booked: bookedSeats.length,
    blocked: blockedSeats.length,
    reserved: reservedSeats.length,
    occupancyRate: totalSeats > 0 ? ((bookedSeats.length / totalSeats) * 100).toFixed(1) : '0'
  }

  return ApiResponseBuilder.success(
    {
      trip: {
        id: trip.id,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        price: trip.price,
        status: trip.status,
        lastBookingTime: trip.lastBookingTime,
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
        bus: trip.bus
      },
      seats: {
        all: seats.map(seat => ({
          id: seat.id,
          seatNumber: seat.seatNumber,
          status: seat.status
        })),
        byStatus: seatsByStatus
      },
      availability: availabilityStats
    },
    SuccessMessages.RETRIEVED
  )
})

// POST - Check specific seat availability (for concurrent booking protection)
export const POST = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const body = await request.json()
  const tripId = params.id

  // Validate trip ID
  if (!tripId || typeof tripId !== 'string') {
    return ApiResponseBuilder.error('Invalid trip ID', 400)
  }

  // Validate request data
  const { seatNumbers } = body

  if (!seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return ApiResponseBuilder.error('Seat numbers array is required', 400)
  }

  // Check if trip exists and is available
  const trip = await prisma.trip.findUnique({
    where: { id: tripId }
  })

  if (!trip) {
    return ApiResponseBuilder.notFound('Trip')
  }

  if (trip.status !== 'scheduled') {
    return ApiResponseBuilder.error(
      `Trip is not available for booking. Current status: ${trip.status}`,
      400
    )
  }

  if (trip.lastBookingTime && new Date() > trip.lastBookingTime) {
    return ApiResponseBuilder.error(
      'Booking deadline has passed for this trip',
      400
    )
  }

  // Check seat availability with row-level locking for concurrent protection
  const seatAvailability = await prisma.$transaction(async (tx) => {
    const seats = await tx.seat.findMany({
      where: {
        tripId,
        seatNumber: { in: seatNumbers }
      },
      select: {
        id: true,
        seatNumber: true,
        status: true
      }
    })

    const availableSeats = seats.filter(seat => seat.status === 'available')
    const unavailableSeats = seats.filter(seat => seat.status !== 'available')

    return {
      requested: seatNumbers,
      available: availableSeats.map(seat => seat.seatNumber),
      unavailable: unavailableSeats.map(seat => ({
        seatNumber: seat.seatNumber,
        status: seat.status
      })),
      allAvailable: availableSeats.length === seatNumbers.length
    }
  })

  return ApiResponseBuilder.success(
    {
      ...seatAvailability,
      tripId,
      checkedAt: new Date().toISOString()
    },
    seatAvailability.allAvailable 
      ? 'All requested seats are available' 
      : 'Some seats are not available'
  )
})
