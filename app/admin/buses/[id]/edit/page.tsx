'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { useLanguage } from '@/context/LanguageContext'

interface PageParams {
  id: string
}

interface EditBusPageProps {
  params: PageParams
}

export default function EditBusPage({ params }: EditBusPageProps) {
  const router = useRouter()
  const { language, translations } = useLanguage()
  const t = translations.dashboard.buses.form
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    plateNumber: '',
    capacity: '',
    model: '',
    status: 'active'
  })

  const fetchBusDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/buses/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error(t.errors.loadFailed)
      
      const data = await response.json()
      setFormData({
        plateNumber: data.plateNumber,
        capacity: data.capacity.toString(),
        model: data.model,
        status: data.status
      })
    } catch (err: any) {
      toast.error(t.errors.loadFailed)
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/buses/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t.errors.updateFailed)
      }

      toast.success(t.success.updated)
      setTimeout(() => {
        router.push('/admin/buses')
      }, 2000)

    } catch (err: any) {
      toast.error(err.message || t.errors.updateFailed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBusDetails()
  }, [])

  return (
    <div className={`max-w-2xl mx-auto text-black ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <Toaster />
      <h1 className="text-2xl font-semibold text-gray-800 max-sm:w-full mb-6">{t.title.edit}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.plateNumber}
          </label>
          <input
            type="text"
            required
            value={formData.plateNumber}
            onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder={t.placeholders.plateNumber}
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.model}
          </label>
          <input
            type="text"
            required
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder={t.placeholders.model}
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.capacity}
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder={t.placeholders.capacity}
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.labels.status}
          </label>
          <select
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            dir="ltr"
          >
            {Object.entries(t.status).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
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
            {loading ? t.buttons.updating : t.buttons.update}
          </button>
        </div>
      </form>
    </div>
  )
}