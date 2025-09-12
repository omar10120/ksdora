import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages } from '@/lib/apiResponse'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// GET - Fetch dashboard statistics
export const GET = asyncHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // all, today, week, month, year
    const limit = parseInt(searchParams.get('limit') || '5')

    // Calculate date filters based on period
    const getDateFilter = () => {
      const now = new Date()
      switch (period) {
        case 'today':
          return {
            bookingDate: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          }
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return { 
            bookingDate: { gte: weekAgo }
          }
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          return { 
            bookingDate: { gte: monthAgo }
          }
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          return { 
            bookingDate: { gte: yearAgo }
          }
        default:
          return {}
      }
    }

    const dateFilter = getDateFilter()

    // Fetch comprehensive statistics
    const [
      totalUsers,
      totalBookings,
      totalRevenue,
      activeTrips,
      completedTrips,
      cancelledBookings,
      pendingBookings,
      confirmedBookings,
      totalBuses,
      activeBuses,
      totalRoutes,
      recentBookings,
      topRoutes,
      revenueByMonth,
      bookingTrends
    ] = await Promise.all([
      // User statistics
      prisma.user.count({
        where: { role: 'USER' }
      }),
      
      // Booking statistics
      prisma.booking.count({
        where: dateFilter
      }),
      
      // Revenue statistics
      prisma.booking.aggregate({
        where: { 
          status: 'confirmed',
          ...dateFilter
        },
        _sum: {
          totalPrice: true
        }
      }),
      
      // Active trips (scheduled and not departed)
      prisma.trip.count({
        where: {
          status: 'scheduled',
          departureTime: {
            gte: new Date()
          }
        }
      }),
      
      // Completed trips
      prisma.trip.count({
        where: {
          status: 'completed'
        }
      }),
      
      // Cancelled bookings
      prisma.booking.count({
        where: {
          status: 'cancelled',
          ...dateFilter
        }
      }),
      
      // Pending bookings
      prisma.booking.count({
        where: {
          status: 'pending',
          ...dateFilter
        }
      }),
      
      // Confirmed bookings
      prisma.booking.count({
        where: {
          status: 'confirmed',
          ...dateFilter
        }
      }),
      
      // Bus statistics
      prisma.bus.count(),
      
      // Active buses
      prisma.bus.count({
        where: { status: 'active' }
      }),
      
      // Route statistics
      prisma.route.count(),
      
      // Recent bookings
      prisma.booking.findMany({
        take: limit,
        orderBy: {
          bookingDate: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          trip: {
            include: {
              route: {
                include: {
                  departureCity: {
                    include: { country: true }
                  },
                  arrivalCity: {
                    include: { country: true }
                  }
                }
              },
              bus: {
                select: {
                  plateNumber: true,
                  model: true
                }
              }
            }
          }
        }
      }),
      
      // Top routes by bookings
      prisma.route.findMany({
        take: 5,
        include: {
          departureCity: {
            include: { country: true }
          },
          arrivalCity: {
            include: { country: true }
          },
          trips: {
            include: {
              bookings: {
                where: { status: 'confirmed' }
              }
            }
          }
        },
        orderBy: {
          trips: {
            _count: 'desc'
          }
        }
      }),
      
      // Revenue by month (last 12 months)
      prisma.booking.groupBy({
        by: ['bookingDate'],
        where: {
          status: 'confirmed',
          bookingDate: {
            gte: new Date(new Date().getFullYear() - 1, 0, 1)
          }
        },
        _sum: {
          totalPrice: true
        }
      }),
      
      // Booking trends
      prisma.booking.groupBy({
        by: ['status', 'bookingDate'],
        where: dateFilter,
        _count: true
      })
    ])

    // Process revenue by month
    const monthlyRevenue = revenueByMonth.reduce((acc: any, item) => {
      if (item.bookingDate) {
        const month = new Date(item.bookingDate).toISOString().slice(0, 7)
        acc[month] = (acc[month] || 0) + Number(item._sum.totalPrice || 0)
      }
      return acc
    }, {})

    // Process booking trends
    const trends = bookingTrends.reduce((acc: any, item) => {
      if (item.bookingDate && item.status) {
        const date = new Date(item.bookingDate).toISOString().slice(0, 10)
        if (!acc[date]) acc[date] = {}
        acc[date][item.status] = item._count
      }
      return acc
    }, {})

    // Calculate top routes with booking counts
    const topRoutesWithStats = topRoutes.map(route => ({
      ...route,
      totalBookings: route.trips.reduce((sum, trip) => sum + trip.bookings.length, 0),
      totalRevenue: route.trips.reduce((sum, trip) => 
        sum + trip.bookings.reduce((tripSum, booking) => tripSum + Number(booking.totalPrice || 0), 0), 0
      )
    }))

    const stats = {
      overview: {
        totalUsers,
        totalBookings,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        activeTrips,
        completedTrips,
        totalBuses,
        activeBuses,
        totalRoutes
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings,
        cancelled: cancelledBookings,
        recent: recentBookings
      },
      analytics: {
        topRoutes: topRoutesWithStats,
        monthlyRevenue,
        bookingTrends: trends
      },
      period,
      generatedAt: new Date().toISOString()
    }

    return ApiResponseBuilder.success(
      stats,
      SuccessMessages.RETRIEVED
    )
  } catch (error) {
    throw ApiError.database('Failed to fetch dashboard statistics')
  }
})