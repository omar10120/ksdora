import { NextRequest ,NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages ,StatusCodes} from '@/lib/apiResponse'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// Simple in-memory cache for trips data
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 0 // 0 seconds cache

// GET - Fetch all trips with pagination and filters
export const GET = asyncHandler(async (request: NextRequest) => {
  
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const routeId = searchParams.get('routeId')
    const busId = searchParams.get('busId')
    const departureDate = searchParams.get('departureDate')

    // Create cache key
    const cacheKey = `trips:${page}:${limit}:${status || 'all'}:${routeId || 'all'}:${busId || 'all'}:${departureDate || 'all'}`
    
    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.data
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (routeId) {
      where.routeId = routeId
    }
    if (busId) {
      where.busId = busId
    }
    if (departureDate) {
      const startDate = new Date(departureDate)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      where.departureTime = {
        gte: startDate,
        lt: endDate
      }
    }

    // Optimized query with SQL aggregation for seat counts
    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        orderBy: {
          departureTime: 'desc'
        },
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
              id: true,
              plateNumber: true,
              model: true,
              capacity: true,
              status: true
            }
          },
          images: {
            select: {
              id: true,
              imageUrl: true,
              altText: true
            }
          },

        },
        skip,
        take: limit
      }),
      prisma.trip.count({ where })
    ])

    // Get seat counts using raw SQL for better performance
    const tripIds = trips.map(trip => trip.id)
    const seatCounts = tripIds.length > 0 ? await prisma.$queryRaw`
      SELECT 
        trip_id,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) as booked,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
      FROM seats 
      WHERE trip_id IN (${tripIds.join("','")})
      GROUP BY trip_id
    ` as Array<{
      trip_id: string
      total: bigint
      booked: bigint
      available: bigint
      reserved: bigint
      blocked: bigint
    }> : []

    // Create seat counts lookup map
    const seatCountsMap = seatCounts.reduce((acc, count) => {
      acc[count.trip_id] = {
        total: Number(count.total),
        booked: Number(count.booked),
        available: Number(count.available),
        reserved: Number(count.reserved),
        blocked: Number(count.blocked)
      }
      return acc
    }, {} as Record<string, any>)

    // Process trips with optimized seat summary
    const processedTrips = trips.map(trip => {
      const seatCounts = seatCountsMap[trip.id] || {
        total: 0,
        booked: 0,
        available: 0,
        reserved: 0,
        blocked: 0
      }
      
      const totalSeats = trip.bus.capacity
      const occupancyRate = totalSeats > 0 ? Math.round((seatCounts.booked / totalSeats) * 100) : 0
      
      return {
        ...trip,
        seatSummary: {
          total: totalSeats,
          booked: seatCounts.booked,
          available: seatCounts.available,
          reserved: seatCounts.reserved,
          blocked: seatCounts.blocked,
          occupancyRate
        }
      }
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit)
    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    const response = ApiResponseBuilder.paginated(processedTrips, pagination, SuccessMessages.RETRIEVED)
    
    // Cache the response
    cache.set(cacheKey, { data: response, timestamp: Date.now() })
    
    // Clean old cache entries (simple cleanup)
    if (cache.size > 100) {
      const now = Date.now()
      const entries = Array.from(cache.entries())
      for (const [key, value] of entries) {
        if (now - value.timestamp > CACHE_TTL) {
          cache.delete(key)
        }
      }
    }
    
    return response
  } catch (error) {
    throw ApiError.internal(`Failed to fetch trips , ${error}`)
  }
})







