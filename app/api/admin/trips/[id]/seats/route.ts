import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const seats = await prisma.seat.findMany({
      where: { tripId: params.id },
      orderBy: { seatNumber: 'asc' }
    })

    return NextResponse.json(seats)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error seats' },
      { status: 500 }
    )
  }
}