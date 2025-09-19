'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { 
  PlusIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'
import ConfirmDialogAdmin from '@/components/ConfirmDialogAdmin'
import BusCard from '@/components/admin/BusCard'
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
      if (Array.isArray(data.data)) {
        setBuses(data.data)
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

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-pulse">
              <div className="bg-gradient-to-r from-gray-300 to-gray-400 h-24"></div>
              <div className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="flex space-x-2">
                  <div className="h-10 bg-gray-200 rounded flex-1"></div>
                  <div className="h-10 bg-gray-200 rounded flex-1"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">🚌</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Buses</p>
                  <p className="text-2xl font-semibold text-gray-900">{buses.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">🟢</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {buses.filter(bus => bus.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">🔧</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Maintenance</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {buses.filter(bus => bus.status === 'maintenance').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Capacity</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {buses.reduce((sum, bus) => sum + bus.capacity, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bus Cards Grid */}
          {filteredBuses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚌</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No buses found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first bus'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => router.push('/admin/buses/new')}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Add First Bus</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBuses.map((bus) => (
                <BusCard
                  key={bus.id}
                  bus={bus}
                  onDeleteClick={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}