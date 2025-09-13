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
      // Get booking with bill and payments to check payment method
      const bookingWithBill = await tx.booking.findUnique({
        where: { id },
        include: {
          bill: {
            include: {
              payments: true
            }
          }
        }
      })

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
          },
          bill: {
            include: {
              payments: true
            }
          }
        }
      })

      // Update seat statuses and handle payments based on booking status
      if (status === 'confirmed') {
        // Update seats to booked
        await Promise.all(
          updatedBooking.details.map(detail =>
            tx.seat.update({
              where: { id: detail.seatId },
              data: { status: 'booked' }
            })
          )
        )

        // Handle bill status and remaining payment for cash method only
        if (bookingWithBill?.bill) {
          // Check if there are any cash payments
          const hasCashPayment = bookingWithBill.bill.payments.some(p => p.method === 'cash')
          
          if (hasCashPayment) {
            // Calculate total paid amount
            const totalPaid = bookingWithBill.bill.payments
              .filter(payment => payment.status === 'successful')
              .reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0)
            
            const billAmount = parseFloat(bookingWithBill.bill.amount.toString())
            const remainingAmount = billAmount - totalPaid

            // Set bill to paid (remaining amount will be collected manually)
            await tx.bill.update({
              where: { id: bookingWithBill.bill.id },
              data: { status: 'paid' }
            })

            // Create a payment record for the remaining amount (cash)
            if (remainingAmount > 0) {
              await tx.payment.create({
                data: {
                  billId: bookingWithBill.bill.id,
                  amount: remainingAmount,
                  method: 'cash',
                  status: 'successful', // Mark as successful since it will be collected manually
                  transactionId: `CASH-${Date.now()}`,
                  paidAt: new Date()
                }
              })
            }
          }
        }
      } else if (status === 'cancelled') {
        // Update seats to available
        await Promise.all(
          updatedBooking.details.map(detail =>
            tx.seat.update({
              where: { id: detail.seatId },
              data: { status: 'available' }
            })
          )
        )

        // Set bill to unpaid when cancelled
        if (bookingWithBill?.bill) {
          await tx.bill.update({
            where: { id: bookingWithBill.bill.id },
            data: { status: 'unpaid' }
          })
        }
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