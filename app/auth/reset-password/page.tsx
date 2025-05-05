'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import AuthLoader from '../components/AuthLoader'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { language, translations } = useLanguage()
  const [formData, setFormData] = useState({
    code: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const email = searchParams.get('email')

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
      return
    }
    
    if (!email) {
      router.push('/auth/forgot-password')
    }
  }, [isAuthenticated, email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      setError(translations.auth.resetPassword.errors.passwordMismatch)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: formData.code,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed')
      }

      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add new state for verification code
  const [code, setCode] = useState(['', '', '', '', '', ''])

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setFormData({ ...formData, code: newCode.join('') })

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 py-12 px-4 text-black">
      <div className={`max-w-md w-full bg-white p-10 rounded-3xl shadow-lg`} dir='ltr'>
        <div className="flex flex-col items-center">
          <div className="w-16 h-8 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {translations.auth.resetPassword.title}
          </h2>
          <p className="text-center text-sm text-gray-600 mb-8">
            {translations.auth.resetPassword.subtitle} <br />
            <span className="font-medium">{email?.replace(/(.{2})(.*)(?=@)/g, '$1***')}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className='text-balck'>
          <div className="flex justify-between mb-8 text-black px-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={code[index]}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-10 text-center text-lg font-semibold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                required
              />
            ))}
          </div>

          {error && (
            <div className="text-center text-sm text-red-600 mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="text-center text-sm text-green-600 mb-4">
              {translations.auth.resetPassword.success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <input
                id="newPassword"
                type="password"
                required
                placeholder={translations.auth.resetPassword.newPassword.placeholder}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              />
            </div>
            <div>
              <input
                id="confirmPassword"
                type="password"
                required
                placeholder={translations.auth.resetPassword.confirmPassword.placeholder}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success || code.some(c => !c)}
            className="w-full py-3 px-4 mt-6 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <AuthLoader />
                <span className={`${language === 'ar' ? 'mr-2' : 'ml-2'}`}>
                  {translations.auth.resetPassword.button.resetting}
                </span>
              </div>
            ) : success ? (
              translations.auth.resetPassword.button.success
            ) : (
              translations.auth.resetPassword.button.reset
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthLoader />}>
      <ResetPasswordForm />
    </Suspense>
  )
}