import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      include: {
        departureCity: true,
        arrivalCity: true,
        trips: {
          include: {
            bus: true
          }
        }
      },
    //   orderBy: {
    //     createdAt: 'desc'
    //   }
    })

    return NextResponse.json(routes)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error routes' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { departureCityId, arrivalCityId, distance } = body

    // Validate required fields
    if (!departureCityId || !arrivalCityId || !distance) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if cities exist
    const [departureCity, arrivalCity] = await Promise.all([
      prisma.city.findUnique({ where: { id: departureCityId } }),
      prisma.city.findUnique({ where: { id: arrivalCityId } })
    ])

    if (!departureCity || !arrivalCity) {
      return NextResponse.json(
        { error: 'One or both cities not found' },
        { status: 404 }
      )
    }

    // Check if route already exists
    const existingRoute = await prisma.route.findFirst({
      where: {
        AND: [
          { departureCityId },
          { arrivalCityId }
        ]
      }
    })

    if (existingRoute) {
      return NextResponse.json(
        { error: 'Route already exists between these cities' },
        { status: 400 }
      )
    }

    // Create new route
    const route = await prisma.route.create({
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

    return NextResponse.json(route)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create route' },
      { status: 500 }
    )
  }
}