import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: {
        departureTime: 'desc'
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

    return NextResponse.json(trips)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error trips' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { routeId, busId, departureTime, arrivalTime, price } = body

    // Validate required fields
    if (!routeId || !busId || !departureTime || !arrivalTime || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if bus is active
    const bus = await prisma.bus.findFirst({
      where: {
        id: busId,
        status: 'active'
      }
    })

    if (!bus) {
      return NextResponse.json(
        { error: 'Bus is not available or not in active state' },
        { status: 400 }
      )
    }

    // Check if bus is available for the time period
    const existingTrip = await prisma.trip.findFirst({
      where: {
        busId,
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

    if (existingTrip) {
      return NextResponse.json(
        { error: 'Bus is not available for the selected time period' },
        { status: 400 }
      )
    }

    // Create trip with seats in a transaction and update bus state
    const trip = await prisma.$transaction(async (tx) => {
      // Update bus status to passenger_filling
      await tx.bus.update({
        where: { id: busId },
        data: { status:  'passenger_filling'}  
      })

      // Create the trip
      const newTrip = await tx.trip.create({
        data: {
          routeId,
          busId,
          departureTime: new Date(departureTime),
          arrivalTime: new Date(arrivalTime),
          price,
          status: 'scheduled',
          seats: {
            create: Array.from({ length: bus.capacity }, (_, i) => ({
              seatNumber: `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`,
              status: 'available'
            }))
          }
        },
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

      return newTrip
    })

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Create trip error:', error)
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    )
  }
}