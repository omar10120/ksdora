'use client'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

interface Trip {
  id: string
  departureTime: string
  arrivalTime: string
  price: number
  route: {
    departureCity: { name: string }
    arrivalCity: { name: string }
  }
}

export default function SearchResults() {
  const { translations } = useLanguage()
  const [trips, setTrips] = useState<Trip[]>([])

  useEffect(() => {
    const searchResults = localStorage.getItem('searchResults')
    if (searchResults) {
      setTrips(JSON.parse(searchResults))
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{translations.search.results}</h1>
      
      <div className="space-y-4">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">
                  {trip.route.departureCity.name} → {trip.route.arrivalCity.name}
                </p>
                <p className="text-gray-600">
                  {new Date(trip.departureTime).toLocaleString()} - 
                  {new Date(trip.arrivalTime).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">${trip.price}</p>
                <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  {translations.search.book}
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {trips.length === 0 && (
          <p className="text-center text-gray-600">{translations.search.noResults}</p>
        )}
      </div>
    </div>
  )
}