import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { tripId, seatIds } = await req.json()
    const headersList = headers() // ✅ middleware-injected headers
    const userId = headersList.get('userId') // ✅ access injected userId

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Start transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Check if seats are available
      const seats = await tx.seat.findMany({
        where: {
          id: { in: seatIds },
          status: 'available'
        }
      })

      if (seats.length !== seatIds.length) {
        throw new Error('Some seats are not available')
      }

      // Get trip details for price calculation
      const trip = await tx.trip.findUnique({
        where: { id: tripId }
      })

      if (!trip) {
        throw new Error('Trip not found')
      }

      // Calculate total price
      const totalPrice = new Decimal(trip.price).mul(seatIds.length)

      // Create booking
      const booking = await tx.booking.create({
        data: {
          userId,
          tripId,
          totalPrice,
          status: 'pending',
          details: {
            create: seatIds.map((seatId: string) => ({
              seatId,
              price: trip.price
            }))
          }
        }
      })

      // Update seat status
      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { status: 'booked' }
      })

      return booking
    })

    return NextResponse.json(booking)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create booking' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const headersList = headers()
    const userId = headersList.get('userId')
    

    
    
    if (!userId) {
      return NextResponse.json(
        { error: `Authentication required ${userId} ` },
        { status: 401 }
      )
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
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

    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error bookings' },
      { status: 500 }
    )
  }
}