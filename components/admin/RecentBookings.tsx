'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
// import { transcode } from 'buffer'
interface Booking {
  id: string
  user: {
    name: string
    email: string
  }
  trip: {
    route: {
      departureCity: { name: string }
      arrivalCity: { name: string }
    }
    departureTime: string
  }
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled'
}

export default function RecentBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const { language, translations } = useLanguage()


  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/admin/stats', {
          headers: {
            'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`
          },
        })
        const data = await response.json()
        setBookings(data.recentBookings || [])
      } catch (error) {
        console.error('Error fetching recent bookings:', error)
      }
    }

    fetchRecentBookings()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6" >
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{translations.dashboard.home.recentBookings.title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" dir='ltr'>
          <thead className="bg-gray-50" >
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {translations.dashboard.home.recentBookings.columns.customer}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {translations.dashboard.home.recentBookings.columns.route}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {translations.dashboard.home.recentBookings.columns.date}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {translations.dashboard.home.recentBookings.columns.amount}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {translations.dashboard.home.recentBookings.columns.status}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{booking.user.name}</div>
                  <div className="text-sm text-gray-500">{booking.user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.trip.route.departureCity.name} → {booking.trip.route.arrivalCity.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(booking.trip.departureTime).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${booking.totalPrice}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}