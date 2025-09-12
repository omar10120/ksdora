import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest, ValidationSchemas } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// GET - Fetch country by ID
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const country = await prisma.country.findUnique({
      where: { id: params.id },
    
    })

    if (!country) {
      return ApiResponseBuilder.notFound('country')
    }

    return ApiResponseBuilder.success(
      country,
      SuccessMessages.RETRIEVED
    )
  } catch (error) {
    throw ApiError.database('Failed to fetch country')
  }
})

// PUT - Update country
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    
    // Validate request data
    const validationResult = validateRequest(body, ValidationSchemas.country)
    
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

    const { name, nameAr ,code} = body

    // Check if country exists
    const existingcountry = await prisma.country.findUnique({
      where: { id: params.id }
    })

    if (!existingcountry) {
      return ApiResponseBuilder.notFound('country')
    }

    // Check if updated name would create a duplicate
    const duplicatecountry = await prisma.country.findFirst({
      where: {
        OR: [
          { name },
          { nameAr }
        ],
        id: { not: params.id }
      }
    })

    if (duplicatecountry) {
      return ApiResponseBuilder.conflict('country with this name already exists')
    }

    // Update country
    const updatedcountry = await prisma.country.update({
      where: { id: params.id },
      data: {
        name,
        nameAr,
        code
      }
    })

    return ApiResponseBuilder.success(
      updatedcountry,
      SuccessMessages.UPDATED
    )
  } catch (error) {
    throw ApiError.database('Failed to update country')
  }
})

// DELETE - Delete country
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Check if country exists
    const existingcountry = await prisma.country.findUnique({
      where: { id: params.id }
    })

    if (!existingcountry) {
      return ApiResponseBuilder.notFound('country')
    }


    // Delete country
    await prisma.country.delete({
      where: { id: params.id }
    })

    return ApiResponseBuilder.success(
      null,
      SuccessMessages.DELETED
    )
  } catch (error) {
    throw ApiError.database('Failed to delete country'  )
  }
})