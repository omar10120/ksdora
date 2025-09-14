import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, StatusCodes } from '@/lib/apiResponse'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// PUT - Confirm a payment
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const paymentId = params.id

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        bill: {
          include: {
            booking: true,
            payments: true
          }
        }
      }
    })

    if (!existingPayment) {
      return ApiResponseBuilder.notFound('Payment')
    }

    // Check if payment is pending
    if (existingPayment.status !== 'pending') {
      return ApiResponseBuilder.error(
        'Payment is not pending',
        StatusCodes.BAD_REQUEST,
        'Only pending payments can be confirmed'
      )
    }

    // Process confirmation in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment status to successful
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'successful',
          paidAt: new Date()
        }
      })

      // Calculate total paid amount
      const totalPaid = existingPayment.bill.payments
        .filter(p => p.status === 'successful' || p.id === paymentId)
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)

      const billAmount = parseFloat(existingPayment.bill.amount.toString())

      // Handle different payment methods
      if (existingPayment.method === 'cash') {
        // For cash payments: confirm booking but keep bill unpaid
        await tx.booking.update({
          where: { id: existingPayment.bill.booking.id },
          data: { status: 'confirmed' }
        })

        // Update seat statuses to booked
        const bookingDetails = await tx.bookingDetail.findMany({
          where: { bookingId: existingPayment.bill.booking.id }
        })

        await Promise.all(
          bookingDetails.map(detail =>
            tx.seat.update({
              where: { id: detail.seatId },
              data: { status: 'booked' }
            })
          )
        )
      } else {
        // For online payments: check if bill is now fully paid
        if (totalPaid >= billAmount) {
          // Update bill status to paid
          await tx.bill.update({
            where: { id: existingPayment.bill.id },
            data: { status: 'paid' }
          })

          // Update booking status to confirmed
          await tx.booking.update({
            where: { id: existingPayment.bill.booking.id },
            data: { status: 'confirmed' }
          })

          // Update seat statuses to booked
          const bookingDetails = await tx.bookingDetail.findMany({
            where: { bookingId: existingPayment.bill.booking.id }
          })

          await Promise.all(
            bookingDetails.map(detail =>
              tx.seat.update({
                where: { id: detail.seatId },
                data: { status: 'booked' }
              })
            )
          )
        }
      }

      return {
        payment: updatedPayment,
        billStatus: existingPayment.method === 'cash' ? 'unpaid' : (totalPaid >= billAmount ? 'paid' : 'unpaid'),
        bookingStatus: existingPayment.method === 'cash' ? 'confirmed' : (totalPaid >= billAmount ? 'confirmed' : existingPayment.bill.booking.status),
        remainingBalance: existingPayment.method === 'cash' ? billAmount : Math.max(0, billAmount - totalPaid)
      }
    })

    return ApiResponseBuilder.success(
      {
        payment: result.payment,
        billStatus: result.billStatus,
        bookingStatus: result.bookingStatus,
        remainingBalance: result.remainingBalance,
        message: 'Payment confirmed successfully'
      },
      SuccessMessages.UPDATED
    )
  } catch (error) {
    throw ApiError.database('Failed to confirm payment')
  }
})
