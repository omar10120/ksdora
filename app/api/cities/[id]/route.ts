import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages } from '@/lib/apiResponse'
import { validateRequest } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'
import { NextApiRequest } from 'next'

export const GET = asyncHandler(async (
  req:  NextApiRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const city = await prisma.city.findUnique({
      where: { id: params.id },
      include: {
        departureRoutes: {
          include: {
            arrivalCity: true
          }
        },
        arrivalRoutes: {
          include: {
            departureCity: true
          }
        }
      }
    })

    if (!city) {
      return ApiResponseBuilder.notFound('City')
    }

    return ApiResponseBuilder.success(city, SuccessMessages.RETRIEVED)
  } catch (error) {
    throw ApiError.database('Failed to fetch city')
  }
})

export const PUT = asyncHandler(async (
  req: NextApiRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await req.body()
    const { name, nameAr } = body

    if (!name || !nameAr) {
      return ApiResponseBuilder.validationError(
        { name: ['Name and Arabic name are required'], nameAr: ['Name and Arabic name are required'] },
        ErrorMessages.VALIDATION_FAILED
      )
    }

    const updatedCity = await prisma.city.update({
      where: { id: params.id },
      data: {
        name,
        nameAr
      }
    })

    return ApiResponseBuilder.success(updatedCity, SuccessMessages.UPDATED)
  } catch (error) {
    throw ApiError.database('Failed to update city')
  }
})

export const DELETE = asyncHandler(async (
  req: NextApiRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const cityWithRoutes = await prisma.city.findUnique({
      where: { id: params.id },
      include: {
        departureRoutes: true,
        arrivalRoutes: true
      }
    })

    if (cityWithRoutes?.departureRoutes.length || cityWithRoutes?.arrivalRoutes.length) {
        return ApiResponseBuilder.error(
          ApiError.validation('Cannot delete city with existing routes').message,
          ApiError.validation('Cannot delete city with existing routes').statusCode
      )
        
    }

    await prisma.city.delete({
      where: { id: params.id }
    })

    return ApiResponseBuilder.success(null  , SuccessMessages.DELETED)
  } catch (error) {
    return ApiResponseBuilder.error(
      ApiError.database('Failed to delete city').message,
      ApiError.database('Failed to delete city').statusCode
    )
  }
})