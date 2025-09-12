import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages } from '@/lib/apiResponse'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// GET - Fetch all bookings with pagination and filters
export const GET = asyncHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const tripId = searchParams.get('tripId')

    // Calculate pagination
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (userId) {
      where.userId = userId
    }
    if (tripId) {
      where.tripId = tripId
    }

    // Get total count
    const total = await prisma.booking.count({ where })
    
    // Get bookings
    const bookings = await prisma.booking.findMany({
      where,
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
            },
            bus: {
              select: {
                plateNumber: true,
                model: true
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
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        bill: {
          include: {
            payments: true
          }
        },
        ratings: true,
        feedbacks: true
      },
      skip,
      take: limit
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

    return ApiResponseBuilder.paginated(bookings, pagination, SuccessMessages.RETRIEVED)
  } catch (error) {
    throw ApiError.database('Failed to fetch bookings')
  }
})