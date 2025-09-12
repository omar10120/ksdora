import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const POST = asyncHandler(async (req: Request) => {
  try {
    const { email, code, newPassword } = await req.json()

    if (!email || !code || !newPassword) {
        return ApiResponseBuilder.error('Email, code, and new password are required', StatusCodes.BAD_REQUEST)
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.verificationToken) {
      return ApiResponseBuilder.error('Invalid reset attempt', StatusCodes.BAD_REQUEST)
    }

    // Verify reset code
    const storedCode = user.verificationToken.substring(0, 6).toUpperCase()
    if (code.toUpperCase() !== storedCode) {
      return ApiResponseBuilder.error('Invalid reset code', StatusCodes.BAD_REQUEST)
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        verificationToken: null
      }
    })

    return ApiResponseBuilder.success({
      message: 'Password reset successfully'
    })
  } catch (error) {
    console.error('Reset password confirmation error:', error)
    return ApiResponseBuilder.error('Failed to reset password', StatusCodes.INTERNAL_SERVER_ERROR)
  }
})
