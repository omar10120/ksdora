import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Decimal, empty } from '@prisma/client/runtime/library'
import { headers } from 'next/headers'
import StaticGenerationSearchParamsBailoutProvider from 'next/dist/client/components/static-generation-searchparams-bailout-provider'


export async function POST(req: Request) {
  try {
    const { tripId, seatsNumber } = await req.json();
    const headersList = headers();
    const userId = headersList.get('userId');
    const parsedSeats = parseInt(seatsNumber );

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    

    if (!tripId || isNaN(parsedSeats) || parsedSeats <= 0) {
      return NextResponse.json(
        { error: 'Trip ID and a valid number of seats are required' },
        { status: 400 }
      );
    }

    const booking = await prisma.$transaction(async (tx) => {
      const availableSeats = await tx.seat.findMany({
        where: {
          tripId,
          status: 'available'
        },
        take: parsedSeats
      });

      if (availableSeats.length < seatsNumber) {
        throw new Error(`Only ${availableSeats.length} seats are available`);
      }

      const trip = await tx.trip.findUnique({
        where: { id: tripId }
      });

      if (!trip) {
        throw new Error('Trip not found');
      }

      const totalPrice = new Decimal(trip.price).mul(seatsNumber);

      const booking = await tx.booking.create({
        data: {
          userId,
          tripId,
          totalPrice,
          status: 'pending',
          details: {
            create: availableSeats.map(seat => ({
              seatId: seat.id,
              price: trip.price
            }))
          }
        }
      });

      await tx.seat.updateMany({
        where: {
          id: { in: availableSeats.map(seat => seat.id) }
        },
        data: { status: 'booked' }
      });

      return {
        ...booking,
        seatIds: availableSeats.map(seat => seat.id)
      };
    });

    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const headersList = headers()
    const userId = headersList.get('userId')
    

    
    
    if (!userId) {
      return NextResponse.json(
        { error: `Authentication required ${userId} ` },
        { status: 401 }
      )
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
          include: {
            seat: true
          }
        }
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error bookings' },
      { status: 500 }
    )
  }
}