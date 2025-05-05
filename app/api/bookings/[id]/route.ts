import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.headers.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        trip: {
          include: {
            route: {
              include: {
                departureCity: true,
                arrivalCity: true
              }
            }
          }
        },
        details: {
          include: {
            seat: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error booking' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.headers.get('userId')
    const { status } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { details: { include: { seat: true } } }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Start transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const booking = await tx.booking.update({
        where: { id: params.id },
        data: { status },
        include: {
          trip: {
            include: {
              route: {
                include: {
                  departureCity: true,
                  arrivalCity: true
                }
              }
            }
          },
          details: {
            include: {
              seat: true
            }
          }
        }
      })

      // If cancelling, update seat status
      if (status === 'cancelled') {
        await tx.seat.updateMany({
          where: {
            id: {
              in: booking.details.map(detail => detail.seatId)
            }
          },
          data: { status: 'available' }
        })
      }

      return booking
    })

    return NextResponse.json(updatedBooking)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}