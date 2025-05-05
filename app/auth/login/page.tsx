'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import LogoImage from '@/public/images/logo.png'
import StoreIcon from '@/public/images/store-icon.png'
import Image from 'next/image'
import { 
  
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { language, translations } = useLanguage()
  const {  user } = useAuth()


  useEffect(() => {
    if (isAuthenticated) {
      if(user?.role == 'ADMIN'){
        router.push('/admin')
      }else{
        router.push('/')
      }
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.isVerificationError) {
          router.push(`/auth/verify-code?email=${formData.email}`)
          return
        }
        throw new Error(data.error || 'Login failed')
      }

      await login(data.user, data.token, data.refreshToken)
      setSuccess(true)
      
      // Delay redirect to show success state
      if (user?.role !== 'ADMIN') {
        setTimeout(() => {
          router.push('/admin')
        }, 1500)
      }
      // else{
      //   setTimeout(() => {
      //     router.push('/')
      //   }, 1500)
      // }
     
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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
          {translations.auth.login.title}
        </h2>
        <p className="text-sm text-gray-600 mb-6 md:mb-8">
          {translations.auth.login.subtitle}
        </p>
      
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 text-black">
          {error && (
            <div className="text-sm text-red-600 mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-600 mb-4">
              {translations.auth.login.successMessage}
            </div>
          )}
      
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {translations.auth.login.email.label}
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={translations.auth.login.email.placeholder}
              className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
      
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              {translations.auth.login.password.label}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={translations.auth.login.password.placeholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <EyeIcon className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
      
          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-indigo-600 text-white py-2 md:py-2.5 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 text-sm md:text-base" 
            
            
          >
            {loading ? (
              <div className={`flex items-center justify-center gap-2 flex-row-reverse`} >
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {translations.auth.login.button.loading}
              </div>
            ) : success ? (
              translations.auth.login.button.success
            ) : (
              translations.auth.login.button.signin
            )}
          </button>
      
          <div className="flex flex-col md:flex-row items-center justify-between text-sm gap-2 md:gap-0">
              <div className='text-indigo-600 hover:text-indigo-700 '>
                <span className='opacity-50'>
                  {translations.auth.login.noAccount}</span>
                <Link href="/auth/register" >
                  <span className='hover:underline '>{translations.auth.login.register}</span>
                </Link>
              </div>
            
            <Link href="/auth/forgot-password" className="text-indigo-600 hover:text-indigo-700">
              {translations.auth.login.forgotPassword}
            </Link>
            
          </div>
        </form>
        <div className='w-full flex py-4'>
            <Link href="/" className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2">
              {language === 'en'? 
                <ArrowRightIcon className="h-4 w-4 text-indigo-700 " />
                :
                <ArrowLeftIcon className="h-4 w-4 text-indigo-700 " />
              }
              {translations.auth.login.backHome}
            </Link>
        </div>
      </div>
      
      
      {/* Right Panel */}
      <div className="hidden md:flex w-full md:w-2/3 bg-gradient-to-br from-indigo-600 to-indigo-800 items-center justify-center">
        <div className="text-center text-white p-4">
          <div className="mb-6 md:mb-8">
            <Image src={StoreIcon} alt="Store" className="h-16 md:h-24 w-16 md:w-24 mx-auto rounded-full" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-4">
            {(translations.auth.login.title).toUpperCase()} !
          </h1>
        </div>
      </div>
    </div>
  )
}