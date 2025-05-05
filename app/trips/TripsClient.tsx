'use client'

import { useState, useEffect, type ReactElement } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import TripCard from '@/components/TripCard'
import FilterSort from '@/components/FilterSort'
import { Trip } from '@/types'
import { useLanguage } from '@/context/LanguageContext'

interface ApiTrip {
  id: string
  price: string
  departureTime: string
  arrivalTime: string
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
  seats: {
    status: 'available' | 'booked' | 'blocked'
  }[]
}

export default function TripsClient(): ReactElement {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const date = searchParams.get('date')
  const { language, translations } = useLanguage()

  useEffect(() => {
    fetchTrips()
  }, [from, to, date])

  const fetchTrips = async (minPrice?: number, maxPrice?: number, timeRange?: string) => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (from) queryParams.append('from', from)
      if (to) queryParams.append('to', to)
      if (date) queryParams.append('date', date)
      if (minPrice) queryParams.append('minPrice', minPrice.toString())
      if (maxPrice) queryParams.append('maxPrice', maxPrice.toString())
      if (timeRange) queryParams.append('timeRange', timeRange)

      const token = localStorage.getItem('token')
      const url = queryParams.toString() ? `/api/trips?${queryParams.toString()}` : '/api/trips'
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      const trips: ApiTrip[] = data.trips

      const formattedTrips: Trip[] = trips.map(trip => ({
        id: trip.id,
        departureCity: language === 'ar' ? trip.route.departureCity.nameAr : trip.route.departureCity.name,
        destinationCity: language === 'ar' ? trip.route.arrivalCity.nameAr : trip.route.arrivalCity.name,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        price: Number(trip.price),
        availableSeats: trip.seats.filter(seat => seat.status === 'available').length
      }))

      setTrips(formattedTrips)
      setFilteredTrips(formattedTrips)
    } catch (error) {
      console.error('Internal server error trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (sortType: string) => {
    const sorted = [...filteredTrips].sort((a, b) => {
      switch (sortType) {
        case 'price_asc':
          return a.price - b.price
        case 'price_desc':
          return b.price - a.price
        case 'time_asc':
          return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
        case 'time_desc':
          return new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime()
        default:
          return 0
      }
    })
    setFilteredTrips(sorted)
  }

  const handlePriceRange = (min: number, max: number) => {
    const filtered = trips.filter(trip => 
      (min ? trip.price >= min : true) && 
      (max ? trip.price <= max : true)
    )
    setFilteredTrips(filtered)
  }

  const handleTimeRange = (timeRange: string) => {
    const filtered = trips.filter(trip => {
      const hour = new Date(trip.departureTime).getHours()
      switch (timeRange) {
        case 'morning':
          return hour >= 6 && hour < 12
        case 'afternoon':
          return hour >= 12 && hour < 18
        case 'evening':
          return hour >= 18 || hour < 6
        default:
          return true
      }
    })
    setFilteredTrips(filtered)
  }

  return (
    <div className={`min-h-screen bg-gray-50 py-12 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          {/* <h1 className="text-3xl font-bold text-gray-900">Available Trips</h1> */}
          <h1 className="text-3xl font-bold text-gray-900"> {translations.trips.filters.titlePage}</h1>
          <p className="text-gray-600 mt-2">
            {from} to {to} on {date}
          </p>
        </div>

        <FilterSort
          onSortChange={handleSort}
          onPriceRangeChange={handlePriceRange}
          onTimeRangeChange={handleTimeRange}
        />

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading trips...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onSelect={(tripId) => router.push(`/trips/${tripId}/seats`)}
                />
              ))}
            </div>

            {filteredTrips.length === 0 && (
              <div className="text-center py-12">
                {/* <p className="text-gray-600">No trips found for your search criteria.</p> */}
                <p className="text-gray-600">{translations.trips.filters.NoTrips}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}