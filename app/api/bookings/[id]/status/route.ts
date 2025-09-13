import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// PUT - Update booking status with business logic validation
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const body = await request.json()
  const userId = request.headers.get('userId')
  const bookingId = params.id

  // Validate authentication
  if (!userId) {
    return ApiResponseBuilder.unauthorized('Authentication required')
  }

  // Validate booking ID
  if (!bookingId || typeof bookingId !== 'string') {
    return ApiResponseBuilder.error('Invalid booking ID', StatusCodes.BAD_REQUEST)
  }

  // Validate request data
  const validationResult = validateRequest(body, {
    status: { 
      required: true, 
      enum: ['pending', 'confirmed', 'cancelled', 'completed'] as string[]
    },
    reason: {
      required: false,
      maxLength: 500
    }
  })

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  const { status, reason } = body

  // Check if booking exists and belongs to user
  const existingBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { 
      details: { include: { seat: true } },
      trip: {
        include: {
          route: {
            include: {
              departureCity: { include: { country: true } },
              arrivalCity: { include: { country: true } }
            }
          }
        }
      },
      bill: {
        include: {
          payments: true
        }
      }
    }
  })

  if (!existingBooking) {
    return ApiResponseBuilder.notFound('Booking')
  }

  if (existingBooking.userId !== userId) {
    return ApiResponseBuilder.forbidden('You can only update your own bookings')
  }

  // Business logic validation
  const currentStatus = existingBooking.status
  const newStatus = status

  // Validate status transitions
  const validTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['completed', 'cancelled'],
    'cancelled': [], // No transitions from cancelled
    'completed': [] // No transitions from completed
  }

  // if (!validTransitions[currentStatus as keyof typeof validTransitions]?.includes(newStatus)) {
  //   return ApiResponseBuilder.error(
  //     `Invalid status transition from ${currentStatus} to ${newStatus}`,
      
  //   )
  // }

  // Additional business logic checks
  if (newStatus === 'confirmed') {
    // Check if bill is paid
    if (!existingBooking.bill) {
      return ApiResponseBuilder.error('No bill found for this booking', StatusCodes.BAD_REQUEST)
    }

    if (existingBooking.bill.status !== 'paid') {
      return ApiResponseBuilder.error(
        'Booking cannot be confirmed until payment is completed',
        StatusCodes.BAD_REQUEST
      )
    }

    // Check if trip is still scheduled
    if (existingBooking.trip.status !== 'scheduled') {
      return ApiResponseBuilder.error(
        'Cannot confirm booking for trip that is not scheduled',
        StatusCodes.BAD_REQUEST
      )
    }
  }

  if (newStatus === 'completed') {
    // Check if trip has actually completed
    if (existingBooking.trip.status !== 'completed') {
      return ApiResponseBuilder.error(
        'Booking cannot be marked as completed until trip is completed',
        StatusCodes.BAD_REQUEST
      )
    }
  }

  // Update booking status in transaction
  const updatedBooking = await prisma.$transaction(async (tx) => {
    // Update booking status
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
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
                capacity: true,
                status: true
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
    })

    // Handle seat status changes
    if (newStatus === 'cancelled') {
      // Release seats back to available
      await tx.seat.updateMany({
        where: {
          id: { in: booking.details.map(detail => detail.seatId) }
        },
        data: { status: 'available' }
      })

      // Update bill status to cancelled if not paid
      if (booking.bill && booking.bill.status === 'unpaid') {
        await tx.bill.update({
          where: { id: booking.bill.id },
          data: { status: 'cancelled' }
        })
      }
    } else if (newStatus === 'confirmed') {
      // Ensure seats remain booked
      await tx.seat.updateMany({
        where: {
          id: { in: booking.details.map(detail => detail.seatId) }
        },
        data: { status: 'booked' }
      })
    }

    return booking
  })

  // Generate status message
  const statusMessages = {
    'pending': 'Booking is pending confirmation',
    'confirmed': 'Booking confirmed! Your seats are reserved.',
    'cancelled': 'Booking has been cancelled',
    'completed': 'Trip completed successfully'
  }

  return ApiResponseBuilder.success(
    {
      ...updatedBooking,
      bookingReference: `BK-${updatedBooking.id.substring(0, 8).toUpperCase()}`,
      route: {
        from: {
          city: updatedBooking.trip.route.departureCity.name,
          cityAr: updatedBooking.trip.route.departureCity.nameAr,
          country: updatedBooking.trip.route.departureCity.country.name,
          countryAr: updatedBooking.trip.route.departureCity.country.nameAr
        },
        to: {
          city: updatedBooking.trip.route.arrivalCity.name,
          cityAr: updatedBooking.trip.route.arrivalCity.nameAr,
          country: updatedBooking.trip.route.arrivalCity.country.name,
          countryAr: updatedBooking.trip.route.arrivalCity.country.nameAr
        },
        distance: updatedBooking.trip.route.distance
      },
      bus: updatedBooking.trip.bus,
      seats: updatedBooking.details.map(detail => ({
        id: detail.seat.id,
        seatNumber: detail.seat.seatNumber,
        price: detail.price,
        status: detail.seat.status
      })),
      payment: updatedBooking.bill ? {
        billId: updatedBooking.bill.id,
        amount: updatedBooking.bill.amount,
        status: updatedBooking.bill.status,
        payments: updatedBooking.bill.payments
      } : null,
      statusChange: {
        from: currentStatus,
        to: newStatus,
        reason: reason || null,
        changedAt: new Date()
      }
    },
    statusMessages[newStatus as keyof typeof statusMessages]
  )
})

// GET - Get booking status and available actions
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const userId = request.headers.get('userId')
  const bookingId = params.id

  // Validate authentication
  if (!userId) {
    return ApiResponseBuilder.unauthorized('Authentication required')
  }

  // Validate booking ID
  if (!bookingId || typeof bookingId !== 'string') {
    return ApiResponseBuilder.error('Invalid booking ID', 400)
  }

  // Get booking with full details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      trip: {
        include: {
          route: {
            include: {
              departureCity: { include: { country: true } },
              arrivalCity: { include: { country: true } }
            }
          }
        }
      },
      bill: {
        include: {
          payments: true
        }
      }
    }
  })

  if (!booking) {
    return ApiResponseBuilder.notFound('Booking')
  }

  if (booking.userId !== userId) {
    return ApiResponseBuilder.forbidden('You can only view your own bookings')
  }

  // Determine available actions based on current status
  const availableActions = getAvailableActions(booking.status as string, booking.bill?.status ?? '', booking.trip.status as string)

  return ApiResponseBuilder.success(
    {
      bookingId: booking.id,
      status: booking.status,
      bookingReference: `BK-${booking.id.substring(0, 8).toUpperCase()}`,
      // createdAt: booking.createdAt ?? new Date(),
      // updatedAt: booking.updatedAt ?? new Date()  ,
      availableActions,
      paymentStatus: booking.bill ? {
        billStatus: booking.bill.status,
        amount: booking.bill.amount,
        totalPaid: booking.bill.payments
          .filter(p => p.status === 'successful')
          .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
        remainingBalance: parseFloat(booking.bill.amount.toString()) - 
          booking.bill.payments
            .filter(p => p.status === 'successful')
            .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
      } : null,
      trip: {
        status: booking.trip.status,
        departureTime: booking.trip.departureTime,
        arrivalTime: booking.trip.arrivalTime
      }
    },
    SuccessMessages.RETRIEVED
  )
})

// Helper function to determine available actions
function getAvailableActions(
  bookingStatus: string, 
  billStatus?: string, 
  tripStatus?: string
): string[] {
  const actions: string[] = []

  switch (bookingStatus) {
    case 'pending':
      if (billStatus === 'paid') {
        actions.push('confirm')
      }
      actions.push('cancel')
      break
    case 'confirmed':
      if (tripStatus === 'completed') {
        actions.push('complete')
      }
      actions.push('cancel')
      break
    case 'cancelled':
      // No actions available
      break
    case 'completed':
      // No actions available
      break
  }

  return actions
}
