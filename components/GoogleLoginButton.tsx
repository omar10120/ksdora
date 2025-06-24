'use client'

import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'

export default function GoogleRegisterButton() {
  const router = useRouter()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleRegister = async () => {
    setLoading(true)
    setError(null)

    try {
      // Firebase popup for Google Sign-In
    const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user

      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken()

      // Send token to your backend to register/login
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Google authentication failed')

      // Use AuthContext login method
      await login(data.user, data.token, data.refreshToken)

      // Redirect user after successful login/registration
      if (!data.user.emailVerified) {
        router.push(`/auth/verify-code?email=${data.user.email}`)
      } else if (data.user.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/')
      }

    } catch (err: any) {
      console.error('Google auth error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full mt-4">
      <button
        onClick={handleGoogleRegister}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-md transition"
      >
        {loading ? 'Signing in with Google...' : 'Sign Up with Google'}
      </button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  )
}
