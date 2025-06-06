import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Get single trip
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
            arrivalCity: true,
          }
        },
        
        seats: true,
        bus: true
      }
    })
  

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }
     // Parse imageUrls if it's stored as a JSON string
     const parsedTrip = {
      ...trip,
      imageUrls: typeof trip.imageUrls === 'string' ? JSON.parse(trip.imageUrls) : trip.imageUrls
    }

    return NextResponse.json(parsedTrip)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error trip' },
      { status: 500 }
    )
  }
}

// Update trip
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { routeId, busId, departureTime, arrivalTime, price, status,locationAr,locationEn,lastBookingTime } = body

    if( lastBookingTime > departureTime || lastBookingTime > arrivalTime){
      return NextResponse.json(
        { error: 'Last booking time must be before departure time and arrival time' },
        { status: 400 }
      )
    }
    
    const updatedTrip = await prisma.trip.update({
      where: { id: params.id },
      data: {
        routeId,
        busId,
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        price,
        status,
        lastBookingTime,
        locationAr,
        locationEn
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

// Delete trip
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if trip has any bookings
    const tripWithBookings = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { bookings: true }
    })

    if (tripWithBookings?.bookings.length) {
      return NextResponse.json(
        { error: 'Cannot delete trip with existing bookings' },
        { status: 400 }
      )
    }

    await prisma.trip.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Trip deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}