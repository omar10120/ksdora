import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages } from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

export const GET = asyncHandler(async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const search = searchParams.get('search')
  
      const cities = await prisma.city.findMany({
        where: search ? {
          OR: [
            {
              name: {
                contains: search
              }
            },
            {
              nameAr: {
                contains: search
              }
            }
          ]
        } : {},
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
  
      return ApiResponseBuilder.success(cities, SuccessMessages.RETRIEVED)
    } catch (error) {
      throw ApiError.database(ErrorMessages.DATABASE_ERROR)
    }
  })

export const POST = asyncHandler(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { name, nameAr ,countryId} = body

    if (!name || !nameAr || !countryId) {
      return ApiResponseBuilder.validationError(
        { name: ['Name and Arabic name are required'], nameAr: ['Name and Arabic name are required'], countryId: ['Name and Arabic name are required'] },
        ErrorMessages.VALIDATION_FAILED
      )
    }

    const existingCity = await prisma.city.findFirst({
        where: {
          OR: [
            {
              name: {
                equals: name
              }
            },
            {
              nameAr: {
                equals: nameAr
              }
            }
          ]
        }
      })

    if (existingCity) {
      return ApiResponseBuilder.conflict('City already exists')
    }

    const city = await prisma.city.create({
      data: {
        name,
        nameAr,
        countryId
      }
    })

    return ApiResponseBuilder.success(city, SuccessMessages.CREATED)
  } catch (error) {
    throw ApiError.database('Failed to create city')
  }
})