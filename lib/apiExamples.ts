import { NextRequest } from 'next/server'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from './apiResponse'
import { validateRequest, ValidationSchemas } from './validation'
import { asyncHandler, ApiError } from './errorHandler'
import prisma from './prisma'

// Example 1: Simple GET endpoint with success response
export const getUsersExample = asyncHandler(async (request: NextRequest) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  })

  return ApiResponseBuilder.success(
    users,
    SuccessMessages.RETRIEVED
  )
})

// Example 2: POST endpoint with validation and creation
export const createUserExample = asyncHandler(async (request: NextRequest) => {
  const body = await request.json()
  
  // Validate request data
  const validationResult = validateRequest(body, ValidationSchemas.user)
  if (!validationResult.isValid) {
    const errorMessages: Record<string, string[]> = {}
    validationResult.errors.forEach(error => {
      if (!errorMessages[error.field]) {
        errorMessages[error.field] = []
      }
      errorMessages[error.field].push(error.message)
    })
    
    return ApiResponseBuilder.validationError(errorMessages, ErrorMessages.VALIDATION_FAILED)
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (existingUser) {
    return ApiResponseBuilder.conflict('User with this email already exists')
  }

  // Create user
  const user = await prisma.user.create({
    data: body,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  })

  return ApiResponseBuilder.created(user, SuccessMessages.CREATED)
})

// Example 3: GET endpoint with pagination
export const getTripsPaginatedExample = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const status = searchParams.get('status')

  // Calculate pagination
  const skip = (page - 1) * limit
  
  // Build where clause
  const where: any = {}
  if (status) {
    where.status = status
  }

  // Get total count
  const total = await prisma.trip.count({ where })
  
  // Get trips
  const trips = await prisma.trip.findMany({
    where,
    include: {
      route: {
        include: {
          departureCity: true,
          arrivalCity: true
        }
      },
      bus: true
    },
    skip,
    take: limit,
    orderBy: {
      departureTime: 'asc'
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

  return ApiResponseBuilder.paginated(trips, pagination, SuccessMessages.RETRIEVED)
})

// Example 4: PUT endpoint with update
export const updateTripExample = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tripId = searchParams.get('id')
  
  if (!tripId) {
    return ApiResponseBuilder.error('Trip ID is required', StatusCodes.BAD_REQUEST)
  }

  const body = await request.json()
  
  // Check if trip exists
  const existingTrip = await prisma.trip.findUnique({
    where: { id: tripId }
  })

  if (!existingTrip) {
    return ApiResponseBuilder.notFound('Trip')
  }

  // Update trip
  const updatedTrip = await prisma.trip.update({
    where: { id: tripId },
    data: body,
    include: {
      route: {
        include: {
          departureCity: true,
          arrivalCity: true
        }
      },
      bus: true
    }
  })

  return ApiResponseBuilder.success(updatedTrip, SuccessMessages.UPDATED)
})

// Example 5: DELETE endpoint
export const deleteBookingExample = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const bookingId = searchParams.get('id')
  
  if (!bookingId) {
    return ApiResponseBuilder.error('Booking ID is required', StatusCodes.BAD_REQUEST)
  }

  // Check if booking exists
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  })

  if (!booking) {
    return ApiResponseBuilder.notFound('Booking')
  }

  // Check if booking can be deleted (not completed)
  if (booking.status === 'completed') {
    return ApiResponseBuilder.error('Cannot delete completed booking', StatusCodes.BAD_REQUEST)
  }

  // Delete booking and related records
  await prisma.$transaction([
    // Delete booking details
    prisma.bookingDetail.deleteMany({
      where: { bookingId }
    }),
    // Delete booking
    prisma.booking.delete({
      where: { id: bookingId }
    })
  ])

  return ApiResponseBuilder.success(null, SuccessMessages.DELETED)
})

// Example 6: Complex query with multiple includes
export const getBookingDetailsExample = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const bookingId = searchParams.get('id')
  
  if (!bookingId) {
    return ApiResponseBuilder.error('Booking ID is required', StatusCodes.BAD_REQUEST)
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
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
          },
          bus: true
        }
      },
      bookingDetails: {
        include: {
          seat: true
        }
      },
      bill: {
        include: {
          payments: true
        }
      },
      ratings: true,
      feedback: true
    }
  })

  if (!booking) {
    return ApiResponseBuilder.notFound('Booking')
  }

  return ApiResponseBuilder.success(booking, SuccessMessages.RETRIEVED)
})

// Example 7: Error handling with custom errors
export const processPaymentExample = asyncHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { billId, amount, method } = body

  // Validate payment data
  const validationResult = validateRequest(body, ValidationSchemas.payment)
  if (!validationResult.isValid) {
    const errorMessages: Record<string, string[]> = {}
    validationResult.errors.forEach(error => {
      if (!errorMessages[error.field]) {
        errorMessages[error.field] = []
      }
      errorMessages[error.field].push(error.message)
    })
    
    return ApiResponseBuilder.validationError(errorMessages, ErrorMessages.VALIDATION_FAILED)
  }

  // Check if bill exists
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: {
      booking: true
    }
  })

  if (!bill) {
    return ApiResponseBuilder.notFound('Bill')
  }

  // Check if bill is already paid
  if (bill.status === 'paid') {
    return ApiResponseBuilder.error('Bill is already paid', StatusCodes.BAD_REQUEST)
  }

  // Check if amount matches
  if (bill.amount !== amount) {
    return ApiResponseBuilder.error('Payment amount does not match bill amount', StatusCodes.BAD_REQUEST)
  }

  try {
    // Process payment (simulate external payment processing)
    const paymentResult = await processExternalPayment(amount, method)
    
    if (!paymentResult.success) {
      throw ApiError.external('Payment processing failed')
    }

    // Update bill and create payment record
    const [updatedBill, payment] = await prisma.$transaction([
      prisma.bill.update({
        where: { id: billId },
        data: { status: 'paid' }
      }),
      prisma.payment.create({
        data: {
          billId,
          amount,
          method,
          status: 'successful',
          transactionId: paymentResult.transactionId,
          paidAt: new Date()
        }
      })
    ])

    return ApiResponseBuilder.success(
      { bill: updatedBill, payment },
      SuccessMessages.PAYMENT_SUCCESS
    )
  } catch (error) {
    // Create failed payment record
    await prisma.payment.create({
      data: {
        billId,
        amount,
        method,
        status: 'failed',
        transactionId: null
      }
    })

    throw ApiError.external('Payment processing failed')
  }
})

// Example 8: Warning response
export const getLowStockSeatsExample = asyncHandler(async (request: NextRequest) => {
  const trips = await prisma.trip.findMany({
    include: {
      seats: {
        where: {
          status: 'available'
        }
      }
    }
  })

  const lowStockTrips = trips.filter(trip => trip.seats.length < 5)

  if (lowStockTrips.length === 0) {
    return ApiResponseBuilder.success(trips, 'All trips have sufficient seat availability')
  }

  return ApiResponseBuilder.warning(
    `${lowStockTrips.length} trips have low seat availability`,
    lowStockTrips
  )
})

// Example 9: Info response
export const getSystemStatsExample = asyncHandler(async (request: NextRequest) => {
  const [
    totalUsers,
    totalTrips,
    totalBookings,
    totalRevenue
  ] = await Promise.all([
    prisma.user.count(),
    prisma.trip.count(),
    prisma.booking.count(),
    prisma.bill.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true }
    })
  ])

  const stats = {
    totalUsers,
    totalTrips,
    totalBookings,
    totalRevenue: totalRevenue._sum.amount || 0,
    lastUpdated: new Date().toISOString()
  }

  return ApiResponseBuilder.info(
    'System statistics retrieved successfully',
    stats
  )
})

// Mock external payment processing
async function processExternalPayment(amount: number, method: string) {
  // Simulate external API call
  return new Promise<{ success: boolean; transactionId?: string }>((resolve) => {
    setTimeout(() => {
      // Simulate 90% success rate
      const success = Math.random() > 0.1
      resolve({
        success,
        transactionId: success ? `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : undefined
      })
    }, 1000)
  })
}
