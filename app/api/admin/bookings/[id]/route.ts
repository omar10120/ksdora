import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// GET - Fetch booking by ID
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        trip: {
          include: {
            route: {
              include: {
                departureCity: true,
                arrivalCity: true
              }
            },
            bus: {
              select: {
                plateNumber: true,
                model: true
              }
            }
          }
        },
        details: {
          include: {
            seat: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        bill: {
          include: {
            payments: true
          }
        },
        ratings: true,
        feedbacks: true
      }
    })

    if (!booking) {
      return ApiResponseBuilder.notFound('Booking')
    }

    return ApiResponseBuilder.success(
      booking,
      SuccessMessages.RETRIEVED
    )
  } catch (error) {
    throw ApiError.database('Failed to fetch booking')
  }
})

// PUT - Update booking status
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    
    // Validate request data
    const validationResult = validateRequest(body, {
      status: { required: true, enum: ['pending', 'confirmed', 'cancelled', 'completed'] }
    })
    
    if (!validationResult.isValid) {
      const errorMessages: Record<string, string[]> = {}
      validationResult.errors.forEach(error => {
        if (!errorMessages[error.field]) {
          errorMessages[error.field] = []
        }
        errorMessages[error.field].push(error.message)
      })
      
      return ApiResponseBuilder.validationError(errorMessages, ErrorMessages.VALIDATION_FAILED)
    }

    const { status } = body
    const { id } = params

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        details: true
      }
    })

    if (!existingBooking) {
      return ApiResponseBuilder.notFound('Booking')
    }

    // Check if booking can be updated (not completed)
    if (existingBooking.status === 'completed' && status !== 'completed') {
      return ApiResponseBuilder.error(
        'Cannot modify completed booking',
        StatusCodes.BAD_REQUEST,
        'Booking is already completed and cannot be modified'
      )
    }

    const booking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status },
        include: {
          trip: {
            include: {
              route: {
                include: {
                  departureCity: true,
                  arrivalCity: true
                }
              }
            }
          },
          details: {
            include: {
              seat: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      })

      // Update seat statuses based on booking status
      if (status === 'confirmed') {
        await Promise.all(
          updatedBooking.details.map(detail =>
            tx.seat.update({
              where: { id: detail.seatId },
              data: { status: 'booked' }
            })
          )
        )
      } else if (status === 'cancelled') {
        await Promise.all(
          updatedBooking.details.map(detail =>
            tx.seat.update({
              where: { id: detail.seatId },
              data: { status: 'available' }
            })
          )
        )
      }

      return updatedBooking
    })

    return ApiResponseBuilder.success(
      booking,
      SuccessMessages.UPDATED
    )
  } catch (error) {
    throw ApiError.database('Failed to update booking')
  }
})

// DELETE - Delete booking
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        details: true
      }
    })

    if (!existingBooking) {
      return ApiResponseBuilder.notFound('Booking')
    }

    // Check if booking can be deleted (not completed)
    if (existingBooking.status === 'completed') {
      return ApiResponseBuilder.error(
        'Cannot delete completed booking',
        StatusCodes.BAD_REQUEST,
        'Completed bookings cannot be deleted'
      )
    }

    const booking = await prisma.$transaction(async (tx) => {
      // Update seats to available
      await Promise.all(
        existingBooking.details.map(detail =>
          tx.seat.update({
            where: { id: detail.seatId },
            data: { status: 'available' }
          })
        )
      )

      // Delete booking details first
      await tx.bookingDetail.deleteMany({
        where: { bookingId: id }
      })

      // Delete the booking
      return tx.booking.delete({
        where: { id }
      })
    })

    return ApiResponseBuilder.success(
      null,
      SuccessMessages.DELETED
    )
  } catch (error) {
    throw ApiError.database('Failed to delete booking')
  }
})