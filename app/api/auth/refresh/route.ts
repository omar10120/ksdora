import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json()

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token provided' }, { status: 400 })
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!storedToken || new Date(storedToken.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 403 })
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret') as {
      userId: string
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Issue a new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7h' }
    )

    return NextResponse.json({ token: newAccessToken })
  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 })
  }
}
