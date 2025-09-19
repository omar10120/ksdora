import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import  { ErrorMessages, StatusCodes, SuccessMessages  ,ApiResponseBuilder} from './lib/apiResponse'

export async function middleware(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required ' }, { status: StatusCodes.UNAUTHORIZED })
  }

  const token = authHeader.split(' ')[1]

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.userId as string
    const role = payload.role as string

    // Check for admin routes and role
    if (request.nextUrl.pathname.startsWith('/api/admin') && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: StatusCodes.FORBIDDEN })
    }

    

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('userId', userId)
    requestHeaders.set('userRole', role)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    

    
    return ApiResponseBuilder.unauthorized(
      ErrorMessages.INVALID_TOKEN
    )
  }
}

export const config = {
  matcher: [
    // '/api/bookings',
    '/api/bookings/:path*',
    '/api/buses/:path*',
    '/api/cities/:path*',
    '/api/routes/:path*',
    // '/api/trips/:path*',
    '/api/admin/:path*',
    '/api/admin/'
  ]
}
