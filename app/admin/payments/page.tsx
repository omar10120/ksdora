'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { 
  EyeIcon, 
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import ConfirmDialogAdmin from '@/components/ConfirmDialogAdmin'
import { useLanguage } from '@/context/LanguageContext'

// Payment interface to match the API response
interface Payment {
  id: string
  billId: string
  amount: string | number
  method: 'cash' | 'online_payment'
  status: 'pending' | 'successful' | 'failed'
  transactionId?: string
  receiptImage?: string
  paidAt?: string
  createdAt: string
  bill: {
    id: string
    amount: string | number
    status: 'paid' | 'unpaid'
    booking: {
      id: string
      userId: string
      status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
      totalPrice: string | number
      user: {
        name: string
        email: string
        phone: string
      }
      trip: {
        id: string
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
    }
  }
}

export default function PaymentsPage() {
  const router = useRouter()
  const { language, translations } = useLanguage()
  const t = translations.dashboard.bookings // Reusing booking translations for now
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [paymentToAction, setPaymentToAction] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'confirm' | 'reject' | null>(null)

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (Array.isArray(data.data)) {
        setPayments(data.data)
      } else {
        console.error('Invalid payments response:', data)
        setPayments([])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments')
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const handleConfirmClick = (paymentId: string) => {
    setPaymentToAction(paymentId)
    setActionType('confirm')
    setIsConfirmDialogOpen(true)
  }

  const handleRejectClick = (paymentId: string) => {
    setPaymentToAction(paymentId)
    setActionType('reject')
    setIsRejectDialogOpen(true)
  }

  const handleConfirmPayment = async () => {
    if (!paymentToAction) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/payments/${paymentToAction}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to confirm payment')
      }

      setPayments(payments.map(payment => 
        payment.id === paymentToAction 
          ? { ...payment, status: 'successful' }
          : payment
      ))
      toast.success('Payment confirmed successfully')
    } catch (error: any) {
      console.error('Confirmation error:', error)
      toast.error(error.message || 'Failed to confirm payment')
    } finally {
      setPaymentToAction(null)
      setActionType(null)
      setIsConfirmDialogOpen(false)
    }
  }

  const handleRejectPayment = async () => {
    if (!paymentToAction) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/payments/${paymentToAction}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to reject payment')
      }

      setPayments(payments.map(payment => 
        payment.id === paymentToAction 
          ? { ...payment, status: 'failed' }
          : payment
      ))
      toast.success('Payment rejected successfully')
    } catch (error: any) {
      console.error('Rejection error:', error)
      toast.error(error.message || 'Failed to reject payment')
    } finally {
      setPaymentToAction(null)
      setActionType(null)
      setIsRejectDialogOpen(false)
    }
  }

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'successful': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodColor = (method: Payment['method']) => {
    switch (method) {
      case 'cash': return 'bg-blue-100 text-blue-800'
      case 'online_payment': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPayments = payments.filter(payment => 
    payment.bill.booking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.bill.booking.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.bill.booking.trip.route.departureCity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.bill.booking.trip.route.arrivalCity.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={`min-h-screen bg-gray-50 p-4 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <Toaster />
      
      {/* Confirm Payment Dialog */}
      <ConfirmDialogAdmin
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmPayment}
        title="Confirm Payment"
        message="Are you sure you want to confirm this payment? This will update the booking status and bill status."
        confirmText="Confirm"
        cancelText="Cancel"
      />

      {/* Reject Payment Dialog */}
      <ConfirmDialogAdmin
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleRejectPayment}
        title="Reject Payment"
        message="Are you sure you want to reject this payment? This will mark the payment as failed."
        confirmText="Reject"
        cancelText="Cancel"
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-black"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" dir="ltr">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.bill.booking.user.name}</div>
                      <div className="text-sm text-gray-500">{payment.bill.booking.user.email}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.bill.booking.trip.route.departureCity.name} → {payment.bill.booking.trip.route.arrivalCity.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(payment.bill.booking.trip.departureTime).toLocaleString()}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMethodColor(payment.method)}`}>
                        {payment.method === 'cash' ? 'Cash' : 'Online Payment'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.amount} SAR
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status === 'successful' ? 'Successful' : 
                         payment.status === 'failed' ? 'Failed' : 'Pending'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.receiptImage ? (
                        <button
                          onClick={() => window.open(payment.receiptImage, '_blank')}
                          className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded-full transition-all cursor-pointer"
                          title="View Receipt"
                        >
                          <PhotoIcon className="h-5 w-5" />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No receipt</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleConfirmClick(payment.id)}
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded-full transition-all cursor-pointer"
                              title="Confirm Payment"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleRejectClick(payment.id)}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full transition-all cursor-pointer"
                              title="Reject Payment"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {payment.status !== 'pending' && (
                          <span className="text-gray-400 text-sm">
                            {payment.status === 'successful' ? 'Confirmed' : 'Rejected'}
                          </span>
                        )}
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

        {!loading && filteredPayments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No payments found</p>
          </div>
        )}
      </div>
    </div>
  )
}
