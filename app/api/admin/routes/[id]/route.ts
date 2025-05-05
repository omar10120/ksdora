import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
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
            bus: true
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { departureCityId, arrivalCityId, distance } = body

    // Validate required fields
    if (!departureCityId || !arrivalCityId || !distance) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id: params.id }
    })

    if (!existingRoute) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      )
    }

    // Check if updated route would create a duplicate
    const duplicateRoute = await prisma.route.findFirst({
      where: {
        AND: [
          { departureCityId },
          { arrivalCityId },
          { id: { not: params.id } }
        ]
      }
    })

    if (duplicateRoute) {
      return NextResponse.json(
        { error: 'Route already exists between these cities' },
        { status: 400 }
      )
    }

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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if route has any trips
    const routeWithTrips = await prisma.route.findFirst({
      where: {
        id: params.id,
        trips: {
          some: {}
        }
      }
    })

    if (routeWithTrips) {
      return NextResponse.json(
        { error: 'Cannot delete route with associated trips' },
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