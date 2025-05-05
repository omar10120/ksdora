import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const cities = await prisma.city.findMany({
      include: {
        departureRoutes: true,
        arrivalRoutes: true
      }
    })
    return NextResponse.json(cities)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error cities' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    // Check if city already exists
    const existingCity = await prisma.city.findFirst({
      where: {
        OR: [
          { name },
          { nameAr }
        ]
      }
    })

    if (existingCity) {
      return NextResponse.json(
        { error: 'City with this name already exists' },
        { status: 400 }
      )
    }

    const city = await prisma.city.create({
      data: {
        name,
        nameAr
      }
    })

    return NextResponse.json(city)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create city' },
      { status: 500 }
    )
  }
}