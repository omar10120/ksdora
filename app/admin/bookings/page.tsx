'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { 
  EyeIcon, 
  TrashIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'
import ConfirmDialogAdmin from '@/components/ConfirmDialogAdmin'
import { useLanguage } from '@/context/LanguageContext'

// First, update the Booking interface to match the API response
interface Booking {
  id: string
  userId: string
  tripId: string
  bookingDate: string
  status: 'confirmed' | 'completed' | 'cancelled' | 'pending'
  totalPrice: string | number
  details: {
    id: string
    bookingId: string
    seatId: string
    price: string
    seat: {
      id: string
      tripId: string
      seatNumber: string
      status: string
    }
  }[]
  user: {
    name: string
    email: string
    phone: string
  }
  trip: {
    id: string
    departureTime: string
    arrivalTime: string
    departureCity: string
    arrivalCity: string
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
}

export default function BookingsPage() {
  const router = useRouter()
  const { language, translations } = useLanguage()
  const t = translations.dashboard.bookings
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null)

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (Array.isArray(data)) {
        setBookings(data)
      } else {
        console.error('Invalid bookings response:', data)
        setBookings([])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error(t.errors.loadFailed)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  // Add new state for confirm dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [bookingToConfirm, setBookingToConfirm] = useState<string | null>(null)
  
  // Modify the handleConfirmBooking to open dialog first
  const handleConfirmClick = (bookingId: string) => {
    setBookingToConfirm(bookingId)
    setIsConfirmDialogOpen(true)
  }
  
  // Move the actual confirmation logic to a new function
  const handleConfirmBooking = async () => {
    if (!bookingToConfirm) return
  
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/bookings/${bookingToConfirm}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'confirmed' })
      })
  
      if (!response.ok) {
        throw new Error(t.confirm.error)
      }
  
      setBookings(bookings.map(booking => 
        booking.id === bookingToConfirm 
          ? { ...booking, status: 'confirmed' }
          : booking
      ))
      toast.success(t.toastMsg.success)
    } catch (error: any) {
      console.error('Confirmation error:', error)
      toast.error(error.message || 'Failed to confirm booking')
    } finally {
      setBookingToConfirm(null)
      setIsConfirmDialogOpen(false)
    }
  }

  const handleDeleteClick = (bookingId: string) => {
    setBookingToDelete(bookingId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/bookings/${bookingToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(t.delete.error)
      }

      setBookings(bookings.filter(booking => booking.id !== bookingToDelete))
      toast.success(t.delete.success)
    } catch (error: any) {
      toast.error(error.message || t.delete.error)
    } finally {
      setBookingToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBookings = bookings.filter(booking => 
    booking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={`min-h-screen bg-gray-50 p-4 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <Toaster />
      <ConfirmDialogAdmin
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteBooking}
        title={t.delete.title}
        message={t.delete.message}
        confirmText={t.delete.confirm}
        cancelText={t.delete.cancel}
      />
      <ConfirmDialogAdmin
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmBooking}
        title={t.confirm.title}
        message={t.confirm.message}
        confirmText={t.confirm.confirm}
        cancelText={t.confirm.cancel}
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder={t.search.placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-black"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            
            <button
              onClick={() => router.push('/admin/bookings/block')}
              className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
            >
              <span>{t.blockSeats.title}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" dir="ltr">
              <thead className="bg-gray-50">
                <tr>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.columns.bookingId}
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.columns.customer}
                  </th>
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.columns.seats}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.columns.route}
                  </th>
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.columns.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.columns.amount}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.columns.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.id}
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.user.name}</div>
                      <div className="text-sm text-gray-500">{booking.user.email}</div>
                    </td>     
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.details?.map(detail => detail.seat.seatNumber).join(', ') || '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.trip.route.departureCity.name} → {booking.trip.route.arrivalCity.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(booking.trip.departureTime).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {t.status[booking.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.totalPrice} SAR
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        {/* <button
                          onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded-full transition-all"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button> */}
                      {/* {booking.status === 'pending' && ( */}

                          <button
                            onClick={() => handleConfirmClick(booking.id)}
                            className="group relative inline-flex items-center justify-center p-2 bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 rounded-lg transition-all duration-200 cursor-pointer"
                            disabled={booking.status === 'confirmed' || booking.status === 'cancelled'}
                            title= {booking.status === 'confirmed' ?     
                              t.statusAction.alreadConfiremd   : 
                              booking.status === 'cancelled' ? t.statusAction.cancelled : 
                              t.statusAction.confirm
                              }
                          >
                            <ArrowLeftIcon className="h-5 w-5" />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                              {booking.status === 'confirmed' ?     
                              t.statusAction.alreadConfiremd  : 
                              booking.status === 'cancelled' ? t.statusAction.cancelled : 
                              t.statusAction.confirm
                              }
                            </span>
                          </button>
                        {/* )} */}
                        <button
                          onClick={() => handleDeleteClick(booking.id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full transition-all cursor-pointer"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {!loading && filteredBookings.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">{t.search.noResults}</p>
          </div>
        )}
      </div>
    </div>
  )
}