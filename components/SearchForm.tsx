'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

interface City {
  id: string
  name: string
  nameAr: string
  departureRoutes: any[]
  arrivalRoutes: any[]
}

export default function SearchForm() {
  const router = useRouter()
  const { language, translations } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')

    const fetchCities = async () => {
      try {
        const response = await fetch('/api/cities',{
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()
        setCities(data)
      } catch (error) {
        console.error('Failed to fetch cities:', error)
      }
    }

    fetchCities()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.from || !formData.to || !formData.date) return

    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const searchParams = new URLSearchParams({
        from: formData.from,
        to: formData.to,
        date: new Date(formData.date).toISOString()
      })

      const response = await fetch(`/api/trips?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const trips = await response.json()
      localStorage.setItem('searchResults', JSON.stringify(trips))
      
      router.push('/search-results')
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          value={formData.from}
          onChange={(e) => setFormData({ ...formData, from: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">{translations.search.from}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.name}>
              {language === 'ar' ? city.nameAr : city.name}
            </option>
          ))}
        </select>

        <select
          value={formData.to}
          onChange={(e) => setFormData({ ...formData, to: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">{translations.search.to}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.name}>
              {language === 'ar' ? city.nameAr : city.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500"
          // required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
      >
        {loading ? translations.search.searching : translations.search.submit}
      </button>
    </form>
  )
}