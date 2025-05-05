'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function UserOnlyGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAdmin) {
      router.replace('/admin') // redirect admins
    }
  }, [isAdmin, loading, router])

  if (loading) return null // or a loader/spinner if needed

  return <>{!isAdmin && children}</>
}
