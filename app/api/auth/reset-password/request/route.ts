import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { sendResetPassword } from '@/utils/resetPasswordService'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
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
    const resetCode = await sendResetPassword(email, resetToken)

    return NextResponse.json({
      message: 'Reset password code has been sent to your email'
    })
  } catch (error) {
    console.error('Reset password request error:', error)
    return NextResponse.json(
      { error: 'Failed to process reset password request' },
      { status: 500 }
    )
  }
}