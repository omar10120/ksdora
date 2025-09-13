import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'
import { Decimal } from '@prisma/client/runtime/library'
import { v2 as cloudinary } from 'cloudinary'
import { PaymentMethod } from '@prisma/client'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Constants
const CASH_PAYMENT_PERCENTAGE = 0.25
const PAYMENT_SUCCESS_RATE = 0.95

// Types
interface PaymentProcessingResult {
  success: boolean
  transactionId?: string
}

interface PaymentResult {
  payment: any
  billStatus: string
  bookingStatus: string
  remainingBalance: number
  message: string
}

// Helper functions
async function uploadReceiptImage(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')
  const dataURI = `data:${file.type};base64,${base64}`
  
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'receipts',
    resource_type: 'auto',
    public_id: `receipt_${Date.now()}`
  })
  
  return result.secure_url
}

function calculatePaymentAmount(method: string, totalPrice: Decimal): Decimal {
  if (method === 'cash') {
    return new Decimal(parseFloat(totalPrice.toString()) * CASH_PAYMENT_PERCENTAGE)
  }
  return totalPrice
}

function generatePaymentMessage(method: string, paidAmount: number, totalAmount: number, remainingBalance: number): string {
  if (method === 'cash') {
    return `Cash payment submitted successfully! Paid ${paidAmount} (25% of ${totalAmount}). Remaining balance: ${remainingBalance}. Waiting for admin confirmation.`
  }
  return 'Payment submitted successfully! Waiting for admin confirmation.'
}

async function validateBookingAccess(bookingId: string, userId: string) {
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
    throw new Error('Booking not found')
  }

  if (booking.userId !== userId) {
    throw new Error('Access denied')
  }

  if (!booking.bill) {
    throw new Error('No bill found')
  }

  return booking
}

async function validatePaymentEligibility(booking: any) {
  if (booking.status === 'cancelled') {
    throw new Error('Cannot make payment for cancelled booking')
  }

  if (booking.status === 'completed') {
    throw new Error('Cannot make payment for completed booking')
  }

  if (booking.bill.status === 'paid') {
    throw new Error('Bill is already paid')
  }

  const existingPendingPayment = await prisma.payment.findFirst({
    where: { 
      billId: booking.bill.id,
      status: 'pending'
    }
  })

  if (existingPendingPayment) {
    throw new Error('Payment already pending for this bill')
  }
}

async function processPaymentTransaction(
  booking: any, 
  paymentAmount: Decimal, 
  method: string, 
  receiptImageUrl: string | null
): Promise<PaymentResult> {
  return await prisma.$transaction(async (tx) => {
    // Create payment record
    const payment = await tx.payment.create({
      data: {
        billId: booking.bill.id,
        amount: paymentAmount,
        method: method as PaymentMethod,
        status: 'pending',
        transactionId: null,
        receiptImage: receiptImageUrl
      }
    })

    // Simulate payment processing
    const paymentResult = await processPayment(payment.amount, method)

    if (paymentResult.success) {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'pending',
          transactionId: paymentResult.transactionId,
          paidAt: new Date()
        }
      })
      
      const totalBillAmount = parseFloat(booking.bill.amount.toString())
      const paidAmount = parseFloat(paymentAmount.toString())
      const remainingBalance = totalBillAmount - paidAmount

      return {
        payment: updatedPayment,
        billStatus: 'unpaid',
        bookingStatus: 'pending',
        remainingBalance,
        message: generatePaymentMessage(method, paidAmount, totalBillAmount, remainingBalance)
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
}

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
      receiptImageUrl = await uploadReceiptImage(receiptImageFile)
    } catch (error) {
      return ApiResponseBuilder.error('Failed to upload receipt image', StatusCodes.INTERNAL_SERVER_ERROR)
    }
  }

  try {
    // Validate booking access and eligibility
    const booking = await validateBookingAccess(bookingId, userId)
    await validatePaymentEligibility(booking)

    // Calculate payment amount based on method
    const paymentAmount = calculatePaymentAmount(method, booking.totalPrice)

    // Process payment in transaction
    const result = await processPaymentTransaction(booking, paymentAmount, method, receiptImageUrl)

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
  } catch (error) {
    if (error instanceof Error) {
      return ApiResponseBuilder.error(error.message, StatusCodes.BAD_REQUEST)
    }
    throw error
  }
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
async function processPayment(amount: Decimal, method: string): Promise<PaymentProcessingResult> {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Simulate success rate
  const success = Math.random() > (1 - PAYMENT_SUCCESS_RATE)

  return {
    success,
    transactionId: success ? `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : undefined
  }
}