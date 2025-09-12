import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages } from '@/lib/apiResponse'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const GET = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const tripId = params.id

  // Validate trip ID
  if (!tripId || typeof tripId !== 'string') {
    return ApiResponseBuilder.error('Invalid trip ID', 400)
  }

  // Check if trip exists
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      bus: {
        select: {
          id: true,
          plateNumber: true,
          model: true,
          capacity: true
        }
      },
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

  // Get seats for the trip
  const seats = await prisma.seat.findMany({
    where: { 
      tripId: trip.id 
    },
    orderBy: { seatNumber: 'asc' },
    select: {
      id: true,
      seatNumber: true,
      status: true,
      tripId: true,

    }
  })

  // Calculate seat statistics
  const seatStats = {
    total: seats.length,
    available: seats.filter(seat => seat.status === 'available').length,
    blocked: seats.filter(seat => seat.status === 'blocked').length,
    booked: seats.filter(seat => seat.status === 'booked').length,
    reserved: seats.filter(seat => seat.status === 'reserved').length
  }

  return ApiResponseBuilder.success(
    {
      trip: {
        id: trip.id,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        status: trip.status,
        bus: trip.bus,
        route: {
          from: trip.route.departureCity.name,
          to: trip.route.arrivalCity.name
        }
      },
      seats,
      statistics: seatStats
    },
    SuccessMessages.RETRIEVED
  )
})