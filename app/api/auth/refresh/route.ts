import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const POST = asyncHandler(async (req: NextRequest) => {
  try {
    const { refreshToken } = await req.json()

    if (!refreshToken) {
      return ApiResponseBuilder.error('No refresh token provided', StatusCodes.BAD_REQUEST)
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!storedToken || new Date(storedToken.expiresAt) < new Date()) {
      return ApiResponseBuilder.error('Invalid or expired refresh token', StatusCodes.FORBIDDEN)
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret') as {
      userId: string
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      return ApiResponseBuilder.error('User not found', StatusCodes.NOT_FOUND)
    }

    // Issue a new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7h' }
    )

    return ApiResponseBuilder.success({ token: newAccessToken })
  } catch (error) {
    console.error('Refresh token error:', error)
    return ApiResponseBuilder.error('Failed to refresh token', StatusCodes.INTERNAL_SERVER_ERROR)
  }
})
