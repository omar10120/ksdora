'use client'
import { Suspense, useEffect, useState } from 'react'
import TripsClient from './TripsClient'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

import UserOnlyGuard from '@/components/UserOnlyGuard'

export default function TripsPage() {
  const { isAuthenticated ,user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login')
    } else{
      setIsLoading(false)
    }
  }, [isAuthenticated, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  const Content  = () => (

    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <TripsClient />
    </Suspense>
  )
  return (
    
   <UserOnlyGuard>
    <ProtectedRoute>
      <Content/>
    </ProtectedRoute>
   </UserOnlyGuard>
  )
}