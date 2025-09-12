import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const busId = params.id
  const { searchParams } = new URL(request.url)
  const includeTrips = searchParams.get('includeTrips') === 'true'
  const tripStatus = searchParams.get('tripStatus')
  const tripPage = parseInt(searchParams.get('tripPage') || '1')
  const tripLimit = parseInt(searchParams.get('tripLimit') || '10')

  // Validate bus ID
  if (!busId || typeof busId !== 'string') {
    return ApiResponseBuilder.error('Invalid bus ID', 400)
  }

  // Build include clause
  const include: any = {}
  if (includeTrips) {
    const tripWhere: any = {}
    if (tripStatus) {
      tripWhere.status = tripStatus
    }

    include.trips = {
      where: tripWhere,
      include: {
        route: {
          include: {
            departureCity: { include: { country: true } },
            arrivalCity: { include: { country: true } }
          }
        }
      },
      orderBy: { departureTime: 'desc' },
      skip: (tripPage - 1) * tripLimit,
      take: tripLimit
    }
  }

  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    include
  })

  if (!bus) {
    return ApiResponseBuilder.notFound('Bus')
  }

  // Get trip statistics
  const tripStats = await prisma.trip.groupBy({
    by: ['status'],
    where: { busId: busId },
    _count: { status: true }
  })

  const statusCounts = tripStats.reduce((acc, stat) => {
    acc[stat.status || ''] = stat._count.status
    return acc
  }, {} as Record<string, number>)

  return ApiResponseBuilder.success(
    {
      ...bus,
      tripCount: statusCounts.scheduled || 0 + statusCounts.in_progress || 0 + statusCounts.completed || 0 + statusCounts.cancelled || 0,
      tripStats: {
        scheduled: statusCounts.scheduled || 0,
        inProgress: statusCounts.in_progress || 0,
        completed: statusCounts.completed || 0,
        cancelled: statusCounts.cancelled || 0
      },
      recentTrips: bus.trips ? bus.trips.map(trip => ({
        id: trip.id,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        status: trip.status,
        price: trip.price,
        // route: {
        //   from: {
        //     city: trip.route.departureCity.name,
        //     cityAr: trip.route.departureCity.nameAr,
        //     country: trip.route.departureCity.country?.name,
        //     countryAr: trip.route.departureCity.country?.nameAr
        //   },
        //   to: {
        //     city: trip.route.arrivalCity.name,
        //     cityAr: trip.route.arrivalCity.nameAr,
        //     country: trip.route.arrivalCity.country?.name,
        //     countryAr: trip.route.arrivalCity.country?.nameAr
        //   },
        //   distance: trip.route.distance
        // }
      })) : []
    },
    SuccessMessages.RETRIEVED
  )
})

export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const body = await request.json()
  const busId = params.id

  // Validate bus ID
  if (!busId || typeof busId !== 'string') {
    return ApiResponseBuilder.error('Invalid bus ID', 400)
  }

  // Validate request data
  const validationResult = validateRequest(body, {
    plateNumber: { 
      required: false, 
      minLength: 3, 
      maxLength: 20,
      pattern: /^[A-Z0-9-]+$/,
      custom: (value: string) => {
        if (!value.match(/^[A-Z0-9-]+$/)) {
          return 'Plate number must contain only uppercase letters, numbers, and hyphens'
        }
        return true
      }
    },
    capacity: { 
      required: false, 
      min: 10, 
      max: 100,
      custom: (value: any) => {
        const parsed = parseInt(value)
        if (isNaN(parsed)) return 'Capacity must be a valid number'
        if (parsed < 10) return 'Capacity must be at least 10 seats'
        if (parsed > 100) return 'Capacity cannot exceed 100 seats'
        return true
      }
    },
    model: { 
      required: false, 
      minLength: 2, 
      maxLength: 50 
    },
    status: { 
      required: false, 
      enum: ['active', 'maintenance', 'inactive'] 
    }
  })

  if (!validationResult.isValid) {
    return createValidationResponse(validationResult)
  }

  const { plateNumber, capacity, model, status } = body

  // Check if bus exists
  const existingBus = await prisma.bus.findUnique({
    where: { id: busId }
  })

  if (!existingBus) {
    return ApiResponseBuilder.notFound('Bus')
  }

  // Check if plate number is being changed and if it already exists
  if (plateNumber && plateNumber.toUpperCase() !== existingBus.plateNumber) {
    const plateExists = await prisma.bus.findUnique({
      where: { plateNumber: plateNumber.toUpperCase() }
    })

    if (plateExists) {
      return ApiResponseBuilder.conflict('Bus with this plate number already exists')
    }
  }

  // Check if bus has active trips when changing status to maintenance/inactive
  if (status && ['maintenance', 'inactive'].includes(status)) {
    const activeTrips = await prisma.trip.findFirst({
      where: {
        busId: busId,
        status: { in: ['scheduled', 'in_progress'] }
      }
    })

    if (activeTrips) {
      return ApiResponseBuilder.error(
        'Cannot change bus status to maintenance/inactive while it has active trips',
        400
      )
    }
  }

  // Update bus
  const updatedBus = await prisma.bus.update({
    where: { id: busId },
    data: {
      ...(plateNumber && { plateNumber: plateNumber.toUpperCase() }),
      ...(capacity && { capacity: parseInt(capacity) }),
      ...(model !== undefined && { model }),
      ...(status && { status })
    }
  })

  return ApiResponseBuilder.success(
    {
      ...updatedBus,
      plateNumber: updatedBus.plateNumber,
      capacity: updatedBus.capacity,
      model: updatedBus.model,
      status: updatedBus.status,

    },
    SuccessMessages.UPDATED
  )
})

export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const busId = params.id

  // Validate bus ID
  if (!busId || typeof busId !== 'string') {
    return ApiResponseBuilder.error('Invalid bus ID', 400)
  }

  // Check if bus exists
  const existingBus = await prisma.bus.findUnique({
    where: { id: busId },
    include: { 
      trips: {
        select: {
          id: true,
          status: true,
          departureTime: true
        }
      }
    }
  })

  if (!existingBus) {
    return ApiResponseBuilder.notFound('Bus')
  }

  // Check if bus has any trips
  if (existingBus.trips.length > 0) {
    const activeTrips = existingBus.trips.filter(trip => 
      ['scheduled', 'in_progress'].includes(trip.status || '')
    )

    if (activeTrips.length > 0) {
      return ApiResponseBuilder.error(
        `Cannot delete bus with ${activeTrips.length} active trips. Please cancel or complete these trips first.`,
        400
      )
    }

    return ApiResponseBuilder.error(
      `Cannot delete bus with ${existingBus.trips.length} existing trips. Please delete all associated trips first.`,
      400
    )
  }

  // Delete bus
  await prisma.bus.delete({
    where: { id: busId }
  })

  return ApiResponseBuilder.success(
    {
      id: busId,
      plateNumber: existingBus.plateNumber,
      deletedAt: new Date().toISOString()
    },
    SuccessMessages.DELETED
  )
})