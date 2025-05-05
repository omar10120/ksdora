import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const city = await prisma.city.findUnique({
      where: { id: params.id },
      include: {
        departureRoutes: {
          include: {
            arrivalCity: true
          }
        },
        arrivalRoutes: {
          include: {
            departureCity: true
          }
        }
      }
    })

    if (!city) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(city)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error city' },
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
    const { name, nameAr } = body

    // Validate required fields
    if (!name || !nameAr) {
      return NextResponse.json(
        { error: 'Name and Arabic name are required' },
        { status: 400 }
      )
    }

    // Check if city exists
    const existingCity = await prisma.city.findUnique({
      where: { id: params.id }
    })

    if (!existingCity) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      )
    }

    // Check if updated name would create a duplicate
    const duplicateCity = await prisma.city.findFirst({
      where: {
        OR: [
          { name },
          { nameAr }
        ],
        id: { not: params.id }
      }
    })

    if (duplicateCity) {
      return NextResponse.json(
        { error: 'City with this name already exists' },
        { status: 400 }
      )
    }

    const updatedCity = await prisma.city.update({
      where: { id: params.id },
      data: {
        name,
        nameAr
      }
    })

    return NextResponse.json(updatedCity)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update city' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if city has any routes
    const cityWithRoutes = await prisma.city.findFirst({
      where: {
        id: params.id,
        OR: [
          { departureRoutes: { some: {} } },
          { arrivalRoutes: { some: {} } }
        ]
      }
    })

    if (cityWithRoutes) {
      return NextResponse.json(
        { error: 'Cannot delete city with associated routes' },
        { status: 400 }
      )
    }

    await prisma.city.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'City deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete city' },
      { status: 500 }
    )
  }
}