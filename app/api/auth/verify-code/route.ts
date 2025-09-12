import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const POST = asyncHandler(async (req: Request) => {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return ApiResponseBuilder.error('Email and verification code are required', StatusCodes.BAD_REQUEST)
    }

    // ✅ Decode email (especially for "+" symbols)
    const decodedEmail = decodeURIComponent(email)

    const user = await prisma.user.findUnique({
      where: { email: decodedEmail }
    })

    if (!user || !user.verificationToken) {
      return ApiResponseBuilder.error('Invalid verification attempt', StatusCodes.BAD_REQUEST)
    }

    const storedCode = user.verificationToken.substring(0, 6).toUpperCase()

    if (code.toUpperCase() !== storedCode) {
      return ApiResponseBuilder.error('Invalid verification code', StatusCodes.BAD_REQUEST)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null
      }
    })

    return ApiResponseBuilder.success({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('Verification error:', error)
    return ApiResponseBuilder.error('Failed to verify email', StatusCodes.INTERNAL_SERVER_ERROR)
  }
})

