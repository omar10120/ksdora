import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest } from '@/lib/validation'
import { asyncHandler, ApiError, ErrorHandler } from '@/lib/errorHandler'
import { v2 as cloudinary } from 'cloudinary'
import { uploadToCloudinary } from '@/lib/uploadToCloudinary'


export const runtime = 'nodejs' // Required for fs/promises and handling files

// GET - Fetch trip by ID
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            details: {
              include: {
                seat: true
              }
            }
          }
        }
      }
    })

    if (!trip) {
      return ApiResponseBuilder.notFound('Trip')
    }

    return ApiResponseBuilder.success(
      trip,
      SuccessMessages.RETRIEVED
    )
  } catch (error) {
    throw ErrorHandler.handle(error, request)
  }
})


// PUT - Update trip
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
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
    const longitude = formData.get('longitude') as string
    const latitude = formData.get('latitude') as string

    const existingImageIds = JSON.parse(formData.get('existingImageIds') as string || '[]') as string[]
    const files = formData.getAll('images') as File[]
    const primaryImage = formData.get('primaryImage') as string

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

    // Check if trip exists
    const existingTrip = await prisma.trip.findUnique({
      where: { id: params.id }
    })

    if (!existingTrip) {
      return ApiResponseBuilder.notFound('Trip')
    }

    // Check if bus exists and is available for scheduling
    const bus = await prisma.bus.findUnique({
      where: { id: busId }
    })

    if (!bus) {
      return ApiResponseBuilder.notFound('Bus')
    }

    // if (bus.status !== 'active' ) {
    //   return ApiResponseBuilder.error(
    //     `Bus is not available for scheduling. Current status: ${bus.status}`,
    //     StatusCodes.BAD_REQUEST
    //   )
    // }

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

    // Check bus availability for time range (excluding current trip)
    const conflictingTrip = await prisma.trip.findFirst({
      where: {
        id: { not: params.id },
        busId,
        status: { in: ['scheduled', 'in_progress'] }, // Only check active trips
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
          },
          {
            AND: [
              { departureTime: { gte: new Date(departureTime) } },
              { arrivalTime: { lte: new Date(arrivalTime) } }
            ]
          }
        ]
      }
    })

    if (conflictingTrip) {
      return ApiResponseBuilder.conflict(
        `Bus is already scheduled for another trip during this time period. Conflicting trip: ${conflictingTrip.id}`
      )
    }

    // Update trip and handle images in a transaction
    const updatedTrip = await prisma.$transaction(async (tx) => {
      // Update trip
      const trip = await tx.trip.update({
        where: { id: params.id },
        data: {
          routeId,
          busId,
          titleAr,
          titleEn,
          descriptionAr,
          descriptionEn,
          longitude,
          latitude,
          primaryImage,
          departureTime: new Date(departureTime),
          arrivalTime: new Date(arrivalTime),
          lastBookingTime: lastBookingTime ? new Date(lastBookingTime) : new Date(departureTime),
          price,
          status: 'scheduled'
        }
      })

      // Handle image management
      // 1. Delete images not in existingImageIds
      await tx.images.deleteMany({
        where: {
          tripId: params.id,
          id: {
            notIn: existingImageIds
          }
        }
      })

      // 2. Upload new images
      const uploadedImages = []
      for (const file of files) {
        if (file.size > 0) {
          try {
            const url = await uploadToCloudinary(file)
            uploadedImages.push(url)
          } catch (error) {
            console.error('Error uploading image:', error)
          }
        }
      }

      // 3. Create new Images records
      if (uploadedImages.length > 0) {
        const existingImagesCount = await tx.images.count({
          where: { tripId: params.id }
        })

        const newImageRecords = uploadedImages.map((url, index) => ({
          tripId: params.id,
          imageUrl: url,
          altText: `Trip image ${existingImagesCount + index + 1}`
        }))

        await tx.images.createMany({
          data: newImageRecords
        })
      }

      // 4. Return trip with all relations
      return tx.trip.findUnique({
        where: { id: params.id },
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

    return ApiResponseBuilder.success(
      updatedTrip,
      SuccessMessages.UPDATED
    )
  } catch (error) {
    throw ErrorHandler.handle(error, request)
  }
})

  
//   try {
//     const formData = await req.formData();

//     const routeId = formData.get('routeId') as string;
//     const busId = formData.get('busId') as string;
//     const departureTime = formData.get('departureTime') as string;
//     const arrivalTime = formData.get('arrivalTime') as string;
//     const price = parseFloat(formData.get('price') as string);
//     const titleAr = formData.get('titleAr') as string;
//     const description = formData.get('description') as string;
//     const existingImages = JSON.parse(formData.get('existingImages') as string) as string[];
//     const files = formData.getAll('images') as File[];

//     // Validate required fields
//     if (!routeId || !busId || !departureTime || !arrivalTime || !price) {
//       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
//     }

//     // Check if bus is active
//     const bus = await prisma.bus.findFirst({
//       where: { id: busId, status: 'active' },
//     });

//     // if (!bus) {
//     //   return NextResponse.json({ error: 'Bus is not available or not active' + busId  }, { status: 400 });
//     // }

//     // Check bus availability for time range
//     const existingTrip = await prisma.trip.findFirst({
//       where: {
//         id: { not: req.nextUrl.pathname.split('/').pop() }, // Exclude current trip
//         busId,
//         OR: [
//           {
//             AND: [
//               { departureTime: { lte: new Date(departureTime) } },
//               { arrivalTime: { gte: new Date(departureTime) } },
//             ],
//           },
//           {
//             AND: [
//               { departureTime: { lte: new Date(arrivalTime) } },
//               { arrivalTime: { gte: new Date(arrivalTime) } },
//             ],
//           },
//         ],
//       },
//     });

//     if (existingTrip) {
//       return NextResponse.json({ error: 'Bus is not available for this period' }, { status: 400 });
//     }

//     // Create upload directory
//     const uploadDir = path.join(process.cwd(), 'public', 'uploads');
//     await fs.mkdir(uploadDir, { recursive: true });

//     // Handle image uploads
//     const newImageUrls: string[] = [];
//     for (const file of files) {
//       const buffer = Buffer.from(await file.arrayBuffer());
//       const fileName = `${Date.now()}-${file.name}`;
//       const filePath = path.join(uploadDir, fileName);
//       await fs.writeFile(filePath, buffer);
//       newImageUrls.push(`/uploads/${fileName}`);
//     }

//     const imageUrls = [...existingImages, ...newImageUrls];

//     // Update trip
//     const tripId = req.nextUrl.pathname.split('/').pop();
//     const updatedTrip = await prisma.trip.update({
//       where: { id: tripId },
//       data: {
//         routeId,
//         busId,
//         titleAr,
//         description,
//         departureTime: new Date(departureTime),
//         arrivalTime: new Date(arrivalTime),
//         price,
//         status: 'scheduled',
//         imageUrls: JSON.stringify(imageUrls),
//       },
//     });

//     return NextResponse.json(updatedTrip);
//   } catch (error) {
//     console.error('Update trip error:', error);
//     return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
//   }
// }

// DELETE - Delete trip
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Check if trip exists
    const existingTrip = await prisma.trip.findUnique({
      where: { id: params.id }
    })

    if (!existingTrip) {
      return ApiResponseBuilder.notFound('Trip')
    }

    // Check if trip has any bookings
    const tripWithBookings = await prisma.trip.findFirst({
      where: {
        id: params.id,
        bookings: { some: {} }
      }
    })

    if (tripWithBookings) {
      return ApiResponseBuilder.error(
        'Cannot delete trip with existing bookings',
        StatusCodes.BAD_REQUEST,
        'Trip has associated bookings and cannot be deleted'
      )
    }

    // Delete trip and related seats in transaction
    await prisma.$transaction([
      prisma.seat.deleteMany({
        where: { tripId: params.id }
      }),
      prisma.trip.delete({
        where: { id: params.id }
      })
    ])

    return ApiResponseBuilder.success(
      null,
      SuccessMessages.DELETED
    )
  } catch (error) {
    throw ErrorHandler.handle(error, request)
  }
})