'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'


export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { checkAuth ,user} = useAuth()
  

  useEffect(() => {
    if (!checkAuth()) {
      router.push('/auth/login')
    }

    
     if(checkAuth() &&   user?.role == 'ADMIN')
        router.push('/admin')
    
  }, [])

  return <>{children}</>
}