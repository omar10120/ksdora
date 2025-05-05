import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const buses = await prisma.bus.findMany({
 
      orderBy: {
        plateNumber: 'asc'
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

    // Validate required fields
    if (!plateNumber || !capacity || !model || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if bus with same plate number exists
    const existingBus = await prisma.bus.findFirst({
      where: {
        plateNumber
      }
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
        status
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