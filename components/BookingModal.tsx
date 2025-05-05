'use client'

import { useLanguage } from '@/context/LanguageContext'

interface Booking {
  id: string
  from: string
  to: string
  date: string
  seats: string[]
  price: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'  // Updated to match page's interface
}

interface BookingModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
  onCancelBooking: (id: string) => void
}
const BookingModal = ({ booking, isOpen, onClose, onCancelBooking }: BookingModalProps) => {
  const { language, translations } = useLanguage()

  if (!isOpen || !booking) return null  

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in text-black">
      <div className={`bg-white rounded-2xl w-full max-w-2xl mx-4 overflow-hidden shadow-xl transform transition-all animate-slide-up ${language === 'ar' ? 'rtl' : 'ltr'}`}>
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold">{translations.bookings.modal.title}</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div>
                <p className="text-sm text-gray-500">{translations.bookings.modal.from}</p>
                <p className="font-semibold">{booking.from}</p>
              </div>
              <div className="flex-1 px-4">
                <div className="border-t-2 border-dashed border-gray-300 relative">
                  <div className={`absolute -top-2 ${language === 'ar' ? 'left-0 -rotate-45' : 'right-0 rotate-45'} transform translate-x-1/2`}>→</div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">{translations.bookings.modal.to}</p>
                <p className="font-semibold">{booking.to}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">{translations.bookings.modal.travelDate}</h4>
              <p className="text-lg">{new Date(booking.date).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">{translations.bookings.bookingCard.price}</h4>
              <p className="text-lg ">${booking.price}</p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">{translations.bookings.modal.selectedSeats}</h4>
            <div className="flex gap-2">
              {booking.seats.map((seat) => (
                <span key={seat} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                  {seat}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={`bg-gray-50 px-6 py-4 flex ${language === 'ar' ? 'flex-row-reverse' : ''} justify-end gap-4`}>
          {booking.status === 'confirmed' && (
            <button 
              onClick={() => onCancelBooking(booking.id)}
              className="px-4 py-2 text-red-600 hover:text-red-800 font-medium transition-colors"
            >
              {translations.bookings.bookingCard.cancelBooking}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {translations.bookings.modal.close}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingModal