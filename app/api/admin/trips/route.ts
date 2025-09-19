import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages ,StatusCodes} from '@/lib/apiResponse'
import { validateRequest } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

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

    // Get total count
    const total = await prisma.trip.count({ where })
    
    // Get trips
    const trips = await prisma.trip.findMany({
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
        seats: {
          select: {
            id: true,
            seatNumber: true,
            status: true
          }
        },
        bookings: {
          select: {
            id: true,
            status: true,
            totalPrice: true
          }
        },

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

    // Format trips with properly parsed imageUrls
    const formattedTrips = trips.map(trip => {
      let parsedImageUrls = null
      
      if (trip.imageUrls) {
        try {
          // Try to parse as JSON first
          parsedImageUrls = JSON.parse(trip.imageUrls)
        } catch (error) {
          // If it's not JSON, treat as single string and wrap in array
          parsedImageUrls = [trip.imageUrls]
        }
      }
      
      return {
        ...trip,
        imageUrls: parsedImageUrls
      }
    })

    return ApiResponseBuilder.paginated(formattedTrips, pagination, SuccessMessages.RETRIEVED)
  } catch (error) {
    throw ApiError.database('Failed to fetch trips')
  }
})

// POST - Create new trip
export const POST = asyncHandler(async (request: NextRequest) => {
  try {
    const formData = await request.formData()

    const routeId = formData.get('routeId') as string
    const busId = formData.get('busId') as string
    const departureTime = formData.get('departureTime') as string
    const arrivalTime = formData.get('arrivalTime') as string
    const lastBookingTime = formData.get('lastBookingTime') as string
    const price = parseFloat(formData.get('price') as string)
    const titleAr = formData.get('titleAr') as string
    const titleEn = formData.get('titleEn') as string
    const descriptionAr = formData.get('descriptionAr') as string
    const descriptionEn = formData.get('descriptionEn') as string
    const latitude = formData.get('latitude') as string
    const longitude = formData.get('longitude') as string
    const files = formData.getAll('images') as File[]
    
    // Validate required fields
    if (!routeId || !busId || !departureTime || !arrivalTime || !price) {
      return ApiResponseBuilder.validationError(
        { general: ['Missing required fields'] },
        ErrorMessages.VALIDATION_FAILED
      )
    }

    // Validate time logic
    if (lastBookingTime && (lastBookingTime > departureTime || lastBookingTime > arrivalTime)) {
      return ApiResponseBuilder.validationError(
        { lastBookingTime: ['Last booking time must be before departure time and arrival time'] },
        ErrorMessages.VALIDATION_FAILED
      )
    }

    // Check if bus exists and is active
    const bus = await prisma.bus.findFirst({
      where: { id: busId, status: 'active' }
    })

    if (!bus) {
      return ApiResponseBuilder.notFound('Active bus')
    }

    // Check if route exists
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        departureCity: { include: { country: true } },
        arrivalCity: { include: { country: true } }
      }
    })

    if (!route) {
      return ApiResponseBuilder.notFound('Route')
    }

    // Check bus availability for time range
    const existingTrip = await prisma.trip.findFirst({
      where: {
        busId,
        OR: [
          {
            AND: [
              { departureTime: { lte: new Date(departureTime) } },
              { arrivalTime: { gte: new Date(departureTime) } }
            ]
          },
          {
            AND: [
              { departureTime: { lte: new Date(arrivalTime) } },
              { arrivalTime: { gte: new Date(arrivalTime) } }
            ]
          }
        ]
      }
    })

    if (existingTrip) {
      return ApiResponseBuilder.conflict('Bus is not available for this period')
    }

    // Upload images to Cloudinary
    const imageUrls: string[] = []
    for (const file of files) {
      if (file.size > 0) { // Only process files with content
        const buffer = Buffer.from(await file.arrayBuffer())
        const base64 = buffer.toString('base64')
        const mimeType = file.type
        const dataURI = `data:${mimeType};base64,${base64}`

        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          folder: 'trips'
        })

        imageUrls.push(uploadResult.secure_url)
      }
    }

    // Ensure imageUrls is properly formatted as complete JSON string
    let imageUrlsString = imageUrls.length > 0 ? JSON.stringify(imageUrls) : null
    
    // Validate JSON string completeness
    if (imageUrlsString) {
      try {
        const parsed = JSON.parse(imageUrlsString)
        console.log('✅ JSON validation successful:', parsed)
        console.log('✅ JSON string length:', imageUrlsString.length)
        console.log('✅ JSON string ends with ]:', imageUrlsString.endsWith(']'))
        
        // Additional validation: ensure it's a complete array
        if (!Array.isArray(parsed)) {
          throw new Error('Parsed result is not an array')
        }
        if (parsed.length !== imageUrls.length) {
          throw new Error('Array length mismatch')
        }
      } catch (error) {
        console.error('❌ JSON validation failed:', error)
        console.error('❌ Invalid JSON string:', imageUrlsString)
        console.error('❌ Original imageUrls array:', imageUrls)
        
        // Fallback: try to fix truncated JSON
        let fixedJsonString = imageUrlsString
        if (!imageUrlsString.endsWith(']')) {
          // Try to find the last complete URL and close the array
          const lastCompleteUrl = imageUrlsString.match(/"[^"]*"/g)?.pop()
          if (lastCompleteUrl) {
            fixedJsonString = imageUrlsString.substring(0, imageUrlsString.lastIndexOf(lastCompleteUrl)) + lastCompleteUrl + ']'
            console.log('🔧 Attempting to fix truncated JSON:', fixedJsonString)
          }
        }
        
        // Use the fixed version if available
        if (fixedJsonString !== imageUrlsString) {
          try {
            JSON.parse(fixedJsonString)
            console.log('✅ Fixed JSON validation successful')
            // Update the imageUrlsString to use the fixed version
            imageUrlsString = fixedJsonString
          } catch (fixError) {
            console.error('❌ Fixed JSON still invalid:', fixError)
          }
        }
      }
    }
    
    console.log('Image URLs array:', imageUrls)
    console.log('Image URLs string:', imageUrlsString)

    // Create trip with seats in transaction
    const trip = await prisma.$transaction(async (tx) => {
      // Update bus status
      await tx.bus.update({
        where: { id: busId },
        data: { status: 'passenger_filling' }
      })

      // Create trip with seats
      console.log('📝 About to store imageUrls in DB:', imageUrlsString)
      console.log('📝 ImageUrls string length:', imageUrlsString?.length)
      console.log('📝 ImageUrls ends with ]:', imageUrlsString?.endsWith(']'))
      
      return tx.trip.create({
        data: {
          routeId,
          busId,
          titleAr,
          titleEn,
          descriptionEn,
          descriptionAr,
          latitude,
          longitude,
          departureTime: new Date(departureTime),
          arrivalTime: new Date(arrivalTime),
          lastBookingTime: lastBookingTime ? new Date(lastBookingTime) : new Date(departureTime),
          price,
          status: 'scheduled',
          imageUrls: imageUrlsString,
          seats: {
            create: Array.from({ length: bus.capacity }, (_, i) => ({
              seatNumber: `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`,
              status: 'available'
            }))
          }
        },
        include: {
          route: {
            include: {
              departureCity: { include: { country: true } },
              arrivalCity: { include: { country: true } }
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
          seats: {
            select: {
              id: true,
              seatNumber: true,
              status: true
            }
          }
        }
      })
    })

    // Format the response with properly parsed imageUrls
    console.log('📖 Retrieved imageUrls from DB:', trip.imageUrls)
    console.log('📖 Retrieved imageUrls length:', trip.imageUrls?.length)
    console.log('📖 Retrieved imageUrls ends with ]:', trip.imageUrls?.endsWith(']'))
    
    let parsedImageUrls = null
    
    if (trip.imageUrls) {
      try {
        // Try to parse as JSON first
        parsedImageUrls = JSON.parse(trip.imageUrls)
        console.log('✅ Response parsing successful:', parsedImageUrls)
      } catch (error) {
        // If it's not JSON, treat as single string and wrap in array
        console.error('❌ Response parsing failed:', error)
        console.error('❌ Raw imageUrls from DB:', trip.imageUrls)
        parsedImageUrls = [trip.imageUrls]
      }
    }
    
    const formattedTrip = {
      ...trip,
      imageUrls: parsedImageUrls
    }
    
    console.log('✅ Final formatted trip imageUrls:', formattedTrip.imageUrls)

    return ApiResponseBuilder.created(
      formattedTrip,
      SuccessMessages.CREATED
    )
  } catch (error) {
    throw ApiError.database('Failed to create trip')
  }
})
