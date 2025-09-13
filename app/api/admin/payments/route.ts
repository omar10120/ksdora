import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages } from '@/lib/apiResponse'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - Fetch all payments with pagination and filters
export const GET = asyncHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const method = searchParams.get('method')

    // Calculate pagination
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (method) {
      where.method = method
    }

    // Get total count
    const total = await prisma.payment.count({ where })
    
    // Get payments with related data
    const payments = await prisma.payment.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        bill: {
          include: {
            booking: {
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
                        departureCity: true,
                        arrivalCity: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
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

    return ApiResponseBuilder.paginated(payments, pagination, SuccessMessages.RETRIEVED)
  } catch (error) {
    throw ApiError.database('Failed to fetch payments')
  }
})
