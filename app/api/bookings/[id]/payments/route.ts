import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'
import { Decimal } from '@prisma/client/runtime/library'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// POST - Process payment for a booking
export const POST = asyncHandler(async (
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
    return ApiResponseBuilder.error('Invalid booking ID' ,   StatusCodes.BAD_REQUEST) 

  }

  // Validate payment data
  const validationResult = validateRequest(body, {

    method: { 
      required: true, 
      enum: ['cash', 'bank_transfer', 'company_alharam'] as string[]
    }
  })

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  const {  method } = body
  

  // Check if booking exists and belongs to user
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      bill: {
        include: {
          payments: true
        }
      },
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
  
  if (!booking) {
    return ApiResponseBuilder.notFound('Booking')
  }

  if (booking.userId !== userId) {
    return ApiResponseBuilder.forbidden('You can only make payments for your own bookings' )
  }

  if (!booking.bill) {
    return ApiResponseBuilder.error('No bill found for this booking', StatusCodes.BAD_REQUEST)
  }

  // Business logic validation
  if (booking.status === 'cancelled') {
    return ApiResponseBuilder.error('Cannot make payment for cancelled booking', StatusCodes.BAD_REQUEST)
  }

  if (booking.status === 'completed') {
    return ApiResponseBuilder.error('Cannot make payment for completed booking', StatusCodes.BAD_REQUEST)
  }

  // Check if bill is already paid
  if (booking.bill.status === 'paid') {
    return ApiResponseBuilder.error('Bill is already paid', StatusCodes.BAD_REQUEST)
  }

  // Check if payment amount exceeds remaining balance
  // const totalPaid = booking.bill.payments
  //   .filter(payment => payment.status === 'successful')
  //   .reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0)
  
  // const remainingBalance = parseFloat(booking.bill.amount.toString()) - totalPaid

  // if (paymentAmount > remainingBalance) {
  //   return ApiResponseBuilder.error(
  //     `Payment amount (${paymentAmount}) exceeds remaining balance (${remainingBalance})`,
  //     StatusCodes.BAD_REQUEST
  //   )
  // }

  // Process payment in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create payment record
    const payment = await tx.payment.create({
      data: {
        billId: booking.bill!.id,
        amount: booking.totalPrice,
        method,
        status: 'pending',
        transactionId: null
      }
    })

    // Simulate payment processing (replace with actual payment gateway)
    const paymentResult = await processPayment(payment.amount, method)

    if (paymentResult.success) {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'successful',
          transactionId: paymentResult.transactionId,
          paidAt: new Date()
        }
      })

      // Check if bill is now fully paid
      const updatedBill = await tx.bill.findUnique({
        where: { id: booking.bill!.id },
        include: { payments: true }
      })

      const newTotalPaid = updatedBill!.payments
        .filter(p => p.status === 'successful')
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)

      const billAmount = parseFloat(updatedBill!.amount.toString())

      if (newTotalPaid >= billAmount) {
        // Bill is fully paid, update bill and booking status
        await tx.bill.update({
          where: { id: booking.bill!.id },
          data: { status: 'paid' }
        })

        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'confirmed' }
        })
      }

      return {
        payment: updatedPayment,
        billStatus: newTotalPaid >= billAmount ? 'paid' : 'unpaid',
        bookingStatus: newTotalPaid >= billAmount ? 'confirmed' : 'pending',
        remainingBalance: Math.max(0, billAmount - newTotalPaid)
      }
    } else {
      // Payment failed
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' }
      })

      throw ApiError.internal('Payment processing failed')
    }
  })

  return ApiResponseBuilder.success(
    {
      payment: result.payment,
      billStatus: result.billStatus,
      bookingStatus: result.bookingStatus,
      remainingBalance: result.remainingBalance,
      message: result.billStatus === 'paid' 
        ? 'Payment successful! Booking confirmed.' 
        : 'Payment successful! Remaining balance: ' + result.remainingBalance
    },
    SuccessMessages.PAYMENT_SUCCESS
  )
})

// GET - Retrieve payment history for a booking
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

  // Check if booking exists and belongs to user
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      bill: {
        include: {
          payments: {
            orderBy: { createdAt: 'desc' }  
          }
        }
      }
    }
  })

  if (!booking) {
    return ApiResponseBuilder.notFound('Booking')
  }

  if (booking.userId !== userId) {
    return ApiResponseBuilder.forbidden('You can only view payments for your own bookings')
  }

  if (!booking.bill) {
    return ApiResponseBuilder.error('No bill found for this booking', StatusCodes.BAD_REQUEST)
  }

  // Calculate payment summary
  const totalPaid = booking.bill.payments
    .filter(payment => payment.status === 'successful')
    .reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0)
  
  const billAmount = parseFloat(booking.bill.amount.toString())
  const remainingBalance = Math.max(0, billAmount - totalPaid)

  return ApiResponseBuilder.success(
    {
      bill: {
        id: booking.bill.id,
        amount: booking.bill.amount,
        status: booking.bill.status,
        createdAt: booking.bill.createdAt,
        updatedAt: booking.bill.updatedAt
      },
      payments: booking.bill.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt
      })),
      summary: {
        totalAmount: billAmount,
        totalPaid,
        remainingBalance,
        isFullyPaid: remainingBalance === 0
      }
    },
    SuccessMessages.RETRIEVED
  )
})

// Mock payment processing function (replace with actual payment gateway)
async function processPayment(amount: Decimal, method: string): Promise<{
  success: boolean
  transactionId?: string
}> {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Simulate 95% success rate
  const success = Math.random() > 0.05

  return {
    success,
    transactionId: success ? `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : undefined
  }
}
