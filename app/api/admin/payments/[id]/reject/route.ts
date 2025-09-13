import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, StatusCodes } from '@/lib/apiResponse'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// PUT - Reject a payment
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
        'Only pending payments can be rejected'
      )
    }

    // Update payment status to failed
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'failed'
      }
    })

    return ApiResponseBuilder.success(
      {
        payment: updatedPayment,
        message: 'Payment rejected successfully'
      },
      SuccessMessages.UPDATED
    )
  } catch (error) {
    throw ApiError.database('Failed to reject payment')
  }
})
