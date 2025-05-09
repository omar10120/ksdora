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

export const getValidToken = async (): Promise<string | null> => {
  const token = localStorage.getItem('token')
  const refreshToken = localStorage.getItem('refreshToken')

  if (!token || isTokenExpired(token)) {
    if (!refreshToken) return null

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) throw new Error('Token refresh failed')

      const data = await res.json()
      localStorage.setItem('token', data.token)
      return data.token
    } catch (err) {
      console.error('Failed to refresh token', err)
      return null
    }
  }

  return token
}


// export const isTokenExpired = (token: string): boolean => {
//   try {
//     const decoded = jwt.decode(token) as { exp?: number }
//     if (!decoded?.exp) return true
//     return Date.now() >= decoded.exp * 1000
//   } catch {
//     return true
//   }
// }