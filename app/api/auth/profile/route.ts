// /app/api/profile/route.ts

import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export const GET = asyncHandler(async (req: Request) => {
  try {
    const authHeader = req.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ApiResponseBuilder.error('Authorization required', StatusCodes.UNAUTHORIZED)
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string
      role: string
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true
      }
    })

    if (!user) {
      return ApiResponseBuilder.error('User not found', StatusCodes.NOT_FOUND)
    }

    return ApiResponseBuilder.success(user)
  } catch (error) {
    console.error('Profile error:', error)
    return ApiResponseBuilder.error('Invalid or expired token', StatusCodes.UNAUTHORIZED)
  }
})
