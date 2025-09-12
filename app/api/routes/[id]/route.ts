import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const route = await prisma.route.findUnique({
      where: { id: params.id },
      include: {
        departureCity: true,
        arrivalCity: true,
        trips: {
          include: {
            bus: true,
            seats: true
          }
        }
      }
    })

    if (!route) {
      return ApiResponseBuilder.notFound('Route')
    }

    return ApiResponseBuilder.success(route, SuccessMessages.RETRIEVED)
  } catch (error) {
    throw ApiError.database('Failed to fetch route')
  }
})

export const PUT = asyncHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await req.json()
    const { departureCityId, arrivalCityId, distance } = body

    const updatedRoute = await prisma.route.update({
      where: { id: params.id },
      data: {
        departureCityId,
        arrivalCityId,
        distance
      },
      include: {
        departureCity: true,
        arrivalCity: true
      }
    })

    return ApiResponseBuilder.success(updatedRoute, SuccessMessages.UPDATED)
  } catch (error) {
    throw ApiError.database('Failed to update route')
  }
})

export const DELETE = asyncHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
      try {
        // Check if route has any trips
        const routeWithTrips = await prisma.route.findUnique({
          where: { id: params.id },
          include: { trips: true }
        })

        if (routeWithTrips?.trips.length) {
          return ApiResponseBuilder.error(
            'Cannot delete route with existing trips',
            StatusCodes.BAD_REQUEST,
            'Cannot delete route with existing trips'
          )
        }

        await prisma.route.delete({
          where: { id: params.id }
        })

        return ApiResponseBuilder.success(null, SuccessMessages.DELETED)
      } catch (error) {
        throw ApiError.database('Failed to delete route')
      }
      }
    )