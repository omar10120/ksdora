import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
    try {
      const { searchParams } = new URL(req.url)
      const search = searchParams.get('search')
  
      const cities = await prisma.city.findMany({
        where: search ? {
          OR: [
            {
              name: {
                contains: search
              }
            },
            {
              nameAr: {
                contains: search
              }
            }
          ]
        } : {},
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
  
      return NextResponse.json(cities)
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error cities' },
        { status: 500 }
      )
    }
  }

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, nameAr } = body

    if (!name || !nameAr) {
      return NextResponse.json(
        { error: 'Name and Arabic name are required' },
        { status: 400 }
      )
    }

    const existingCity = await prisma.city.findFirst({
        where: {
          OR: [
            {
              name: {
                equals: name
              }
            },
            {
              nameAr: {
                equals: nameAr
              }
            }
          ]
        }
      })

    if (existingCity) {
      return NextResponse.json(
        { error: 'City already exists' },
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