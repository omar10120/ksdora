'use client'

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import type { ReactElement } from 'react'

interface PageParams {
  bookingRef: string;
}

interface BookingConfirmationPageProps {
  params: Promise<PageParams>;
}

async function BookingConfirmationPage({ 
  params 
}: BookingConfirmationPageProps): Promise<ReactElement> {
  const { bookingRef } = await params
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success')

  useEffect(() => {
    if (!isSuccess) {
      router.replace('/')
    }
  }, [isSuccess, router])

  return (
    
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your booking reference number is: <span className="font-mono font-bold">{bookingRef}</span>
          </p>
          <p className="text-gray-600 mb-8">
            We have sent the booking details to your email address.
          </p>

          <div className="space-x-4">
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Book Another Trip
            </Link>
            <Link
              href={`/bookings/${bookingRef}`}
              className="inline-block bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              View Booking Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmationPage