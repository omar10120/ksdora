import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

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
    return ApiResponseBuilder.error('Invalid booking ID', StatusCodes.BAD_REQUEST)
  }

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

  if (!booking) {
    return ApiResponseBuilder.notFound('Booking')
  }

  if (booking.userId !== userId) {
    return ApiResponseBuilder.forbidden('You can only view your own bookings')
  }

  return ApiResponseBuilder.success(
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
        price: detail.price,
        status: detail.seat.status
      })),
      payment: booking.bill ? {
        billId: booking.bill.id,
        amount: booking.bill.amount,
        status: booking.bill.status,
        payments: booking.bill.payments
      } : null
    },
    SuccessMessages.RETRIEVED
  )
})

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
      enum: ['pending', 'confirmed', 'cancelled', 'completed'] 
    }
  })

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  const { status } = body

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
  if (existingBooking.status === 'completed') {
    return ApiResponseBuilder.error(
      'Cannot modify completed bookings'
      
    )
  }

  if (existingBooking.status === 'cancelled' && status !== 'cancelled') {
    return ApiResponseBuilder.error(
      'Cannot change status of cancelled booking',
      StatusCodes.BAD_REQUEST
    )
    
  }

  // Check if trip is still available for changes
  if (status === 'confirmed' && existingBooking.trip.status !== 'scheduled') {
    return ApiResponseBuilder.error(
      'Cannot confirm booking for trip that is not scheduled',
      StatusCodes.BAD_REQUEST
    )
  }

  // Update booking in transaction
  const updatedBooking = await prisma.$transaction(async (tx) => {
    // Update booking status
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: { status },
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

    // If cancelling, update seat status back to available
    if (status === 'cancelled') {
      await tx.seat.updateMany({
        where: {
          id: {
            in: booking.details.map(detail => detail.seatId)
          }
        },
        data: { status: 'available' }
      })
    }

    return booking
  })

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
      } : null
    },
    SuccessMessages.UPDATED
  )
})