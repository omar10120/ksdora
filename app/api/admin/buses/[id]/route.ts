import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// GET - Fetch bus by ID
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const bus = await prisma.bus.findUnique({
      where: { id: params.id },
      include: {
        trips: {
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

    if (!bus) {
      return ApiResponseBuilder.notFound('Bus')
    }

    return ApiResponseBuilder.success(
      bus,
      SuccessMessages.RETRIEVED
    )
  } catch (error) {
    throw ApiError.database('Failed to fetch bus')
  }
})

// PUT - Update bus
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    
    // Validate request data
    const validationResult = validateRequest(body, {
      plateNumber: { required: true, minLength: 5, maxLength: 20 },
      capacity: { required: true, min: 1, max: 100 },
      model: { required: true, minLength: 2, maxLength: 100 },
      status: { required: true, enum: ['active', 'maintenance', 'inactive'] }
    })
    
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

    const { plateNumber, capacity, model, status } = body

    // Check if bus exists
    const existingBus = await prisma.bus.findUnique({
      where: { id: params.id }
    })

    if (!existingBus) {
      return ApiResponseBuilder.notFound('Bus')
    }

    // Check if plate number is taken by another bus
    const busWithPlateNumber = await prisma.bus.findFirst({
      where: {
        plateNumber,
        id: { not: params.id }
      }
    })

    if (busWithPlateNumber) {
      return ApiResponseBuilder.conflict('Plate number is already in use')
    }

    // Update bus
    const updatedBus = await prisma.bus.update({
      where: { id: params.id },
      data: {
        plateNumber,
        capacity,
        model,
        status
      }
    })

    return ApiResponseBuilder.success(
      updatedBus,
      SuccessMessages.UPDATED
    )
  } catch (error) {
    throw ApiError.database('Failed to update bus')
  }
})

// DELETE - Delete bus
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Check if bus exists
    const existingBus = await prisma.bus.findUnique({
      where: { id: params.id }
    })

    if (!existingBus) {
      return ApiResponseBuilder.notFound('Bus')
    }

    // Check if bus has any associated trips
    const busWithTrips = await prisma.bus.findFirst({
      where: {
        id: params.id,
        trips: {
          some: {}
        }
      }
    })

    if (busWithTrips) {
      return ApiResponseBuilder.error(
        'Cannot delete bus with associated trips',
        StatusCodes.BAD_REQUEST,
        'Bus has associated trips and cannot be deleted'
      )
    }

    // Delete bus
    await prisma.bus.delete({
      where: { id: params.id }
    })

    return ApiResponseBuilder.success(
      null,
      SuccessMessages.DELETED
    )
  } catch (error) {
    throw ApiError.database('Failed to delete bus')
  }
})