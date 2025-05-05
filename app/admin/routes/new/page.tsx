'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { useLanguage } from '@/context/LanguageContext'

interface City {
  id: string
  name: string
}

export default function NewRoutePage() {
  const router = useRouter()
  const { language, translations } = useLanguage()
  const t = translations.dashboard.routes.form
  const [loading, setLoading] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [formData, setFormData] = useState({
    departureCityId: '',
    arrivalCityId: '',
    distance: ''
  })

  useEffect(() => {
    fetchCities()
  }, [])

  const fetchCities = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/cities`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setCities(data)
    } catch (error) {
      console.error('Error fetching cities:', error)
      toast.error(t.errors.loadFailed)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          distance: parseFloat(formData.distance)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t.errors.createFailed)
      }

      toast.success(t.success.created)
      setTimeout(() => {
        router.push('/admin/routes')
      }, 2000)

    } catch (err: any) {
      toast.error(err.message || t.errors.createFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`max-w-2xl mx-auto text-black ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <Toaster />
      <h1 className="text-2xl font-semibold text-gray-800 max-sm:w-full mb-6">{t.title.new}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.departureCity}
          </label>
          <select
            required
            value={formData.departureCityId}
            onChange={(e) => setFormData({ ...formData, departureCityId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            dir="ltr"
          >
            <option value="">{t.placeholders.selectDeparture}</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.arrivalCity}
          </label>
          <select
            required
            value={formData.arrivalCityId}
            onChange={(e) => setFormData({ ...formData, arrivalCityId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            dir="ltr"
          >
            <option value="">{t.placeholders.selectArrival}</option>
            {cities.filter(city => city.id !== formData.departureCityId).map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.distance}
          </label>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            value={formData.distance}
            onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder={t.placeholders.distance}
            dir="ltr"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {t.buttons.cancel}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {loading ? t.buttons.creating : t.buttons.create}
          </button>
        </div>
      </form>
    </div>
  )
}