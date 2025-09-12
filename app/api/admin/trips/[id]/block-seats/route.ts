import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const POST = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const body = await request.json()
  const tripId = params.id

  // Validate request data
  const validationResult = validateRequest(body, {
    seatIds: { 
      required: true, 
      type: 'array',
      custom: (value: any) => {
        if (!Array.isArray(value)) return 'seatIds must be an array'
        if (value.length === 0) return 'seatIds cannot be empty'
        if (!value.every((id: any) => typeof id === 'string' && id.length > 0)) {
          return 'All seat IDs must be valid strings'
        }
        return true
      }
    }
  })

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  const { seatIds } = body

  // Check if trip exists
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      bus: true,
      route: {
        include: {
          departureCity: true,
          arrivalCity: true
        }
      }
    }
  })

  if (!trip) {
    return ApiResponseBuilder.notFound('Trip')
  }

  // Check if trip is in a state that allows seat blocking
  if (trip.status === 'completed' || trip.status === 'cancelled') {
    return ApiResponseBuilder.error(
      'Cannot block seats for completed or cancelled trips',
      400
    )
  }

  // Check if seats belong to this trip and are available
  const seats = await prisma.seat.findMany({
    where: {
      id: { in: seatIds },
      tripId: tripId,
      status: 'available'
    },
    include: {
      trip: {
        select: {
          id: true,
          departureTime: true,
          status: true
        }
      }
    }
  })

  if (seats.length !== seatIds.length) {
    const unavailableSeats = seatIds.filter((id: string) => 
      !seats.some(seat => seat.id === id)
    )
    
    return ApiResponseBuilder.error(
      `Some seats are not available or don't belong to this trip. Unavailable seats: ${unavailableSeats.join(', ')}`,
      400
    )
  }

  // Additional validation: Check if seats are from the correct trip
  const invalidTripSeats = seats.filter(seat => seat.tripId !== tripId)
  if (invalidTripSeats.length > 0) {
    return ApiResponseBuilder.error(
      `Some seats don't belong to this trip: ${invalidTripSeats.map(s => s.id).join(', ')}`,
      400
    )
  }

  // Block the seats
  const blockedSeats = await prisma.seat.updateMany({
    where: {
      id: { in: seatIds }
    },
    data: {
      status: 'blocked'
    }
  })

  return ApiResponseBuilder.success(
    {
      blockedCount: blockedSeats.count,
      seatIds,
      seats: seats.map(seat => ({
        id: seat.id,
        seatNumber: seat.seatNumber,
        previousStatus: 'available',
        newStatus: 'blocked'
      })),
      trip: {
        id: trip.id,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        status: trip.status,
        route: {
          from: {
            city: trip.route.departureCity.name,
            cityAr: trip.route.departureCity.nameAr
          },
          to: {
            city: trip.route.arrivalCity.name,
            cityAr: trip.route.arrivalCity.nameAr
          }
        },
        bus: {
          id: trip.bus.id,
          plateNumber: trip.bus.plateNumber,
          model: trip.bus.model,
          capacity: trip.bus.capacity
        }
      },
      blockedAt: new Date().toISOString()
    },
    SuccessMessages.SEAT_RESERVED
  )
})