import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bus = await prisma.bus.findUnique({
      where: {
        id: params.id
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { plateNumber, capacity, model, status } = body

    // Validate required fields
    if (!plateNumber || !capacity || !model || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if bus exists
    const existingBus = await prisma.bus.findUnique({
      where: { id: params.id }
    })

    if (!existingBus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      )
    }

    // Check if plate number is taken by another bus
    const busWithPlateNumber = await prisma.bus.findFirst({
      where: {
        plateNumber,
        id: { not: params.id }
      }
    })

    if (busWithPlateNumber) {
      return NextResponse.json(
        { error: 'Plate number is already in use' },
        { status: 400 }
      )
    }

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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if bus has any associated trips
    const busWithTrips = await prisma.bus.findFirst({
      where: {
        id: params.id,
        trips: {
          some: {}
        }
      }
    })

    if (busWithTrips) {
      return NextResponse.json(
        { error: 'Cannot delete bus with associated trips' },
        { status: 400 }
      )
    }

    await prisma.bus.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: 'Bus deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete bus' },
      { status: 500 }
    )
  }
}