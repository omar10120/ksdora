'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import toast, { Toaster } from 'react-hot-toast'

interface Route {
  id: string
  departureCity: { name: string }
  arrivalCity: { name: string }
}

interface Bus {
  id: string
  plateNumber: string
  capacity: number
  status: 'active' | 'maintenance' | 'inactive' | 'passenger_filling' | 'in_trip'
}

export default function NewTripPage() {
  const router = useRouter()
  const { language, translations } = useLanguage()
  const t = translations.dashboard.trips.form
  const [routes, setRoutes] = useState<Route[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setloadingProgress] = useState(false)
  const [loadingProgressCansel, setloadingProgressCansel] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    routeId: '',
    busId: '',
    departureTime: '',
    arrivalTime: '',
    price: ''
  })

  useEffect(() => {
    fetchRoutes()
    fetchBuses()
  }, [])

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/routes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setRoutes(data)
    } catch (error) {
      console.error('Error fetching routes:', error)
    }
  }

  const fetchBuses = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/admin/buses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      // Filter to only show active buses
      const activeBuses = data.filter((bus: Bus) => bus.status === 'active')
      setBuses(activeBuses)
    } catch (error) {
      console.error('Error fetching buses:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t.errors.createFailed)
      }

      toast.success(t.success.created)
      router.push('/admin/trips')
    } catch (err: any) {
      setError(err.message)
      toast.error(t.errors.createFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`max-w-2xl mx-auto text-black ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <Toaster />
      <h1 className="text-2xl font-semibold text-gray-800 max-sm:w-full mb-6">{t.title.new}</h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.route}
          </label>
          <select
            required
            value={formData.routeId}
            onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">{t.placeholders.selectRoute}</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.departureCity.name} → {route.arrivalCity.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.bus}
          </label>
          <select
            required
            value={formData.busId}
            onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">{t.placeholders.selectBus}</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.plateNumber} ({t.placeholders.busCapacity}: {bus.capacity})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.departureTime}
          </label>
          <input
            type="datetime-local"
            required
            value={formData.departureTime}
            onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.arrivalTime}
          </label>
          <input
            type="datetime-local"
            required
            value={formData.arrivalTime}
            onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.price}
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              router.back()
              setloadingProgressCansel(true)
            }}
            disabled={loadingProgressCansel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
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