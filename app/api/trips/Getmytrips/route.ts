import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { ApiResponseBuilder, SuccessMessages, ErrorMessages ,StatusCodes} from '@/lib/apiResponse'
import { validateRequest, createValidationResponse } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

// Simple in-memory cache for user trips data
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 0 // 0 seconds cache

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (req: NextRequest) => {
  try {
    const headersList = headers();
    const authHeader = headersList.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponseBuilder.error(
        'Authorization token required',
        StatusCodes.UNAUTHORIZED
      );
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    let userId: string;

    try {
      const decoded = jwt.verify(token, secret) as { userId: string };
      userId = decoded.userId;
    } catch (err) {
      return ApiResponseBuilder.error(
        'Invalid or expired token',
        StatusCodes.UNAUTHORIZED
      );
    }

    // Add pagination support
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Create cache key based on user and pagination
    const cacheKey = `userTrips:${userId}:${page}:${limit}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.data;
    }

    // Optimized parallel queries
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { userId },
        include: {
          trip: {
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
              images: {
                select: {
                  id: true,
                  imageUrl: true,
                  altText: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.booking.count({ where: { userId } })
    ]);


    // Get trip seat counts using SQL aggregation for better performance
    const tripIds = bookings.map(booking => booking.trip.id);
    const tripSeatCounts = tripIds.length > 0 ? await prisma.$queryRaw`
      SELECT 
        trip_id,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) as booked,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
      FROM seats 
      WHERE trip_id IN (${tripIds.join("','")})
      GROUP BY trip_id
    ` as Array<{
      trip_id: string
      total: bigint
      booked: bigint
      available: bigint
      reserved: bigint
      blocked: bigint
    }> : [];

    // Create trip seat counts lookup map
    const tripSeatCountsMap = tripSeatCounts.reduce((acc, count) => {
      acc[count.trip_id] = {
        total: Number(count.total),
        booked: Number(count.booked),
        available: Number(count.available),
        reserved: Number(count.reserved),
        blocked: Number(count.blocked)
      };
      return acc;
    }, {} as Record<string, any>);

    // Process bookings to match the required response format
    const formattedBookings = bookings.map(booking => {
      const seatCounts = tripSeatCountsMap[booking.trip.id] || {
        total: 0,
        booked: 0,
        available: 0,
        reserved: 0,
        blocked: 0
      };

      const totalSeats = booking.trip.bus.capacity;
      const occupancyRate = totalSeats > 0 ? Math.round((seatCounts.booked / totalSeats) * 100) : 0;

      return {
        id: booking.trip.id,
        routeId: booking.trip.routeId,
        busId: booking.trip.busId,
        departureTime: booking.trip.departureTime,
        arrivalTime: booking.trip.arrivalTime,
        lastBookingTime: booking.trip.lastBookingTime,
        price: booking.trip.price.toString(),
        status: booking.trip.status,
        titleAr: booking.trip.titleAr,
        titleEn: booking.trip.titleEn,
        descriptionAr: booking.trip.descriptionAr,
        descriptionEn: booking.trip.descriptionEn,
        latitude: booking.trip.latitude.toString(),
        longitude: booking.trip.longitude.toString(),
        images: booking.trip.images,
        createdAt: booking.trip.createdAt,
        updatedAt: booking.trip.updatedAt,
        route: {
          id: booking.trip.route.id,
          departureCityId: booking.trip.route.departureCityId,
          arrivalCityId: booking.trip.route.arrivalCityId,
          distance: booking.trip.route.distance?.toString() || "0",
          departureCity: {
            id: booking.trip.route.departureCity.id,
            name: booking.trip.route.departureCity.name,
            nameAr: booking.trip.route.departureCity.nameAr,
            countryId: booking.trip.route.departureCity.countryId,
            country: {
              id: booking.trip.route.departureCity.country.id,
              name: booking.trip.route.departureCity.country.name,
              nameAr: booking.trip.route.departureCity.country.nameAr,
              code: booking.trip.route.departureCity.country.code
            }
          },
          arrivalCity: {
            id: booking.trip.route.arrivalCity.id,
            name: booking.trip.route.arrivalCity.name,
            nameAr: booking.trip.route.arrivalCity.nameAr,
            countryId: booking.trip.route.arrivalCity.countryId,
            country: {
              id: booking.trip.route.arrivalCity.country.id,
              name: booking.trip.route.arrivalCity.country.name,
              nameAr: booking.trip.route.arrivalCity.country.nameAr,
              code: booking.trip.route.arrivalCity.country.code
            }
          }
        },
        bus: {
          id: booking.trip.bus.id,
          plateNumber: booking.trip.bus.plateNumber,
          model: booking.trip.bus.model,
          capacity: booking.trip.bus.capacity,
          status: booking.trip.bus.status
        },
        seatSummary: {
          total: totalSeats,
          booked: seatCounts.booked,
          available: seatCounts.available,
          reserved: seatCounts.reserved,
          blocked: seatCounts.blocked,
          occupancyRate
        }
      };
    });

    // Fix the logic error - only return error if no bookings found
    if (formattedBookings.length === 0) {
      return ApiResponseBuilder.warning(
        'No bookings found for this user',
        {
          message: 'You have no trip bookings yet',
          suggestion: 'Book a trip to see your reservations here'
        }
      );
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    const response = ApiResponseBuilder.paginated(formattedBookings, pagination, SuccessMessages.RETRIEVED);
    
    // Cache the response
    cache.set(cacheKey, { data: response, timestamp: Date.now() });
    
    // Clean old cache entries (simple cleanup)
    if (cache.size > 100) {
      const now = Date.now();
      const entries = Array.from(cache.entries());
      for (const [key, value] of entries) {
        if (now - value.timestamp > CACHE_TTL) {
          cache.delete(key);
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error('GetMyTrips error:', error);
    throw ApiError.database('Failed to fetch user trips');
  }
})
