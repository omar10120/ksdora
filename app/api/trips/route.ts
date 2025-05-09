import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createSearchParamsBailoutProxy } from 'next/dist/client/components/searchparams-bailout-proxy'

// Get all trips (existing code)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const date = searchParams.get('date')
    
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const limitSeat = parseInt(searchParams.get('limitSeat') || '100')
    const imagesUrls = searchParams.get('imageUrls')
    const skip = (page - 1) * limit


    const trips = await prisma.trip.findMany({
      skip,
      take: limit,
      where: {
        status: 'scheduled',
        AND: [
          {
            route: {
              departureCity: from ? {
                name: { contains: from }
              } : undefined,
              arrivalCity: to ? {
                name: { contains: to }
              } : undefined
            }
          },
          date ? {
            departureTime: {
              gte: new Date(date),
              lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
            }
          } : {}
        ]
      },
      include: {
        route: {
          include: {
            departureCity: true,
            arrivalCity: true
          }
        },
        seats: true
      }
    })
    
    // const tripsWithLimitedSeats = trips.  map(trip => ({
    //   ...trip,
    //   seats: trip.seats.slice(0, limitSeat)
    // }))

    const tripsWithLimitedSeats = trips.map(trip => ({
      ...trip,
      imageUrls: typeof trip.imageUrls === 'string' ? JSON.parse(trip.imageUrls) : trip.imageUrls,
      seats: trip.seats.slice(0, limitSeat)
    }))
    

    const total = await prisma.trip.count({
      where: {
        status: 'scheduled',
        AND: [
          {
            route: {
              departureCity: from ? {
                name: { contains: from }
              } : undefined,
              arrivalCity: to ? {
                name: { contains: to }
              } : undefined
            }
          },
          date ? {
            departureTime: {
              gte: new Date(date),
              lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
            }
          } : {}
        ]
      }
    })
    
    return NextResponse.json({
      trips : tripsWithLimitedSeats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        limitSeat
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error trips' },
      { status: 500 }
    )
  }
}

// Create new trip
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { routeId, busId, departureTime, arrivalTime, price, location,lastBookingTime } = body

    // Validate required fields
    if (!routeId || !busId || !departureTime || !arrivalTime || !price || !lastBookingTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    if( lastBookingTime > departureTime || lastBookingTime > arrivalTime){
      return NextResponse.json(
        { error: 'Last booking time must be before departure time and arrival time' },
        { status: 400 }
      )
    }
    if (existingTrip) {
      return NextResponse.json(
        { error: 'Bus is not available for the selected time period' },
        { status: 400 }
      )
    }

    // Create trip with seats
    const trip = await prisma.$transaction(async (tx) => {
      // Create the trip
      const newTrip = await tx.trip.create({
        data: {
          routeId,
          busId,
          departureTime: new Date(departureTime),
          arrivalTime: new Date(arrivalTime),
          lastBookingTime: new Date(lastBookingTime),
          price,
          status: 'scheduled',
          location,
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

      // Get bus capacity
      const bus = await tx.bus.findUnique({
        where: { id: busId }
      })

      // Create seats for the trip
      const seatPromises = Array.from({ length: bus!.capacity }, (_, i) => {
        return tx.seat.create({
          data: {
            tripId: newTrip.id,
            seatNumber: `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`,
            status: 'available'
          }
        })
      })

      await Promise.all(seatPromises)

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