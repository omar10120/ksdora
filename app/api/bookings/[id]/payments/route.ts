import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'
import { Decimal } from '@prisma/client/runtime/library'
import { v2 as cloudinary } from 'cloudinary'
import { PaymentMethod } from '@prisma/client'
import { text } from 'stream/consumers'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// POST - Process payment for a booking
export const POST = asyncHandler(async (
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

  // Handle form-data for file upload
  const formData = await request.formData()
  const method = formData.get('method') as string
  const receiptImageFile = formData.get('receiptImage') as File | null

  // Validate payment data
  const validationResult = validateRequest({ method }, {
    method: { 
      required: true, 
      enum: ['cash', 'online_payment'] as string[]
    }
  })

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  // Handle image upload to Cloudinary
  let receiptImageUrl: string | null = null
  if (receiptImageFile && receiptImageFile.size > 0) {
    try {
      const buffer = Buffer.from(await receiptImageFile.arrayBuffer())
      const base64 = buffer.toString('base64')
      const dataURI = `data:${receiptImageFile.type};base64,${base64}`
      
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'receipts',
        resource_type: 'auto',
        public_id: `receipt_${Date.now()}`
      })
      
      receiptImageUrl = result.secure_url
    } catch (error) {
      return ApiResponseBuilder.error('Failed to upload receipt image', StatusCodes.INTERNAL_SERVER_ERROR)
    }
  }
  
 
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
  // if (booking.status === 'pending' && payment)
  //   return ApiResponseBuilder.error('Bill is arleady pending' , StatusCodes.BAD_REQUEST)

  

  // Check if there's already a pending payment for this bill
  const existingPendingPayment = await prisma.payment.findFirst({
    where: { 
      billId: booking.bill.id,
      status: 'pending'
    }
  })
  
  if (existingPendingPayment) {
    return ApiResponseBuilder.error('Payment already pending for this bill', StatusCodes.BAD_REQUEST)
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

  // Calculate payment amount based on method
  let paymentAmount: Decimal
  if (method === 'cash') {
    // For cash payments, only 25% of total price
    paymentAmount = new Decimal(parseFloat(booking.totalPrice.toString()) * 0.25)
  } else {
    // For online payments, full amount
    paymentAmount = booking.totalPrice
  }

  // Process payment in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create payment record
    const payment = await tx.payment.create({
      data: {
        billId: booking.bill!.id,
        amount: paymentAmount,
        method: method as PaymentMethod,
        status: 'pending',
        transactionId: null,
        receiptImage: receiptImageUrl
      }
    })

    // Simulate payment processing (replace with actual payment gateway)
    const paymentResult = await processPayment(payment.amount, method)

    if (paymentResult.success) {
      // Update payment status to pending (waiting for admin confirmation)
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'pending', // Keep as pending until admin confirms
          transactionId: paymentResult.transactionId,
          paidAt: new Date()
        }
      })
      
      const totalBillAmount = parseFloat(booking.bill!.amount.toString())
      const paidAmount = parseFloat(paymentAmount.toString())
      const remainingBalance = totalBillAmount - paidAmount

      return {
        payment: updatedPayment,
        billStatus: 'unpaid', // Bill remains unpaid until admin confirms
        bookingStatus: 'pending', // Booking remains pending until admin confirms
        remainingBalance: remainingBalance,
        message: method === 'cash' 
          ? `Cash payment submitted successfully! Paid ${paidAmount} (25% of ${totalBillAmount}). Remaining balance: ${remainingBalance}. Waiting for admin confirmation.`
          : 'Payment submitted successfully! Waiting for admin confirmation.'
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
      message: result.message
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
        receiptImage: payment.receiptImage,
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
