import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

export async function GET() {

  try {
    
    const bookings = await prisma.booking.findMany({
      orderBy: {
        bookingDate: 'desc'
      },
      include: {
        trip: {
          include: {
            route: {
              include: {
                departureCity: true,
                arrivalCity: true
              }
            }
          }
        },
        details: {
          include: {
            seat: true
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error bookings' },
      { status: 500 }
    )
  }
}