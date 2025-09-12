import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const POST = asyncHandler(async (req: Request) => {
  try {
    const { email, password } = await req.json()

    // Validate required fields
    if (!email || !password) {
      return ApiResponseBuilder.error('Email and password are required', StatusCodes.BAD_REQUEST)
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return ApiResponseBuilder.error('Invalid credentials', StatusCodes.UNAUTHORIZED)
    }

    // Check if email is verified
    if (!user.emailVerified) {
        return ApiResponseBuilder.error('Please verify your email before logging in', StatusCodes.FORBIDDEN)
        
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return ApiResponseBuilder.error('Invalid credentials', StatusCodes.UNAUTHORIZED)
    }

    // Clear any existing refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id }
    })

    const token = jwt.sign(
      { userId: user.id , role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '3h' }
    )

    const refreshToken = jwt.sign(
      { userId: user.id , refresh: true,},
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '7d' }
    )

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    return ApiResponseBuilder.success({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return ApiResponseBuilder.error('Internal server error', StatusCodes.INTERNAL_SERVER_ERROR)
  }
})
