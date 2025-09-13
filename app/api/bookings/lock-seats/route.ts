import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages , StatusCodes} from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// POST - Lock seats temporarily for booking (prevents concurrent bookings)
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
    seatNumbers: {
      required: true,
      custom: (value: any) => {
        if (!Array.isArray(value)) return 'Seat numbers must be an array'
        if (value.length === 0) return 'At least one seat must be selected'
        if (value.length > 10) return 'Maximum 10 seats per booking'
        if (!value.every(seat => typeof seat === 'string' && seat.trim().length > 0)) {
          return 'All seat numbers must be non-empty strings'
        }
        return true
      }
    },
    lockDuration: {
      required: false,
      min: 30, // Minimum 30 seconds
      max: 300, // Maximum 5 minutes
      custom: (value: any) => {
        if (value === undefined || value === null) return true
        const parsed = parseInt(value)
        if (isNaN(parsed)) return 'Lock duration must be a valid number'
        if (parsed < 30) return 'Lock duration must be at least 30 seconds'
        if (parsed > 300) return 'Lock duration cannot exceed 5 minutes'
        return true
      }
    }
  })

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  const { tripId, seatNumbers, lockDuration = 120 } = body // Default 2 minutes

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
      StatusCodes.BAD_REQUEST
    )
  }

  if (trip.lastBookingTime && new Date() > trip.lastBookingTime) {
    return ApiResponseBuilder.error(
      'Booking deadline has passed for this trip',
      StatusCodes.BAD_REQUEST
    )
  }

  // Lock seats with concurrent protection
  const lockResult = await prisma.$transaction(async (tx) => {
    // Check if seats exist and are available
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

    if (seats.length !== seatNumbers.length) {
      const foundSeatNumbers = seats.map(seat => seat.seatNumber)
      const missingSeats = seatNumbers.filter((seatNumber: string) => !foundSeatNumbers.includes(seatNumber))
      throw ApiError.validation(`The following seats do not exist: ${missingSeats.join(', ')}`)
    }

    const unavailableSeats = seats.filter(seat => seat.status !== 'available')
    if (unavailableSeats.length > 0) {
      throw ApiError.validation(
        `The following seats are not available: ${unavailableSeats.map(seat => seat.seatNumber).join(', ')}`
      )
    }

    // Check for existing locks by this user
    const existingLocks = await tx.seat.findMany({
      where: {
        tripId,
        seatNumber: { in: seatNumbers },
        status: 'reserved'
      },
      include: {
        bookingDetails: {
          include: {
            booking: {
              select: {
                userId: true,
                bookingDate : true,
                createdAt : true,
                updatedAt:true
                
              }
            }
          }
        }
      }
    })

    // Check if seats are locked by another user (within lock duration)
    const now = new Date()
    const lockExpiryTime = new Date(now.getTime() - lockDuration * 1000)

    const conflictingLocks = existingLocks.filter(seat => {
      const booking = seat.bookingDetails[0]?.booking
      if (!booking) return false
      
      // If locked by different user and within lock duration
      return booking.userId !== userId && booking.bookingDate  > lockExpiryTime
    })

    if (conflictingLocks.length > 0) {
      throw ApiError.conflict(
        `The following seats are currently locked by another user: ${conflictingLocks.map(seat => seat.seatNumber).join(', ')}`
      )
    }

    // Create temporary booking to lock seats
    const lockBooking = await tx.booking.create({
      data: {
        userId,
        tripId,
        bookingDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        

        totalPrice: 0, // Temporary booking, no price
        status: 'pending',
        details: {
          create: seats.map(seat => ({
            seatId: seat.id,
            price: 0 // Temporary booking, no price
          }))
        }
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        bookingDate: true,
        totalPrice: true,
        status: true,
        details: true
      }
    })

    // Update seats to reserved status
    await tx.seat.updateMany({
      where: {
        id: { in: seats.map(seat => seat.id) }
      },
      data: { status: 'reserved' }
    })

    return {
      lockId: lockBooking.id,
      seats: seatNumbers,
      lockedAt: lockBooking.createdAt,
      expiresAt: new Date(lockBooking.createdAt.getTime() + lockDuration * 1000),
      lockDuration
    }
  })

  return ApiResponseBuilder.success(
    {
      ...lockResult,
      message: `Seats locked for ${lockDuration} seconds. Complete your booking before expiry.`
    },
    'Seats locked successfully'
  )
})

// DELETE - Release seat locks
export const DELETE = asyncHandler(async (request: NextRequest) => {
  const body = await request.json()
  const userId = request.headers.get('userId')

  // Validate authentication
  if (!userId) {
    return ApiResponseBuilder.unauthorized('Authentication required')
  }

  // Validate request data
  const validationResult = validateRequest(body, {
    lockId: { required: true }
  })

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  const { lockId } = body

  // Release locks in transaction
  const releaseResult = await prisma.$transaction(async (tx) => {
    // Find the lock booking
    const lockBooking = await tx.booking.findUnique({
      where: { id: lockId },
      include: {
        details: {
          include: {
            seat: true
          }
        }
      }
    })

    if (!lockBooking) {
      throw ApiError.notFound('Lock not found')
    }

    if (lockBooking.userId !== userId) {
      throw ApiError.forbidden('You can only release your own locks')
    }

    if (lockBooking.status !== 'pending') {
      ApiError.validation('Lock has already been processed')
    }

    // Update seats back to available
    await tx.seat.updateMany({
      where: {
        id: { in: lockBooking.details.map(detail => detail.seatId) }
      },
      data: { status: 'available' }
    })

    // Delete the temporary booking
    await tx.bookingDetail.deleteMany({
      where: { bookingId: lockId }
    })

    await tx.booking.delete({
      where: { id: lockId }
    })

    return {
      lockId,
      releasedSeats: lockBooking.details.map(detail => detail.seat.seatNumber),
      releasedAt: new Date()
    }
  })

  return ApiResponseBuilder.success(
    releaseResult,
    'Seat locks released successfully'
  )
})
