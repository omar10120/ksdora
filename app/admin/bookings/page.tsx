'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { 
  EyeIcon, 
  TrashIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  ArrowPathRoundedSquareIcon
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
  createdAt : Date
  updatedAt : Date
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
  bill?: {
    id: string
    amount: string | number
    status: 'paid' | 'unpaid'
    payments: {
      id: string
      amount: string | number
      method: string
      status: 'pending' | 'successful' | 'failed'
      receiptImage?: string
      paidAt?: string
      createdAt: string
    }[]
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
  const token = localStorage.getItem('token')
  const fetchBookings = async () => {
    try {
      
      const response = await fetch('/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (Array.isArray(data.data)) {
        setBookings(data.data)
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

  // Add new state for confirm and cancel dialogs
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [bookingToAction, setBookingToAction] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'confirm' | 'cancel' | null>(null)
  
  // Handle confirm click
  const handleConfirmClick = (bookingId: string) => {
    setBookingToAction(bookingId)
    setActionType('confirm')
    setIsConfirmDialogOpen(true)
  }

  // Handle cancel click
  const handleCancelClick = (bookingId: string) => {
    setBookingToAction(bookingId)
    setActionType('cancel')
    setIsCancelDialogOpen(true)
  }
  
  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!bookingToAction) return
  
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/bookings/${bookingToAction}`, {
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
  
      // Refetch bookings to get updated bill status
      await fetchBookings()
      toast.success('Booking confirmed successfully')
    } catch (error: any) {
      console.error('Confirmation error:', error)
      toast.error(error.message || 'Failed to confirm booking')
    } finally {
      setBookingToAction(null)
      setActionType(null)
      setIsConfirmDialogOpen(false)
    }
  }

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!bookingToAction) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/bookings/${bookingToAction}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      })

      if (!response.ok) {
        throw new Error('Failed to cancel booking')
      }

      setBookings(bookings.map(booking => 
        booking.id === bookingToAction 
          ? { ...booking, status: 'cancelled' }
          : booking
      ))
      toast.success('Booking cancelled successfully')
    } catch (error: any) {
      console.error('Cancellation error:', error)
      toast.error(error.message || 'Failed to cancel booking')
    } finally {
      setBookingToAction(null)
      setActionType(null)
      setIsCancelDialogOpen(false)
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

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'unpaid': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'successful': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
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
      {/* Confirm Booking Dialog */}
      <ConfirmDialogAdmin
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmBooking}
        title="Confirm Booking"
        message="Are you sure you want to confirm this booking? This will update the booking status and bill status."
        confirmText="Confirm"
        cancelText="Cancel"
      />

      {/* Cancel Booking Dialog */}
      <ConfirmDialogAdmin
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleCancelBooking}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This will free up the seats and update the bill status."
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
             <button
              onClick={() => fetchBookings()}
              className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
            >
              <span> refresh</span>
              </button>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
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
                    Bill Status
                  </th>
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.columns.amount}
                  </th>
             
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"> 
                    {t.columns.createdAt}
                  </th>
                  {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"> 
                    {t.columns.updatedAt}
                  </th> */}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
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
                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-gray-50 z-10">
                      <div className="text-sm text-gray-900">{booking.user.name}</div>
                      <div className="text-sm text-gray-500">{booking.user.email}</div>
                    </td>     
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {/* {booking.details?.map(detail => detail.seat.seatNumber).join(', ') || '-'} */}
                      {booking.details.length}

                        
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.bill ? (
                        <div className="space-y-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBillStatusColor(booking.bill.status)}`}>
                            {booking.bill.status === 'paid' ? 'Paid' : 'Unpaid'}
                          </span>
                          {booking.bill.payments && booking.bill.payments.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {booking.bill.payments.filter(p => p.status === 'pending').length > 0 && (
                                <span className="text-yellow-600">
                                  {booking.bill.payments.filter(p => p.status === 'pending').length} pending
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No bill</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.totalPrice} SAR
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.createdAt.toString()} 
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.updatedAt.toString()}   
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white z-10">
                      <div className="flex justify-end gap-3">
                        {(booking.status === 'pending' || (booking.status === 'confirmed' && booking.bill?.status !== 'paid')) && (
                          <>
                            {/* Show confirm button for cash payments (pending or confirmed with unpaid bill) */}
                            {booking.bill?.payments?.some(p => p.method === 'cash') && (
                              <button
                                onClick={() => handleConfirmClick(booking.id)}
                                className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded-full transition-all cursor-pointer"
                                title={booking.status === 'pending' ? "Confirm Booking (Cash Payment)" : "Mark Bill as Paid"}
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                            )}
                            {/* Show message for online payments */}
                            {booking.bill?.payments?.some(p => p.method === 'online_payment') && !booking.bill?.payments?.some(p => p.method === 'cash') && (
                              <span className="text-blue-600 text-xs px-2 py-1 bg-blue-50 rounded-full">
                                Confirm via Payments
                              </span>
                            )}
                            <button
                              onClick={() => handleCancelClick(booking.id)}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full transition-all cursor-pointer"
                              title="Cancel Booking"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && booking.bill?.status === 'paid' && (
                          <span className="text-green-600 text-sm font-medium">Confirmed & Paid</span>
                        )}
                        {booking.status === 'cancelled' && (
                          <span className="text-gray-400 text-sm">Cancelled</span>
                        )}
                        {booking.status === 'completed' && (
                          <span className="text-gray-400 text-sm">Completed</span>
                        )}
                        <button
                          onClick={() => handleDeleteClick(booking.id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full transition-all cursor-pointer"
                          title="Delete Booking"
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