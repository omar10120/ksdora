import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'
import type { TripStatus } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: {
        route: {
          include: {
            departureCity: true,
            arrivalCity: true
          }
        },
        bus: true,
        seats: true
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(trip)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error trip' },
      { status: 500 }
    )
  }
}


export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();

    const routeId = formData.get('routeId') as string;
    const busId = formData.get('busId') as string;
    const departureTime = formData.get('departureTime') as string;
    const arrivalTime = formData.get('arrivalTime') as string;
    const price = parseFloat(formData.get('price') as string);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const existingImages = JSON.parse(formData.get('existingImages') as string) as string[];
    const files = formData.getAll('images') as File[];

    // Validate required fields
    if (!routeId || !busId || !departureTime || !arrivalTime || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if bus is active
    const bus = await prisma.bus.findFirst({
      where: { id: busId, status: 'active' },
    });

    // if (!bus) {
    //   return NextResponse.json({ error: 'Bus is not available or not active' + busId  }, { status: 400 });
    // }

    // Check bus availability for time range
    const existingTrip = await prisma.trip.findFirst({
      where: {
        id: { not: req.nextUrl.pathname.split('/').pop() }, // Exclude current trip
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

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Handle image uploads
    const newImageUrls: string[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);
      newImageUrls.push(`/uploads/${fileName}`);
    }

    const imageUrls = [...existingImages, ...newImageUrls];

    // Update trip
    const tripId = req.nextUrl.pathname.split('/').pop();
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        routeId,
        busId,
        title,
        description,
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        price,
        status: 'scheduled',
        imageUrls: JSON.stringify(imageUrls),
      },
    });

    return NextResponse.json(updatedTrip);
  } catch (error) {
    console.error('Update trip error:', error);
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if trip has any bookings
    const tripWithBookings = await prisma.trip.findFirst({
      where: {
        id: params.id,
        bookings: { some: {} }
      }
    })

    if (tripWithBookings) {
      return NextResponse.json(
        { error: 'Cannot delete trip with existing bookings' },
        { status: 400 }
      )
    }

    // Delete trip and related seats
    await prisma.$transaction([
      prisma.seat.deleteMany({
        where: { tripId: params.id }
      }),
      prisma.trip.delete({
        where: { id: params.id }
      })
    ])

    return NextResponse.json({ message: 'Trip deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}