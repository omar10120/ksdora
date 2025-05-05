'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { 
  HomeIcon,
  UsersIcon,
  TicketIcon,
  CalendarIcon,
  CogIcon,
  ChartBarIcon,
  TruckIcon,
  MapIcon,
  BuildingOfficeIcon,
  Bars3Icon,
  XMarkIcon,
  LanguageIcon

} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { LayoutRouter } from 'next/dist/server/app-render/entry-base'
import { dir } from 'console'

const getMenuItems = (t: any) => [
  { href: '/admin', icon: HomeIcon, label: t.dashboard },
  { href: '/admin/users', icon: UsersIcon, label: t.users },
  { href: '/admin/bookings', icon: TicketIcon, label: t.bookings },
  { href: '/admin/trips', icon: CalendarIcon, label: t.trips },
  { href: '/admin/buses', icon: TruckIcon, label: t.buses },  
  { href: '/admin/routes', icon: MapIcon, label: t.routes }, 
  { href: '/admin/cities', icon: BuildingOfficeIcon, label: t.cities }, 
  { href: '/admin/reports', icon: ChartBarIcon, label: t.reports },
  { href: '/admin/settings', icon: CogIcon, label: t.settings },
  // { href: '', icon: CogIcon, label: t.logout },
  
]

export default function AdminSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { language, translations ,toggleLanguage} = useLanguage()
  const t = translations.dashboard.sidebar
  const menuItems = getMenuItems(t)
  const { isAuthenticated, user, logout } = useAuth()
  


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`md:hidden fixed top-4  ${language == 'ar'? 'left-4': 'right-4'} z-50 p-2 rounded-lg bg-gray-800 text-white`}
      >
        {isSidebarOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 "
          
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 ${language == 'ar'? 'right-0': 'left-0'}  z-40
        transform ${isSidebarOpen ? 'translate-x-0' : language == 'ar'? 'translate-x-full':'-translate-x-full'}
        md:translate-x-0 transition-transform duration-300 ease-in-out
        flex flex-col w-64 bg-gray-800  
      `}>
        <div className="flex items-center justify-between h-16 bg-gray-900 px-4 ">
          <span className="text-white text-lg font-semibold">{t.title}</span>
          <button
            onClick={toggleSidebar}
            className="md:hidden text-white p-1 hover:bg-gray-700 rounded"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          <nav className={`flex-1 px-2 py-4 space-y-1 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Bottom Actions Section */}

          <div className="px-2 py-4 border-t border-gray-700 md:hidden">
            <button
              onClick={toggleLanguage}
              className={`flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors ${
                language === 'ar' ? 'f text-whiteerse' : ''
              }`}
            >
              <LanguageIcon className={`h-5 w-5 ${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <button

              onClick={logout}
              className={`flex items-center w-full px-4 py-2 mt-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-900/20 hover:text-red-300 transition-colors  
                //  ${language === 'ar' ? '' : ''} 
                 `
                  
              }
            >
              <svg 
                className={`h-5 w-5 ${language === 'ar' ? 'ml-3 ' : 'mr-3 '}`}
                
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span  >{language === 'en' ? 'Logout' : 'تسجيل خروج'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}