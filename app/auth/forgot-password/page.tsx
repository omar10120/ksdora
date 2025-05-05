'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import AuthLoader from '../components/AuthLoader'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { language, translations } = useLanguage()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset password')
      }

      setSuccess(true)
      
      // Redirect to reset-password page with email parameter
      setTimeout(() => {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {translations.auth.forgotPassword.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {translations.auth.forgotPassword.subtitle}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    {translations.auth.forgotPassword.success}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {translations.auth.forgotPassword.email.label}
            </label>
            <input
              id="email"
              type="email"
              placeholder={translations.auth.forgotPassword.email.placeholder}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              dir='ltr'
              disabled={loading || success}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-200 "
            >
              {loading && <AuthLoader />}
              {loading ? translations.auth.forgotPassword.button.sending : 
               success ? translations.auth.forgotPassword.button.sent : 
               translations.auth.forgotPassword.button.send}
            </button>
          </div>

          <div className="text-center">
            <Link 
              href="/auth/login" 
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
            >
              {translations.auth.forgotPassword.backToLogin}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}