import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';


import { v2 as cloudinary } from 'cloudinary';
// import type { File } from 'formdata-node';


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function GET() {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: {
        departureTime: 'desc'
      },
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

    return NextResponse.json(trips)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error trips' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const routeId = formData.get('routeId') as string;
    const busId = formData.get('busId') as string;
    const departureTime = formData.get('departureTime') as string;
    const arrivalTime = formData.get('arrivalTime') as string;
    const lastBookingTime = formData.get('lastBookingTime') as string;
    const price = parseFloat(formData.get('price') as string);
    const titleAr = formData.get('titleAr') as string;
    const titleEn = formData.get('titleEn') as string;
    const descriptionAr = formData.get('descriptionAr') as string;
    const descriptionEn = formData.get('descriptionEn') as string;
    const locationAr = formData.get('locationAr') as string;
    const locationEn = formData.get('locationEn') as string;
    const files = formData.getAll('images') as File[];
    
    if (!routeId || !busId || !departureTime || !arrivalTime || !price )  {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if( lastBookingTime > departureTime || lastBookingTime > arrivalTime){
      return NextResponse.json(
        { error: 'Last booking time must be before departure time and arrival time' },
        { status: 400 }
      )
    }
    const bus = await prisma.bus.findFirst({
      where: { id: busId, status: 'active' },
    });

    if (!bus) {
      return NextResponse.json({ error: 'Bus is not available or not active' }, { status: 400 });
    }

    const existingTrip = await prisma.trip.findFirst({
      where: {
        busId,
        OR: [
          {
            AND: [
              { departureTime: { lte: new Date(departureTime) } },
              { arrivalTime: { gte: new Date(departureTime) } },
            ],
          },
          {
            AND: [
              { departureTime: { lte: new Date(arrivalTime) } },
              { arrivalTime: { gte: new Date(arrivalTime) } },
            ],
          },
        ],
      },
    });

    if (existingTrip) {
      return NextResponse.json({ error: 'Bus is not available for this period' }, { status: 400 });
    }

    const imageUrls: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      const mimeType = file.type;
      const dataURI = `data:${mimeType};base64,${base64}`;

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: 'trips',
      });

      imageUrls.push(uploadResult.secure_url);
    }

    const trip = await prisma.$transaction(async (tx) => {
      await tx.bus.update({
        where: { id: busId },
        data: { status: 'passenger_filling' },
      });

      return tx.trip.create({
        data: {
          routeId,
          busId,
          titleAr,
          titleEn,
          descriptionEn,
          descriptionAr,
          locationAr,
          locationEn,
          departureTime: new Date(departureTime),
          arrivalTime: new Date(arrivalTime),
          lastBookingTime: new Date(lastBookingTime),
          price,
          status: 'scheduled',
          imageUrls: JSON.stringify(imageUrls),
          seats: {
            create: Array.from({ length: bus.capacity }, (_, i) => ({
              seatNumber: `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`,
              status: 'available',
            })),
          },
        },
        include: {
          route: { include: { departureCity: true, arrivalCity: true } },
          bus: true,
          seats: true,
        },
      });
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error('Create trip error:', error);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}

// export async function POST(req: NextRequest) {
//   try {
//     const formData = await req.formData();

//     const routeId = formData.get('routeId') as string;
//     const busId = formData.get('busId') as string;
//     const departureTime = formData.get('departureTime') as string;
//     const arrivalTime = formData.get('arrivalTime') as string;
//     const price = parseFloat(formData.get('price') as string);
//     const title = formData.get('title') as string;
//     const description = formData.get('description') as string;
//     const files = formData.getAll('images') as File[];

//     // Validate required fields
//     if (!routeId || !busId || !departureTime || !arrivalTime || !price) {
//       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
//     }

//     // Check if bus is active
//     const bus = await prisma.bus.findFirst({
//       where: { id: busId, status: 'active' },
//     });

//     if (!bus) {
//       return NextResponse.json({ error: 'Bus is not available or not active' }, { status: 400 });
//     }

//     // Check bus availability for time range
//     const existingTrip = await prisma.trip.findFirst({
//       where: {
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
//     const imageUrls: string[] = [];
//     for (const file of files) { 
//       const buffer = Buffer.from(await file.arrayBuffer());
//       const fileName = `${Date.now()}-${file.name}`;
//       const filePath = path.join(uploadDir, fileName);
//       await fs.writeFile(filePath, buffer);
//       imageUrls.push(`/uploads/${fileName}`);
//     }

//     // Create trip in transaction
//     const trip = await prisma.$transaction(async (tx) => {
//       await tx.bus.update({
//         where: { id: busId },
//         data: { status: 'passenger_filling' },
//       });

//       return tx.trip.create({
//         data: {
//           routeId,
//           busId,
//           title,
//           description,
//           departureTime: new Date(departureTime),
//           arrivalTime: new Date(arrivalTime),
//           price,
//           status: 'scheduled',
//           imageUrls: JSON.stringify(imageUrls),
//           seats: {
//             create: Array.from({ length: bus.capacity }, (_, i) => ({
//               seatNumber: `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`,
//               status: 'available',
//             })),
//           },
//         },
//         include: {
//           route: { include: { departureCity: true, arrivalCity: true } },
//           bus: true,
//           seats: true,
//         },
//       });
//     });

//     return NextResponse.json(trip);
//   } catch (error) {
//     console.error('Create trip error:', error);
//     return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
//   }
// }