// pages/api/auth/google-login.ts
import { NextResponse } from 'next/server'
import admin from '@/lib/firebaseAdmin'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { generateRefreshToken } from '@/lib/tokenService'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const POST = asyncHandler(async (req: Request) => {
  try {
    const { idToken } = await req.json()
    const decoded = await admin.auth().verifyIdToken(idToken)

    const { email, name, picture } = decoded

    if (!email) {
      return ApiResponseBuilder.error('Missing email from Google account', StatusCodes.BAD_REQUEST)
    }

    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: '', // Google-based
          emailVerified: true
          // role: 'USER',
        }
      })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )

    const refreshToken = await generateRefreshToken(user.id)

    return ApiResponseBuilder.success({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        phone: user.phone,
      },
      token,
      refreshToken,
    })

  } catch (err) {
    console.error('Google login error:', err)
    return ApiResponseBuilder.error('Invalid ID token or internal error', StatusCodes.UNAUTHORIZED)
  }
})
