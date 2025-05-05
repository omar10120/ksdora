'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'
import ConfirmDialogAdmin from '@/components/ConfirmDialogAdmin'
import { useLanguage } from '@/context/LanguageContext'

interface Bus {
  id: string
  plateNumber: string
  capacity: number
  model: string
  status: 'active' | 'maintenance' | 'inactive' | 'passenger_filling' | 'in_trip'
}

export default function BusesPage() {
  const router = useRouter()
  const { language, translations } = useLanguage()
  const t = translations.dashboard.buses
  const [buses, setBuses] = useState<Bus[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [busToDelete, setBusToDelete] = useState<string | null>(null)

  const getStatusColor = (status: Bus['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'passenger_filling': return 'bg-blue-100 text-blue-800'
      case 'in_trip': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'

      
    }
  }
  if (!Array.isArray(buses)) return null

  const filteredBuses = buses.filter(bus => 
    bus.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.model.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    fetchBuses()
  }, [])

  const fetchBuses = async () => {
    try {
      const token = localStorage.getItem('token')

      
      const response = await fetch(`/api/admin/buses`, {

        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
  
      // Ensure data is an array
      if (Array.isArray(data)) {
        setBuses(data)
      } else {
        console.error('Invalid response format for buses:', data)
        setBuses([]) // fallback
      }
    } catch (error) {
      console.error('Error fetching buses:', error)
      setBuses([]) // fallback on error
    } finally {
      setLoading(false)
    }
  }
  

  const handleDeleteClick = (busId: string) => {
    setBusToDelete(busId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteBus = async () => {
    if (!busToDelete) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/buses/${busToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setBuses(buses.filter(bus => bus.id !== busToDelete))
        toast.success(t.delete.success)
      } else {
        throw new Error(data.error || t.delete.error)
      }
    } catch (error: any) {
      toast.error(error.message || t.delete.error)
    } finally {
      setBusToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className={language === 'ar' ? 'rtl' : 'ltr'}>
      <Toaster />
      <ConfirmDialogAdmin
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteBus}
        title={t.delete.title}
        message={t.delete.message}
        confirmText={t.delete.confirm}
        cancelText={t.delete.cancel}
      />

      <div className="flex justify-between max-sm:flex-col items-center mb-6 text-black">
        <h1 className="text-2xl font-semibold text-gray-800 max-sm:w-full">{t.title}</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t.search.placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 max-sm:w-full "
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          <button
            onClick={() => router.push('/admin/buses/new')}
            className="flex items-center space-x-2 px-4 max-sm:px-2 py-2 max-sm:py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <PlusIcon className="h-5 w-5" />
            <span>{t.addButton}</span>
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200" dir="ltr">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.plateNumber}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.model}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.capacity}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.status}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.columns.actions}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBuses.map((bus) => (
              <tr key={bus.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bus.plateNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bus.model}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bus.capacity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bus.status)}`}>
                    {t.status[bus.status]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => router.push(`/admin/buses/${bus.id}/edit`)}
                    className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(bus.id)}
                    className="text-red-600 hover:text-red-900 ml-4 cursor-pointer"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}