'use client'

import { useLanguage } from '@/context/LanguageContext'


interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }: ConfirmDialogProps) => {
  const { language, translations } = useLanguage()
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className={`bg-white rounded-xl w-full max-w-md mx-4 overflow-hidden shadow-xl animate-fade-in ${language === 'ar' ? 'rtl' : 'ltr'}`}>
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-center mb-2 text-black">{translations.bookings.confirmCancel.title}</h3>
          <p className="text-gray-600 text-center mb-6">
            {translations.bookings.confirmCancel.message}
          </p>
          <div className={`flex justify-end gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              {translations.bookings.confirmCancel.cancel}
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {translations.bookings.confirmCancel.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog