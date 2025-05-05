'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { isTokenExpired } from '@/utils/auth'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  emailVerified: boolean
  phone?: string | null
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (userData: User, token: string, refreshToken: string) => Promise<void>
  logout: () => void
  checkAuth: () => boolean
  loading: boolean
  isAdmin: boolean
}


export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    // Check token expiration every minute
    const checkTokenInterval = setInterval(() => {
      const token = localStorage.getItem('token')
      if (token && isTokenExpired(token)) {
        // Token expired, logout user
        logout()
      }
    }, 60000) // Check every minute

    return () => clearInterval(checkTokenInterval)
  }, [])

  const checkAuth = () => {
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData) as User
        setIsAuthenticated(true)
        setUser(parsedUser)
        setLoading(false)
        return true
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      logout()
    }
    setLoading(false)
    return false
  }

  const login = async (userData: User, token: string, refreshToken: string) => {
    try {
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Error during login:', error)
      logout()
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setUser(null)
    setIsAuthenticated(false)
    router.push('/auth/login')
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout, 
      checkAuth, 
      loading ,
      isAdmin: user?.role === 'ADMIN',

    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}