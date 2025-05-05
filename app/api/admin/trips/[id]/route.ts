import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: {
        route: {
          include: {
            departureCity: true,
            arrivalCity: true
          }
        },
        bus: true,
        seats: true
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(trip)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error trip' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { routeId, busId, departureTime, arrivalTime, price, status } = body

    // Validate required fields
    if (!routeId || !busId || !departureTime || !arrivalTime || !price || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if trip exists
    const existingTrip = await prisma.trip.findUnique({
      where: { id: params.id }
    })

    if (!existingTrip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Check if bus is available for the new time period (excluding current trip)
    const busConflict = await prisma.trip.findFirst({
      where: {
        busId,
        id: { not: params.id },
        OR: [
          {
            AND: [
              { departureTime: { lte: new Date(departureTime) } },
              { arrivalTime: { gte: new Date(departureTime) } }
            ]
          },
          {
            AND: [
              { departureTime: { lte: new Date(arrivalTime) } },
              { arrivalTime: { gte: new Date(arrivalTime) } }
            ]
          }
        ]
      }
    })

    if (busConflict) {
      return NextResponse.json(
        { error: 'Bus is not available for the selected time period' },
        { status: 400 }
      )
    }

    // If status is being updated to completed, update in transaction with bus
    if (status === 'completed') {
      const updatedTrip = await prisma.$transaction(async (tx) => {
        const trip = await tx.trip.update({
          where: { id: params.id },
          data: {
            routeId,
            busId,
            departureTime: new Date(departureTime),
            arrivalTime: new Date(arrivalTime),
            price,
            status
          },
          include: {
            route: {
              include: {
                departureCity: true,
                arrivalCity: true
              }
            },
            bus: true
          }
        })

        // Update bus status to active
        await tx.bus.update({
          where: { id: busId },
          data: { status: 'active' }
        })

        return trip
      })

      return NextResponse.json(updatedTrip)
    }

    // Regular update for other status changes
    const updatedTrip = await prisma.trip.update({
      where: { id: params.id },
      data: {
        routeId,
        busId,
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        price,
        status
      },
      include: {
        route: {
          include: {
            departureCity: true,
            arrivalCity: true
          }
        },
        bus: true
      }
    })

    return NextResponse.json(updatedTrip)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if trip has any bookings
    const tripWithBookings = await prisma.trip.findFirst({
      where: {
        id: params.id,
        bookings: { some: {} }
      }
    })

    if (tripWithBookings) {
      return NextResponse.json(
        { error: 'Cannot delete trip with existing bookings' },
        { status: 400 }
      )
    }

    // Delete trip and related seats
    await prisma.$transaction([
      prisma.seat.deleteMany({
        where: { tripId: params.id }
      }),
      prisma.trip.delete({
        where: { id: params.id }
      })
    ])

    return NextResponse.json({ message: 'Trip deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}