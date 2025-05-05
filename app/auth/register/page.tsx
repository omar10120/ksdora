'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

// Add these imports at the top
import LogoImage from '@/public/images/logo.png'
import StoreIcon from '@/public/images/store.png'
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { language, translations } = useLanguage()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError(translations.auth.register.errors.passwordMismatch)
      return
    }

    if (formData.password.length < 6) {
      setError(translations.auth.register.errors.passwordLength)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,

        })
      })

      const data = await response.json()

      if (data.error != null) {
        setError(data.error);
        throw new Error(data.error || 'Registration failed')
      }
     
      setError(data.error);
    
      
      // If registration is successful, redirect to verification page
      router.push(`/auth/verify-code?email=${encodeURIComponent(formData.email)}`)
      
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel */}
      <div className="w-full md:w-1/3 bg-white p-4 md:p-8 flex flex-col justify-center min-h-screen md:min-h-0">
        <div className="mb-4 md:mb-8">
          <Image src={LogoImage} alt="Logo" className="h-8 md:h-12 w-8 md:w-12" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-800">
          {translations.auth.register.title}
        </h2>


        {error && (
          <div className="text-sm text-red-600 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 text-black">
          {/* Form fields with responsive spacing */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {translations.auth.register.fullName.label}
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder={translations.auth.register.fullName.placeholder}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {translations.auth.register.email.label}
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={translations.auth.register.email.placeholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {translations.auth.register.password.label}
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={translations.auth.register.password.placeholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {translations.auth.register.confirmPassword.label}
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder={translations.auth.register.confirmPassword.placeholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {translations.auth.register.phone.label}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={translations.auth.register.phone.placeholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 md:py-2.5 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 text-sm md:text-base mt-4 md:mt-6"
          >
            {isLoading ? translations.auth.register.button.creating : translations.auth.register.button.signup}
          </button>

          <div className="text-center mt-4">
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 text-sm hover:underline">
              {translations.auth.register.haveAccount}
            </Link>
          </div>
        </form>
      </div>

      {/* Right Panel */}
      <div className="hidden md:flex w-full md:w-2/3 bg-gradient-to-br from-indigo-600 to-indigo-800 items-center justify-center">
        <div className="text-center text-white p-4">
          <div className="mb-6 md:mb-8">
            <Image src={StoreIcon} alt="Store" className="h-16 md:h-24 w-16 md:w-24 mx-auto rounded-full" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-4">{(translations.auth.register.title).toUpperCase()}!</h1>
        </div>
      </div>
    </div>
  )
}