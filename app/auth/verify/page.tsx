'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import AuthLoader from '../components/AuthLoader'

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { language, translations } = useLanguage()
  const t = translations.auth.verify
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [error, setError] = useState('')
  
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
      return
    }

    const email = searchParams.get('email')
    const token = searchParams.get('token')

    if (!email) {
      setError(t.errors.emailRequired)
      setVerificationStatus('error')
      return
    }

    if (token) {
      verifyEmail(email, token)
    }
  }, [isAuthenticated, t.errors.emailRequired])

  const verifyEmail = async (email: string, token: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token })
      })

      if (!response.ok) {
        throw new Error(t.status.error)
      }

      setVerificationStatus('success')
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (err: any) {
      setError(err.message)
      setVerificationStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg ${language === 'ar' ? 'rtl' : 'ltr'}`}>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t.title}
          </h2>
        </div>

        <div className="mt-8 space-y-6">
          {verificationStatus === 'pending' && (
            <div className="flex justify-center">
              <AuthLoader />
              <span className={`${language === 'ar' ? 'mr-2' : 'ml-2'}`}>
                {t.status.pending}
              </span>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex">
                <div className={`${language === 'ar' ? 'mr-3' : 'ml-3'}`}>
                  <p className="text-sm text-green-700">
                    {t.status.success}
                  </p>
                </div>
              </div>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className={`${language === 'ar' ? 'mr-3' : 'ml-3'}`}>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<AuthLoader />}>
      <VerifyEmailForm />
    </Suspense>
  )
}