import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: Request,
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
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { name, nameAr } = body

    if (!name || !nameAr) {
      return NextResponse.json(
        { error: 'Name and Arabic name are required' },
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
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cityWithRoutes = await prisma.city.findUnique({
      where: { id: params.id },
      include: {
        departureRoutes: true,
        arrivalRoutes: true
      }
    })

    if (cityWithRoutes?.departureRoutes.length || cityWithRoutes?.arrivalRoutes.length) {
      return NextResponse.json(
        { error: 'Cannot delete city with existing routes' },
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