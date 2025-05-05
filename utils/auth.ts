import jwt from 'jsonwebtoken'

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as { exp?: number }
    if (!decoded?.exp) return true
    return Date.now() >= decoded.exp * 1000
  } catch {
    return true
  }
}