import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'

interface Props {
  isOpen: boolean
  onClose: () => void
  booking: {
    user: {
      name: string
      email: string
      phone: string
    }
  } | null
}

export default function BookingDetailsDialog({ isOpen, onClose, booking }: Props) {
  const { language, translations } = useLanguage()
  const t = translations.dashboard.bookingDetails

  if (!booking) return null

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full max-w-md transform overflow-scroll rounded-2xl bg-white p-6 shadow-xl transition-all ${language === 'ar' ? 'rtl' : 'ltr'}`}>
                <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  {t.title}
                </Dialog.Title>

                <div className="mt-4">
                  <div className="flex items-center justify-center mb-6">
                    <UserCircleIcon className="h-20 w-20 text-gray-400" />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t.labels.name}</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{booking.user.name}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t.labels.email}</label>
                      <p className="mt-1 text-lg text-gray-900" dir="ltr">{booking.user.email}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t.labels.phone}</label>
                      <p className="mt-1 text-lg text-gray-900" dir="ltr">{booking.user.phone}</p>
                    </div>
                  </div>
                </div>

                <div className={`mt-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    {t.buttons.close}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}