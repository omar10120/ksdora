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
        images: {
          select: {
            id: true,
            imageUrl: true,
            altText: true
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
      let parsedImages = null
      
      if (trip.images) {
        try {
          // Try to parse as JSON first
          parsedImages = trip.images
        } catch (error) {
          // If it's not JSON, treat as single string and wrap in array
          parsedImages = [trip.images]
        }
      }
      
      return {
        ...trip,
        images: parsedImages
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
    const primaryImage = formData.get('primaryImage') as string
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
    const images: string[] = []
    for (const file of files) {
      if (file.size > 0) { // Only process files with content
        const buffer = Buffer.from(await file.arrayBuffer())
        const base64 = buffer.toString('base64')
        const mimeType = file.type
        const dataURI = `data:${mimeType};base64,${base64}`

        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          folder: 'trips'
        })

        images.push(uploadResult.secure_url)
      }
    }

    console.log('Image URLs array:', images)

    // Create trip with seats and images in transaction
    const trip = await prisma.$transaction(async (tx) => {
      // Update bus status
      await tx.bus.update({
        where: { id: busId },
        data: { status: 'passenger_filling' }
      })

      // Create trip with seats
      const newTrip = await tx.trip.create({
        data: {
          routeId,
          busId,
          titleAr,
          titleEn,
          descriptionEn,
          descriptionAr,
          latitude,
          longitude,
          primaryImage,
          departureTime: new Date(departureTime),
          arrivalTime: new Date(arrivalTime),
          lastBookingTime: lastBookingTime ? new Date(lastBookingTime) : new Date(departureTime),
          price,
          status: 'scheduled',
          seats: {
            create: Array.from({ length: bus.capacity }, (_, i) => ({
              seatNumber: `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`,
              status: 'available'
            }))
          }
        }
      })

      // Create Images records
      if (images.length > 0) {
        const imageRecords = images.map((url, index) => ({
          tripId: newTrip.id,
          imageUrl: url,
          altText: `Trip image ${index + 1}`
        }))

        await tx.images.createMany({
          data: imageRecords
        })
      }

      // Return trip with all relations
      return tx.trip.findUnique({
        where: { id: newTrip.id },
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
          },
          images: {
            select: {
              id: true,
              imageUrl: true,
              altText: true
            }
          }
        }
      })
    })

    return ApiResponseBuilder.created(
      trip,
      SuccessMessages.CREATED
    )
  } catch (error) {
    throw ApiError.database('Failed to create trip')
  }
})
