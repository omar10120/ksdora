'use client'
import { useEffect } from 'react'
import AdminNotFound from './not-found'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return <AdminNotFound />
}