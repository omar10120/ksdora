import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json()
    const { id } = params

    // Validate status
    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const booking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status },
        include: {
          details: {
            include: {
              seat: true
            }
          }
        }
      })

      // Update seat statuses based on booking status
      if (status === 'confirmed') {
        await Promise.all(
          updatedBooking.details.map(detail =>
            tx.seat.update({
              where: { id: detail.seatId  },
              data: { status: 'booked' }
            })
          )
        )
      } else if (status === 'cancelled') {
        await Promise.all(
          updatedBooking.details.map(detail =>
            tx.seat.update({
              where: { id: detail.seatId },
              data: { status: 'available' }
            })
          )
        )
      
      }

      return updatedBooking
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const booking = await prisma.$transaction(async (tx) => {
      // Get booking details first
      const bookingToDelete = await tx.booking.findUnique({
        where: { id },
        include: {
          details: true
        }
      })

      if (!bookingToDelete) {
        throw new Error('Booking not found')
      }

      // Update seats to available
      await Promise.all(
        bookingToDelete.details.map(detail =>
          tx.seat.update({
            where: { id: detail.seatId },
            data: { status: 'available' }
          })
        )
      )

      // Delete booking details first
      await tx.bookingDetail.deleteMany({
        where: { bookingId: id }
      })

      // Delete the booking
      return tx.booking.delete({
        where: { id }
      })
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Delete booking error:', error)
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    )
  }
}