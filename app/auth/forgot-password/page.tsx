'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import AuthLoader from '../components/AuthLoader'
import PhoneLogin from '../components/PhoneLogin'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { language, translations } = useLanguage()

  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isAuthenticated === true) {
      router.push('/')
    }
  }, [isAuthenticated])

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset password')
      }

      setSuccess(true)
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
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8 ${
        language === 'ar' ? 'rtl' : 'ltr'
      }`}
    >
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {translations?.auth?.forgotPassword?.title || 'Forgot Password'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {translations?.auth?.forgotPassword?.subtitle || 'Reset via email or phone'}
          </p>
        </div>

        {/* <div className="flex justify-center gap-4">
          {['email', 'phone'].map((option) => (
            <button
              key={option}
              onClick={() => setMethod(option as 'email' | 'phone')}
              className={`px-4 py-2 rounded ${
                method === option
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {option === 'email' ? 'Email' : 'Phone'}
            </button>
          ))}s
        </div> */}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && method === 'email' && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <p className="text-sm text-green-700">
              {translations?.auth?.forgotPassword?.success || 'Email sent successfully.'}
            </p>
          </div>
        )}

        {method === 'email' ? (
          <form className="mt-4 space-y-6" onSubmit={handleEmailSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                {translations?.auth?.forgotPassword?.email?.label || 'Email'}
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder={
                  translations?.auth?.forgotPassword?.email?.placeholder || 'you@example.com'
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400 transition-colors duration-200"
            >
              {loading && <AuthLoader />}
              {loading
                ? translations?.auth?.forgotPassword?.button?.sending || 'Sending...'
                : success
                ? translations?.auth?.forgotPassword?.button?.sent || 'Sent'
                : translations?.auth?.forgotPassword?.button?.send || 'Send'}
            </button>
          </form>
        ) : (
          <PhoneLogin />
        )}

        <div className="text-center mt-4">
          <Link
            href="/auth/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
          >
            {translations?.auth?.forgotPassword?.backToLogin || 'Back to Login'}
          </Link>
        </div>
      </div>
    </div>
  )
}
