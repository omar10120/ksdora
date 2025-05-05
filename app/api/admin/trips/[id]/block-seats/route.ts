import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { seatIds } = await req.json()

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid seat selection' },
        { status: 400 }
      )
    }

    // Check if seats are available
    const seats = await prisma.seat.findMany({
      where: {
        id: { in: seatIds },
        status: 'available'
      }
    })

    if (seats.length !== seatIds.length) {
      return NextResponse.json(
        { error: 'Some seats are not available' },
        { status: 400 }
      )
    }

    // Block the seats
    await prisma.seat.updateMany({
      where: {
        id: { in: seatIds }
      },
      data: {
        status: 'blocked'
      }
    })

    return NextResponse.json({ message: 'Seats blocked successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to block seats' },
      { status: 500 }
    )
  }
}