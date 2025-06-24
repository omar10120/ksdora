// lib/tokenService.ts
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

export async function generateRefreshToken(userId: string) {
  const expiresIn = 60 * 60 * 24 * 7 // 7 days

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    { expiresIn }
  )

  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  // Save token to DB
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt,
    },
  })

  return refreshToken
}
