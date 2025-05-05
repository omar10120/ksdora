import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const [totalUsers, totalBookings, totalRevenue, activeTrips, recentBookings] = await Promise.all([
      prisma.user.count({
        where: { role: 'USER' }
      }),
      prisma.booking.count(),
      prisma.booking.aggregate({
        where: { status: 'confirmed' },
        _sum: {
          totalPrice: true
        }
      }),
      prisma.trip.count({
        where: {
          status: 'scheduled',
          departureTime: {
            gte: new Date()
          }
        }
      }),
      prisma.booking.findMany({
        take: 5,
        orderBy: {
          bookingDate: 'desc'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          trip: {
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
    ])

    return NextResponse.json({
      totalUsers,
      totalBookings,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      activeTrips,
      recentBookings
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error dashboard stats' },
      { status: 500 }
    )
  }
}