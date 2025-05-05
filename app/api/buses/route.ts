import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as 'active' | 'maintenance' | 'inactive' | null

    const buses = await prisma.bus.findMany({
      where: status ? { status } : {},
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

    return NextResponse.json(buses)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error buses' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { plateNumber, capacity, model, status } = body

    if (!plateNumber || !capacity) {
      return NextResponse.json(
        { error: 'Plate number and capacity are required' },
        { status: 400 }
      )
    }

    const existingBus = await prisma.bus.findUnique({
      where: { plateNumber }
    })

    if (existingBus) {
      return NextResponse.json(
        { error: 'Bus with this plate number already exists' },
        { status: 400 }
      )
    }

    const bus = await prisma.bus.create({
      data: {
        plateNumber,
        capacity,
        model,
        status: status || 'active'
      }
    })

    return NextResponse.json(bus)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create bus' },
      { status: 500 }
    )
  }
}