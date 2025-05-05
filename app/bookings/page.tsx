'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import BookingModal from '@/components/BookingModal'
import ConfirmDialog from '@/components/ConfirmDialog'
import ProtectedRoute from "@/components/ProtectedRoute"
import UserOnlyGuard from '@/components/UserOnlyGuard'


interface Booking {
  id: string
  from: string
  to: string
  date: string
  seats: string[]
  price: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'  // Added 'pending' status
}

  interface ApiBooking {
  id: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  bookingDate: string
  totalPrice: string
  trip: {
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
  }
  details: {
    seat: {
      seatNumber: string
      status: string
    }
  }[]
}

export default function BookingsPage() {
  const router = useRouter()
  const { language, translations } = useLanguage()
  const { isAuthenticated,user, checkAuth  } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)


  const [value1 , setvalue1 ] = useState('')
  const [value2 , setvalue2 ] = useState('')
  const [valueint2 , setvalueint2 ] = useState('')
  useEffect(() => {
    if (!checkAuth()) {
      router.push('/auth/login')
      return
    }
 
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/auth/login')
        return
      }
    

      
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Internal server error bookings')
      }

      const apiBookings: ApiBooking[] = await response.json()

      const formattedBookings: Booking[] = apiBookings.map(booking => ({
        id: booking.id,
        from: language === 'ar' ? booking.trip.route.departureCity.nameAr : booking.trip.route.departureCity.name,
        to: language === 'ar' ? booking.trip.route.arrivalCity.nameAr : booking.trip.route.arrivalCity.name,
        date: booking.trip.departureTime,
        seats: booking.details.map(detail => detail.seat.seatNumber),
        price: Number(booking.totalPrice),
        status: booking.status
      }))

      setBookings(formattedBookings)
    } catch (error) {
      console.error('Internal server error bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'cancelled'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to cancel booking')
      }

      // Refresh bookings after cancellation
      await fetchBookings()
      setIsConfirmDialogOpen(false)
    } catch (error) {
      console.error('Failed to cancel booking:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const Content = () => (
      <div className={`min-h-screen bg-gray-50 py-12 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {translations.bookings.title}
          
        </h1>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {translations.bookings.noBookings.title}
            </h2>
            <p className="text-gray-600 mb-6">
              {translations.bookings.noBookings.description}
            </p>
            <button
              onClick={() => router.push('/trips')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {translations.bookings.noBookings.cta}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-black">
            {bookings.map(booking => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  {/* <div>
                    <p className="text-sm text-gray-500">
                      {translations.bookings.bookingCard.bookingId}
                    </p>
                    <p className="font-mono font-bold">{booking.id}</p>
                  </div> */}
                  
                  <span className={`px-3 py-1 rounded-full text-sm font-medium  ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800 ' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' 
                    :
           
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {translations.bookings.status[booking.status]}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-gray-600">{booking.from} → {booking.to}</p>
                  <p className="text-gray-600">
                    {new Date(booking.date).toLocaleString()}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      setSelectedBooking(booking)
                      setIsModalOpen(true)
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {translations.bookings.bookingCard.viewDetails}
                  </button>
                  {(booking.status === 'confirmed' || booking.status === 'pending') && (
                    <button
                      onClick={() => {
                        setSelectedBooking(booking)
                        setIsConfirmDialogOpen(true)
                      }}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      {translations.bookings.bookingCard.cancelBooking}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BookingModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCancelBooking={(id) => {
          setIsModalOpen(false)
          setSelectedBooking(null)
          handleCancelBooking(id)
        }}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={() => selectedBooking && handleCancelBooking(selectedBooking.id)}
        title={selectedBooking?.id || ''}
        message={translations.bookings.confirmCancel.message}
      />
    </div>
  )
  return (
    <UserOnlyGuard>
      <ProtectedRoute>
        <Content />
      </ProtectedRoute>
    </UserOnlyGuard>
  )
}