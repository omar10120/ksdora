'use client'

import { useState, useEffect, ReactElement } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useSearchParams, useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast' // Add this import


interface TripDetails {
  id: string
  route: {
    departureCity: {
      name: string
      nameAr: string
    }
    arrivalCity: {
      name: string
      nameAr: string
    }
  }
  departureTime: string
  arrivalTime: string
  price: string
  seats: {
    id: string
    seatNumber: string
    status: string
  }[]
}

interface PageParams {
  tripId: string
}

interface BookingPageProps {
  params: PageParams
}

export default function BookingPage({ params }: BookingPageProps): ReactElement {
  const { tripId } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null)
  const selectedSeatNumbers = searchParams.get('seats')?.split(',') || []
  
  const { language, translations } = useLanguage()
  const t = translations.bookings.ConfirmDialog
  
  useEffect(() => {
    fetchTripDetails()
  }, [tripId])

  const fetchTripDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/trips/${tripId}`,
        {
          headers: {
            'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`
          }
        }
      )
      if (!response.ok) throw new Error('Internal server error trip details')
      const data = await response.json()
      setTripDetails(data)
    } catch (err) {
      setError('Failed to load trip details')
      console.error(err)
    }
  }

  const handleBooking = async () => {
    setIsLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Please login to continue')
      }

      const seatIds = tripDetails?.seats
        .filter(seat => selectedSeatNumbers.includes(seat.seatNumber))
        .map(seat => seat.id)

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId,
          seatIds
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed')
      }

      // Show success message
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{t.success.title}</span>
          <span className="text-sm">{t.success.redirect}...</span>
        </div>,
        {
          duration: 3000,
          position: 'top-center',
          className: 'bg-white text-green-800'
        }
      )

      // Wait for toast to be visible before redirecting
      setTimeout(() => {
        router.push('/bookings')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to create booking')
      console.error('Booking error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!tripDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Toaster />
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.title}</h1>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-black">{t.tripDetails.title}</h2>
          <div className="space-y-2 text-gray-600">
            <p>{t.tripDetails.from}: {tripDetails?.route.departureCity.name}</p>
            <p>{t.tripDetails.to}: {tripDetails?.route.arrivalCity.name}</p>
            <p>{t.tripDetails.departure}: {new Date(tripDetails?.departureTime).toLocaleString()}</p>
            <p>{t.tripDetails.arrival}: {new Date(tripDetails?.arrivalTime).toLocaleString()}</p>
            <p>{t.tripDetails.selectedSeats}: {selectedSeatNumbers.join(', ')}</p>
            <p className="text-lg font-semibold text-gray-900">
            {t.tripDetails.totalPrice}: ${Number(tripDetails?.price) * selectedSeatNumbers.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={handleBooking}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? `${t.buttons.processing}...` : `${t.buttons.confirm}`}
          </button>
        </div>  
      </div>
    </div>
  )
}