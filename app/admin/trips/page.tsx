'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'

interface Trip {
  id: string
  routeId: string
  busId: string
  departureTime: string
  arrivalTime: string
  price: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  route: {
    departureCity: { name: string }
    arrivalCity: { name: string }
  }
  bus: {
    plateNumber: string
    capacity: number
  }
}

export default function TripsPage() {
  const { language, translations } = useLanguage()
  const t = translations.dashboard.trips
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')  
  const router = useRouter()

  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/trips`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setTrips(data)
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm(t.delete.confirm)) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setTrips(trips.filter(trip => trip.id !== tripId))
        alert(t.delete.success)
      } else {
        const error = await response.json()
        alert(error.message || t.delete.error)
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert(t.delete.error)
    }
  }

  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredTrips = trips.filter(trip => 
    trip.route.departureCity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.route.arrivalCity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.bus.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between max-sm:flex-col items-center mb-6 text-black">
        <h1 className="text-2xl font-semibold text-gray-800 max-sm:w-full">{t.title}</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t.search.placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 max-sm:w-full"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          <button
            disabled={loadingProgress}
            onClick=
            {() => {
                router.push('/admin/trips/new')
                setLoadingProgress(true)
              }}
            
            className="flex items-center space-x-2 px-4 max-sm:px-2 py-2 max-sm:py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-5 w-5" />
            <span>
              {loadingProgress ? t.processing: t.addButton}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-scroll">
        <table className="min-w-full divide-y divide-gray-200" dir="ltr">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.route}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.bus}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.schedule}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.price}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.status}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.actions}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTrips.map((trip) => (
              <tr key={trip.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {trip.route.departureCity.name} → {trip.route.arrivalCity.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{trip.bus.plateNumber}</div>
                  <div className="text-sm text-gray-500">{t.columns.capacity}: {trip.bus.capacity}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(trip.departureTime).toLocaleString(language === 'ar' ? 'en-US' : 'en-US')}
                  </div>
                  <div className="text-sm text-gray-500">
                    to {new Date(trip.arrivalTime).toLocaleString(language === 'ar' ? 'en-US' : 'en-US')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${trip.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(trip.status)}`}>
                    {t.status[trip.status]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {t.status[trip.status]!= 'Completed' &&(
                    <>
                        <button
                          onClick={() => router.push(`/admin/trips/${trip.id}/edit`)}
                          className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                          >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="text-red-600 hover:text-red-900 ml-4 cursor-pointer"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}