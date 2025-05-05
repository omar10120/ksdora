import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has any bookings
    const userWithBookings = await prisma.user.findUnique({
      where: { id: params.id },
      include: { bookings: true }
    })

    if (userWithBookings?.bookings.length) {
      return NextResponse.json(
        { error: 'Cannot delete user with existing bookings' },
        { status: 400 }
      )
    }

    // Check if user is an admin
    if (userWithBookings?.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}