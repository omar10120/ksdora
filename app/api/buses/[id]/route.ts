import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bus = await prisma.bus.findUnique({
      where: { id: params.id },
      include: {
        trips: {
          include: {
            route: {
              include: {
                departureCity: true,
                arrivalCity: true
              }
            }
          }
        }
      }
    })

    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(bus)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error bus' },
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
    const { plateNumber, capacity, model, status } = body

    const updatedBus = await prisma.bus.update({
      where: { id: params.id },
      data: {
        plateNumber,
        capacity,
        model,
        status
      }
    })

    return NextResponse.json(updatedBus)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update bus' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if bus has any trips
    const busWithTrips = await prisma.bus.findUnique({
      where: { id: params.id },
      include: { trips: true }
    })

    if (busWithTrips?.trips.length) {
      return NextResponse.json(
        { error: 'Cannot delete bus with existing trips' },
        { status: 400 }
      )
    }

    await prisma.bus.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Bus deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete bus' },
      { status: 500 }
    )
  }
}