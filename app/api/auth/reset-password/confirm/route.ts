import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, code, and new password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.verificationToken) {
      return NextResponse.json(
        { error: 'Invalid reset attempt' },
        { status: 400 }
      )
    }

    // Verify reset code
    const storedCode = user.verificationToken.substring(0, 6).toUpperCase()
    if (code.toUpperCase() !== storedCode) {
      return NextResponse.json(
        { error: 'Invalid reset code' },
        { status: 400 }
      )
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

    return NextResponse.json({
      message: 'Password reset successfully'
    })
  } catch (error) {
    console.error('Reset password confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}