import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const route = await prisma.route.findUnique({
      where: { id: params.id },
      include: {
        departureCity: true,
        arrivalCity: true,
        trips: {
          include: {
            bus: true,
            seats: true
          }
        }
      }
    })

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(route)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error route' },
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
    const { departureCityId, arrivalCityId, distance } = body

    const updatedRoute = await prisma.route.update({
      where: { id: params.id },
      data: {
        departureCityId,
        arrivalCityId,
        distance
      },
      include: {
        departureCity: true,
        arrivalCity: true
      }
    })

    return NextResponse.json(updatedRoute)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update route' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if route has any trips
    const routeWithTrips = await prisma.route.findUnique({
      where: { id: params.id },
      include: { trips: true }
    })

    if (routeWithTrips?.trips.length) {
      return NextResponse.json(
        { error: 'Cannot delete route with existing trips' },
        { status: 400 }
      )
    }

    await prisma.route.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Route deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete route' },
      { status: 500 }
    )
  }
}