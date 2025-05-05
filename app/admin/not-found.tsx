'use client'
import Link from 'next/link'
import { HomeIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'

export default function AdminNotFound() {
  const { language, translations } = useLanguage()
  const t = translations.errors.notFound

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="flex justify-center">
          <div className="relative">
            <div className="text-[150px] font-bold text-gray-900/10">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl font-bold text-gray-900">404</div>
            </div>
          </div>
        </div>
        
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">
          {t.title}
        </h2>
        <p className="mt-2 text-gray-600">
          {t.message}
        </p>

        <Link 
          href="/admin"
          className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
        >
          <HomeIcon className="h-5 w-5 mr-2" />
          {t.backToHome}
        </Link>
      </div>
    </div>
  )
}