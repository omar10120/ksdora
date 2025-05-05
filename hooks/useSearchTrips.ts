import { useState, useEffect } from 'react'

interface City {
  id: string
  name: string
}

interface Route {
  departureCity: City
  arrivalCity: City
}

export const useSearchTrips = () => {
  const [departureCities, setDepartureCities] = useState<City[]>([])
  const [arrivalCities, setArrivalCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch all routes to get unique cities
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('/api/routes')
        const data = await response.json()
        
        // Extract unique cities
        const uniqueDepartureCities = new Map<string, City>()
        const uniqueArrivalCities = new Map<string, City>()

        data.forEach((route: Route) => {
          uniqueDepartureCities.set(route.departureCity.id, route.departureCity)
          uniqueArrivalCities.set(route.arrivalCity.id, route.arrivalCity)
        })

        setDepartureCities(Array.from(uniqueDepartureCities.values()))
        setArrivalCities(Array.from(uniqueArrivalCities.values()))
      } catch (err) {
        setError('Internal server error cities')
      }
    }

    fetchRoutes()
  }, [])

  const searchTrips = async (from: string, to: string, date: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/trips?from=${from}&to=${to}&date=${date}`
      )
      const data = await response.json()
      return data
    } catch (err) {
      setError('Internal server error trips')
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    departureCities,
    arrivalCities,
    loading,
    error,
    searchTrips
  }
}