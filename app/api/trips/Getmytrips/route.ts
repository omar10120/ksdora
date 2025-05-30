import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(req: Request) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    let userId: string;

    try {
      const decoded = jwt.verify(token, secret) as { userId: string };
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        trip: {
          include: {
            route: {
              include: {
                departureCity: true,
                arrivalCity: true
              }
            }
          }
        },
        details: {
          select: {
            seatId: true
          }
        }
      }
    });

    const formattedBookings = bookings.map(booking => ({
      tripId: booking.trip.id,
      departureTime: booking.trip.departureTime,
      totalPrice: booking.totalPrice.toString(),
      status: booking.status,
      route: {
        departureCity: { name: booking.trip.route.departureCity.name },
        arrivalCity: { name: booking.trip.route.arrivalCity.name }
      },
      seatsBooked: booking.details.length
    }));
    if(formattedBookings.length == 0 || formattedBookings?.length )
        return NextResponse.json(
    { error : 'There is no reservation'},
    { status: 400 }
    );
    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching user trips:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
