import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/utils/emailService'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'   

export const POST = asyncHandler(async (req: Request) => {
  try {
    const { email } = await req.json()

    if (!email) {
      return ApiResponseBuilder.error('Email is required', StatusCodes.BAD_REQUEST)
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
        return ApiResponseBuilder.error('User not found', StatusCodes.NOT_FOUND)
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: resetToken
      }
    })

    // Send reset code email
    const resetCode = await sendVerificationEmail(email, resetToken)

    return ApiResponseBuilder.success({
      message: 'Reset password code has been sent to your email'
    })
  } catch (error) {
    console.error('Reset password request error:', error)
    return ApiResponseBuilder.error('Failed to process reset password request', StatusCodes.INTERNAL_SERVER_ERROR)
  }
})
