'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user, loading } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/auth/login')
        return
      }
      
      if (user?.role !== 'ADMIN') {
        router.push('/')
        return
      }

      setIsChecking(false)
    }
  }, [isAuthenticated, loading, user, router])

  if (loading || isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (isAuthenticated && user?.role === 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Header for mobile */}
          <div className="md:hidden bg-white shadow-sm py-4 px-6">
            <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
          </div>

          {/* Main content area */}
          <div className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto w-full">
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                {children}
              </div>
            </div>
          </div>

         
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  )
}