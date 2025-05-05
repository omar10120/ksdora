'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { 
  HomeIcon, 
  TicketIcon, 
  MapIcon, 
  BookmarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  LanguageIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

export default function Navbar() {
  const { language, translations, toggleLanguage } = useLanguage()
  const { isAuthenticated, user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  


  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
              <MapIcon className="h-8 w-8" />
              <span>{translations.brand}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
              {/* Add Dashboard Link for Admin */}
              {/* {isAuthenticated && user?.role === 'ADMIN' && (
              <>  
                <Link
                    href="/admin"
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
                    <span>{translations.nav.dashboard}</span>
                  </Link>
              </>
             )} */}
              {isAuthenticated && user?.role === 'USER' && (
                <Link href="/" className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  <HomeIcon className="h-5 w-5" />
                  <span>{translations.nav.home}</span>
                </Link>
              )}
           {isAuthenticated && user?.role == 'USER' && (
            <>
              <Link 
                href={isAuthenticated ? "/book-seat" : "/auth/login"}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <TicketIcon className="h-5 w-5" />
                <span>{translations.nav.bookSeat}</span>
              </Link>
              <Link 
                href={isAuthenticated ? "/trips" : "/auth/login"}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <MapIcon className="h-5 w-5" />
                <span>{translations.nav.trips}</span>
              </Link>
              <Link 
                href={isAuthenticated ? "/bookings" : "/auth/login"}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <BookmarkIcon className="h-5 w-5" />
                <span>{translations.nav.myBookings}</span>
              </Link>
            </>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            >
              <LanguageIcon className="h-5 w-5" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-2 text-gray-600 bg-gray-50 rounded-lg">
                  <UserCircleIcon className="h-5 w-5" />
                  <span>{user?.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>{language === 'en' ? 'Logout' : 'تسجيل خروج'}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>{language === 'en' ? 'Sign In' : 'تسجيل دخول'}</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          {(isAuthenticated || !isAuthenticated ) && user?.role != 'ADMIN' && (
              <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" />
                )}
              </button>
            </div>
          )}
      
        </div>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden fixed inset-x-0 top-16 bg-white shadow-lg transition-all duration-300 ease-in-out ${
            isMenuOpen 
              ? 'opacity-100 translate-y-0 visible' 
              : 'opacity-0 -translate-y-2 invisible'
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* {isAuthenticated && user?.role === 'ADMIN' && (
          <Link
              href="/"
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => setIsMenuOpen(false)}
            >
              <HomeIcon className="h-5 w-5" />
              <span>{translations.nav.dashboard}</span>
            </Link>
          )} */}
          
          {isAuthenticated && user?.role === 'USER' && (
          <> 
            <Link
              href="/"
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => setIsMenuOpen(false)}
            >
              <HomeIcon className="h-5 w-5" />
              <span>{translations.nav.home}</span>
            </Link>
            <Link
              href={isAuthenticated ? "/book-seat" : "/auth/login"}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => setIsMenuOpen(false)}
            >
              <TicketIcon className="h-5 w-5" />
              <span>{translations.nav.bookSeat}</span>
            </Link>
            <Link
              href={isAuthenticated ? "/trips" : "/auth/login"}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => setIsMenuOpen(false)}
            >
              <MapIcon className="h-5 w-5" />
              <span>{translations.nav.trips}</span>
            </Link>
            <Link
              href={isAuthenticated ? "/bookings" : "/auth/login"}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => setIsMenuOpen(false)}
            >
              <BookmarkIcon className="h-5 w-5" />
              <span>{translations.nav.myBookings}</span>
            </Link>
            
          </>
          )}
            {/* Mobile Language Toggle */}
            <button
              onClick={() => {
                toggleLanguage()
                setIsMenuOpen(false)
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
            >
              <LanguageIcon className="h-5 w-5" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Mobile Auth Buttons */}
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 px-3 py-2 text-gray-600 bg-gray-50 rounded-lg">
                  <UserCircleIcon className="h-5 w-5" />
                  <span>{user?.name}</span>
                </div>
                <button
                  onClick={() => {
                    logout()
                    setIsMenuOpen(false)
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>{language === 'en' ? 'Logout' : 'تسجيل خروج'}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>{language === 'en' ? 'Sign In' : 'تسجيل دخول'}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
