'use client'

import { useState, useEffect, ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import Seat from '@/components/Seat'

import { useLanguage } from '@/context/LanguageContext'

interface SeatData {
  id: string
  seatNumber: string
  status: 'available' | 'booked' | 'blocked'
}

interface TripData {
  id: string
  price: string
  seats: SeatData[]
}

interface PageParams {
  tripId: string;
}

interface SeatsPageProps {
  params: PageParams;
}

export default function SeatsPage({ params }: SeatsPageProps): ReactElement {
  const { tripId } = params
  const router = useRouter()
  const { language, translations } = useLanguage()
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [tripData, setTripData] = useState<TripData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTripSeats()
  }, [tripId])

  const fetchTripSeats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/trips/${tripId}`,{
        headers: {
          'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Internal server error trip data')
      }
      const data = await response.json()
      setTripData(data)
    } catch (err) {
      setError('Failed to load seats. Please try again.')
      console.error('Error fetching seats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center gap-2 justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen flex items-center gap-2 justify-center">
        <div className="text-red-600">{error || translations.trips.seats.errors.loadFailed}</div>
      </div>
    )
  }

  const handleSeatSelect = (seatNumber: string) => {
    setSelectedSeats(prev => 
      prev.includes(seatNumber)
        ? prev.filter(num => num !== seatNumber)
        : [...prev, seatNumber]
    )
  }

  const handleContinue = () => {
    setLoadingProgress(true);
    if (selectedSeats.length > 0) {
      router.push(`/trips/${tripId}/booking?seats=${selectedSeats.join(',')}`)

    }

    // setLoadingProgress(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center gap-2 justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen flex items-center gap-2 justify-center">
        <div className="text-red-600">{error || 'Failed to load seats'}</div>
      </div>
    )
  }

return (
    <div className={`min-h-screen bg-gray-50 py-12 text-black ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {translations.trips.seats.title}
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-8  flex w-full justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-4 justify-items-start ">
                <div className="flex items-center gap-2 ">
                  <div className="w-6 h-6 bg-white border border-gray-300 rounded"></div>
                  <span className="ml-2">{translations.trips.seats.legend.available}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded"></div>
                  <span className="ml-2">{translations.trips.seats.legend.selected}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  <span className="ml-2">{translations.trips.seats.legend.booked}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-300 rounded"></div>
                  <span className="ml-2">{translations.trips.seats.legend.blocked}</span>
                </div>
              </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-8">
            {tripData.seats.map((seat) => (
              <Seat
                key={seat.id}
                number={seat.seatNumber}
                isBooked={seat.status === 'booked' }
                isBlocked={seat.status === 'blocked'}
                isSelected={selectedSeats.includes(seat.seatNumber)}
                onSelect={handleSeatSelect}
              />
            ))}
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-gray-600">
                  {translations.trips.seats.selectedSeats}: {selectedSeats.join(', ')}
                </p>
                <p className="text-gray-600">
                  {translations.trips.seats.totalPrice}: ${selectedSeats.length * Number(tripData.price)}
                </p>
              </div>
              <button
                onClick={handleContinue}
                disabled={selectedSeats.length === 0 || loadingProgress}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loadingProgress? 
                    translations.trips.seats.button.progress
                :
                  translations.trips.seats.button.continue
                }
                
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}